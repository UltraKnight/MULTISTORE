const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product.model');
const User = require('../models/User.model');
const fileUpload = require('../configs/cloudinary');

const requireLogin = (req, res, next) => {
  if(req.user) {
    next();
  } else {
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
router.get('/products/:categoryId', requireLogin, async (req, res) => {
  try {
    const productsDB = await Product.find({category: req.params.categoryId}).populate(['category', 'createdBy']);
    res.status(200).json(productsDB);

  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occured ${error}`);
  }
});

//Read
router.get('/products', async (_req, res) => {
  try {
    const productsDB = await Product.find().populate(['category', 'createdBy']);
    res.status(200).json(productsDB);
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Create
router.post('/products', async (req, res) => {
  try {
    const {name, description, image_url, category, quantity, price, createdBy} = req.body;
    
    if(!name || !category || !quantity || !price || !createdBy) {
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
      createdBy
    });

    await User.findByIdAndUpdate(createdBy, {$push: {products: product.id}});
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
    if(! product.createdBy.equals(req.user._id)) {
      res.status(401).json('You cannot delete a product you did\'nt create.');
      return;
    }

    await Product.findByIdAndRemove(req.params.id);
    await User.findByIdAndUpdate(req.user._id, {$pull: {products: req.params.id}});
    res.status(200).json(`Product with id ${req.params.id} was deleted.`);
  } catch (error) {
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
    if(! product.createdBy.equals(req.user._id)) {
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

router.post('/upload', fileUpload.single('file'), (req, res) => {
  try {
    res.status(200).json({ fileUrl: req.file.path});
  } 
  catch(error) {
    res.status(500).json(`Error occurred ${error}`);
  };
});

module.exports = router;