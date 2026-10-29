const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // 'cakes' or 'shringar'
  description: { type: String },
  halfKgPrice: { type: Number },
  oneKgPrice: { type: Number },
  priceDisplay: { type: String }, // e.g. 'from ₹200' or 'Price on request'
  image: { type: String }
});

module.exports = mongoose.model('Product', productSchema);
