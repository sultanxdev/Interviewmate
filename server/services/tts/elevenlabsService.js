import { ElevenLabsClient } from 'elevenlabs';

/**
 * ElevenLabs TTS Service
 * Converts text to natural-sounding speech
 */

class ElevenLabsService {
    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        this.enabled = false;

        if (!this.apiKey) {
            console.warn('⚠️  ELEVENLABS_API_KEY not set - TTS will be text-only');
        } else {
            try {
                this.client = new ElevenLabsClient({ apiKey: this.apiKey });
                this.enabled = true;
                console.log('✅ ElevenLabs service initialized');
            } catch (err) {
                console.warn('⚠️  ElevenLabs client failed to initialize:', err.message);
            }
        }

        // Rachel — professional neutral voice
        this.defaultVoiceId = '21m00Tcm4TlvDq8ikWAM';
    }

    /**
     * Convert text to speech
     * Returns a Buffer, or null if TTS is unavailable
     * (callers should gracefully handle null — text-only fallback)
     */
    async textToSpeech(text, voiceId = null) {
        if (!this.enabled || !this.client) {
            console.log('TTS skipped — ElevenLabs not available, using text-only mode');
            return null;
        }

        if (!text || text.trim().length === 0) {
            return null;
        }

        try {
            const selectedVoiceId = voiceId || this.defaultVoiceId;

            const audio = await this.client.generate({
                voice: selectedVoiceId,
                text: text.trim(),
                model_id: 'eleven_monolingual_v1',
            });

            // Collect async iterable chunks into a Buffer
            const chunks = [];
            for await (const chunk of audio) {
                chunks.push(chunk);
            }

            return Buffer.concat(chunks);

        } catch (error) {
            // 401 = invalid key, 403 = quota, 422 = bad params
            const status = error?.statusCode || error?.status;
            if (status === 401) {
                console.warn('⚠️  ElevenLabs: Invalid API key — disabling TTS for this session');
                this.enabled = false; // Stop retrying every call
            } else {
                console.error('ElevenLabs TTS error:', error?.message || error);
            }
            return null; // Always return null — never crash the session
        }
    }

    /**
     * Text to speech with streaming
     */
    async textToSpeechStream(text, voiceId = null) {
        if (!this.enabled || !this.client) return null;

        try {
            const selectedVoiceId = voiceId || this.defaultVoiceId;
            return await this.client.generate({
                voice: selectedVoiceId,
                text: text.trim(),
                model_id: 'eleven_monolingual_v1',
                stream: true,
            });
        } catch (error) {
            console.error('ElevenLabs TTS streaming error:', error?.message || error);
            return null;
        }
    }

    /**
     * Get available voices
     */
    async getVoices() {
        if (!this.enabled || !this.client) return [];
        try {
            const voices = await this.client.voices.getAll();
            return voices || [];
        } catch (error) {
            console.error('Failed to fetch ElevenLabs voices:', error?.message || error);
            return [];
        }
    }
}

export default new ElevenLabsService();
