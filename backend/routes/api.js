const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Initialize Razorpay (Mock keys if not provided)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mocksecret',
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    // If no products in DB yet, return default products based on screenshots
    if (products.length === 0) {
      const defaultProducts = [
        { name: 'Vanilla or chocolate cream cake', category: 'cakes', halfKgPrice: 200, oneKgPrice: 400, priceDisplay: 'from ₹200' },
        { name: 'Butterscotch cake', category: 'cakes', halfKgPrice: 200, oneKgPrice: 400, priceDisplay: 'from ₹200' },
        { name: 'Black forest cake', category: 'cakes', halfKgPrice: 200, oneKgPrice: 400, priceDisplay: 'from ₹200' },
        { name: 'Pineapple cake', category: 'cakes', halfKgPrice: 200, oneKgPrice: 400, priceDisplay: 'from ₹200' },
        { name: 'Fresh fruit cake', category: 'cakes', halfKgPrice: 200, oneKgPrice: 400, priceDisplay: 'from ₹200' },
        { name: 'Photo cake (your picture on top)', category: 'cakes', oneKgPrice: 500, priceDisplay: '₹500' },
        { name: 'Heart cake for anniversaries', category: 'cakes', priceDisplay: 'Price on request' },
        { name: 'Dry fruit and premium cakes', category: 'cakes', priceDisplay: 'Price on request' },
        
        { name: 'Bridal shringar set', category: 'shringar', priceDisplay: 'Price on request', description: 'Full set for the wedding day' },
        { name: 'Bindi and bindi boxes', category: 'shringar', priceDisplay: 'Price on request', description: 'Single packets and boxes' },
        { name: 'Bangle sets', category: 'shringar', priceDisplay: 'Price on request', description: 'Glass, plastic and metal' },
        { name: 'Mehendi cones', category: 'shringar', priceDisplay: 'Price on request', description: 'Single and party packs' },
        { name: 'Hair accessories', category: 'shringar', priceDisplay: 'Price on request', description: 'Pins, clips, ribbons, jewelled bands' },
        { name: 'Sindoor, kajal and everyday cosmetics', category: 'shringar', priceDisplay: 'Price on request', description: 'Daily-use items' },
      ];
      await Product.insertMany(defaultProducts);
      return res.json(defaultProducts);
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, customerName, customerPhone, address, item, weight, customMessage } = req.body;

    // Create Razorpay order
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save pending order to DB
    const newOrder = new Order({
      customerName,
      customerPhone,
      address,
      item,
      weight,
      price: amount,
      customMessage,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: 'Pending'
    });

    await newOrder.save();

    res.json({
      orderId: razorpayOrder.id,
      currency: razorpayOrder.currency,
      amount: razorpayOrder.amount,
      dbOrderId: newOrder._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong while creating order" });
  }
});

// Verify Payment
router.post('/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dbOrderId
    } = req.body;

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'mocksecret');
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    // For testing without real keys, allow mock success if using mock secret
    const isMock = !process.env.RAZORPAY_KEY_SECRET;

    if (digest === razorpay_signature || isMock) {
      // Update order in DB
      await Order.findByIdAndUpdate(dbOrderId, {
        paymentStatus: 'Paid',
        razorpayPaymentId: razorpay_payment_id,
        orderStatus: 'Received'
      });

      return res.json({ status: 'success', message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ status: 'failure', message: 'Invalid signature' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
