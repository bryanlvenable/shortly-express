var User = require('../app/models/user');
var session = require('express-session');



// check' the session object on the request to see if there is a user attached
exports.checkAuth = function(req, res, next) {
  // [Q] how does the user get on the session obj
  if ( req.session.user ) {
    next();
  } else {
    req.session.error = 'Need More Keyboards: Access Denied';
    res.redirect('login');
  }
};

// checks to see if the user exists in the DB
// this will be utilized in the /login push request
exports.userExists = function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var user = new User({username: username, password: password});
  user.where({username: req.body.username})
      .fetch()
      .then(function(model){
        next();
        // console.log('user model:', model);
        // how can we access an error? or whether it returns an empty set?
      });
};

exports.loginAuth = function(req,res,next){
  var username = req.body.username;
  var password = req.body.password;
  var user = new User({username: username, password: password});
  user.fetch()
  .then(function(model){
    if (model) {
      // adds user property to session to track that the session is active
      req.session.user = username;
      next();
    }
    else {
      console.log('username and password dont match');
      res.redirect('/login');
    }
  });
};
