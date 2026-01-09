import express from 'express'
import { protect } from '../middleware/auth.js'
import { validateRegistration, validateLogin } from '../middleware/validation.js'
import { authLimiter } from '../middleware/rateLimiting.js'
import { body } from 'express-validator'
import { handleValidationErrors } from '../middleware/validation.js'
import * as authController from '../controllers/authController.js'

const router = express.Router()

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', authLimiter, validateRegistration, authController.register)

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authLimiter, validateLogin, authController.login)

// @desc    Google OAuth login
// @route   POST /api/auth/google
// @access  Public
router.post('/google', authController.googleAuth)

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, authController.getMe)

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, authController.logout)

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  handleValidationErrors
], authController.forgotPassword)

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
], authController.resetPassword)

export default router
