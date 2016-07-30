var csv = require('basic-csv')
var loki = require('lokijs')
var Promise = require('bluebird')

var Datastore = function() {}
Datastore.outcomeTypesCollection = null;
Datastore.chancesCollection = null;

Datastore.parse = function(fileName, collection, cb) {
    let outcomesTypes = csv.readCSV(fileName, {
        // parse properties go here
    }, function (error, rows) {
        if (error) {
            return cb(error)
        }
        let headerRow = rows[0]
        let dataRows = rows.slice(1)
        dataRows.forEach(row => {
            let json = {}
            headerRow.forEach((col, index) => {
                let value = row[index]
                if (value === '') {
                    value = null
                }
                json[col] = value
            })
            collection.insert(json)
            console.log(`Inserting ${JSON.stringify(json)}`)
        })
        console.log(`Finishing parsing ${fileName} have inserted ${collection.count()}`)
        cb(null,true)
    })    
}

Datastore.init = function(cb) {

    let db = new loki('lokijs')
    Datastore.outcomeTypesCollection = db.addCollection('outcomes', {
        unique: ['id']
    })
    Datastore.chancesCollection = db.addCollection('chances', {
        indices: ['gender','outcome']
    })
    let promiseParse = Promise.promisify(Datastore.parse)
    
    Promise.promisify(Datastore.parse)('./data/outcomes.csv', Datastore.outcomeTypesCollection).then(() => {
        return Promise.promisify(Datastore.parse)('./data/chances.csv', Datastore.chancesCollection)
    }).then(_ => {
        console.log('CALLING CALLBACK NOW')
        cb(null,true)
    }).catch(err => {
        cb(err)
    })

}

Datastore.chancesFor = function(person) {
    let queryAnds = []
    Object.keys(person).forEach(key => {
        let value = person[key];
        queryAnds.push({$or:
            [
                {[key]: {$eq: value}},
                //TODO double check to see if this works for absent values
                {[key]: {$eq: null}},
                {[key]: {$eq: undefined}}
            ]
        })
    })
    let query = {$and: queryAnds}
    console.log(`Querying choices with this ${JSON.stringify(query)}`)
    let rows = Datastore.chancesCollection.find(query)

    rows.map(row => {
        let object = {}
        object.outcome = row.outcome
        object.chance = row.chance
        let outcomeRow = Datastore.outcomeTypesCollection.find({id: object.outcome})
    })
    return rows;
}

module.exports = Datastore