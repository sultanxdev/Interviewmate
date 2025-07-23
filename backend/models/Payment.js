const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  razorpaySignature: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed', 'refunded'],
    default: 'created'
  },
  plan: {
    type: String,
    enum: ['pro_monthly', 'pro_yearly'],
    required: true
  },
  planDuration: {
    type: Number, // in days
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Update user subscription after successful payment
paymentSchema.methods.activateSubscription = async function() {
  const User = mongoose.model('User');
  const user = await User.findById(this.userId);
  
  if (user && this.status === 'paid') {
    user.subscription = 'pro';
    
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.planDuration);
    user.subscriptionExpiry = expiryDate;
    
    await user.save();
    return user;
  }
  
  return null;
};

module.exports = mongoose.model('Payment', paymentSchema);