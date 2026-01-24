import Session from '../../models/Session.js';
import deepgramService from '../../services/stt/deepgramService.js';
import ttsService from '../../services/tts/elevenlabsService.js';
import decisionEngine from '../../services/llm/decisionEngine.js';

/**
 * Audio Event Handler  
 * Handles real-time audio streaming with Deepgram STT, ElevenLabs TTS, and Gemini decision engine
 */

export const registerAudioHandlers = (io, socket) => {
    /**
     * Event: audio:start
     * Initialize STT connection for the session
     */
    socket.on('audio:start', async () => {
        try {
            const sessionId = socket.sessionId;

            if (!sessionId) {
                return socket.emit('session:error', { message: 'Not in a session' });
            }

            const session = await Session.findById(sessionId);

            if (!session || session.status !== 'active') {
                return socket.emit('session:error', { message: 'Session not active' });
            }

            // Create Deepgram connection
            const onTranscript = async (transcriptData) => {
                const { text, isFinal, confidence } = transcriptData;

                // Emit partial transcript to client
                io.to(`session-${sessionId}`).emit('transcript:partial', {
                    text,
                    isFinal,
                    confidence,
                    speaker: 'user'
                });

                // Save to conversation history
                session.conversationHistory.push({
                    role: 'user',
                    content: text,
                    timestamp: new Date()
                });

                // Evaluate if final transcript
                if (isFinal && text.trim().length > 20) {
                    const decision = await decisionEngine.evaluate(sessionId, text);

                    // Execute decision
                    await executeDecision(io, socket, sessionId, decision);
                }

                await session.save();
            };

            const onError = (error) => {
                console.error('Deepgram error:', error);
                socket.emit('session:error', { message: 'Transcription error' });
            };

            await deepgramService.createLiveConnection(sessionId, onTranscript, onError);

            socket.emit('audio:ready', { sessionId });
            console.log(`Audio stream started for session ${sessionId}`);

        } catch (error) {
            console.error('Audio start error:', error);
            socket.emit('session:error', { message: 'Failed to start audio' });
        }
    });

    /**
     * Event: audio:stream
     * Receive audio chunks from client microphone and forward to Deepgram
     */
    socket.on('audio:stream', async (audioData) => {
        try {
            const sessionId = socket.sessionId;

            if (!sessionId) {
                return;
            }

            // Send audio to Deepgram
            if (deepgramService.hasActiveConnection(sessionId)) {
                deepgramService.sendAudio(sessionId, audioData);
            }

        } catch (error) {
            console.error('Audio stream error:', error);
        }
    });

    /**
     * Event: audio:stop
     * User stopped speaking
     */
    socket.on('audio:stop', async () => {
        try {
            const sessionId = socket.sessionId;

            if (!sessionId) {
                return;
            }

            console.log(`Audio stopped for session ${sessionId}`);

            // Close Deepgram connection
            deepgramService.closeConnection(sessionId);

        } catch (error) {
            console.error('Audio stop error:', error);
        }
    });
};

/**
 * Execute decision from LLM
 */
async function executeDecision(io, socket, sessionId, decision) {
    try {
        const session = await Session.findById(sessionId);

        if (!session) return;

        const { action, response, reason } = decision;

        let audioBuffer = null;
        let actionType = 'continue';

        switch (action) {
            case 'CONTINUE_LISTENING':
                // No action needed
                break;

            case 'INTERRUPT':
                // Generate AI speech
                audioBuffer = await ttsService.textToSpeech(response);
                actionType = 'interrupt';

                // Add to transcript
                await session.addTranscript('ai', response, true, 'interrupt');

                // Emit to client
                io.to(`session-${sessionId}`).emit('ai:interrupt', {
                    text: response,
                    audio: audioBuffer ? audioBuffer.toString('base64') : null,
                    reason
                });
                break;

            case 'PROBE_DEEPER':
                audioBuffer = await ttsService.textToSpeech(response);
                actionType = 'probe';

                await session.addTranscript('ai', response, false, 'probe');

                io.to(`session-${sessionId}`).emit('ai:probe', {
                    text: response,
                    audio: audioBuffer ? audioBuffer.toString('base64') : null
                });
                break;

            case 'CHANGE_DIRECTION':
                audioBuffer = await ttsService.textToSpeech(response);
                actionType = 'redirect';

                await session.addTranscript('ai', response, false, 'redirect');

                io.to(`session-${sessionId}`).emit('ai:redirect', {
                    text: response,
                    audio: audioBuffer ? audioBuffer.toString('base64') : null,
                    newDifficulty: session.state.difficultyCurve
                });
                break;

            case 'MOVE_FORWARD':
                audioBuffer = await ttsService.textToSpeech(response);
                actionType = 'move_forward';

                await session.addTranscript('ai', response, false, 'move_forward');
                session.state.currentQuestionIndex += 1;

                io.to(`session-${sessionId}`).emit('ai:move_forward', {
                    text: response,
                    audio: audioBuffer ? audioBuffer.toString('base64') : null
                });
                break;
        }

        // Save conversation history
        if (response) {
            session.conversationHistory.push({
                role: 'ai',
                content: response,
                timestamp: new Date()
            });
        }

        await session.save();

    } catch (error) {
        console.error('Execute decision error:', error);
    }
}

/**
 * Transcript Event Handler
 * Manages transcript display and storage
 */
export const registerTranscriptHandlers = (io, socket) => {
    /**
     * Event: transcript:add
     * Manually add transcript entry (for testing)
     */
    socket.on('transcript:add', async (data) => {
        try {
            const sessionId = socket.sessionId;
            const { speaker, text } = data;

            if (!sessionId) {
                return socket.emit('session:error', { message: 'Not in a session' });
            }

            const session = await Session.findById(sessionId);

            if (!session) {
                return socket.emit('session:error', { message: 'Session not found' });
            }

            await session.addTranscript(speaker, text);

            // Broadcast to all clients in session
            io.to(`session-${sessionId}`).emit('transcript:updated', {
                speaker,
                text,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Transcript add error:', error);
            socket.emit('session:error', { message: 'Failed to add transcript' });
        }
    });
};
