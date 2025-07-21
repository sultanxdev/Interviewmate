const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  mainQuestion: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['behavioral', 'technical', 'situational', 'general'],
    default: 'general'
  },
  answer: {
    type: String,
    default: ''
  },
  crossQuestion: {
    type: String,
    default: ''
  },
  crossAnswer: {
    type: String,
    default: ''
  },
  audioFiles: {
    questionAudio: {
      type: String,
      default: ''
    },
    answerAudio: {
      type: String,
      default: ''
    },
    crossQuestionAudio: {
      type: String,
      default: ''
    },
    crossAnswerAudio: {
      type: String,
      default: ''
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  config: {
    type: {
      type: String,
      enum: ['HR', 'Technical', 'Managerial'],
      required: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    topics: [{
      type: String,
      trim: true
    }],
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true
    },
    company: {
      type: String,
      trim: true,
      default: ''
    },
    questionCount: {
      type: Number,
      required: true,
      min: 1,
      max: 20
    }
  },
  status: {
    type: String,
    enum: ['setup', 'in_progress', 'completed', 'cancelled'],
    default: 'setup'
  },
  questions: [questionSchema],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  }
}, {
  timestamps: true
});

// Calculate interview duration when completed
interviewSchema.pre('save', function(next) {
  if (this.isModified('completedAt') && this.completedAt && this.startedAt) {
    this.duration = Math.round((this.completedAt - this.startedAt) / (1000 * 60)); // Convert to minutes
  }
  next();
});

// Get interview progress percentage
interviewSchema.methods.getProgress = function() {
  if (this.questions.length === 0) return 0;
  
  const answeredQuestions = this.questions.filter(q => q.answer.trim() !== '').length;
  return Math.round((answeredQuestions / this.questions.length) * 100);
};

// Check if interview is complete
interviewSchema.methods.isComplete = function() {
  return this.status === 'completed' || 
         this.questions.every(q => q.answer.trim() !== '');
};

// Get total questions count
interviewSchema.methods.getTotalQuestions = function() {
  return this.questions.length;
};

// Get answered questions count
interviewSchema.methods.getAnsweredQuestions = function() {
  return this.questions.filter(q => q.answer.trim() !== '').length;
};

// Get interview summary
interviewSchema.methods.getSummary = function() {
  return {
    id: this._id,
    role: this.config.role,
    type: this.config.type,
    difficulty: this.config.difficulty,
    status: this.status,
    progress: this.getProgress(),
    duration: this.duration,
    totalQuestions: this.getTotalQuestions(),
    answeredQuestions: this.getAnsweredQuestions(),
    createdAt: this.createdAt,
    completedAt: this.completedAt
  };
};

// Indexes for performance
interviewSchema.index({ userId: 1, createdAt: -1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ 'config.type': 1 });
interviewSchema.index({ 'config.role': 1 });

module.exports = mongoose.model('Interview', interviewSchema);