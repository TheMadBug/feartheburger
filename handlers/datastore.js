var csv = require('basic-csv')
var loki = require('lokijs')
var Promise = require('bluebird')
var fs = require('fs')

var Datastore = function() {}
Datastore.outcomeTypesCollection = null;
Datastore.chancesCollection = null;
Datastore.populationCollection = null;

var matchingColumns = ['gender','state','regional','age']

Datastore.parsePopulation = function(filename, cb) {
    Datastore.parse(filename, (error, rows) => {
        if (error) { return cb(error) }
        var baseKeys = ['gender','state','regional']
        var baseKeysSet = {gender:true, state:true, regional:true}
        var ageRows = []
        rows.map(row => {
            var regional = row.regional === 'TRUE' || row.regional === 'true'
            var baseRow = {gender:row.gender, state:row.state, regional:regional}
            Object.keys(row).filter(k => baseKeys.indexOf(k) == -1).forEach(k => {
                var age = k
                var ageRow = Object.assign({},baseRow,{age:k, number:row[k]})
                ageRows.push(ageRow)
                //console.log(`ageRow = ${JSON.stringify(ageRow)}`)
            })
        })
        cb(null, ageRows)
    })
}

Datastore.populationRowsFor = function(row) {
    var ands = [];
    Object.keys(row).forEach(k => {
        if (matchingColumns.indexOf(k) != -1) {
            var query = {}
            query[k] = {$eq: row[k]}
            ands.push( query );
        }
    })
    return Datastore.populationCollection.find({$and: ands})
}

Datastore.parseAbsolute = function(filename, cb) {
    Datastore.parse(filename, (error, rows) => {
        if (error) { return cb(error) }

        rows.forEach(row => {
            if (row.regional) {
                row.regional = row.regional === 'TRUE' || row.regional === 'true'
            }
        })

        var populationRows = rows.filter(row => {return row.number > 0 && !row.chance}).map(row => {
            var ands = [];
            Object.keys(row).forEach(k => {
                if (matchingColumns.indexOf(k) != -1) {
                    var query = {}
                    query[k] = {$eq: row[k]}
                    ands.push( query )
                }
            })
            return row
        })
        var chanceRows = rows.filter(row => {return row.chance}).map(row => {
            var populationFor = Datastore.populationRowsFor(row).reduce((p,c) => {return p + c.number} ,0)
            row.number = row.chance * populationFor
            // console.log(`reverse chance to be number by multiplying ${populationFor} by ${row.chance}`)
        })
        
        cb(null, populationRows.concat(chanceRows))
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

Datastore.populationDebug = function() {
    return Datastore.populationCollection.find({})
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
    var folders = fs.readdirSync('./data')
    folders.forEach( fn => {
        var stats = fs.statSync( './data/' + fn )
        if (stats.isDirectory()) {
            outcomeArray.push( {file:'./data/' + fn + '/outcomes.csv', prefix:fn} )
            absoluteNumbersArray.push( {file:'./data/' + fn + '/numbers.csv', prefix:fn} )
        }
    } )

    Promise.promisify(Datastore.parsePopulation)('./data/population.csv').then(populationRows => {
        populationRows.forEach((row) => {
            Datastore.populationCollection.insert(row)
        })
        console.log('FINISHED population')
        return true;
    }).then(_ => {
        return Promise.all(outcomeArray.map(entry => {
            var file = entry.file
            return Promise.promisify(Datastore.parse)(file).then(outcomeRows => {
                outcomeRows.forEach((row) => {
                    row.id = entry.prefix + '_' + row.id
                    Datastore.outcomeTypesCollection.insert(row)
                })
            })
        }))
    }).then(_ => {
         console.log('starting absolute numbers')
        return Promise.all(absoluteNumbersArray.map(entry => {
            var file = entry.file
            return Promise.promisify(Datastore.parseAbsolute)(file).then(outcomeRows => {
                outcomeRows.forEach((row) => {
                    row.outcome = entry.prefix + '_' + row.outcome
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

Datastore.compareChances = function(personA, personB, minChance) {
    if (!(minChance)) {
        minChance = 0.00001
    }

    var personAChances = Datastore.chancesFor(personA)
    var personBChances = Datastore.chancesFor(personB)

    var allOutcomes = {}    
    personAChances.forEach(out => {
        var copy = Object.assign({},out)
        allOutcomes[out.outcome] = copy
        copy.chanceA = out.chance
        copy.chanceB = 0
    })
    personBChances.forEach(out => {
        var existing = allOutcomes[out.outcome]
        if (existing) {
            existing.chanceB = out.chance
        } else {
            var copy = Object.assign({},out)
            allOutcomes[out.outcome] = copy
            copy.chanceA = 0
            copy.chanceB = out.chance
        }
    })
    var outcomeArray = []
    Object.keys(allOutcomes).forEach(key => {
        var row = allOutcomes[key]
        outcomeArray.push( allOutcomes[key] )
        row.chanceDiff = row.chanceA - row.chanceB
        if (row.chanceA > row.chanceB) {
            row.chanceDiffP = -(row.chanceA / row.chanceB)
        } else if (row.chanceB > row.chanceA) {
            row.chanceDiffP = -(row.chanceB / row.chanceA)
        } else {
            row.chanceDiffP = 0
        }
        delete row['chance']
    })
    outcomeArray = outcomeArray.filter(row => { return ((row.chanceA >= minChance || row.chanceB >= minChance) && row.chanceDiffP != 0) })
    outcomeArray = outcomeArray.sort((a, b) => { return b.chanceDiff - a.chanceDiff})
    return outcomeArray
}

Datastore.chancesFor = function(person) {
    
    var population = Datastore.populationRowsFor( person ).reduce((p,c) => { return p + c.number}, 0)

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
    var rows = Datastore.chancesCollection.find(query)


    var uniqueRows = []
    var uniqueRowMap = {};
    rows.forEach(row => {
        if (uniqueRowMap[row.outcome]) {
            // combine the numbers
            uniqueRowMap[row.outcome].number += row.number
        } else {
            uniqueRowMap[row.outcome] = Object.assign({},row);
            uniqueRows.push(row)
        }
    })

    var cleanRows = uniqueRows.map(row => {
        var output = {}
        output.outcome = row.outcome
        output.chance = row.number / population
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
    cleanRows.sort((a,b) => { return b.chance - a.chance })
    return cleanRows
}

module.exports = Datastore