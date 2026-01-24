import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Setup Configuration
    mode: {
        type: String,
        enum: ['interview', 'drill', 'presentation', 'custom'],
        required: true,
        default: 'interview'
    },
    scenario: {
        type: {
            type: String,
            default: ''
        },
        role: {
            type: String,
            required: true
        },
        context: {
            type: String,
            default: ''
        },
        company: {
            type: String,
            default: ''
        }
    },
    skillsToEvaluate: [{
        type: String,
        enum: ['clarity', 'structure', 'confidence', 'depth', 'crossQuestionHandling', 'logicalConsistency']
    }],
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    duration: {
        type: Number, // in minutes
        required: true,
        default: 20
    },

    // Session State (Real-Time)
    state: {
        stage: {
            type: String,
            enum: ['initialized', 'opening', 'main', 'closing'],
            default: 'initialized'
        },
        currentQuestionIndex: {
            type: Number,
            default: 0
        },
        difficultyCurve: {
            type: Number,
            default: 5, // 0-10 scale
            min: 0,
            max: 10
        },
        weaknessTracker: {
            clarity: { type: Number, default: 0 },
            structure: { type: Number, default: 0 },
            confidence: { type: Number, default: 0 },
            depth: { type: Number, default: 0 }
        },
        interruptionCount: {
            type: Number,
            default: 0
        },
        probeDepthCount: {
            type: Number,
            default: 0
        }
    },

    // Transcript Management
    transcript: [{
        speaker: {
            type: String,
            enum: ['user', 'ai'],
            required: true
        },
        text: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        wasInterruption: {
            type: Boolean,
            default: false
        },
        actionType: {
            type: String,
            enum: ['continue', 'interrupt', 'probe', 'redirect', 'move_forward'],
            default: 'continue'
        }
    }],

    // Token Management
    tokenTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TokenTransaction',
        default: null
    },
    tokensLocked: {
        type: Number,
        default: 10
    },
    tokensUsed: {
        type: Number,
        default: 0
    },

    // Session Lifecycle
    status: {
        type: String,
        enum: ['initialized', 'active', 'paused', 'completed', 'abandoned', 'failed'],
        default: 'initialized',
        index: true
    },
    startedAt: {
        type: Date,
        default: null
    },
    endedAt: {
        type: Date,
        default: null
    },
    actualDuration: {
        type: Number, // in seconds
        default: 0
    },

    // AI Context
    systemPrompt: {
        type: String,
        default: ''
    },
    conversationHistory: [{
        role: String,
        content: String,
        timestamp: Date
    }]
}, {
    timestamps: true
});

// Indexes for efficient querying
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ 'state.stage': 1 });

// Calculate actual duration on session end
sessionSchema.methods.calculateDuration = function () {
    if (this.startedAt && this.endedAt) {
        this.actualDuration = Math.floor((this.endedAt - this.startedAt) / 1000);
    }
    return this.actualDuration;
};

// Mark session as started
sessionSchema.methods.start = async function () {
    this.status = 'active';
    this.startedAt = new Date();
    this.state.stage = 'opening';
    await this.save();
};

// Mark session as completed
sessionSchema.methods.complete = async function () {
    this.status = 'completed';
    this.endedAt = new Date();
    this.calculateDuration();
    await this.save();
};

// Add transcript entry
sessionSchema.methods.addTranscript = async function (speaker, text, wasInterruption = false, actionType = 'continue') {
    this.transcript.push({
        speaker,
        text,
        timestamp: new Date(),
        wasInterruption,
        actionType
    });
    await this.save();
};

export default mongoose.model('Session', sessionSchema);
