const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Category = require('../models/Category.model');
const User = require('../models/User.model');

const requireLogin = (req, res, next) => {
  if(req.user) {
    next();
  } else {
    res.status(401).json('You must be logged in to access this content');
    return;
  }
}

//Get categories by user
router.get('/categories/me', requireLogin, async (req, res) => {
  try {
    const categoriesDB = await Category.find({createdBy: req.user._id}).populate('createdBy');
    res.status(200).json(categoriesDB);

  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occured ${error}`);
  }
});

//Read - only categories created by you and the admin
router.get('/categories', requireLogin, async (req, res) => {
  try {
    const admin = await User.findOne({username: 'admin'});
    const categoriesDB = await Category.find({createdBy: [req.user._id, admin._id]}).populate('createdBy');
    res.status(200).json(categoriesDB);
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occurred ${error}`);
  }
});

//All categories
router.get('/categories/all', async (_req, res) => {
  try {
    const categoriesDB = await Category.find().populate('createdBy');
    res.status(200).json(categoriesDB);
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Create
router.post('/categories', requireLogin, async (req, res) => {
  try {
    const {name} = req.body;
    
    if(!name) {
      res.status(400).json(`Missing fields`);
      return;
    }
    
    const category = await Category.create({
      name,
      createdBy: req.user._id
    });

    await User.findByIdAndUpdate(req.user._id, {$push: {categories: category.id}});
    console.log('Category added to the user');
    res.status(200).json(category);
  } catch (error) {
    console.log(error);
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Delete
router.delete('/categories/:id', requireLogin, async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);
    if(! category.createdBy.equals(req.user._id)) {
      res.status(401).json('You cannot delete a category you did\'nt create.');
      return;
    }

    await Category.findByIdAndRemove(req.params.id);
    await User.findByIdAndUpdate(req.user._id, {$pull: {categories: req.params.id}});
    console.log('Category removed from the user');
    res.status(200).json(`Product with id ${req.params.id} was deleted.`);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Read - by id
router.get('/categories/:id', async (req, res) => {
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json('Specified id is not valid');
      return;
    }

    const foundProduct = await Category.findById(req.params.id);
    res.status(200).json(foundProduct);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

//Update
router.put('/categories/:id', requireLogin, async (req, res) => {
  try {
    let product = await Category.findById(req.params.id);
    if(! product.createdBy.equals(req.user._id)) {
      res.status(401).json('You cannot edit a category you did\'nt create.');
      return;
    }

    const productWithNewData = req.body;
    await Category.findByIdAndUpdate(req.params.id, productWithNewData);
    res.status(200).json(`Product with id ${req.params.id} was updated`);
  } catch (error) {
    res.status(500).json(`Error occurred ${error}`);
  }
});

module.exports = router;