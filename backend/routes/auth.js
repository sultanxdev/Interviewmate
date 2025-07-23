const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
router.post('/google/callback', [
  body('code').notEmpty().withMessage('Authorization code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;

    try {
      // Exchange authorization code for access token
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.FRONTEND_URL}/auth/google/callback`
      });

      const { access_token } = tokenResponse.data;

      // Get user info from Google
      const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });

      const googleUser = userResponse.data;

      // Check if user exists
      let user = await User.findOne({ email: googleUser.email });

      if (!user) {
        // Create new user
        user = new User({
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.id,
          avatar: googleUser.picture,
          authProvider: 'google'
        });

        await user.save();
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        message: 'Google login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          subscription: user.subscription,
          avatar: user.avatar,
          preferences: user.preferences
        }
      });
    } catch (oauthError) {
      console.error('Google OAuth error:', oauthError);
      return res.status(401).json({ message: 'Invalid authorization code' });
    }
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

// @route   POST /api/auth/github/callback
// @desc    Handle GitHub OAuth callback
// @access  Public
router.post('/github/callback', [
  body('code').notEmpty().withMessage('Authorization code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;

    try {
      // Exchange authorization code for access token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      const { access_token } = tokenResponse.data;

      // Get user info from GitHub
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${access_token}`
        }
      });

      const githubUser = userResponse.data;

      // Get user email if not public
      let email = githubUser.email;
      if (!email) {
        const emailResponse = await axios.get('https://api.github.com/user/emails', {
          headers: {
            Authorization: `token ${access_token}`
          }
        });
        const primaryEmail = emailResponse.data.find(e => e.primary);
        email = primaryEmail ? primaryEmail.email : null;
      }

      if (!email) {
        return res.status(400).json({ message: 'Unable to get email from GitHub account' });
      }

      // Check if user exists
      let user = await User.findOne({ email });

      if (!user) {
        // Create new user
        user = new User({
          name: githubUser.name || githubUser.login,
          email: email,
          password: Math.random().toString(36).slice(-8), // Generate random password
          avatar: githubUser.avatar_url,
          authProvider: 'github'
        });

        await user.save();
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        message: 'GitHub login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          subscription: user.subscription,
          avatar: user.avatar,
          preferences: user.preferences
        }
      });
    } catch (oauthError) {
      console.error('GitHub OAuth error:', oauthError);
      return res.status(401).json({ message: 'Invalid authorization code' });
    }
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.status(500).json({ message: 'Server error during GitHub authentication' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        avatar: user.avatar,
        preferences: user.preferences,
        hasPro: user.hasPro(),
        dailyLimit: user.getDailyLimit()
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });

    if (user) {
      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );

      // Store reset token in user document
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      // Send email with reset link
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset - InterviewMate',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Password Reset Request</h1>
              <p>You requested a password reset for your InterviewMate account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">InterviewMate - AI-Powered Mock Interview Platform</p>
            </div>
          `
        };
        
        try {
          await transporter.sendMail(mailOptions);
          console.log(`Password reset email sent to ${email}`);
        } catch (emailError) {
          console.error('Error sending password reset email:', emailError);
        }
      } else {
        // For development - log the reset token
        console.log(`Password reset token for ${email}: ${resetToken}`);
        console.log(`Reset URL: ${process.env.FRONTEND_URL}/reset-password/${resetToken}`);
      }
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;