import { createClient } from '@deepgram/sdk';

/**
 * Deepgram STT Service
 * Handles real-time speech-to-text transcription using Deepgram's streaming API
 */

class DeepgramService {
    constructor() {
        this.apiKey = process.env.DEEPGRAM_API_KEY;
        if (!this.apiKey) {
            console.warn('DEEPGRAM_API_KEY not set - STT service will not function');
        } else {
            console.log('✅ Deepgram service initialized with API key');
        }
        this.deepgram = null;
        this.activeConnections = new Map(); // Track active connections by sessionId
    }

    /**
     * Initialize Deepgram client
     */
    getClient() {
        if (!this.deepgram && this.apiKey) {
            this.deepgram = createClient(this.apiKey);
        }
        return this.deepgram;
    }

    /**
     * Create a live transcription connection
     * @param {string} sessionId - Unique session identifier
     * @param {function} onTranscript - Callback for transcript results
     * @param {function} onError - Callback for errors
     * @returns {object} Connection object
     */
    async createLiveConnection(sessionId, onTranscript, onError) {
        try {
            const client = this.getClient();

            if (!client) {
                throw new Error('Deepgram client not initialized');
            }

            const connection = client.listen.live({
                model: 'nova-2',
                language: 'en',
                smart_format: true,
                interim_results: true,
                punctuate: true,
                diarize: false,
                utterance_end_ms: 1000
            });

            // Handle transcript results
            connection.on('Results', (data) => {
                if (data.channel && data.channel.alternatives && data.channel.alternatives.length > 0) {
                    const transcript = data.channel.alternatives[0].transcript;
                    const isFinal = data.is_final;

                    if (transcript && transcript.trim().length > 0) {
                        onTranscript({
                            text: transcript,
                            isFinal,
                            confidence: data.channel.alternatives[0].confidence,
                            words: data.channel.alternatives[0].words
                        });
                    }
                }
            });

            // Handle errors
            connection.on('error', (error) => {
                console.error('Deepgram connection error:', error);
                if (onError) onError(error);
            });

            // Handle connection close
            connection.on('close', () => {
                console.log(`Deepgram connection closed for session ${sessionId}`);
                this.activeConnections.delete(sessionId);
            });

            // Store connection
            this.activeConnections.set(sessionId, connection);

            return connection;

        } catch (error) {
            console.error('Failed to create Deepgram connection:', error);
            throw error;
        }
    }

    /**
     * Send audio data to Deepgram
     * @param {string} sessionId - Session identifier
     * @param {Buffer} audioData - Audio chunk
     */
    sendAudio(sessionId, audioData) {
        const connection = this.activeConnections.get(sessionId);

        if (!connection) {
            throw new Error(`No active connection for session ${sessionId}`);
        }

        try {
            connection.send(audioData);
        } catch (error) {
            console.error('Failed to send audio to Deepgram:', error);
            throw error;
        }
    }

    /**
     * Close the connection for a session
     * @param {string} sessionId - Session identifier
     */
    closeConnection(sessionId) {
        const connection = this.activeConnections.get(sessionId);

        if (connection) {
            try {
                connection.finish();
                this.activeConnections.delete(sessionId);
                console.log(`Closed Deepgram connection for session ${sessionId}`);
            } catch (error) {
                console.error('Error closing Deepgram connection:', error);
            }
        }
    }

    /**
     * Check if a session has an active connection
     * @param {string} sessionId - Session identifier
     * @returns {boolean}
     */
    hasActiveConnection(sessionId) {
        return this.activeConnections.has(sessionId);
    }
}

// Export singleton instance
export default new DeepgramService();
