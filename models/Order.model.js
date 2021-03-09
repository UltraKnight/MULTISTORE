const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  products: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      max: 99
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  total: {
    type: Number,
    required: true
  },
  // seller: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true
  // },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  shippedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Refunded', 'In transit', 'Delivered', 'Processing'],
    required: true
  },
  comments: [{
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    comment: {
      type: String,
      trim: true
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;