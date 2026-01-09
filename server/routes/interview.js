import express from 'express'
import { protect } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimiting.js'
import { analyticsCache, historyCache } from '../middleware/cache.js'
import { body } from 'express-validator'
import { handleValidationErrors } from '../middleware/validation.js'
import * as interviewController from '../controllers/interviewController.js'

const router = express.Router()

const analyticsLimiter = createRateLimiter(60 * 1000, 10, 'Too many analytics requests.')
const historyLimiter = createRateLimiter(60 * 1000, 15, 'Too many history requests.')

router.get('/create', protect, interviewController.getCreateData)

router.post('/create', protect, [
  body('type').isIn(['hr', 'technical', 'managerial', 'custom']).withMessage('Invalid interview type'),
  body('candidateInfo.name').trim().notEmpty().withMessage('Candidate name is required'),
  body('candidateInfo.role').trim().notEmpty().withMessage('Role is required'),
  body('candidateInfo.company').trim().notEmpty().withMessage('Company is required'),
  body('candidateInfo.experience').isIn(['fresher', 'mid-level', 'senior', 'executive']).withMessage('Invalid experience level'),
  body('configuration.duration').isInt({ min: 5, max: 60 }).withMessage('Duration must be between 5 and 60 minutes'),
  body('configuration.difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  handleValidationErrors
], interviewController.createInterview)

router.get('/history', protect, historyLimiter, historyCache, interviewController.getHistory)
router.get('/analytics', protect, analyticsLimiter, analyticsCache, interviewController.getAnalytics)

router.post('/generate-questions', protect, [
  body('jobDescription').trim().notEmpty().withMessage('Job description is required'),
  handleValidationErrors
], interviewController.generateQuestions)

router.post('/evaluate', protect, [
  body('transcript').trim().notEmpty().withMessage('Transcript is required'),
  body('questions').isArray().withMessage('Questions array is required'),
  handleValidationErrors
], interviewController.evaluateGeneral)

router.post('/generate-followup', protect, [
  body('transcript').trim().notEmpty().withMessage('Transcript is required'),
  body('currentQuestion').trim().notEmpty().withMessage('Current question is required'),
  handleValidationErrors
], interviewController.generateFollowUp)

router.post('/parse-resume', protect, interviewController.parseResume)
router.post('/resume-questions', protect, interviewController.resumeQuestions)
router.get('/test-gemini', protect, interviewController.testGemini)

router.get('/:id', protect, interviewController.getInterviewById)
router.put('/:id', protect, interviewController.updateInterview)
router.post('/:id/evaluate', protect, [
  body('transcript').trim().notEmpty().withMessage('Transcript is required for evaluation'),
  handleValidationErrors
], interviewController.evaluateInterview)
router.delete('/:id', protect, interviewController.deleteInterview)

export default router