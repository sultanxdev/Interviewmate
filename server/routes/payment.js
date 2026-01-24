import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Lazy-initialize Razorpay (after env vars are loaded)
let razorpay = null;
const getRazorpay = () => {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
};

// Create order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { plan, amount } = req.body;

    // Validate plan
    const validPlans = {
      'pro_monthly': 999,
      'pro_yearly': 9999
    };

    if (!validPlans[plan] || validPlans[plan] !== amount) {
      return res.status(400).json({ message: 'Invalid plan or amount' });
    }

    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.userId,
        plan: plan
      }
    };

    const order = await getRazorpay().orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// Verify payment
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update user subscription
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate expiry date
    const now = new Date();
    let expiryDate;

    if (plan === 'pro_monthly') {
      expiryDate = new Date(now.setMonth(now.getMonth() + 1));
    } else if (plan === 'pro_yearly') {
      expiryDate = new Date(now.setFullYear(now.getFullYear() + 1));
    }

    // Update user
    user.subscription = 'pro';
    user.subscriptionExpiry = expiryDate;
    await user.save();

    res.json({
      message: 'Payment verified and subscription updated successfully',
      subscription: {
        plan: 'pro',
        expiryDate: expiryDate
      }
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// Get subscription status
router.get('/subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('subscription subscriptionExpiry');

    const isActive = user.subscription === 'pro' &&
      user.subscriptionExpiry &&
      new Date() < user.subscriptionExpiry;

    res.json({
      subscription: user.subscription,
      expiryDate: user.subscriptionExpiry,
      isActive: isActive
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Failed to get subscription status' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.subscription = 'free';
    user.subscriptionExpiry = null;
    await user.save();

    res.json({ message: 'Subscription cancelled successfully' });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Webhook for payment events
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
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
        console.log('Payment captured:', event.payload.payment.entity);
        break;
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity);
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

export default router;