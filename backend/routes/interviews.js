const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const interviewService = require('../services/interviewService');
const voiceService = require('../services/voiceService');

// Configure multer for audio file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      voiceService.validateAudioFormat(file);
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  }
});

// Create new interview session
router.post('/setup', auth, async (req, res) => {
  try {
    const { type, role, topics, difficulty, company, questionCount } = req.body;
    
    // Validate input
    if (!type || !role || !topics || !difficulty || !questionCount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const config = {
      type,
      role,
      topics: Array.isArray(topics) ? topics : [topics],
      difficulty,
      company: company || '',
      questionCount: parseInt(questionCount)
    };

    const interview = await interviewService.createSession(req.user.userId, config);
    
    res.json({
      success: true,
      data: {
        sessionId: interview._id,
        config: interview.config,
        totalQuestions: interview.questions.length
      },
      message: 'Interview session created successfully'
    });
  } catch (error) {
    console.error('Error creating interview session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create interview session'
    });
  }
});

// Start interview session
router.post('/start/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await interviewService.startSession(sessionId);
    
    res.json({
      success: true,
      data: {
        sessionId: result.interview._id,
        currentQuestion: result.currentQuestion.mainQuestion,
        questionIndex: 0,
        questionAudio: result.questionAudio,
        totalQuestions: result.interview.questions.length
      },
      message: 'Interview started successfully'
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start interview'
    });
  }
});

// Submit answer to current question
router.post('/answer/:sessionId/:questionIndex', auth, upload.single('audio'), async (req, res) => {
  try {
    const { sessionId, questionIndex } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    const audioBuffer = require('fs').readFileSync(req.file.path);
    const result = await interviewService.processAnswer(
      sessionId, 
      parseInt(questionIndex), 
      audioBuffer
    );

    // Clean up uploaded file
    require('fs').unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        transcription: result.transcription,
        needsCrossQuestion: result.needsCrossQuestion,
        crossQuestion: result.crossQuestion,
        crossQuestionAudio: result.crossQuestionAudio
      },
      message: 'Answer processed successfully'
    });
  } catch (error) {
    console.error('Error processing answer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process answer'
    });
  }
});

// Submit cross-question answer
router.post('/cross-answer/:sessionId/:questionIndex', auth, upload.single('audio'), async (req, res) => {
  try {
    const { sessionId, questionIndex } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    const audioBuffer = require('fs').readFileSync(req.file.path);
    const result = await interviewService.processCrossAnswer(
      sessionId, 
      parseInt(questionIndex), 
      audioBuffer
    );

    // Clean up uploaded file
    require('fs').unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        transcription: result.transcription
      },
      message: 'Cross-answer processed successfully'
    });
  } catch (error) {
    console.error('Error processing cross-answer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process cross-answer'
    });
  }
});

// Get next question
router.get('/next-question/:sessionId/:currentIndex', auth, async (req, res) => {
  try {
    const { sessionId, currentIndex } = req.params;
    
    const result = await interviewService.getNextQuestion(
      sessionId, 
      parseInt(currentIndex)
    );

    if (!result) {
      return res.json({
        success: true,
        data: null,
        message: 'No more questions - interview ready for completion'
      });
    }

    res.json({
      success: true,
      data: {
        question: result.question.mainQuestion,
        questionIndex: result.questionIndex,
        questionAudio: result.questionAudio,
        category: result.question.category
      },
      message: 'Next question retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting next question:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get next question'
    });
  }
});

// Complete interview and generate report
router.post('/complete/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await interviewService.completeInterview(sessionId);
    
    res.json({
      success: true,
      data: {
        reportId: result.report._id,
        evaluation: result.evaluation,
        interviewSummary: result.interview.getSummary()
      },
      message: 'Interview completed and report generated successfully'
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete interview'
    });
  }
});

// Get interview session details
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const interview = await interviewService.getSession(sessionId);
    
    res.json({
      success: true,
      data: {
        interview: interview.getSummary(),
        questions: interview.questions.map(q => ({
          question: q.mainQuestion,
          category: q.category,
          hasAnswer: !!q.answer,
          hasCrossQuestion: !!q.crossQuestion
        }))
      },
      message: 'Interview session retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting interview session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get interview session'
    });
  }
});

// Get user's interview history
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await interviewService.getUserInterviews(req.user.userId, page, limit);
    
    res.json({
      success: true,
      data: {
        interviews: result.interviews.map(interview => interview.getSummary()),
        pagination: result.pagination
      },
      message: 'Interview history retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting interview history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get interview history'
    });
  }
});

module.exports = router;