import TokenTransaction from '../../models/TokenTransaction.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';

/**
 * Token Service
 * Handles all token-related operations with transactional safety
 */

const SESSION_TOKEN_COST = parseInt(process.env.SESSION_TOKEN_COST) || 10;
const REPORT_TOKEN_COST = parseInt(process.env.REPORT_TOKEN_COST) || 0;
const DEFAULT_FREE_TOKENS = parseInt(process.env.DEFAULT_FREE_TOKENS) || 50;

class TokenService {
    /**
     * Check if user has enough tokens
     */
    async checkBalance(userId, requiredAmount) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user.tokenBalance >= requiredAmount;
    }

    /**
     * Get user's current token balance
     */
    async getBalance(userId) {
        const user = await User.findById(userId).select('tokenBalance');
        if (!user) {
            throw new Error('User not found');
        }
        return user.tokenBalance;
    }

    /**
     * Lock tokens for a session (before session starts)
     * Creates a transaction record in 'locked' status
     */
    async lockTokens(userId, amount, sessionId, description = 'Session token lock') {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const user = await User.findById(userId).session(session);

            if (!user) {
                throw new Error('User not found');
            }

            if (user.tokenBalance < amount) {
                throw new Error('Insufficient tokens');
            }

            const balanceBefore = user.tokenBalance;
            user.tokenBalance -= amount;
            const balanceAfter = user.tokenBalance;

            await user.save({ session });

            const transaction = new TokenTransaction({
                userId,
                type: 'debit',
                amount,
                balanceBefore,
                balanceAfter,
                sessionId,
                status: 'locked',
                description
            });

            await transaction.save({ session });

            await session.commitTransaction();

            return transaction._id;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Deduct tokens after session completion
     * Converts 'locked' transaction to 'completed'
     */
    async deductTokens(transactionId) {
        const transaction = await TokenTransaction.findById(transactionId);

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.status !== 'locked') {
            throw new Error('Transaction not in locked state');
        }

        transaction.status = 'completed';
        await transaction.save();

        // Update user's total tokens used
        await User.findByIdAndUpdate(transaction.userId, {
            $inc: { totalTokensUsed: transaction.amount }
        });

        return transaction;
    }

    /**
     * Release locked tokens (on session failure/abandonment)
     * Refunds tokens back to user and marks transaction as refunded
     */
    async releaseTokens(transactionId) {
        const mongoSession = await mongoose.startSession();
        mongoSession.startTransaction();

        try {
            const transaction = await TokenTransaction.findById(transactionId).session(mongoSession);

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            if (transaction.status !== 'locked') {
                throw new Error('Transaction not in locked state');
            }

            const user = await User.findById(transaction.userId).session(mongoSession);

            // Refund tokens
            user.tokenBalance += transaction.amount;
            await user.save({ session: mongoSession });

            // Mark transaction as refunded
            transaction.status = 'refunded';
            await transaction.save({ session: mongoSession });

            await mongoSession.commitTransaction();

            return user.tokenBalance;
        } catch (error) {
            await mongoSession.abortTransaction();
            throw error;
        } finally {
            mongoSession.endSession();
        }
    }

    /**
     * Add tokens to user account (purchase or credit)
     */
    async addTokens(userId, amount, source = 'purchase', paymentId = null, description = '') {
        const mongoSession = await mongoose.startSession();
        mongoSession.startTransaction();

        try {
            const user = await User.findById(userId).session(mongoSession);

            if (!user) {
                throw new Error('User not found');
            }

            const balanceBefore = user.tokenBalance;
            user.tokenBalance += amount;

            if (source === 'purchase') {
                user.totalTokensPurchased += amount;
            }

            const balanceAfter = user.tokenBalance;
            await user.save({ session: mongoSession });

            const transaction = new TokenTransaction({
                userId,
                type: source === 'purchase' ? 'purchase' : 'credit',
                amount,
                balanceBefore,
                balanceAfter,
                paymentId,
                status: 'completed',
                description: description || `Tokens ${source}`
            });

            await transaction.save({ session: mongoSession });

            await mongoSession.commitTransaction();

            return {
                newBalance: balanceAfter,
                transaction: transaction._id
            };
        } catch (error) {
            await mongoSession.abortTransaction();
            throw error;
        } finally {
            mongoSession.endSession();
        }
    }

    /**
     * Calculate token cost for a session based on configuration
     */
    calculateSessionCost(sessionConfig) {
        let baseCost = SESSION_TOKEN_COST;

        // Future: Could adjust cost based on duration, difficulty, etc.
        // For now, flat rate

        return baseCost;
    }

    /**
     * Get token transaction history for a user
     */
    async getTransactionHistory(userId, limit = 20) {
        const transactions = await TokenTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sessionId', 'mode status createdAt')
            .lean();

        return transactions;
    }

    /**
     * Credit free tokens to new user on signup
     */
    async creditSignupTokens(userId) {
        return this.addTokens(
            userId,
            DEFAULT_FREE_TOKENS,
            'credit',
            null,
            'Welcome bonus - Free tokens on signup'
        );
    }

    /**
     * Credit monthly subscription allowance
     */
    async creditSubscriptionAllowance(userId, amount) {
        return this.addTokens(
            userId,
            amount,
            'subscription_credit',
            null,
            'Monthly subscription token allowance'
        );
    }
}

export default new TokenService();
export { SESSION_TOKEN_COST, REPORT_TOKEN_COST, DEFAULT_FREE_TOKENS };
