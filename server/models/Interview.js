import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  userAnswer: {
    type: String,
    default: ''
  },
  followUpQuestions: [{
    question: String,
    answer: String
  }],
  score: {
    type: Number,
    min: 0,
    max: 10
  },
  feedback: String
});

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewType: {
    type: String,
    enum: ['HR', 'Technical', 'Managerial', 'Custom'],
    required: true
  },
  role: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: ''
  },
  topics: [{
    type: String
  }],
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  numberOfQuestions: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  questions: [questionSchema],
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  skillBreakdown: {
    communication: { type: Number, min: 0, max: 100 },
    confidence: { type: Number, min: 0, max: 100 },
    technicalKnowledge: { type: Number, min: 0, max: 100 },
    problemSolving: { type: Number, min: 0, max: 100 },
    clarity: { type: Number, min: 0, max: 100 }
  },
  strengths: [String],
  weaknesses: [String],
  improvementTips: [String],
  transcript: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  isShared: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Generate share token when interview is shared
interviewSchema.methods.generateShareToken = function() {
  this.shareToken = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  this.isShared = true;
  return this.shareToken;
};

export default mongoose.model('Interview', interviewSchema);