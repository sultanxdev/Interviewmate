const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  evaluation: {
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    skillBreakdown: {
      communication: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      clarity: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      technicalKnowledge: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      problemSolving: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    strengths: [{
      type: String,
      trim: true
    }],
    improvements: [{
      type: String,
      trim: true
    }],
    tips: [{
      type: String,
      trim: true
    }],
    detailedFeedback: {
      type: String,
      required: true
    }
  },
  transcript: {
    type: String,
    required: true
  },
  shareableLink: {
    type: String,
    default: ''
  },
  sharedAt: {
    type: Date,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate shareable link
reportSchema.methods.generateShareableLink = function() {
  const crypto = require('crypto');
  const shareId = crypto.randomBytes(16).toString('hex');
  this.shareableLink = shareId;
  this.sharedAt = new Date();
  return shareId;
};

// Get performance grade based on overall score
reportSchema.methods.getGrade = function() {
  const score = this.evaluation.overallScore;
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  return 'D';
};

// Get performance level description
reportSchema.methods.getPerformanceLevel = function() {
  const score = this.evaluation.overallScore;
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Average';
  if (score >= 40) return 'Below Average';
  return 'Needs Improvement';
};

// Get top strengths (limit to top 3)
reportSchema.methods.getTopStrengths = function() {
  return this.evaluation.strengths.slice(0, 3);
};

// Get priority improvements (limit to top 3)
reportSchema.methods.getPriorityImprovements = function() {
  return this.evaluation.improvements.slice(0, 3);
};

// Get skill breakdown as array for charts
reportSchema.methods.getSkillsArray = function() {
  const skills = this.evaluation.skillBreakdown;
  return [
    { skill: 'Communication', score: skills.communication },
    { skill: 'Confidence', score: skills.confidence },
    { skill: 'Clarity', score: skills.clarity },
    { skill: 'Technical Knowledge', score: skills.technicalKnowledge },
    { skill: 'Problem Solving', score: skills.problemSolving }
  ];
};

// Get report summary for listings
reportSchema.methods.getSummary = function() {
  return {
    id: this._id,
    overallScore: this.evaluation.overallScore,
    grade: this.getGrade(),
    performanceLevel: this.getPerformanceLevel(),
    topStrengths: this.getTopStrengths(),
    createdAt: this.createdAt,
    isShared: !!this.shareableLink
  };
};

// Increment view count
reportSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Indexes for performance
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ interviewId: 1 });
reportSchema.index({ shareableLink: 1 });
reportSchema.index({ 'evaluation.overallScore': -1 });

module.exports = mongoose.model('Report', reportSchema);