import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import Interview from '../models/Interview.js';

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user statistics
    const totalInterviews = await Interview.countDocuments({ 
      userId: req.userId, 
      status: 'completed' 
    });

    const averageScore = await Interview.aggregate([
      { $match: { userId: req.userId, status: 'completed', overallScore: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
    ]);

    const recentInterviews = await Interview.find({ 
      userId: req.userId, 
      status: 'completed' 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('role interviewType overallScore createdAt');

    res.json({
      user,
      stats: {
        totalInterviews,
        averageScore: averageScore[0]?.avgScore || 0,
        recentInterviews
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, theme } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (theme && ['light', 'dark'].includes(theme)) user.theme = theme;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        avatar: user.avatar,
        theme: user.theme
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', auth, [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a password (not OAuth user)
    if (!user.password) {
      return res.status(400).json({ message: 'Cannot change password for OAuth users' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Upload avatar
router.post('/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar URL is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatar;
    await user.save();

    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
});

// Delete account
router.delete('/account', auth, [
  body('password').exists().withMessage('Password is required to delete account')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password for non-OAuth users
    if (user.password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
      }
    }

    // Delete user's interviews
    await Interview.deleteMany({ userId: req.userId });

    // Delete user account
    await User.findByIdAndDelete(req.userId);

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    // Get interview statistics
    const totalInterviews = await Interview.countDocuments({ 
      userId: req.userId, 
      status: 'completed' 
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyInterviews = await Interview.countDocuments({
      userId: req.userId,
      status: 'completed',
      createdAt: { $gte: thisMonth }
    });

    // Get average scores by skill
    const skillAverages = await Interview.aggregate([
      { $match: { userId: req.userId, status: 'completed', skillBreakdown: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgCommunication: { $avg: '$skillBreakdown.communication' },
          avgConfidence: { $avg: '$skillBreakdown.confidence' },
          avgTechnical: { $avg: '$skillBreakdown.technicalKnowledge' },
          avgProblemSolving: { $avg: '$skillBreakdown.problemSolving' },
          avgClarity: { $avg: '$skillBreakdown.clarity' }
        }
      }
    ]);

    // Get recent interviews
    const recentInterviews = await Interview.find({ 
      userId: req.userId, 
      status: 'completed' 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('role interviewType overallScore createdAt company');

    // Get interview type distribution
    const interviewTypes = await Interview.aggregate([
      { $match: { userId: req.userId, status: 'completed' } },
      { $group: { _id: '$interviewType', count: { $sum: 1 } } }
    ]);

    res.json({
      user,
      stats: {
        totalInterviews,
        monthlyInterviews,
        skillAverages: skillAverages[0] || {},
        recentInterviews,
        interviewTypes
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Failed to get dashboard data' });
  }
});

export default router;