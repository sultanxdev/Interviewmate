import fetch from 'node-fetch';
import FormData from 'form-data';

/**
 * ElevenLabs Speech-to-Text Service
 * Converts audio recordings to text using ElevenLabs Scribe STT API
 */
class ElevenLabsSTTService {
    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        this.enabled = false;

        if (!this.apiKey) {
            console.warn('⚠️  ELEVENLABS_API_KEY not set — STT will use fallback');
        } else {
            this.enabled = true;
            console.log('✅ ElevenLabs STT service initialized');
        }

        this.baseUrl = 'https://api.elevenlabs.io';
    }

    /**
     * Convert audio buffer to text
     * @param {Buffer} audioBuffer - Audio data buffer
     * @param {string} mimeType - e.g. 'audio/webm', 'audio/mp4', 'audio/wav'
     * @returns {Promise<string>} Transcribed text
     */
    async transcribe(audioBuffer, mimeType = 'audio/webm') {
        if (!this.enabled) {
            console.log('STT skipped — ElevenLabs not available');
            return null;
        }

        if (!audioBuffer || audioBuffer.length === 0) {
            return null;
        }

        try {
            const form = new FormData();

            // Append audio file  
            const extension = this._getExtension(mimeType);
            form.append('file', audioBuffer, {
                filename: `audio.${extension}`,
                contentType: mimeType,
            });
            form.append('model_id', 'scribe_v1');

            const response = await fetch(`${this.baseUrl}/v1/speech-to-text`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey,
                    ...form.getHeaders(),
                },
                body: form,
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`ElevenLabs STT error ${response.status}:`, errText);
                return null;
            }

            const data = await response.json();
            const transcript = data.text?.trim() || '';

            console.log(`✅ STT transcribed: "${transcript.substring(0, 80)}${transcript.length > 80 ? '...' : ''}"`);
            return transcript;

        } catch (error) {
            console.error('ElevenLabs STT error:', error?.message || error);
            return null;
        }
    }

    /**
     * Get file extension from mime type
     */
    _getExtension(mimeType) {
        const map = {
            'audio/webm': 'webm',
            'audio/webm;codecs=opus': 'webm',
            'audio/mp4': 'mp4',
            'audio/mp3': 'mp3',
            'audio/mpeg': 'mp3',
            'audio/wav': 'wav',
            'audio/ogg': 'ogg',
        };
        return map[mimeType] || 'webm';
    }
}

export default new ElevenLabsSTTService();
