import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Overall Assessment
    overallScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },

    // Detailed Breakdown
    skillBreakdown: {
        clarity: {
            score: { type: Number, min: 0, max: 100 },
            feedback: String
        },
        structure: {
            score: { type: Number, min: 0, max: 100 },
            feedback: String
        },
        confidence: {
            score: { type: Number, min: 0, max: 100 },
            feedback: String
        },
        depth: {
            score: { type: Number, min: 0, max: 100 },
            feedback: String
        },
        crossQuestionHandling: {
            score: { type: Number, min: 0, max: 100 },
            feedback: String
        },
        logicalConsistency: {
            score: { type: Number, min: 0, max: 100 },
            feedback: String
        }
    },

    // Analysis
    strengths: [{
        type: String
    }],
    weaknesses: [{
        type: String
    }],
    weakPatterns: [{
        type: String
    }],

    // Actionable Feedback
    improvementActions: [{
        area: String,
        priority: {
            type: String,
            enum: ['high', 'medium', 'low']
        },
        suggestion: String,
        example: String
    }],

    // Example Improvements
    improvedResponses: [{
        originalQuestion: String,
        userResponse: String,
        improvedVersion: String,
        explanation: String
    }],

    // Session Reference
    fullTranscript: {
        type: String,
        required: true
    },
    sessionDuration: {
        type: Number, // in seconds
        default: 0
    },
    interruptionsMade: {
        type: Number,
        default: 0
    },

    // Sharing
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

// Indexes
reportSchema.index({ userId: 1, createdAt: -1 });

// Generate share token
reportSchema.methods.generateShareToken = function () {
    this.shareToken = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    this.isShared = true;
    return this.shareToken;
};

export default mongoose.model('Report', reportSchema);
