import mongoose from 'mongoose';

const tokenTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['debit', 'credit', 'purchase', 'refund', 'subscription_credit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    balanceBefore: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        default: null
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null
    },
    status: {
        type: String,
        enum: ['locked', 'completed', 'refunded'],
        default: 'completed'
    },
    description: {
        type: String,
        default: ''
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
tokenTransactionSchema.index({ userId: 1, createdAt: -1 });
tokenTransactionSchema.index({ sessionId: 1 });
tokenTransactionSchema.index({ status: 1 });

export default mongoose.model('TokenTransaction', tokenTransactionSchema);
