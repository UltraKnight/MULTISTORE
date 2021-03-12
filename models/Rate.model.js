const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fields = {
  comment: {
    type: String,
    required: true,
    trim: true
  },
  rate: {
    type: Number,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }
};

const Rate = mongoose.model('Rate', new Schema(fields));
module.exports = Rate;