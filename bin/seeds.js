// Iteration #1
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category.model');
const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
require('../configs/db.config');

let userId;

async function createUser() {
  try {
    const foundUser = await User.findOne({username: 'admin'});
    if(! foundUser) {
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashPassword = bcrypt.hashSync(process.env.ADMIN_PASS, salt);
      await User.create({
        fullName: 'Vanderlei Ignacio Martins',
        billing: {
          firstName: 'Vanderlei',
          lastName: 'Ignacio Martins',
          address1: 'Rua Joao Chagas, 131',
          address2: '2º direito',
          city: 'Oeiras',
          state: 'LI',
          postcode: '2795-102',
          country: 'PT',
          phone: '+351910240118'
        },
        shipping: {
          firstName: 'Vanderlei',
          lastName: 'Ignacio Martins',
          address1: 'Rua Joao Chagas, 131',
          address2: '2º direito',
          city: 'Oeiras',
          state: 'LI',
          postcode: '2795-102',
          country: 'PT',
          phone: '+351910240118',
          phoneConfirmed: true
        },
        username: 'admin',
        email: 'admin@outlook.com',
        password: hashPassword
      });
      console.log('admin user created.');
    } else {
      console.log('admin user already exists.');
    }
  } catch (error) {
    console.log(`Error while creating admin user: ${error}`);
    mongoose.connection.close();
    throw error;
  }
}

async function getUserId() {
  try {
    const user = await User.findOne({username: 'admin'});
    if(!user) {
      console.log('Could\'nt recover User id');
      return;
    }
    userId = user.id;
  } catch(error) {
    console.log(`Error retrieving User id ${error}`);
    mongoose.connection.close();
    throw error;
  }
}

function createArrayCategories() {
    categories = [
      {
        name: 'Electronics',
        createdBy: userId
      },
      {
        name: 'Books',
        createdBy: userId
      },
      {
        name: 'Clothes',
        createdBy: userId
      }
    ]
}

async function createCategories() {
    try {
        await Category.create(categories);
        console.log('Categories inserted!');
    } catch (error) {
        console.log(`Error while inserting categories ${error}`);
        mongoose.connection.close();
        throw error;
    }
}

async function populateDB() {
  try {
    await createUser();
    await getUserId();

    await createArrayCategories();
    await createCategories();
    mongoose.connection.close();
  } catch (error) {
    //console.log(`Error: ${error}`);
    return;
  }
}

populateDB();