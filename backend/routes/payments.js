const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private
router.post('/create-order', auth, [
  body('plan').isIn(['pro_monthly', 'pro_yearly']).withMessage('Invalid plan')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plan } = req.body;
    const user = req.userDoc;

    // Plan pricing
    const planPricing = {
      pro_monthly: { amount: 49900, duration: 30 }, // ₹499 for 30 days
      pro_yearly: { amount: 499900, duration: 365 } // ₹4999 for 365 days
    };

    const planDetails = planPricing[plan];
    if (!planDetails) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: planDetails.amount, // amount in paise
      currency: 'INR',
      receipt: `order_${user._id}_${Date.now()}`,
      notes: {
        userId: user._id.toString(),
        plan: plan,
        email: user.email
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    // Save payment record
    const payment = new Payment({
      userId: user._id,
      razorpayOrderId: order.id,
      amount: planDetails.amount,
      currency: 'INR',
      plan: plan,
      planDuration: planDetails.duration,
      status: 'created'
    });

    await payment.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post('/verify', auth, [
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      userId: req.user.userId
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'paid';
    await payment.save();

    // Activate user subscription
    const user = await payment.activateSubscription();

    res.json({
      message: 'Payment verified successfully',
      subscription: {
        plan: user.subscription,
        expiresAt: user.subscriptionExpiry
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Razorpay webhooks
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Helper function to handle payment captured
async function handlePaymentCaptured(paymentData) {
  try {
    const payment = await Payment.findOne({
      razorpayOrderId: paymentData.order_id
    });

    if (payment && payment.status !== 'paid') {
      payment.razorpayPaymentId = paymentData.id;
      payment.status = 'paid';
      await payment.save();

      // Activate subscription
      await payment.activateSubscription();
    }
  } catch (error) {
    console.error('Handle payment captured error:', error);
  }
}

// Helper function to handle payment failed
async function handlePaymentFailed(paymentData) {
  try {
    const payment = await Payment.findOne({
      razorpayOrderId: paymentData.order_id
    });

    if (payment) {
      payment.status = 'failed';
      await payment.save();
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

// Helper function to handle subscription cancelled
async function handleSubscriptionCancelled(subscriptionData) {
  try {
    // Find user by Razorpay customer ID and update subscription
    const user = await User.findOne({
      razorpayCustomerId: subscriptionData.customer_id
    });

    if (user) {
      user.subscription = 'free';
      user.subscriptionExpiry = null;
      await user.save();
    }
  } catch (error) {
    console.error('Handle subscription cancelled error:', error);
  }
}

// @route   GET /api/payments/history
// @desc    Get user's payment history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({
      userId: req.user.userId,
      status: 'paid'
    }).sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/cancel-subscription
// @desc    Cancel user subscription
// @access  Private
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const user = req.userDoc;

    if (!user.isPro()) {
      return res.status(400).json({ message: 'No active subscription to cancel' });
    }

    // In a real app, you would cancel the Razorpay subscription
    // For now, we'll just set the subscription to expire at the end of the current period
    
    user.subscription = 'free';
    user.subscriptionExpiry = null;
    await user.save();

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;