const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  address: { type: String, required: true },
  item: { type: String, required: true },
  weight: { type: String },
  price: { type: Number, required: true },
  customMessage: { type: String },
  paymentStatus: { type: String, default: 'Pending' }, // Pending, Paid, Failed
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  orderStatus: { type: String, default: 'Received' }, // Received, Preparing, Ready, Delivered
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
