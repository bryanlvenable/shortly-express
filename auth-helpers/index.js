var User = require('../app/models/user');



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
  // How do we use next???
  User.where({username: req.body.username})
      .fetch()
      .then(function(model){
        console.log('user model:', model);
        // how can we access an error? or whether it returns an empty set?
      });
};
