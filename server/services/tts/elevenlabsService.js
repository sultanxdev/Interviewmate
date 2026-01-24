import { ElevenLabsClient } from 'elevenlabs';

/**
 * ElevenLabs TTS Service
 * Converts text to natural-sounding speech
 */

class ElevenLabsService {
    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        if (!this.apiKey) {
            console.warn('ELEVENLABS_API_KEY not set - TTS service will not function');
        } else {
            console.log('✅ ElevenLabs service initialized with API key');
        }

        // Professional neutral female voice ID (Rachel)
        this.defaultVoiceId = '21m00Tcm4TlvDq8ikWAM';

        this.client = null;
        if (this.apiKey) {
            this.client = new ElevenLabsClient({
                apiKey: this.apiKey
            });
        }
    }

    /**
     * Convert text to speech
     * @param {string} text - Text to convert
     * @param {string} voiceId - Optional voice ID (defaults to professional female)
     * @returns {Promise<Buffer>} Audio buffer
     */
    async textToSpeech(text, voiceId = null) {
        try {
            if (!this.client) {
                throw new Error('ElevenLabs not initialized - API key missing');
            }

            if (!text || text.trim().length === 0) {
                throw new Error('Text is required for TTS');
            }

            const selectedVoiceId = voiceId || this.defaultVoiceId;

            const audio = await this.client.generate({
                voice: selectedVoiceId,
                text: text.trim(),
                model_id: 'eleven_monolingual_v1'
            });

            // Convert async iterable to buffer
            const chunks = [];
            for await (const chunk of audio) {
                chunks.push(chunk);
            }

            return Buffer.concat(chunks);

        } catch (error) {
            console.error('ElevenLabs TTS error:', error.message);
            // Return null instead of throwing to prevent crashing the flow
            // The client will just show text if audio is missing
            return null;
        }
    }

    /**
     * Text to speech with streaming (for real-time playback)
     */
    async textToSpeechStream(text, voiceId = null) {
        try {
            if (!this.client) {
                throw new Error('ElevenLabs not initialized');
            }

            const selectedVoiceId = voiceId || this.defaultVoiceId;

            const audio = await this.client.generate({
                voice: selectedVoiceId,
                text: text.trim(),
                model_id: 'eleven_monolingual_v1',
                stream: true
            });

            return audio;

        } catch (error) {
            console.error('ElevenLabs TTS streaming error:', error);
            throw error;
        }
    }

    /**
     * Get available voices
     */
    async getVoices() {
        try {
            if (!this.client) {
                throw new Error('ElevenLabs not initialized');
            }

            const voices = await this.client.voices.getAll();
            return voices || [];

        } catch (error) {
            console.error('Failed to fetch voices:', error);
            return [];
        }
    }
}

// Export singleton instance
export default new ElevenLabsService();
