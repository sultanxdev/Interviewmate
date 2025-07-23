const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const axios = require('axios');
const FormData = require('form-data');
const auth = require('../middleware/auth');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// @route   POST /api/interviews/transcribe
// @desc    Transcribe audio to text
// @access  Private
router.post('/transcribe', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }
    
    const filePath = req.file.path;
    const service = req.body.service || 'whisper'; // Default to Whisper
    
    let transcription;
    
    if (service === 'deepgram') {
      // Use Deepgram API
      transcription = await transcribeWithDeepgram(filePath);
    } else {
      // Use OpenAI Whisper API
      transcription = await transcribeWithWhisper(filePath);
    }
    
    // Clean up the file
    await promisify(fs.unlink)(filePath);
    
    res.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    
    // Clean up the file if it exists
    if (req.file && req.file.path) {
      try {
        await promisify(fs.unlink)(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ message: 'Transcription failed' });
  }
});

// Transcribe with OpenAI Whisper API
async function transcribeWithWhisper(filePath) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      language: 'en'
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Whisper API error:', error);
    throw error;
  }
}

// Transcribe with Deepgram API
async function transcribeWithDeepgram(filePath) {
  try {
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    
    if (!DEEPGRAM_API_KEY) {
      throw new Error('Deepgram API key not found');
    }
    
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(filePath));
    
    const response = await axios.post('https://api.deepgram.com/v1/listen', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Token ${DEEPGRAM_API_KEY}`
      },
      params: {
        model: 'general',
        language: 'en-US',
        punctuate: true,
        diarize: false
      }
    });
    
    return response.data.results.channels[0].alternatives[0].transcript;
  } catch (error) {
    console.error('Deepgram API error:', error);
    throw error;
  }
}

module.exports = router;