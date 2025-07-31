const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product.model');
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const cloudinary = require('../configs/cloudinary');
const fs = require('fs');

const requireLogin = (req, res, next) => {
  if(req.user) {
    next();
  } else {
    console.log('User not logged in');
    res.status(401).json('You must be logged in to access this content');
    return;
  }
}

//Get products by user
router.get('/products/me', requireLogin, async (req, res) => {
  try {
    const productsDB = await Product.find({createdBy: req.user._id}).populate(['category', 'createdBy']);
    res.status(200).json(productsDB);

  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occured ${error}`);
  }
});

//Get products by category
router.get('/products/by-category/:categoryId', async (req, res) => {
  try {
    const productsDB = await Product.find({category: req.params.categoryId}).populate('category').populate('createdBy', 'billing.state billing.country billing.phoneConfirmed shipping.state shipping.country shipping.phoneConfirmed');
    res.status(200).json(productsDB);

  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occured ${error}`);
  }
});

//Read
router.get('/products', async (req, res) => {
  const search = req.query.query ? req.query.query : '';
  const limit = req.query.limit ? Number(req.query.limit) : 0;
  const stock = req.query.stock === 'true' ? 1 : 0;
  try {
    let productsDB = [];
    if(search) {
      productsDB = await Product.find({name: { "$regex": `${search}`, "$options": "i" }, quantity: {"$gte": stock}}).limit(limit).populate('category').populate('createdBy', 'billing.state billing.country billing.phoneConfirmed shipping.state shipping.country shipping.phoneConfirmed');
    } else {
      productsDB = await Product.find().limit(limit).populate('category').populate('createdBy', 'billing.state billing.country billing.phoneConfirmed shipping.state shipping.country shipping.phoneConfirmed');
    }
    res.status(200).json(productsDB);
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Create
router.post('/products', requireLogin, async (req, res) => {
  try {
    const {name, description, image_url, category, quantity, price} = req.body;
    
    if(!name || !category || !quantity || !price) {
      res.status(400).json(`Missing fields`);
      return;
    }
    
    const product = await Product.create({
      name,
      description,
      image_url,
      category,
      quantity,
      price,
      createdBy: req.user._id
    });

    await User.findByIdAndUpdate(req.user._id, {$push: {products: product.id}});
    console.log('Product added to the user');
    res.status(200).json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Delete
router.delete('/products/:id', requireLogin, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if(!product.createdBy.equals(req.user._id)) {
      res.status(401).json('You cannot delete a product you did\'nt create.');
      return;
    }

    await Product.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.user._id, {$pull: {products: req.params.id}});
    res.status(200).json(`Product with id ${req.params.id} was deleted.`);
  } catch (error) {
    console.error('Error occurred while deleting product:', error);
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Read - by id
router.get('/products/:id', async (req, res) => {
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json('Specified id is not valid');
      return;
    }

    const foundProduct = await Product.findById(req.params.id);
    res.status(200).json(foundProduct);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Update
router.put('/products/:id', requireLogin, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if(!product.createdBy.equals(req.user._id)) {
      res.status(401).json('You cannot edit a product you did\'nt create.');
      return;
    }

    const productWithNewData = req.body;
    await Product.findByIdAndUpdate(req.params.id, productWithNewData);
    res.status(200).json(`Product with id ${req.params.id} was updated`);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Sell
router.put('/products/:id/sell', requireLogin, async (req, res) => {
  try {
    let admin = await User.findOne({username: 'admin'});
    let product = await Product.findById(req.params.id);
    let {quantity} = req.body;
    console.log('true', (!product.createdBy.equals(req.user._id)) || (!bcrypt.compareSync(process.env.ADMIN_PASS, admin.password)));
    if(!(product.createdBy.equals(req.user._id) || bcrypt.compareSync(process.env.ADMIN_PASS, admin.password))) {
      res.status(401).json('Unauthorized action.');
      return;
    }

    await Product.findByIdAndUpdate(req.params.id, {$inc: {quantity: -quantity}});
    res.status(200).json('Product updated!');

  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

router.post('/upload', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const uploadedFile = req.files.file;
      const result = await cloudinary.uploader.upload(uploadedFile.tempFilePath, {
      folder: 'multistore',
      allowed_formats: ['jpg', 'png']
    });

    // delete the temp file
    fs.unlinkSync(uploadedFile.tempFilePath);

    res.status(200).json({ fileUrl: result.secure_url});
  } 
  catch(error) {
    console.error('Error uploading file:', error);
    res.status(500).json(`Error occurred ${error}`);
  };
});

module.exports = router;
