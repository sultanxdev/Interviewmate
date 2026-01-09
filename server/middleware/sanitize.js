import mongoSanitize from 'express-mongo-sanitize'
import DOMPurify from 'isomorphic-dompurify'
import hpp from 'hpp'

// MongoDB injection prevention
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key: ${key} in request to ${req.path}`)
  }
})

// XSS protection using DOMPurify
export const xssMiddleware = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value)
    }
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach(key => {
        value[key] = sanitizeValue(value[key])
      })
    }
    return value
  }

  if (req.body) req.body = sanitizeValue(req.body)
  if (req.query) req.query = sanitizeValue(req.query)
  if (req.params) req.params = sanitizeValue(req.params)

  next()
}

// HTTP Parameter Pollution prevention
export const hppMiddleware = hpp({
  whitelist: ['tags', 'topics', 'skills'] // Allow arrays for these parameters
})

// Custom input validation middleware
export const validateInput = (req, res, next) => {
  // Check for common attack patterns
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /\$\{.*\}/gi, // Template injection
    /\{\{.*\}\}/gi, // Template injection
    /__proto__/gi,
    /constructor/gi
  ]

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value))
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue)
    }
    return false
  }

  // Check request body
  if (req.body && checkValue(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    })
  }

  // Check query parameters
  if (req.query && checkValue(req.query)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters detected'
    })
  }

  next()
}

// File upload security
export const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next()
  }

  const files = req.files ? Object.values(req.files).flat() : [req.file]

  for (const file of files) {
    // Check filename for path traversal
    if (file.originalname.includes('..') ||
      file.originalname.includes('/') ||
      file.originalname.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename detected'
      })
    }

    // Check for executable file extensions
    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
      '.php', '.asp', '.aspx', '.jsp', '.sh', '.ps1', '.py', '.rb'
    ]

    const fileExt = file.originalname.toLowerCase().split('.').pop()
    if (dangerousExtensions.includes(`.${fileExt}`)) {
      return res.status(400).json({
        success: false,
        message: 'File type not allowed for security reasons'
      })
    }

    // Check MIME type consistency
    const allowedMimes = {
      'pdf': ['application/pdf'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'txt': ['text/plain']
    }

    const expectedMimes = allowedMimes[fileExt] || []
    if (expectedMimes.length > 0 && !expectedMimes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'File type and content do not match'
      })
    }
  }

  next()
}

// Combined sanitization middleware
export const sanitizeAll = [
  mongoSanitizeMiddleware,
  xssMiddleware,
  hppMiddleware,
  validateInput
]

export default {
  mongoSanitizeMiddleware,
  xssMiddleware,
  hppMiddleware,
  validateInput,
  validateFileUpload,
  sanitizeAll
}