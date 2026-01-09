import express from 'express'
import { body, validationResult } from 'express-validator'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import User from '../models/User.js'
import Payment from '../models/Payment.js'
import Ledger from '../models/Ledger.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Initialize Razorpay only if keys are provided
let razorpay = null
const razorpayKeyId = process.env.RAZORPAY_KEY_ID
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

if (razorpayKeyId && razorpayKeySecret &&
  razorpayKeyId !== 'rzp_test_your_key_id_here' &&
  razorpayKeySecret !== 'your_key_secret_here') {
  try {
    razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    })
    console.log('✅ Razorpay initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay:', error.message)
  }
} else {
  console.log('⚠️ Razorpay not configured - payment features disabled')
}

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
router.post('/create-order', protect, [
  body('amount')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer'),
  body('currency')
    .optional()
    .isIn(['INR', 'USD'])
    .withMessage('Currency must be INR or USD'),
  body('plan')
    .isIn(['pro', 'enterprise'])
    .withMessage('Invalid plan selected')
], async (req, res, next) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured'
      })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { amount, currency = 'INR', plan } = req.body

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `order_${req.user.id}_${Date.now()}`,
      notes: {
        userId: req.user.id.toString(),
        plan,
        email: req.user.email
      }
    }

    const order = await razorpay.orders.create(options)

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key: process.env.RAZORPAY_KEY_ID
    })
  } catch (error) {
    console.error('Razorpay order creation error:', error)
    next(error)
  }
})

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
router.post('/verify', protect, [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Signature is required'),
  body('plan')
    .isIn(['pro', 'enterprise'])
    .withMessage('Invalid plan selected')
], async (req, res, next) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured'
      })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan
    } = req.body

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      })
    }

    // Get order details from Razorpay
    const order = await razorpay.orders.fetch(razorpay_order_id)
    const amount = order.amount / 100 // Convert from paise to rupees

    // Create payment record
    const payment = await Payment.create({
      userId: req.user.id,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amount,
      currency: order.currency,
      status: 'completed',
      plan,
      description: `${plan} plan purchase - ${amount} ${order.currency}`,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    })

    // Calculate minutes to add (assuming $0.50 per minute for VAPI)
    const minutesToAdd = Math.floor(amount * 2) // $1 = 2 minutes

    // Add credit to ledger
    await Ledger.addCredit(
      req.user.id,
      minutesToAdd,
      'purchase',
      `Purchased ${minutesToAdd} minutes for ${amount} ${order.currency}`,
      payment._id,
      'Payment'
    )

    // Update user subscription
    const user = await User.findById(req.user.id)
    user.subscription.plan = 'pro'
    user.subscription.payAsYouGoBalance += amount
    user.subscription.lastPayment = {
      amount,
      date: new Date(),
      razorpayPaymentId: razorpay_payment_id,
      status: 'completed'
    }

    await user.save()

    // Update payment record with minutes added
    payment.minutesAdded = minutesToAdd
    await payment.save()

    // In production, you might want to:
    // 1. Store payment details in a separate Payment model
    // 2. Send confirmation email
    // 3. Generate invoice

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription updated',
      subscription: user.subscription
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    next(error)
  }
})

// @desc    Handle Razorpay webhooks
// @route   POST /api/payment/webhook
// @access  Public (but verified)
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature']
    const body = JSON.stringify(req.body)

    // Verify webhook signature - REQUIRED in production
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET === 'whsec_your_webhook_secret_here') {
        console.error('Webhook secret not configured in production')
        return res.status(500).json({
          success: false,
          message: 'Webhook verification not configured'
        })
      }
    }

    // Always verify signature if webhook secret is configured
    if (process.env.RAZORPAY_WEBHOOK_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET !== 'whsec_your_webhook_secret_here') {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature received')
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        })
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, always require signature verification
      return res.status(400).json({
        success: false,
        message: 'Webhook signature verification required'
      })
    } else {
      // In development, warn if webhook secret is not configured
      console.warn('⚠️ Webhook secret not configured - webhooks will be accepted without verification')
    }

    const event = req.body

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity)
        break

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity)
        break

      default:
        console.log(`Unhandled webhook event: ${event.event}`)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    next(error)
  }
})

// Helper function to handle payment captured
async function handlePaymentCaptured(payment) {
  try {
    const userId = payment.notes?.userId
    if (!userId) return

    const user = await User.findById(userId)
    if (!user) return

    // Update user subscription or add minutes based on payment
    // This would depend on your business logic
    console.log(`Payment captured for user ${userId}: ${payment.amount / 100} ${payment.currency}`)
  } catch (error) {
    console.error('Error handling payment captured:', error)
  }
}

// Helper function to handle payment failed
async function handlePaymentFailed(payment) {
  try {
    const userId = payment.notes?.userId
    if (!userId) return

    // Handle failed payment - maybe send notification email
    console.log(`Payment failed for user ${userId}`)
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

// Helper function to handle subscription cancelled
async function handleSubscriptionCancelled(subscription) {
  try {
    const userId = subscription.notes?.userId
    if (!userId) return

    const user = await User.findById(userId)
    if (!user) return

    // Downgrade user to free plan
    user.subscription.plan = 'free'
    user.subscription.vapiMinutesRemaining = 30 // Reset to free plan minutes
    await user.save()

    console.log(`Subscription cancelled for user ${userId}`)
  } catch (error) {
    console.error('Error handling subscription cancelled:', error)
  }
}

// @desc    Get payment history
// @route   GET /api/payment/history
// @access  Private
router.get('/history', protect, async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)

    res.status(200).json({
      success: true,
      payments
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Cancel subscription
// @route   POST /api/payment/cancel-subscription
// @access  Private
router.post('/cancel-subscription', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (user.subscription.plan === 'free') {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel'
      })
    }

    // In production, you would:
    // 1. Cancel the subscription with Razorpay
    // 2. Update the user's subscription status
    // 3. Set cancellation date

    // For now, just downgrade to free
    user.subscription.plan = 'free'
    user.subscription.vapiMinutesRemaining = Math.min(user.subscription.vapiMinutesRemaining, 30)
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: user.subscription
    })
  } catch (error) {
    next(error)
  }
})

export default router