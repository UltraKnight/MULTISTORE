const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order.model');
const User = require('../models/User.model');
const stripe = require("stripe")('sk_test_51IT8KtGAKMDxiOOtdWC9ORYmkqPMMYflkIfa1rllOa0TwTzj0EPhDFeJOEgIjaS0uXfyfU3kUphBjmwJP5IQWqsr004ofwcFwa');

const requireLogin = (req, res, next) => {
  if(req.user) {
    next();
  } else {
    res.status(401).json('You must be logged in to access this content');
    return;
  }
}

//Read
router.get('/orders', async (_req, res) => {
  try {
    const ordersDB = await Order.find().populate(['products.product', 'products.seller', 'client', 'comments.author', 'comments.to']).sort({orderDate : -1});
    res.status(200).json(ordersDB);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Get sale orders
router.get('/orders/sales', requireLogin, async (req, res) => {
  try {
    const ordersDB = await Order.find({'products.seller': req.user._id}).populate(['products.product', 'products.seller', 'client', 'comments.author', 'comments.to']).sort({orderDate : -1});
    res.status(200).json(ordersDB);

  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occured ${error}`);
  }
});

//Get purchase orders
router.get('/orders/purchases', requireLogin, async (req, res) => {
  try {
    const ordersDB = await Order.find({client: req.user._id}).populate(['products.product', 'products.seller', 'client', 'comments.author', 'comments.to']).sort({orderDate : -1});
    res.status(200).json(ordersDB);

  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occured ${error}`);
  }
});

//Create order - no shipped date or comment at this moment
router.post('/orders', requireLogin, async (req, res) => {
  try {
    console.log(req.body);
    const {products, total, client, orderDate, status} = req.body;
    if(!products || !client || !status) {
      res.status(400).json(`Missing fields`);
      return;
    }
    
    const order = await Order.create({
      products,
      total,
      client,
      orderDate,
      status
    });
    
    //add order as sales to the seller(s)
    products.map(async product => await User.findByIdAndUpdate(product.seller, {$push: {sales: order.id}}));
    console.log('Order added to the sellers');
    //add order as purchases to the client
    await User.findByIdAndUpdate(client, {$push: {purchases: order.id}});
    console.log('Order added to the client');

    res.status(200).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Delete
router.delete('/orders/:id', requireLogin, async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    if(! order.seller.equals(req.user._id)) {
      res.status(401).json('You cannot delete a product you did\'nt create.');
      return;
    }

    await User.findByIdAndUpdate(order.seller, {$pull: {sales: order.id}});
    console.log('Order removed from the Seller');
    await User.findByIdAndUpdate(order.client, {$pull: {purchases: order.id}});
    console.log('Order removed from the Client');
    
    await Order.findByIdAndRemove(req.params.id);
    res.status(200).json(`Order with id ${req.params.id} was deleted.`);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Read - by id
router.get('/orders/:id', async (req, res) => {
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json('Specified id is not valid');
      return;
    }

    const foundOrder = await Order.findById(req.params.id);
    res.status(200).json(foundOrder);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Update
router.put('/orders/:id', requireLogin, async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    let foundSeller = order.products.find(product => product.seller.equals(req.user._id));
    if(! !foundSeller) {
      res.status(401).json('You cannot edit this order.');
      return;
    }
    
    const orderWithNewData = req.body;
    const {comments} = req.body;

    if(comments) {
      res.status(406).json('You cannot update the comment here');
      return;
    }

    await Order.findByIdAndUpdate(req.params.id, orderWithNewData);
    res.status(200).json(`Order with id ${req.params.id} was updated`);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Add comment - must have author id, comment and the date (which has a default value)
router.put('/orders/:id/comment', requireLogin, async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    let foundSeller = order.products.find(product => product.seller.equals(req.user._id));
    if(! (foundSeller || order.client.equals(req.user._id))) {
      res.status(401).json('You cannot add comments to this order.');
      return;
    }

    const {comment, to} = req.body;
    await Order.findByIdAndUpdate(req.params.id, {$push: {comments: {author: req.user._id, to: to, comment: comment}}});
    res.status(200).json(`Comment added to the order with id ${req.params.id}`);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Update status
router.put('/orders/:id/status', requireLogin, async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    let foundSeller = order.products.find(product => product.seller.equals(req.user._id));
    if(! (foundSeller || order.client.equals(req.user._id))) {
      res.status(401).json('You cannot edit the status of this order.');
      return;
    }

    const {status} = req.body;
    await Order.findByIdAndUpdate(req.params.id, {status: status});
    res.status(200).json(`Status changed to the order with id ${req.params.id}`);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
})

//Calculate order
const calculateOrderAmount = userCart => {
  let total = userCart.reduce((accumulator, curr) => accumulator + curr.quantity * curr.product.price, 0).toFixed(2);
  total = parseInt(total * 100);
  return total
}

//Payment
router.post("/create-payment-intent", async (req, res) => {
  const {userCart} = req.body;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(userCart),
    currency: "eur"
  });
  res.send({
    clientSecret: paymentIntent.client_secret
  });
});

//Retry payment
router.post("/retry-payment-intent", async (req, res) => {
  const {total} = req.body;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: parseInt(total * 100),
    currency: "eur"
  });
  res.send({
    clientSecret: paymentIntent.client_secret
  });
});

module.exports = router;