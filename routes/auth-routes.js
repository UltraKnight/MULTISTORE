const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const passport = require('passport');
const emailController = require('./email/email.controller');

const templates = require('./email/email.templates');
const sendEmail = require('./email/email.send');

const requireLogin = (req, res, next) => {
  if(req.user) {
    next();
  } else {
    console.log(req.user)
    res.status(401).json('You must be logged in to access this content');
    return;
  }
}

//username, password, email, fullname
router.post('/signup', async (req, res) => {
  const { username, password, fullName, email } = req.body;

  //Server side validation on empty fields
  if (username === '' || password === '' || email === '' || fullName === '') {
    res.json('missing fields');
    return;
  }

  const emailAfterAt = email.substring(email.length, email.indexOf('@'));
  if(! emailAfterAt.includes('.')) {
    res.json('invalid email');
    return;
  }

  //Server side validation on password constrain
  //Regular expressions
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (passwordRegex.test(password) === false) {
    res.status(200).json('weak password');
    return;
  }

  const emailExists = await User.findOne({email});
  if(emailExists) {
    res.status(200).json('email already registered');
    return;
  }

  User.findOne({username: username})
  .then((user) => {
    if (user) {
      res.status(200).json('username already exists');
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
    }).then(async (response) => {
      await sendEmail(response.email, templates.confirm(response._id));
      res.status(200).json(response);
    }).catch((error) => {
      //.code is mongoose validation error
      if (error.code === 11000) {
        res.status(500).json('username should be unique');
        return;
      }
      res.status(500).json(error);
    });
  });
});

router.post('/email/send', async (req, res) => {
  try {
    const {email, id} = req.body;
    console.log(email);
    console.log(id);
    await sendEmail(email, templates.confirm(id));
    res.status(200).json('Email sent');
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error: ${error}`);
  }
});

router.get('/email/confirm/:id', emailController.confirmEmail);

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
router.post('/cart/remove', requireLogin, async (req, res) => {
  const product = req.body;
  try {
    const foundUser = await User.findById(req.user._id).populate('cart.product');
    //if there is at least one deleted product in the cart
    for (const item of foundUser.cart) {
      if(! item.product) {
        const index = foundUser.cart.indexOf(item);
        foundUser.cart.splice(index, 1);
        await User.findByIdAndUpdate(req.user._id, {cart : foundUser.cart});
        res.status(200).json('A deleted product was removed from your cart.');
        return;
      }
    }

    if(! product.product) {
      res.status(400).json('Invalid product');
      return;
    }

    //if the product was not deleted by the seller
    const productInCart = await foundUser.cart.find(item => item.product._id.equals(product.product));
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