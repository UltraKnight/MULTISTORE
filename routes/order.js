const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order.model');
const User = require('../models/User.model');

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
    const ordersDB = await Order.find().populate(['products', 'seller', 'client']);
    res.status(200).json(ordersDB);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Get sale orders
router.get('/orders/sales', requireLogin, async (req, res) => {
  try {
    const ordersDB = await Order.find({seller: req.user._id}).populate(['products', 'seller', 'client']);
    res.status(200).json(ordersDB);

  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occured ${error}`);
  }
});

//Get purchase orders
router.get('/orders/purchases', requireLogin, async (req, res) => {
  try {
    const ordersDB = await Order.find({client: req.user._id}).populate(['products', 'seller', 'client']);
    res.status(200).json(ordersDB);

  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occured ${error}`);
  }
});

//Create order - no shipped date or comment at this moment
router.post('/orders', requireLogin, async (req, res) => {
  try {
    const {products, total, seller, client, orderDate, status} = req.body;
    if(!products || !seller || !client || !status) {
      res.status(400).json(`Missing fields`);
      return;
    }
    
    const order = await Order.create({
      products,
      total,
      seller,
      client,
      orderDate,
      status
    });

    //add order as sales to the seller
    await User.findByIdAndUpdate(seller, {$push: {sales: order.id}});
    console.log('Order added to the seller');
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
    if(! order.seller.equals(req.user._id)) {
      res.status(401).json('You cannot edit this order.');
      return;
    }
    
    const productWithNewData = req.body;
    const {comments} = req.body;

    if(comments) {
      res.status(406).json('You cannot update the comment here');
      return;
    }

    await Order.findByIdAndUpdate(req.params.id, productWithNewData);
    res.status(200).json(`Order with id ${req.params.id} was updated`);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Add comment - must have author id, comment and the date (which has a default value)
router.put('/orders/:id/comment', requireLogin, async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    if(! (order.seller.equals(req.user._id) || order.client.equals(req.user._id))) {
      res.status(401).json('You cannot add comments to this order.');
      return;
    }

    const comment = req.body;
    await Order.findByIdAndUpdate(req.params.id, {$push: {comments: comment}});
    res.status(200).json(`Comment added to the order with id ${req.params.id}`);
  } catch (error) {
    res.status(500).json(`Error occured ${error}`);
  }
});

module.exports = router;