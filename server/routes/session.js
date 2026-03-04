import express from 'express';
import multer from 'multer';
import Session from '../models/Session.js';
import tokenService from '../services/token/tokenService.js';
import decisionEngine from '../services/llm/decisionEngine.js';
import ttsService from '../services/tts/elevenlabsService.js';
import sttService from '../services/stt/elevenlabsSTT.js';
import { auth } from '../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// Multer for audio uploads (in-memory, max 25MB)
const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
        if (allowed.includes(file.mimetype) || file.fieldname === 'audio') {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported audio format: ${file.mimetype}`));
        }
    }
});

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

            const { mode, scenario, skillsToEvaluate, difficulty, duration } = req.body;
            const userId = req.userId;

            // Calculate token cost
            const tokenCost = tokenService.calculateSessionCost();

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

            // Lock tokens
            const transactionId = await tokenService.lockTokens(
                userId,
                tokenCost,
                session._id,
                `Tokens locked for ${mode} session`
            );

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
                }
            });

        } catch (error) {
            console.error('Session creation error:', error);
            res.status(500).json({ message: 'Failed to create session', error: error.message });
        }
    }
);

/**
 * @route   POST /api/session/:id/start
 * @desc    Start a session — generates opening question via LLM + TTS audio
 * @access  Private
 */
router.post('/:id/start',
    auth,
    param('id').isMongoId(),
    async (req, res) => {
        try {
            const session = await Session.findById(req.params.id);

            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }

            if (session.userId.toString() !== req.userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            // If already active, replay the existing opening question
            if (session.status === 'active' || session.status === 'paused') {
                const aiOpener = session.transcript?.find(t => t.speaker === 'ai');
                const openingText = aiOpener?.text || decisionEngine.getTemplateOpeningQuestion(session);

                // Regenerate TTS for re-visits (graceful null if unavailable)
                let openingAudioBase64 = null;
                try {
                    const buf = await ttsService.textToSpeech(openingText);
                    if (buf) openingAudioBase64 = buf.toString('base64');
                } catch (_) { }

                return res.json({
                    sessionId: session._id,
                    openingText,
                    openingAudio: openingAudioBase64,
                    mode: session.mode,
                    difficulty: session.difficulty,
                    duration: session.duration,
                    turnIndex: session.conversationHistory.filter(h => h.role === 'user').length,
                    transcript: session.transcript || []
                });
            }

            // Fresh session — mark active
            if (session.status !== 'initialized') {
                return res.status(400).json({ message: `Cannot start session in status: ${session.status}` });
            }

            await session.start();

            // Generate opening question
            console.log(`Generating opening question for session ${session._id}...`);
            const openingText = await decisionEngine.generateOpeningQuestion(session._id);

            // TTS for opening question (graceful null if unavailable)
            let openingAudioBase64 = null;
            try {
                const buf = await ttsService.textToSpeech(openingText);
                if (buf) openingAudioBase64 = buf.toString('base64');
            } catch (err) {
                console.error('TTS failed for opening question:', err.message);
            }

            // Save opening question to transcript + conversation history
            await session.addTranscript('ai', openingText);
            session.conversationHistory.push({ role: 'ai', content: openingText, timestamp: new Date() });
            await session.save();

            console.log(`✅ Session ${session._id} started`);

            res.json({
                sessionId: session._id,
                openingText,
                openingAudio: openingAudioBase64,
                mode: session.mode,
                difficulty: session.difficulty,
                duration: session.duration,
                turnIndex: 0,
                transcript: session.transcript
            });

        } catch (error) {
            console.error('Session start error:', error);
            res.status(500).json({ message: 'Failed to start session', error: error.message });
        }
    }
);

/**
 * @route   POST /api/session/:id/turn
 * @desc    Submit user audio answer → STT → save → LLM next Q → TTS → return
 * @access  Private
 * 
 * Body (multipart/form-data):
 *   - audio: audio file blob
 *   - mimeType: string (optional, e.g. 'audio/webm')
 *   - turnIndex: number (current turn index)
 */
router.post('/:id/turn',
    auth,
    audioUpload.single('audio'),
    async (req, res) => {
        try {
            const session = await Session.findById(req.params.id);

            if (!session) {
                return res.status(404).json({ message: 'Session not found' });
            }

            if (session.userId.toString() !== req.userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            if (session.status !== 'active') {
                return res.status(400).json({ message: `Session is not active (status: ${session.status})` });
            }

            // ── Step 1: Speech-to-Text ─────────────────────────────────────────
            let userTranscript = req.body.fallbackText || '';

            if (req.file) {
                const mimeType = req.body.mimeType || req.file.mimetype || 'audio/webm';
                console.log(`Processing audio for session ${session._id}: ${req.file.size} bytes, type: ${mimeType}`);

                const transcribed = await sttService.transcribe(req.file.buffer, mimeType);
                if (transcribed && transcribed.trim().length > 0) {
                    userTranscript = transcribed;
                } else {
                    console.warn('STT returned empty transcript');
                }
            }

            if (!userTranscript || userTranscript.trim().length === 0) {
                return res.status(422).json({
                    message: 'Could not understand audio. Please try again.',
                    hint: 'Speak clearly and ensure microphone access is granted.'
                });
            }

            // ── Step 2: Save user answer ───────────────────────────────────────
            await session.addTranscript('user', userTranscript);
            session.conversationHistory.push({
                role: 'user',
                content: userTranscript,
                timestamp: new Date()
            });
            await session.save();

            // ── Step 3: Generate AI next question/response ─────────────────────
            const userTurnCount = session.conversationHistory.filter(h => h.role === 'user').length;
            const turnIndex = parseInt(req.body.turnIndex || '0') || (userTurnCount - 1);

            const { text: aiResponseText, isComplete } = await decisionEngine.generateNextQuestion(
                session._id,
                userTranscript,
                turnIndex
            );

            // ── Step 4: TTS for AI response ────────────────────────────────────
            let aiAudioBase64 = null;
            try {
                const audioBuf = await ttsService.textToSpeech(aiResponseText);
                if (audioBuf) aiAudioBase64 = audioBuf.toString('base64');
            } catch (err) {
                console.error('TTS error for AI response:', err.message);
            }

            // ── Step 5: Save AI response ───────────────────────────────────────
            await session.addTranscript('ai', aiResponseText);
            session.conversationHistory.push({
                role: 'ai',
                content: aiResponseText,
                timestamp: new Date()
            });

            // If interview is complete, mark session as such
            if (isComplete) {
                await session.complete();
                if (session.tokenTransaction) {
                    try {
                        await tokenService.deductTokens(session.tokenTransaction);
                        session.tokensUsed = session.tokensLocked;
                    } catch (err) {
                        console.error('Token deduction error:', err.message);
                    }
                }
            } else {
                await session.save();
            }

            console.log(`✅ Turn ${turnIndex + 1} complete for session ${session._id} — isComplete: ${isComplete}`);

            res.json({
                userTranscript,
                aiResponse: aiResponseText,
                aiAudio: aiAudioBase64,
                isComplete,
                turnIndex: turnIndex + 1
            });

        } catch (error) {
            console.error('Session turn error:', error);
            res.status(500).json({ message: 'Failed to process turn', error: error.message });
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

            if (session.userId.toString() !== req.userId) {
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

            if (session.userId.toString() !== req.userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            if (session.status === 'completed') {
                // Already done — just return success so client can navigate
                return res.json({
                    message: 'Session already completed',
                    sessionId: session._id,
                    duration: session.actualDuration,
                    tokensUsed: session.tokensUsed
                });
            }

            await session.complete();

            if (session.tokenTransaction) {
                try {
                    await tokenService.deductTokens(session.tokenTransaction);
                    session.tokensUsed = session.tokensLocked;
                    await session.save();
                } catch (err) {
                    console.error('Token deduction error:', err.message);
                }
            }

            res.json({
                message: 'Session completed successfully',
                sessionId: session._id,
                duration: session.actualDuration,
                tokensUsed: session.tokensUsed
            });

        } catch (error) {
            console.error('Complete session error:', error);
            res.status(500).json({ message: 'Failed to complete session', error: error.message });
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

            if (session.userId.toString() !== req.userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            if (session.status === 'completed') {
                return res.status(400).json({ message: 'Cannot abandon completed session' });
            }

            session.status = 'abandoned';
            session.endedAt = new Date();
            await session.save();

            if (session.tokenTransaction) {
                try {
                    await tokenService.releaseTokens(session.tokenTransaction);
                } catch (err) {
                    console.error('Token release error:', err.message);
                }
            }

            res.json({ message: 'Session abandoned, tokens refunded', sessionId: session._id });

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
            if (req.params.userId !== req.userId) {
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
