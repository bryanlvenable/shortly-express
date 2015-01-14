var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

// creates handy helper methods for authentication
var authHelpers = require('auth-helpers');

// var cookieParser = require('cookie-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
// Cookie parser and session added because modules no-longer part of express
// app.use(cookieParser('jobsFinished'));
app.use(session({
  secret: 'needMoreMinerals',
  resave: false, // dunno what this does...
  saveUninitialized: true // dunno what this does...
}));

// define restrict function


// if the user is already authenticated (check the session object)
  // render the index.html
// if the user is not authenticated
  // redirect them to the login page

app.get('/', function(req, res) {
  authHelpers.checkAuth(req, res, function(){
    res.render('index');
  });
});

app.get('/create', function(req, res) {
  authHelpers.checkAuth(req, res, function(){
    res.render('create');
  });
});

app.get('/links', function(req, res) {
  // checking the Authorization on session
  authHelpers.checkAuth(req, res, function() {
    // Links.reset() will purge the local cache and then fetch all link records from db
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  });
});

app.get('/signup', function(req, res){
  res.render('signup');
});

app.post('/signup', function(req, res){
  // console.log('Reck dat body', req.body);
  var username = req.body.username;
  var password = req.body.password;
  var user = new User({username: username});
  user.fetch().then(function(model){
    if (model) {
      console.log('username already exists');
      res.render('signup');
    } else {
      new User({username: username, password: password}).save().then(function(model){
        console.log('user model has been added to DB', model);
        // create a session
        // redirect to index
        res.redirect('/');
      });
    }
  });
  // if successful delete old session
    // give them a new session with new username
  // if storing fails render signup page with Canadian error message
});

// creates a router for post requests to the /login route
app.post('/login', function(req, res) {
  // authHelpers.userExists(req, res); // this should console log the

  // Call the login authorization helper function to authorize
  // then redirect to the home page
  authHelpers.loginAuth(req, res, function(){
    res.redirect('/');
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', function(req, res) {
  res.render('login');
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
