import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId; // Password required only if not Google OAuth
    }
  },
  googleId: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String,
    default: ''
  },
  subscription: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  // Token System
  tokenBalance: {
    type: Number,
    default: 50, // Free tokens on signup
    min: 0
  },
  totalTokensUsed: {
    type: Number,
    default: 0
  },
  totalTokensPurchased: {
    type: Number,
    default: 0
  },
  monthlyTokenAllowance: {
    type: Number,
    default: 0 // Pro users get monthly tokens
  },
  lastTokenRefill: {
    type: Date,
    default: null
  },
  // Analytics
  analytics: {
    totalSessions: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    skillAverages: {
      clarity: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      depth: { type: Number, default: 0 },
      crossQuestionHandling: { type: Number, default: 0 },
      logicalConsistency: { type: Number, default: 0 }
    },
    improvementRate: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // Legacy fields (deprecated but kept for migration)
  dailyInterviewCount: {
    type: Number,
    default: 0
  },
  lastInterviewDate: {
    type: Date,
    default: null
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Token management methods
userSchema.methods.hasEnoughTokens = function (requiredTokens) {
  return this.tokenBalance >= requiredTokens;
};

userSchema.methods.deductTokens = async function (amount) {
  if (this.tokenBalance < amount) {
    throw new Error('Insufficient tokens');
  }
  this.tokenBalance -= amount;
  this.totalTokensUsed += amount;
  await this.save();
  return this.tokenBalance;
};

userSchema.methods.addTokens = async function (amount, source = 'purchase') {
  this.tokenBalance += amount;
  if (source === 'purchase') {
    this.totalTokensPurchased += amount;
  }
  await this.save();
  return this.tokenBalance;
};

// Check and refill monthly subscription allowance
userSchema.methods.checkMonthlyRefill = async function () {
  if (this.subscription === 'pro' && this.monthlyTokenAllowance > 0) {
    const now = new Date();
    const lastRefill = this.lastTokenRefill || new Date(0);
    const daysSinceRefill = (now - lastRefill) / (1000 * 60 * 60 * 24);

    if (daysSinceRefill >= 30) {
      this.tokenBalance += this.monthlyTokenAllowance;
      this.lastTokenRefill = now;
      await this.save();
      return true;
    }
  }
  return false;
};

// Legacy method - kept for backwards compatibility
userSchema.methods.canTakeInterview = function () {
  // Use token-based check instead
  return this.hasEnoughTokens(10); // 10 tokens per session
};

export default mongoose.model('User', userSchema);