import mongoose from 'mongoose';
import Session from '../../models/Session.js';
import tokenService from '../../services/token/tokenService.js';
import decisionEngine from '../../services/llm/decisionEngine.js';
import ttsService from '../../services/tts/elevenlabsService.js';

/**
 * Session Event Handler
 * Manages session lifecycle events via WebSocket
 */

export const registerSessionHandlers = (io, socket) => {
    /**
     * Event: session:join
     * Client joins a session room
     */
    socket.on('session:join', async (data) => {
        try {
            const { sessionId } = data;
            const userId = socket.userId;

            // Validate sessionId
            if (!sessionId || sessionId === 'undefined' || !mongoose.Types.ObjectId.isValid(sessionId)) {
                return socket.emit('session:error', { message: 'Invalid session ID' });
            }

            // Fetch session and verify ownership
            const session = await Session.findById(sessionId);

            if (!session) {
                return socket.emit('session:error', { message: 'Session not found' });
            }

            if (session.userId.toString() !== userId) {
                return socket.emit('session:error', { message: 'Unauthorized' });
            }

            // Block only truly terminal states
            if (session.status === 'completed' || session.status === 'abandoned') {
                return socket.emit('session:error', { message: 'Session already completed or abandoned' });
            }

            // Join Socket.IO room
            socket.join(`session-${sessionId}`);
            socket.sessionId = sessionId;

            console.log(`User ${userId} joined session ${sessionId} (status: ${session.status})`);

            // Always send joined confirmation first
            socket.emit('session:joined', {
                sessionId,
                mode: session.mode,
                difficulty: session.difficulty,
                duration: session.duration,
                skillsToEvaluate: session.skillsToEvaluate
            });

            // ── Case 1: Fresh session — generate opening question ────────────
            if (session.status === 'initialized') {
                await session.start();

                console.log(`Generating opening question for session ${sessionId}...`);
                const openingText = await decisionEngine.generateOpeningQuestion(sessionId);

                // TTS (graceful — returns null if unavailable)
                let openingAudioBase64 = null;
                try {
                    const buf = await ttsService.textToSpeech(openingText);
                    if (buf) openingAudioBase64 = buf.toString('base64');
                } catch (err) {
                    console.error('TTS failed for opening question:', err.message);
                }

                socket.emit('session:started', {
                    sessionId,
                    openingText,
                    openingAudio: openingAudioBase64
                });

                await session.addTranscript('ai', openingText);
                return;
            }

            // ── Case 2: Already active — reconnect, replay opening question ──
            if (session.status === 'active') {
                console.log(`Reconnecting to active session ${sessionId} — replaying opening`);
                const aiOpener = session.transcript?.find(t => t.speaker === 'ai');
                const openingText = aiOpener?.text
                    || decisionEngine.getTemplateOpeningQuestion(session);

                socket.emit('session:started', {
                    sessionId,
                    openingText,
                    openingAudio: null
                });
                return;
            }

            // ── Case 3: Paused — resume, restore state ───────────────────────
            if (session.status === 'paused') {
                // Restore to active
                session.status = 'active';
                await session.save();

                // Resend opening question from transcript
                const aiOpener = session.transcript?.find(t => t.speaker === 'ai');
                const openingText = aiOpener?.text || decisionEngine.getTemplateOpeningQuestion(session);

                socket.emit('session:started', {
                    sessionId,
                    openingText,
                    openingAudio: null
                });

                // Also resend any existing transcript entries
                if (session.transcript?.length > 1) {
                    socket.emit('session:transcript_restore', {
                        transcript: session.transcript
                    });
                }
                return;
            }


        } catch (error) {
            console.error('Session join error:', error);
            socket.emit('session:error', { message: 'Failed to join session', error: error.message });
        }
    });


    /**
     * Event: session:pause
     * Pause the session
     */
    socket.on('session:pause', async () => {
        try {
            const sessionId = socket.sessionId;

            if (!sessionId) {
                return socket.emit('session:error', { message: 'Not in a session' });
            }

            const session = await Session.findById(sessionId);

            if (!session) {
                return socket.emit('session:error', { message: 'Session not found' });
            }

            session.status = 'paused';
            await session.save();

            io.to(`session-${sessionId}`).emit('session:paused', { sessionId });

        } catch (error) {
            console.error('Session pause error:', error);
            socket.emit('session:error', { message: 'Failed to pause session' });
        }
    });

    /**
     * Event: session:resume
     * Resume a paused session
     */
    socket.on('session:resume', async () => {
        try {
            const sessionId = socket.sessionId;

            if (!sessionId) {
                return socket.emit('session:error', { message: 'Not in a session' });
            }

            const session = await Session.findById(sessionId);

            if (!session) {
                return socket.emit('session:error', { message: 'Session not found' });
            }

            if (session.status !== 'paused') {
                return socket.emit('session:error', { message: 'Session is not paused' });
            }

            session.status = 'active';
            await session.save();

            io.to(`session-${sessionId}`).emit('session:resumed', { sessionId });

        } catch (error) {
            console.error('Session resume error:', error);
            socket.emit('session:error', { message: 'Failed to resume session' });
        }
    });

    /**
     * Event: session:end
     * End the session (called by client)
     */
    socket.on('session:end', async () => {
        try {
            const sessionId = socket.sessionId;

            if (!sessionId) {
                return socket.emit('session:error', { message: 'Not in a session' });
            }

            const session = await Session.findById(sessionId);

            if (!session) {
                return socket.emit('session:error', { message: 'Session not found' });
            }

            if (session.status === 'completed') {
                return socket.emit('session:error', { message: 'Session already completed' });
            }

            // Mark session as completed
            await session.complete();

            // Deduct tokens
            if (session.tokenTransaction) {
                await tokenService.deductTokens(session.tokenTransaction);
                session.tokensUsed = session.tokensLocked;
                await session.save();
            }

            // Emit completion
            io.to(`session-${sessionId}`).emit('session:ended', {
                sessionId,
                duration: session.actualDuration,
                tokensUsed: session.tokensUsed,
                transcriptLength: session.transcript.length
            });

            // Leave room
            socket.leave(`session-${sessionId}`);
            socket.sessionId = null;

            console.log(`Session ${sessionId} completed`);

        } catch (error) {
            console.error('Session end error:', error);
            socket.emit('session:error', { message: 'Failed to end session' });
        }
    });

    /**
     * Event: disconnect
     * Handle unexpected disconnection
     */
    socket.on('disconnect', async () => {
        try {
            const sessionId = socket.sessionId;

            if (sessionId) {
                const session = await Session.findById(sessionId);

                if (session && session.status === 'active') {
                    // Pause session on disconnect (don't abandon)
                    session.status = 'paused';
                    await session.save();

                    console.log(`User disconnected from session ${sessionId}, session paused`);
                }
            }
        } catch (error) {
            console.error('Disconnect handler error:', error);
        }
    });
};
