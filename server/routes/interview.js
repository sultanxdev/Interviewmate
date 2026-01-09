import express from 'express'
import mongoose from 'mongoose'
import { body, validationResult } from 'express-validator'
import Interview from '../models/Interview.js'
import User from '../models/User.js'
import geminiService from '../config/gemini.js'
import resumeParser from '../utils/resumeParser.js'
import { protect } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimiting.js'
import { analyticsCache, historyCache, clearUserCache } from '../middleware/cache.js'

// Create specific rate limiters for interview endpoints
const analyticsLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 requests per minute
  'Too many analytics requests. Please wait before refreshing.'
)

const historyLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  15, // 15 requests per minute
  'Too many history requests. Please wait before refreshing.'
)

const router = express.Router()

// @desc    Get interview creation form data
// @route   GET /api/interview/create
// @access  Private
router.get('/create', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    res.status(200).json({
      success: true,
      data: {
        userPlan: user.subscription.plan,
        vapiMinutesRemaining: user.subscription.vapiMinutesRemaining,
        payAsYouGoBalance: user.subscription.payAsYouGoBalance,
        interviewTypes: ['hr', 'technical', 'managerial', 'custom'],
        experienceLevels: ['fresher', 'mid-level', 'senior', 'executive'],
        difficulties: ['easy', 'medium', 'hard'],
        durations: [5, 10, 15, 30, 45, 60]
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview creation data'
    })
  }
})

// @desc    Create new interview
// @route   POST /api/interview/create
// @access  Private
router.post('/create', protect, [
  body('type')
    .isIn(['hr', 'technical', 'managerial', 'custom'])
    .withMessage('Invalid interview type'),
  body('candidateInfo.name')
    .trim()
    .notEmpty()
    .withMessage('Candidate name is required'),
  body('candidateInfo.role')
    .trim()
    .notEmpty()
    .withMessage('Role is required'),
  body('candidateInfo.company')
    .trim()
    .notEmpty()
    .withMessage('Company is required'),
  body('candidateInfo.experience')
    .isIn(['fresher', 'mid-level', 'senior', 'executive'])
    .withMessage('Invalid experience level'),
  body('configuration.duration')
    .isInt({ min: 5, max: 60 })
    .withMessage('Duration must be between 5 and 60 minutes'),
  body('configuration.difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Invalid difficulty level'),
  body('configuration.customTopics')
    .optional()
    .isArray()
    .withMessage('Custom topics must be an array'),
  body('configuration.customQuestions')
    .optional()
    .isArray()
    .withMessage('Custom questions must be an array'),
  body('configuration.jobDescription')
    .optional()
    .isString()
    .withMessage('Job description must be a string')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { type, candidateInfo, configuration } = req.body

    // Check if user has enough VAPI minutes (only for VAPI mode)
    const user = await User.findById(req.user.id)
    const mode = req.body.mode || req.body.configuration?.interviewMode || 'webspeech' // Default to webspeech if not specified

    if (mode === 'vapi') {
      if (user.subscription.plan === 'free' && user.subscription.vapiMinutesRemaining < configuration.duration) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient VAPI minutes remaining. Please upgrade to Pro plan or use Web Speech API mode.'
        })
      }

      if (user.subscription.plan === 'pro') {
        const cost = configuration.duration * 0.5 // $0.50 per minute
        if (user.subscription.payAsYouGoBalance < cost) {
          return res.status(400).json({
            success: false,
            message: `Insufficient balance. Need $${cost.toFixed(2)} for ${configuration.duration} minutes. Please add funds.`
          })
        }
      }
    }
    // Web Speech API mode is always free and unlimited

    // Create interview
    const interview = await Interview.create({
      userId: req.user.id,
      type,
      candidateInfo,
      configuration,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    })

    // Generate VAPI configuration
    interview.generateVapiConfig()
    await interview.save()

    // Clear user cache since data has changed
    clearUserCache(req.user.id)

    res.status(201).json({
      success: true,
      interview
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get user's interview history
// @route   GET /api/interview/history
// @access  Private
router.get('/history', protect, async (req, res, next) => {
  try {
    console.log('📊 Interview history request from user:', req.user.id)

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Build filter
    const filter = { userId: req.user.id }

    if (req.query.type) {
      filter.type = req.query.type
    }

    if (req.query.status) {
      filter.status = req.query.status
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {}
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate)
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate)
      }
    }

    console.log('📊 Query filter:', filter)

    const interviews = await Interview.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Interview.countDocuments(filter)

    console.log('📊 Found interviews:', interviews.length, 'Total:', total)

    res.status(200).json({
      success: true,
      interviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('❌ Interview history error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview history',
      error: error.message
    })
  }
})

