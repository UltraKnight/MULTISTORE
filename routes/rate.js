const express = require('express');
const router = express.Router();
const Rate = require('../models/Rate.model');

const requireLogin = (req, res, next) => {
    if(req.user) {
      next();
    } else {
      res.status(401).json('You must be logged in to access this content');
      return;
    }
}

router.get('/rates/:productId', async (req, res) => {
    try {
      const ratesDB = await Rate.find({productId: req.params.productId}).populate('createdBy');
      res.status(200).json(ratesDB);
    } catch (error) {
      console.log(error);
      res.status(500).json(`Error occurred ${error}`);
    }
});

router.post('/rates/add', requireLogin, async (req, res) => {
    const {comment, rate, createdBy, productId} = req.body;
    
    if(!comment || !rate || !createdBy || !productId) {
        res.status(400).json(`Missing fields`);
        return;
      }
    
    try {
      const newRate = await Rate.create({
        comment,
        rate,
        createdBy,
        productId
      });
  
      res.status(200).json(newRate);
    } catch (error) {
      console.log(error);
      res.status(500).json(`Error occurred ${error}`);
    }
});

router.delete('/rates/:id', requireLogin, async (req, res) => {
    try {
      let rate = await Rate.findById(req.params.id);
      if(! rate.createdBy.equals(req.user._id)) {
        res.status(401).json('You cannot delete a product you did\'nt create.');
        return;
      }
  
      await Rate.findByIdAndRemove(req.params.id);
      res.status(200).json(`Rate with id ${req.params.id} was deleted.`);
    } catch (error) {
      res.status(500).json(`Error occurred ${error}`);
    }
  });

module.exports = router;