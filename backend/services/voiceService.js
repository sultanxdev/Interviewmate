const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class VoiceService {
  constructor() {
    // Initialize Google Cloud clients
    this.ttsClient = new textToSpeech.TextToSpeechClient();
    this.sttClient = new speech.SpeechClient();
    
    // Create uploads directory if it doesn't exist
    this.uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  // Convert text to speech using Google TTS
  async textToSpeech(text, voice = 'en-US-Standard-A') {
    try {
      const request = {
        input: { text: text },
        voice: {
          languageCode: 'en-US',
          name: voice,
          ssmlGender: 'NEUTRAL',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.9,
          pitch: 0.0,
        },
      };

      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      // Save audio file
      const fileName = `tts_${uuidv4()}.mp3`;
      const filePath = path.join(this.uploadsDir, fileName);
      
      fs.writeFileSync(filePath, response.audioContent, 'binary');
      
      return {
        audioPath: filePath,
        audioUrl: `/uploads/${fileName}`,
        fileName: fileName
      };
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw new Error('Failed to convert text to speech');
    }
  }

  // Convert speech to text using Google STT
  async speechToText(audioBuffer, encoding = 'WEBM_OPUS') {
    try {
      const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: encoding,
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          model: 'latest_long',
        },
      };

      const [response] = await this.sttClient.recognize(request);
      
      if (response.results && response.results.length > 0) {
        const transcription = response.results
          .map(result => result.alternatives[0].transcript)
          .join(' ');
        
        return {
          transcript: transcription,
          confidence: response.results[0].alternatives[0].confidence || 0
        };
      } else {
        return {
          transcript: '',
          confidence: 0
        };
      }
    } catch (error) {
      console.error('Error in speech-to-text:', error);
      throw new Error('Failed to convert speech to text');
    }
  }

  // Alternative STT using Whisper (if Google Cloud is not available)
  async speechToTextWhisper(audioFilePath) {
    try {
      // This would use whisper-node package
      // Implementation depends on your Whisper setup
      const whisper = require('whisper-node');
      
      const options = {
        modelName: 'base.en',
        whisperOptions: {
          language: 'en',
          word_timestamps: true
        }
      };

      const transcript = await whisper(audioFilePath, options);
      
      return {
        transcript: transcript[0]?.speech || '',
        confidence: 0.9 // Whisper doesn't provide confidence scores
      };
    } catch (error) {
      console.error('Error in Whisper STT:', error);
      throw new Error('Failed to transcribe audio with Whisper');
    }
  }

  // Validate audio format
  validateAudioFormat(file) {
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid audio format. Supported formats: WAV, MP3, WebM, OGG');
    }

    if (file.size > maxSize) {
      throw new Error('Audio file too large. Maximum size: 10MB');
    }

    return true;
  }

  // Clean up old audio files
  async cleanupOldFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const files = fs.readdirSync(this.uploadsDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old audio file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up audio files:', error);
    }
  }
}

module.exports = new VoiceService();