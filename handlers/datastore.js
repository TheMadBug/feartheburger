var csv = require('basic-csv')
var loki = require('lokijs')
var Promise = require('bluebird')
var fs = require('fs')

var Datastore = function() {}
Datastore.outcomeTypesCollection = null;
Datastore.chancesCollection = null;
Datastore.populationCollection = null;

Datastore.parsePopulation = function(filename, cb) {
    Datastore.parse(filename, (error, rows) => {
        if (error) { return cb(error) }
        var baseKeys = ['gender','state','regional']
        var baseKeysSet = {gender:true, state:true, regional:true}
        var ageRows = []
        rows.map(row => {
            var baseRow = {gender:row.gender, state:row.state, regional:row.regional}
            Object.keys(row).filter(k => baseKeys.indexOf(k) == -1).forEach(k => {
                var ageRow = Object.assign({},baseRow,{age:k, number:row[k]})
                ageRows.push(ageRow)
                //console.log(`ageRow = ${JSON.stringify(ageRow)}`)
            })
        })
        cb(null, ageRows)
    })
}

Datastore.parseAbsolute = function(filename, cb) {
    Datastore.parse(filename, (error, rows) => {
        if (error) { return cb(error) }
        matchingColumns = ['gender','state','regional','age']
        rows.forEach(row => {
            var ands = [];
            Object.keys(row).forEach(k => {
                if (matchingColumns.indexOf(k) != -1) {
                    ands.push( {[k]: {$eq: row[k]}} );
                }
            })
            var relevantRows = Datastore.populationCollection.find({$and: ands})
            var totalNumber = relevantRows.map(row => row.number).reduce((p,c) => {return p + c},0)
            var chance = row.number / totalNumber

            row.chance = chance
        })
        cb(null, rows)
    })
}

Datastore.parse = function(fileName, cb) {
    var outcomesTypes = csv.readCSV(fileName, {
        // parse properties go here
    }, function (error, rows) {
        if (error) {
            return cb(error)
        }
        var headerRow = rows[0]
        var dataRows = rows.slice(1)
        var objects = dataRows.map(row => {
            var json = {}
            headerRow.forEach((col, index) => {
                var value = row[index]
                if (value === '') {
                    value = null
                }
                json[col] = value
            })
            return json
        })
        console.log(`Finishing parsing ${fileName} have inserted ${objects.length}`)
        cb(null,objects)
    })    
}

Datastore.init = function(cb) {

    var db = new loki('lokijs')
    Datastore.outcomeTypesCollection = db.addCollection('outcomes', {
        unique: ['id']
    })
    Datastore.chancesCollection = db.addCollection('chances', {
        indices: ['gender','outcome']
    })
    Datastore.populationCollection = db.addCollection('population', {
        indices: ['gender','state','age','regional']
    })

    var promiseArray = [];

    var outcomeArray = []
    var absoluteNumbersArray = []
    let folders = fs.readdirSync('./data')
    folders.forEach( fn => {
        let stats = fs.statSync( './data/' + fn )
        if (stats.isDirectory()) {
            outcomeArray.push( './data/' + fn + '/outcomes.csv' )
            absoluteNumbersArray.push( './data/' + fn + '/numbers.csv' )
        }
    } )

    Promise.promisify(Datastore.parsePopulation)('./data/population.csv').then(populationRows => {
        populationRows.forEach((row) => {
            Datastore.populationCollection.insert(row)
        })
        return true;
    }).then(_ => {
        return Promise.all(outcomeArray.map(file => {
            return Promise.promisify(Datastore.parse)(file).then(outcomeRows => {
                outcomeRows.forEach((row) => {
                    Datastore.outcomeTypesCollection.insert(row)
                })
            })
        }))
    }).then(_ => {
        return Promise.all(absoluteNumbersArray.map(file => {
            return Promise.promisify(Datastore.parseAbsolute)(file).then(outcomeRows => {
                outcomeRows.forEach((row) => {
                    console.log(`Recording chance = ${JSON.stringify(row)}`)
                    Datastore.chancesCollection.insert(row)
                })
            })
        }))
    }).then(_ => {
        console.log('CALLING CALLBACK NOW')
        cb(null,true)
    }).catch(err => {
        cb(err)
    })
}

Datastore.chancesFor = function(person) {
    var queryAnds = []
    Object.keys(person).forEach(key => {
        var value = person[key];
        var checkEq = {}
        checkEq[key] = {$eq: value}

        var checkNull = {}
        checkNull[key] = {$eq: null}

        var checkUndefined = {}
        checkUndefined[key] = {$eq: undefined}

        queryAnds.push({$or:
            [
                checkEq,
                //TODO double check to see if this works for absent values
                checkNull,
                checkUndefined
            ]
        })
    })
    var query = {$and: queryAnds}
    console.log(`query = ${JSON.stringify(query)}`)
    var rows = Datastore.chancesCollection.find(query)

    console.log(`All relevant rows =`)
    console.log(JSON.stringify(rows))

    var uniqueRows = []
    var uniqueRowMap = {};
    rows.forEach(row => {
        if (uniqueRowMap[row.outcome]) {
            // combine the numbers
            uniqueRowMap[row.outcome].chance += row.chance
        } else {
            uniqueRowMap[row.outcome] = row;
            uniqueRows.push(row)
        }
    })

    return uniqueRows.map(row => {
        var output = {}
        output.outcome = row.outcome
        output.chance = row.chance
        var outcomeRow = Datastore.outcomeTypesCollection.findOne({id: row.outcome})
        if (outcomeRow) {
            output.valid = true;
            Object.keys(outcomeRow).filter(key => {return key != 'meta' && key != '$loki'}).forEach(key => {
                output[key] = outcomeRow[key]
            });
        } else {
            output.valid = false;
        }

        return output
    })
}

module.exports = Datastore