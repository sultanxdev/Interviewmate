/**
 * Text-to-Speech Service
 * Provides integration with Google TTS and ElevenLabs TTS APIs
 */

// API keys from environment variables
const GOOGLE_TTS_API_KEY = process.env.REACT_APP_GOOGLE_TTS_API_KEY;
const ELEVENLABS_API_KEY = process.env.REACT_APP_ELEVENLABS_API_KEY;

/**
 * Convert text to speech using Google TTS API
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Options for the TTS request
 * @returns {Promise<ArrayBuffer>} - The audio data as an ArrayBuffer
 */
export const googleTextToSpeech = async (text, options = {}) => {
  try {
    const defaultOptions = {
      voice: 'en-US-Neural2-F', // Default female voice
      languageCode: 'en-US',
      pitch: 0,
      speakingRate: 1.0
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: requestOptions.languageCode,
          name: requestOptions.voice
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: requestOptions.pitch,
          speakingRate: requestOptions.speakingRate
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Google TTS API error: ${response.status}`);
    }
    
    const data = await response.json();
    const audioContent = data.audioContent;
    
    // Convert base64 to ArrayBuffer
    const binaryString = window.atob(audioContent);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  } catch (error) {
    console.error('Google TTS error:', error);
    throw error;
  }
};

/**
 * Convert text to speech using ElevenLabs TTS API
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Options for the TTS request
 * @returns {Promise<ArrayBuffer>} - The audio data as an ArrayBuffer
 */
export const elevenLabsTextToSpeech = async (text, options = {}) => {
  try {
    const defaultOptions = {
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Default voice ID (Rachel)
      stability: 0.5,
      similarityBoost: 0.5
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${requestOptions.voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: requestOptions.stability,
          similarity_boost: requestOptions.similarityBoost
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }
    
    const audioData = await response.arrayBuffer();
    return audioData;
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    throw error;
  }
};

/**
 * Fallback TTS using browser's built-in SpeechSynthesis API
 * @param {string} text - The text to speak
 * @param {Object} options - Options for the speech synthesis
 * @returns {Promise<void>}
 */
export const browserTextToSpeech = (text, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Browser does not support speech synthesis'));
      return;
    }
    
    const defaultOptions = {
      lang: 'en-US',
      pitch: 1,
      rate: 1,
      volume: 1
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = requestOptions.lang;
    utterance.pitch = requestOptions.pitch;
    utterance.rate = requestOptions.rate;
    utterance.volume = requestOptions.volume;
    
    // Set voice if specified
    if (requestOptions.voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === requestOptions.voiceName);
      if (voice) {
        utterance.voice = voice;
      }
    }
    
    // Event handlers
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
    
    // Speak
    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Main TTS function that tries different services in order
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Options for the TTS request
 * @returns {Promise<ArrayBuffer|void>} - The audio data or void if using browser TTS
 */
export const textToSpeech = async (text, options = {}) => {
  try {
    // Try Google TTS first if API key is available
    if (GOOGLE_TTS_API_KEY) {
      return await googleTextToSpeech(text, options);
    }
    
    // Try ElevenLabs if API key is available
    if (ELEVENLABS_API_KEY) {
      return await elevenLabsTextToSpeech(text, options);
    }
    
    // Fallback to browser TTS
    return await browserTextToSpeech(text, options);
  } catch (error) {
    console.error('TTS error:', error);
    
    // Final fallback to browser TTS
    try {
      return await browserTextToSpeech(text, options);
    } catch (fallbackError) {
      console.error('Browser TTS fallback error:', fallbackError);
      throw fallbackError;
    }
  }
};