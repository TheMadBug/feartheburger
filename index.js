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
  var demo = JSON.parse( req.param('demo') )

  var results = Datastore.chancesFor( demo )

  res.setHeader('Content-Type', 'application/json');
  res.send( JSON.stringify(results) )
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


