const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: false
  },
  image_url: {
    type: String,
    trim: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category' //Relates to the Category model
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
    required: true
  },
  price: {
    type: Number,
    default: 0.00,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;