var express = require('express');
var app = express();
var Datastore = require('./handlers/datastore.js')

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

/**
 * Create your demographic record, e.g. demo = {"gender":"F"}
 * then call get to '/outcomesFor?demo=' + encodeURIComponent( JSON.stringify( demo ))
 */
app.get('/outcomesFor', function(req, res) {
  var demo = JSON.parse( req.query['demo'] )
  var category = req.query['category']
  console.log(`category = ${category}`)

  var results = Datastore.chancesFor( demo )
  if (category) {
    results = results.filter(row => {return row.category === category})
  }

  res.setHeader('Content-Type', 'application/json');
  res.send( JSON.stringify(results) )
})

app.get('/populationFor', function(req, res) {
  var demo = JSON.parse( req.query['demo'] )

  var results = Datastore.populationRowsFor( demo )

  res.setHeader('Content-Type', 'application/json');
  res.send( JSON.stringify(results) )
})

app.get('/debug', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send( JSON.stringify(  Datastore.populationDebug() ))
})

app.listen(app.get('port'), function() {
  Datastore.init((err, worked) => {
    if (err) {
      console.log('Error starting database')
      console.error(err)
    } else {
      console.log('Database has inited')
    }
  })
});