// @desc    Get interview analytics
// @route   GET /api/interview/analytics
// @access  Private
router.get('/analytics', protect, analyticsLimiter, analyticsCache, async (req, res, next) => {
  try {
    const userId = req.user.id

    // Aggregate interview statistics
    const stats = await Interview.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalInterviews: { $sum: 1 },
          averageScore: { $avg: '$evaluation.overallScore' },
          totalMinutes: { $sum: '$configuration.duration' },
          completedInterviews: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ])

    // Get performance trend (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const performanceTrend = await Interview.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          averageScore: { $avg: '$evaluation.overallScore' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Get skill breakdown
    const skillBreakdown = await Interview.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          communication: { $avg: '$evaluation.skillScores.communication' },
          technicalKnowledge: { $avg: '$evaluation.skillScores.technicalKnowledge' },
          problemSolving: { $avg: '$evaluation.skillScores.problemSolving' },
          confidence: { $avg: '$evaluation.skillScores.confidence' },
          clarity: { $avg: '$evaluation.skillScores.clarity' },
          behavioral: { $avg: '$evaluation.skillScores.behavioral' }
        }
      }
    ])

    res.status(200).json({
      success: true,
      analytics: {
        overview: stats[0] || {
          totalInterviews: 0,
          averageScore: 0,
          totalMinutes: 0,
          completedInterviews: 0
        },
        performanceTrend,
        skillBreakdown: skillBreakdown[0] || {}
      }
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Generate interview questions using Gemini AI
// @route   POST /api/interview/generate-questions
// @access  Private
router.post('/generate-questions', protect, [
  body('jobDescription')
    .trim()
    .notEmpty()
    .withMessage('Job description is required'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Invalid difficulty level'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Count must be between 1 and 10')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { jobDescription, difficulty = 'medium', count = 5 } = req.body

    try {
      const questions = await geminiService.generateQuestions(jobDescription, difficulty, count)

      res.status(200).json({
        success: true,
        questions
      })
    } catch (aiError) {
      console.error('Gemini AI Error:', aiError)

      // Return fallback questions
      const fallbackQuestions = [
        { question: "Tell me about yourself and your background.", type: "behavioral" },
        { question: "Why are you interested in this role?", type: "behavioral" },
        { question: "What are your greatest strengths?", type: "behavioral" },
        { question: "Describe a challenging situation you faced and how you handled it.", type: "behavioral" },
        { question: "Where do you see yourself in 5 years?", type: "behavioral" }
      ]

      res.status(200).json({
        success: true,
        questions: fallbackQuestions,
        message: 'Using fallback questions due to AI service unavailability'
      })
    }
  } catch (error) {
    next(error)
  }
})

// @desc    Evaluate interview using Gemini AI (general endpoint)
// @route   POST /api/interview/evaluate
// @access  Private
router.post('/evaluate', protect, [
  body('transcript')
    .trim()
    .notEmpty()
    .withMessage('Transcript is required'),
  body('questions')
    .isArray()
    .withMessage('Questions array is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { transcript, questions } = req.body

    try {
      const evaluation = await geminiService.evaluateInterview(transcript, questions)

      res.status(200).json({
        success: true,
        evaluation
      })
    } catch (aiError) {
      console.error('Gemini AI Error:', aiError)

      // Return fallback evaluation
      const fallbackEvaluation = {
        overallScore: 75,
        strengths: ['Clear communication', 'Good engagement'],
        weaknesses: ['Could provide more specific examples'],
        recommendations: ['Practice behavioral questions', 'Prepare specific examples'],
        questionFeedback: (questions || []).map((q, index) => ({
          question: q.question || q,
          score: 7,
          feedback: 'Good response, could be more detailed'
        }))
      }

      res.status(200).json({
        success: true,
        evaluation: fallbackEvaluation,
        message: 'Using fallback evaluation due to AI service unavailability'
      })
    }
  } catch (error) {
    next(error)
  }
})

// @desc    Generate follow-up question using Gemini AI
// @route   POST /api/interview/generate-followup
// @access  Private
router.post('/generate-followup', protect, [
  body('transcript')
    .trim()
    .notEmpty()
    .withMessage('Transcript is required'),
  body('currentQuestion')
    .trim()
    .notEmpty()
    .withMessage('Current question is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { transcript, currentQuestion } = req.body

    try {
      const followUp = await geminiService.generateFollowUp(transcript, currentQuestion)

      res.status(200).json({
        success: true,
        followUp: followUp === 'PROCEED' ? '' : followUp,
        shouldProceed: followUp === 'PROCEED'
      })
    } catch (aiError) {
      console.error('Gemini AI Error:', aiError)

      res.status(200).json({
        success: true,
        followUp: '', // Empty follow-up to continue to next question
        shouldProceed: true,
        message: 'AI follow-up generation unavailable'
      })
    }
  } catch (error) {
    next(error)
  }
})

// @desc    Parse uploaded resume
// @route   POST /api/interview/parse-resume
// @access  Private
router.post('/parse-resume', protect, async (req, res, next) => {
  try {
    const { filePath, fileName } = req.body

    if (!filePath || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'File path and name are required'
      })
    }

    const result = await resumeParser.parseResume(filePath, fileName)

    res.status(200).json({
      success: result.success,
      data: result.data,
      message: result.success ? 'Resume parsed successfully' : 'Resume parsing failed, using fallback data'
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Generate resume-based questions
// @route   POST /api/interview/resume-questions
// @access  Private
router.post('/resume-questions', protect, [
  body('resumeData')
    .notEmpty()
    .withMessage('Resume data is required'),
  body('interviewType')
    .isIn(['hr', 'technical', 'managerial'])
    .withMessage('Invalid interview type')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { resumeData, interviewType } = req.body

    const questions = await resumeParser.generateResumeBasedQuestions(resumeData, interviewType)

    res.status(200).json({
      success: true,
      questions
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Test Gemini AI connection
// @route   GET /api/interview/test-gemini
// @access  Private
router.get('/test-gemini', protect, async (req, res, next) => {
  try {
    const isWorking = await geminiService.testConnection()

    res.status(200).json({
      success: isWorking,
      message: isWorking ? 'Gemini AI is working' : 'Gemini AI connection failed'
    })
  } catch (error) {
    res.status(200).json({
      success: false,
      message: 'Gemini AI test failed',
      error: error.message
    })
  }
})

// @desc    Get interview by ID
// @route   GET /api/interview/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      })
    }

    res.status(200).json({
      success: true,
      interview
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Update interview
// @route   PUT /api/interview/:id
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      })
    }

    // Update allowed fields
    const allowedUpdates = ['status', 'session', 'vapiConfig']
    const updates = {}

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    interview = await Interview.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      interview
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Evaluate interview using Gemini AI
// @route   POST /api/interview/:id/evaluate
// @access  Private
router.post('/:id/evaluate', protect, [
  body('transcript')
    .trim()
    .notEmpty()
    .withMessage('Transcript is required for evaluation')
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { transcript } = req.body

    let interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      })
    }

    // Update transcript
    interview.session.transcript = transcript
    interview.session.endTime = new Date()
    interview.status = 'completed'

    // Generate AI evaluation using Gemini with proper error handling
    try {
      let evaluation
      try {
        evaluation = await geminiService.evaluateInterview(interview, transcript)
      } catch (aiError) {
        console.error('AI Evaluation Error:', aiError)
        // Use fallback evaluation from Gemini service
        evaluation = geminiService.getFallbackEvaluation()
      }

      interview.evaluation = evaluation

      // Update user stats with proper error handling
      try {
        const user = await User.findById(req.user.id)
        if (user) {
          user.updateStats({
            duration: interview.configuration.duration,
            score: evaluation.overallScore
          })
          await user.save()
        }
      } catch (userError) {
        console.error('Error updating user stats:', userError)
        // Continue without failing the request
      }

      await interview.save()

      // Clear user cache since data has changed
      try {
        clearUserCache(req.user.id)
      } catch (cacheError) {
        console.error('Error clearing user cache:', cacheError)
        // Continue without failing the request
      }

      res.status(200).json({
        success: true,
        interview,
        evaluation,
        message: evaluation.evaluationModel === 'fallback' ?
          'Interview evaluated with fallback system. AI evaluation temporarily unavailable.' :
          'Interview evaluated successfully.'
      })
    } catch (error) {
      console.error('Unexpected error during evaluation:', error)

      // Final fallback - return basic evaluation
      const basicEvaluation = {
        overallScore: 75,
        skillScores: {
          communication: 75,
          technicalKnowledge: 70,
          problemSolving: 75,
          confidence: 70,
          clarity: 75,
          behavioral: 75
        },
        strengths: ['Participated in the interview'],
        weaknesses: ['Could provide more specific examples'],
        recommendations: ['Continue practicing interview skills'],
        detailedFeedback: 'Interview completed with basic evaluation due to system limitations.',
        badges: [],
        evaluatedAt: new Date(),
        evaluationModel: 'basic-fallback'
      }

      interview.evaluation = basicEvaluation
      await interview.save()

      res.status(200).json({
        success: true,
        interview,
        evaluation: basicEvaluation,
        message: 'Interview completed with basic evaluation due to system limitations.'
      })
    }
  } catch (error) {
    next(error)
  }
})

// @desc    Delete interview
// @route   DELETE /api/interview/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      })
    }

    await interview.deleteOne()

    res.status(200).json({
      success: true,
      message: 'Interview deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// @desc    VAPI Webhook handler
// @route   POST /api/interview/vapi-webhook
// @access  Public (webhook)
router.post('/vapi-webhook', async (req, res) => {
  try {
    const event = req.body

    // Handle different VAPI events
    switch (event.type) {
      case 'call.started':
        console.log('VAPI call started:', event.data)
        break

      case 'call.ended':
        console.log('VAPI call ended:', event.data)
        // Update interview with call data
        if (event.data.metadata && event.data.metadata.interviewId) {
          const interview = await Interview.findById(event.data.metadata.interviewId)
          if (interview) {
            interview.session.endTime = new Date()
            interview.session.duration = event.data.duration || 0
            interview.status = 'completed'
            await interview.save()
          }
        }
        break

      case 'transcript.updated':
        console.log('VAPI transcript updated:', event.data)
        // Update interview transcript
        if (event.data.metadata && event.data.metadata.interviewId) {
          const interview = await Interview.findById(event.data.metadata.interviewId)
          if (interview) {
            interview.session.transcript = event.data.transcript || ''
            await interview.save()
          }
        }
        break

      default:
        console.log('Unknown VAPI event:', event.type)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('VAPI webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

export default router