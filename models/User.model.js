const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const userSchema = new Schema({
  fullName: {
    type: String,
    trim: true,
    required: [true, 'Your name is required']
  },
  storeName: {
    type: String,
    trim: true,
    default: ''
  },
  username: {
    type: String,
    trim: true,
    required: [true, 'Username is required'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true
  },
  emailConfirmed: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product' //Relates to the Product model
  }],
  sales: [{
    type: Schema.Types.ObjectId,
    ref: 'Order' //Relates to the Order model
  }],
  purchases: [{
    type: Schema.Types.ObjectId,
    ref: 'Order'
  }],
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  cart: [{
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        max: 99
    }
  }],
  billing: {
    firstName : {
      type: String,
    },
    lastName: {
      type: String,
    },
    address1: {
      type: String,
    },
    address2: {
      type: String
    },
    city: {
      type: String,
    },
    state: {
      type: String,
      minLength: 2,
      maxLength: 2,
    },
    postcode: {
      type: String,
    },
    country: {
      type: String,
      minLength: 2,
      maxLength: 2,
    },
    phone: {
      type: String,
      required: true,
      maxLength: 20
    },
    phoneConfirmed: {
      type: Boolean,
      default: false
    }
  },
  shipping: {
    firstName : {
      type: String,
    },
    lastName: {
      type: String,
    },
    address1: {
      type: String,
    },
    address2: {
      type: String
    },
    city: {
      type: String,
    },
    state: {
      type: String,
      minLength: 2,
      maxLength: 2,
    },
    postcode: {
      type: String,
    },
    country: {
      type: String,
      minLength: 2,
      maxLength: 2,
    },
    phone: {
      type: String,
    },
    phoneConfirmed: {
      type: Boolean,
      default: false
    }
  }
});

const User = model('User', userSchema);
module.exports = User;