import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import DOMPurify from 'isomorphic-dompurify'
import hpp from 'hpp'
import cors from 'cors'

// Security configuration
export const securityConfig = {
  // Helmet configuration for security headers
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.vapi.ai", "https://generativelanguage.googleapis.com"],
        mediaSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false, // Disable for VAPI compatibility
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // CORS configuration
  cors: cors({
    origin: function (origin, callback) {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173').split(',')

      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true)

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  }),

  // MongoDB injection prevention
  mongoSanitize: mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Potential NoSQL injection attempt detected: ${key} from ${req.ip}`)
    }
  }),

  // XSS protection using DOMPurify
  xss: (req, res, next) => {
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
  },

  // HTTP Parameter Pollution protection
  hpp: hpp({
    whitelist: ['sort', 'fields', 'page', 'limit', 'type', 'status']
  })
}

// Request logging middleware for security monitoring
export const securityLogger = (req, res, next) => {
  const startTime = Date.now()

  // Log suspicious patterns
  const suspiciousPatterns = [
    /(\<script\>|\<\/script\>)/gi,
    /(union|select|insert|delete|update|drop|create|alter)/gi,
    /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin)/gi,
    /(javascript:|data:|vbscript:)/gi
  ]

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  })

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData))

  if (isSuspicious) {
    console.warn(`🚨 Suspicious request detected from ${req.ip}:`, {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString()
    })
  }

  // Log response time and status
  res.on('finish', () => {
    const duration = Date.now() - startTime

    if (duration > 5000) { // Log slow requests
      console.warn(`⏱️ Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`)
    }

    if (res.statusCode >= 400) { // Log error responses
      console.warn(`❌ Error response: ${res.statusCode} for ${req.method} ${req.originalUrl}`)
    }
  })

  next()
}

// IP-based rate limiting and blocking
export const ipSecurity = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress

  // Block known malicious IPs (you would maintain this list)
  const blockedIPs = process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : []

  if (blockedIPs.includes(clientIP)) {
    console.warn(`🚫 Blocked IP attempted access: ${clientIP}`)
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    })
  }

  // Add IP to request for logging
  req.clientIP = clientIP
  next()
}

// Request size limiting
export const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0')
    const maxBytes = typeof maxSize === 'string' ?
      parseInt(maxSize) * 1024 * 1024 : maxSize

    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large'
      })
    }

    next()
  }
}

// API key validation for external services
export const validateApiKey = (req, res, next) => {
  const apiKey = req.get('X-API-Key')

  if (req.path.startsWith('/api/webhook/')) {
    // Webhook endpoints require API key validation
    if (!apiKey || !isValidApiKey(apiKey)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      })
    }
  }

  next()
}

// Helper function to validate API keys
const isValidApiKey = (key) => {
  const validKeys = [
    process.env.VAPI_WEBHOOK_SECRET,
    process.env.RAZORPAY_WEBHOOK_SECRET
  ].filter(Boolean)

  return validKeys.includes(key)
}

// Content type validation
export const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type')

      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({
          success: false,
          message: 'Unsupported media type'
        })
      }
    }

    next()
  }
}

export default {
  securityConfig,
  securityLogger,
  ipSecurity,
  requestSizeLimit,
  validateApiKey,
  validateContentType
}