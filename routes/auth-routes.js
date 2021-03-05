const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const passport = require('passport');

const requireLogin = (req, res, next) => {
  if(req.user) {
    next();
  } else {
    res.status(401).json('You must be logged in to access this content');
    return;
  }
}

//username, password, email, fullname
router.post('/signup', (req, res) => {
    const { username, password, fullName, email } = req.body;
    //Server side validation on empty fields
    if (username === '' || password === '' || email === '' || fullName === '') {
      res.state(400).json('missing fields')
      return;
    }
    //Server side validation on password constrain
    //Regular expressions
    const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (passwordRegex.test(password) === false) {
      res.status(400).json('weak password');
      return;
    }
    User.findOne({username: username})
      .then((user) => {
        if (user) {
          res.status(400).json('username already exists');
          return;
        }
        //Create the user
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashPassword = bcrypt.hashSync(password, salt);
        User.create({
          fullName,
          username,
          password: hashPassword,
          email
        }).then((response) => {
          res.status(200).json(response)
        }).catch((error) => {
          //.code is mongoose validation error
          if (error.code === 11000) {
            res.status(500).json('username should be unique')
          }
        });
      });
  });

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, theUser, failureDetails) => {
        if (err) {
            res.status(500).json({ message: 'Something went wrong authenticating user' });
            return;
        }
        if (!theUser) {
            // "failureDetails" contains the error messages
            // from our logic in "LocalStrategy" { message: '...' }.
            res.status(401).json(failureDetails);
            return;
        }
        // save user in session
        req.login(theUser, (err) => {
            if (err) {
                res.status(500).json({ message: 'Session save went bad.' });
                return;
            }
            // We are now logged in (that's why we can also send req.user)
            res.status(200).json(theUser);
        });
    })(req, res, next);
});

router.post('/logout', (req, res) => {
    req.logout();
    res.status(200).json('logout success');
});

router.get('/loggedin', (req, res) => {
    if(req.isAuthenticated()) {
        res.status(200).json(req.user);
        return;
    }
    res.status(200).json({});
});

//product must by an object like this - {product: id, quantity: 00}
router.post('/cart/add', requireLogin, async (req, res) => {
  
  const product = req.body;
  
  try {
    const foundUser = await User.findById(req.user._id);
    const productInCart = await foundUser.cart.find(item => item.product.equals(product.product));
    if(productInCart) {
      const index =  foundUser.cart.indexOf(productInCart);
      foundUser.cart[index].quantity += product.quantity;
      await User.findByIdAndUpdate(req.user._id, {cart : foundUser.cart});
      res.status(200).json('Product updated in the cart');
    } else {
      await User.findByIdAndUpdate(req.user._id, {$push: {cart: product}});
      res.status(200).json('Product added to the cart');
    }
  } catch (error) {
    res.status(500).json(`An error occurred: ${error}`);
  }
});

//product = {product: id, quantity: 00}
//if quantity === 0 - remove the product else decrement the quantity
router.delete('/cart/remove', requireLogin, async (req, res) => {
  const product = req.body;

  try {
    const foundUser = await User.findById(req.user._id).populate('cart');
    const productInCart = await foundUser.cart.find(item => item.product.equals(product.product));
    if(productInCart && product.quantity > 0 && productInCart.quantity > product.quantity) {
      const index = foundUser.cart.indexOf(productInCart);
      foundUser.cart[index].quantity -= product.quantity;
      await User.findByIdAndUpdate(req.user._id, {cart : foundUser.cart});
      res.status(200).json('Product updated in the cart');
    } else if(productInCart) {
      await User.findByIdAndUpdate(req.user._id, {$pull: {cart: productInCart}});
      res.status(200).json('Product removed from the cart');
    } else {
      res.status(400).json('Poduct is not in the cart');
    }
  } catch (error) {
    res.status(500).json(`An error occurred: ${error}`);
  }
});

module.exports = router;