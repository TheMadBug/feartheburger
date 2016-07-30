var express = require('express');
var app = express();
var Datastore = require('./datastore.js')

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.listen(app.get('port'), function() {
  Datastore.init((err, worked) => {
    if (err) {
      console.log('Error starting database')
      console.error(err)
    } else {
      console.log('Yay database init worked')
      let results = Datastore.chancesFor({gender:'F', foo:'Bar'})
      console.log(JSON.stringify(results))
    }
  })
});


