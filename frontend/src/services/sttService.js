/**
 * Speech-to-Text Service
 * Provides integration with OpenAI Whisper API and Deepgram API
 */

import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Convert speech to text using OpenAI Whisper API (via backend proxy)
 * @param {Blob} audioBlob - The audio data as a Blob
 * @returns {Promise<string>} - The transcribed text
 */
export const whisperSpeechToText = async (audioBlob) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    // Send to backend proxy
    const response = await axios.post(`${API_URL}/interviews/transcribe`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.transcription;
  } catch (error) {
    console.error('Whisper STT error:', error);
    throw error;
  }
};

/**
 * Convert speech to text using Deepgram API (via backend proxy)
 * @param {Blob} audioBlob - The audio data as a Blob
 * @returns {Promise<string>} - The transcribed text
 */
export const deepgramSpeechToText = async (audioBlob) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('service', 'deepgram');
    
    // Send to backend proxy
    const response = await axios.post(`${API_URL}/interviews/transcribe`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.transcription;
  } catch (error) {
    console.error('Deepgram STT error:', error);
    throw error;
  }
};

/**
 * Main STT function that tries different services in order
 * @param {Blob} audioBlob - The audio data as a Blob
 * @param {Object} options - Options for the STT request
 * @returns {Promise<string>} - The transcribed text
 */
export const speechToText = async (audioBlob, options = {}) => {
  try {
    const { service = 'whisper' } = options;
    
    if (service === 'deepgram') {
      return await deepgramSpeechToText(audioBlob);
    } else {
      // Default to Whisper
      return await whisperSpeechToText(audioBlob);
    }
  } catch (error) {
    console.error('STT error:', error);
    
    // If the specified service fails, try the other one
    try {
      if (options.service === 'deepgram') {
        return await whisperSpeechToText(audioBlob);
      } else {
        return await deepgramSpeechToText(audioBlob);
      }
    } catch (fallbackError) {
      console.error('STT fallback error:', fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Voice Activity Detection (VAD)
 * Detects when the user has stopped speaking
 */
export class VoiceActivityDetector {
  constructor(options = {}) {
    this.options = {
      silenceThreshold: -50, // dB
      silenceDuration: 1500, // ms
      ...options
    };
    
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.javascriptNode = null;
    this.isSilent = false;
    this.silenceStart = null;
    this.onSilence = options.onSilence || (() => {});
    this.onSpeaking = options.onSpeaking || (() => {});
    this.isRunning = false;
  }
  
  async start() {
    if (this.isRunning) return;
    
    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.javascriptNode = this.audioContext.createScriptProcessor(2048, 1, 1);
      
      // Connect nodes
      this.microphone.connect(this.analyser);
      this.analyser.connect(this.javascriptNode);
      this.javascriptNode.connect(this.audioContext.destination);
      
      // Set up analyser
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      this.analyser.smoothingTimeConstant = 0.85;
      
      // Process audio
      this.javascriptNode.onaudioprocess = () => {
        const array = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(array);
        
        // Calculate volume
        let values = 0;
        const length = array.length;
        for (let i = 0; i < length; i++) {
          values += array[i];
        }
        
        const average = values / length;
        const volume = 20 * Math.log10(average / 255); // Convert to dB
        
        // Check for silence
        if (volume < this.options.silenceThreshold) {
          if (!this.isSilent) {
            this.isSilent = true;
            this.silenceStart = Date.now();
          } else if (Date.now() - this.silenceStart > this.options.silenceDuration) {
            this.onSilence();
          }
        } else {
          if (this.isSilent) {
            this.isSilent = false;
            this.onSpeaking();
          }
        }
      };
      
      this.isRunning = true;
    } catch (error) {
      console.error('VAD error:', error);
      throw error;
    }
  }
  
  stop() {
    if (!this.isRunning) return;
    
    // Disconnect nodes
    this.microphone.disconnect();
    this.analyser.disconnect();
    this.javascriptNode.disconnect();
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.isRunning = false;
  }
}