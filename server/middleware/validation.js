import { body, param, query, validationResult } from 'express-validator'
import mongoose from 'mongoose'
import DOMPurify from 'isomorphic-dompurify'

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg)
    return res.status(400).json({
      success: false,
      message: errorMessages[0] || 'Validation failed',
      errors: errors.array()
    })
  }
  next()
}

// Custom validators
export const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('Invalid ID format')
  }
  return true
}

export const sanitizeHtml = (value) => {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] })
}

export const isStrongPassword = (value) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(value)
  const hasLowerCase = /[a-z]/.test(value)
  const hasNumbers = /\d/.test(value)
  const hasNonalphas = /\W/.test(value)

  if (value.length < minLength) {
    throw new Error('Password must be at least 8 characters long')
  }

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    throw new Error('Password must contain uppercase, lowercase, and numeric characters')
  }

  return true
}

// Common validation chains
export const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .customSanitizer(sanitizeHtml),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .custom(isStrongPassword),
  handleValidationErrors
]

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
]

export const validateInterviewCreation = [
  body('type')
    .isIn(['hr', 'technical', 'managerial', 'custom'])
    .withMessage('Invalid interview type'),
  body('candidateInfo.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Candidate name is required and must be less than 100 characters')
    .customSanitizer(sanitizeHtml),
  body('candidateInfo.role')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Role is required and must be less than 100 characters')
    .customSanitizer(sanitizeHtml),
  body('candidateInfo.company')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company is required and must be less than 100 characters')
    .customSanitizer(sanitizeHtml),
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
    .isArray({ max: 10 })
    .withMessage('Custom topics must be an array with maximum 10 items'),
  body('configuration.customTopics.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeHtml),
  body('configuration.customQuestions')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Custom questions must be an array with maximum 20 items'),
  body('configuration.customQuestions.*')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .customSanitizer(sanitizeHtml),
  body('configuration.jobDescription')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Job description must be less than 5000 characters')
    .customSanitizer(sanitizeHtml),
  handleValidationErrors
]

export const validateObjectId = [
  param('id')
    .custom(isValidObjectId)
    .withMessage('Invalid ID format'),
  handleValidationErrors
]

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
]

export const validateTranscript = [
  body('transcript')
    .trim()
    .isLength({ min: 10, max: 50000 })
    .withMessage('Transcript must be between 10 and 50000 characters')
    .customSanitizer(sanitizeHtml),
  handleValidationErrors
]

// Rate limiting validation
export const validateRateLimit = (windowMs, maxRequests) => {
  return (req, res, next) => {
    const key = `rate_limit:${req.ip}:${req.route.path}`
    // Implementation would depend on your caching solution
    // This is a placeholder for rate limiting logic
    next()
  }
}

// File upload validation
export const validateFileUpload = (allowedTypes, maxSize) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      })
    }

    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      })
    }

    next()
  }
}

export default {
  handleValidationErrors,
  isValidObjectId,
  sanitizeHtml,
  isStrongPassword,
  validateRegistration,
  validateLogin,
  validateInterviewCreation,
  validateObjectId,
  validatePagination,
  validateTranscript,
  validateRateLimit,
  validateFileUpload
}