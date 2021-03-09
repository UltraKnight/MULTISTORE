const express = require('express');
const router = express.Router();
const User = require('../models/User.model');

const requireLogin = (req, res, next) => {
    if(req.user) {
      next();
    } else {
      res.status(401).json('You must be logged in to access this content');
      return;
    }
}

router.post('/profile', requireLogin, async (req, res) => {
    const newData = req.body;
    try {
        if(newData.username) {
            const foundUser = await User.findOne({username: newData.username});
            if(foundUser) {
                delete newData.username;
                await User.findByIdAndUpdate(req.user._id, newData);
                res.status(200).json(`Profile updated. Username already exists`);
            } else {
                await User.findByIdAndUpdate(req.user._id, newData);
                res.status(200).json(`User profile was updated`);
            }
            return;
        }

        await User.findByIdAndUpdate(req.user._id, newData);
        res.status(200).json(`User profile was updated`);
    } catch (error) {
        res.status(500).json(`Error occurred ${error}`);
    }
});

router.post('/profile/email', requireLogin, async (req, res) => {
    const {email} = req.body;
    console.log(email)
    try {
        const foundUser = await User.findOne({email});
        if(foundUser) {
            res.status(200).json('Email exists');
            return;
        }
        await User.findByIdAndUpdate(req.user._id, {email, emailConfirmed: false});
        res.status(200).json(`User profile was updated`);
    } catch (error) {
        res.status(500).json(`Error occurred ${error}`);
    }
});

module.exports = router;