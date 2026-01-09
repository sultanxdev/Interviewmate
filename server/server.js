import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'

// Import configuration
import { validateEnvironment, checkDevelopmentSetup } from './config/validateEnv.js'
import connectDB from './config/database.js'
import geminiService from './config/gemini.js'

// Import routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import interviewRoutes from './routes/interview.js'
import paymentRoutes from './routes/payment.js'
import uploadRoutes from './routes/upload.js'
import adminRoutes from './routes/admin.js'
import healthRoutes from './routes/health.js'
import reportsRoutes from './routes/reports.js'

// Import middleware
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { sanitizeAll } from './middleware/sanitize.js'
import { apiLimiter, authLimiter } from './middleware/rateLimiting.js'
import { securityConfig, securityLogger, ipSecurity, requestSizeLimit } from './middleware/security.js'
import { validateSecuritySettings } from './config/validateEnv.js'

// Validate environment variables and security settings
validateEnvironment()
validateSecuritySettings()
checkDevelopmentSetup()

const app = express()
const PORT = process.env.PORT || 5001

// Security & Safety middleware
app.use(securityConfig.helmet)
app.use(securityConfig.cors)
app.use(ipSecurity)
app.use(securityLogger)
app.use(requestSizeLimit('10mb'))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Sanitization middleware (applied after parsing)
app.use(sanitizeAll)

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'InterviewMate API is running',
    timestamp: new Date().toISOString()
  })
})

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/user', apiLimiter, userRoutes)
app.use('/api/interview', apiLimiter, interviewRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api', healthRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB()

    // Initialize Gemini AI
    try {
      const initialized = geminiService.initialize()

      if (initialized) {
        // Test Gemini connection
        const isGeminiWorking = await geminiService.testConnection()
        if (isGeminiWorking) {
          console.log('✅ Gemini AI connection verified')
        } else {
          console.log('⚠️ Gemini AI connection test failed - using fallback evaluation')
        }
      } else {
        console.log('⚠️ Gemini AI not configured - using fallback evaluation')
      }
    } catch (error) {
      console.log('⚠️ Gemini AI initialization failed - using fallback evaluation:', error.message)
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV}`)
      console.log(`🌐 API URL: http://localhost:${PORT}/api`)
      console.log(`📚 Health check: http://localhost:${PORT}/api/health`)
    })

    // Handle port in use error
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please:`)
        console.error(`   1. Kill the existing process: taskkill /f /im node.exe`)
        console.error(`   2. Or use a different port: PORT=5002 npm run dev`)
        console.error(`   3. Or wait a moment and try again`)
        process.exit(1)
      } else {
        throw err
      }
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app