import express from 'express';
import Session from '../models/Session.js';
import tokenService from '../services/token/tokenService.js';
import { auth } from '../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

/**
 * @route   POST /api/session/create
 * @desc    Create a new session (locks tokens, initializes session)
 * @access  Private
 */
router.post('/create',
    auth,
    [
        body('mode').isIn(['interview', 'drill', 'presentation', 'custom']),
        body('scenario.role').notEmpty().withMessage('Role is required'),
        body('skillsToEvaluate').isArray({ min: 1 }).withMessage('At least one skill must be selected'),
        body('difficulty').isIn(['easy', 'medium', 'hard']),
        body('duration').isInt({ min: 5, max: 60 }).withMessage('Duration must be between 5-60 minutes')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                mode,
                scenario,
                skillsToEvaluate,
                difficulty,
                duration
            } = req.body;

            const userId = req.user.id;

            // Calculate token cost
            const tokenCost = tokenService.calculateSessionCost({ mode, duration, difficulty });

            // Check if user has enough tokens
            const hasEnoughTokens = await tokenService.checkBalance(userId, tokenCost);

            if (!hasEnoughTokens) {
                return res.status(402).json({
                    message: 'Insufficient tokens',
                    required: tokenCost,
                    current: await tokenService.getBalance(userId),
                    action: 'upgrade'
                });
            }

            // Create session document
            const session = new Session({
                userId,
                mode,
                scenario,
                skillsToEvaluate,
                difficulty,
                duration,
                tokensLocked: tokenCost,
                status: 'initialized'
            });

            await session.save();

            // Lock tokens for this session
            const transactionId = await tokenService.lockTokens(
                userId,
                tokenCost,
                session._id,
                `Tokens locked for ${mode} session`
            );

            // Update session with transaction reference
            session.tokenTransaction = transactionId;
            await session.save();

            res.status(201).json({
                message: 'Session created successfully',
                sessionId: session._id,
                session: {
                    id: session._id,
                    mode: session.mode,
                    tokensLocked: tokenCost,
                    difficulty: session.difficulty,
                    duration: session.duration
                },
                websocketUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/session/${session._id}`
            });

        } catch (error) {
            console.error('Session creation error:', error);
            res.status(500).json({ message: 'Failed to create session', error: error.message });
        }
    }
);

/**
 * @route   GET /api/session/:id
 * @desc    Get session details
 * @access  Private
 */
router.get('/:id',
    auth,
    param('id').isMongoId(),
    async (req, res) => {
        try {
            const session = await Session.findById(req.params.id);

            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }

            // Verify ownership
            if (session.userId.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            res.json(session);
        } catch (error) {
            console.error('Get session error:', error);
            res.status(500).json({ message: 'Failed to fetch session' });
        }
    }
);

/**
 * @route   PUT /api/session/:id/state
 * @desc    Update session state (used by WebSocket handlers)
 * @access  Private
 */
router.put('/:id/state',
    auth,
    param('id').isMongoId(),
    async (req, res) => {
        try {
            const session = await Session.findById(req.params.id);

            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }

            // Verify ownership
            if (session.userId.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            // Update state fields
            if (req.body.state) {
                session.state = { ...session.state, ...req.body.state };
            }

            await session.save();

            res.json({ message: 'Session state updated', state: session.state });
        } catch (error) {
            console.error('Update session state error:', error);
            res.status(500).json({ message: 'Failed to update session state' });
        }
    }
);

/**
 * @route   POST /api/session/:id/complete
 * @desc    Mark session as completed and deduct tokens
 * @access  Private
 */
router.post('/:id/complete',
    auth,
    param('id').isMongoId(),
    async (req, res) => {
        try {
            const session = await Session.findById(req.params.id);

            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }

            // Verify ownership
            if (session.userId.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            if (session.status === 'completed') {
                return res.status(400).json({ message: 'Session already completed' });
            }

            // Mark session as completed
            await session.complete();

            // Deduct locked tokens
            if (session.tokenTransaction) {
                await tokenService.deductTokens(session.tokenTransaction);
                session.tokensUsed = session.tokensLocked;
                await session.save();
            }

            res.json({
                message: 'Session completed successfully',
                sessionId: session._id,
                duration: session.actualDuration,
                tokensUsed: session.tokensUsed
            });

        } catch (error) {
            console.error('Complete session error:', error);
            res.status(500).json({ message: 'Failed to complete session' });
        }
    }
);

/**
 * @route   POST /api/session/:id/abandon
 * @desc    Abandon session and release locked tokens
 * @access  Private
 */
router.post('/:id/abandon',
    auth,
    param('id').isMongoId(),
    async (req, res) => {
        try {
            const session = await Session.findById(req.params.id);

            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }

            // Verify ownership
            if (session.userId.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            if (session.status === 'completed') {
                return res.status(400).json({ message: 'Cannot abandon completed session' });
            }

            // Mark session as abandoned
            session.status = 'abandoned';
            session.endedAt = new Date();
            await session.save();

            // Release locked tokens
            if (session.tokenTransaction) {
                await tokenService.releaseTokens(session.tokenTransaction);
            }

            res.json({
                message: 'Session abandoned, tokens refunded',
                sessionId: session._id
            });

        } catch (error) {
            console.error('Abandon session error:', error);
            res.status(500).json({ message: 'Failed to abandon session' });
        }
    }
);

/**
 * @route   GET /api/session/user/:userId
 * @desc    Get all sessions for a user
 * @access  Private
 */
router.get('/user/:userId',
    auth,
    async (req, res) => {
        try {
            // Verify user can only fetch their own sessions
            if (req.params.userId !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const sessions = await Session.find({ userId: req.params.userId })
                .sort({ createdAt: -1 })
                .select('-transcript -conversationHistory -systemPrompt')
                .limit(50);

            res.json({ sessions, count: sessions.length });
        } catch (error) {
            console.error('Get user sessions error:', error);
            res.status(500).json({ message: 'Failed to fetch sessions' });
        }
    }
);

export default router;
