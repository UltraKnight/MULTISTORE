const passport = require('passport');
//Local auth using our database
const LocalStrategy = require('passport-local');
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');

//Passport - Set the user in session
passport.serializeUser((loggedInUser, cb) => {
  cb(null, loggedInUser._id);
});

//Passport - Get the user from the session
//req.user
passport.deserializeUser(async (userIdFromSession, cb) => {
  // User.findById(userIdFromSession, (err, userDocument) => {
  //     if(err) {
  //         cb(err);
  //         return;
  //     }
  //     cb(null, userDocument);
  // });

try {
  const userDocument = await User.findById(userIdFromSession)
    .populate(['sales', 'purchases', 'categories', 'products', 'cart.product']);

  cb(null, userDocument);
} catch (err) {
  cb(err);
}
});

//Passport - Local authentication
passport.use(
  new LocalStrategy(async (username, password, next) => {
    try {
      const foundUser = await User.findOne({ username });
      
      if (!foundUser) {
        next(null, false, { message: 'Invalid login.' });
        return;
      }

      if (!bcrypt.compareSync(password, foundUser.password)) {
        next(null, false, { message: 'Invalid login.' });
        return;
      }

      next(null, foundUser);
    } catch (error) {
      next(err);
      return;
    }
  }),
);
