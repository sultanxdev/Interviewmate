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
    required: function() {
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
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user can take interview (for free users)
userSchema.methods.canTakeInterview = function() {
  if (this.subscription === 'pro') return true;
  
  const today = new Date().toDateString();
  const lastInterviewDate = this.lastInterviewDate ? this.lastInterviewDate.toDateString() : null;
  
  if (lastInterviewDate !== today) {
    return true; // New day, reset count
  }
  
  return this.dailyInterviewCount < 2; // Free users get 2 interviews per day
};

export default mongoose.model('User', userSchema);