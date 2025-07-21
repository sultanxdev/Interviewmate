const express = require('express');
const User = require('../models/User');
const Interview = require('../models/Interview');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

const router = express.Router();

// Admin middleware
const isAdmin = async (req, res, next) => {
  try {
    const user = req.userDoc;
    
    // Check if user is an admin
    // In a real app, you would have an isAdmin field in the user model
    // For now, we'll use a hardcoded admin email
    if (user.email === process.env.ADMIN_EMAIL || user.email === 'admin@interviewmate.com') {
      return next();
    }
    
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      };
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user by ID
// @access  Admin
router.get('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Admin
router.put('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, subscription, subscriptionExpiry } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (subscription) user.subscription = subscription;
    if (subscriptionExpiry) user.subscriptionExpiry = subscriptionExpiry;
    
    await user.save();
    
    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/dashboard', auth, isAdmin, async (req, res) => {
  try {
    // Get user stats
    const totalUsers = await User.countDocuments();
    const proUsers = await User.countDocuments({ subscription: 'pro' });
    
    // Get interview stats
    const totalInterviews = await Interview.countDocuments();
    const completedInterviews = await Interview.countDocuments({ status: 'completed' });
    
    // Get payment stats
    const totalPayments = await Payment.countDocuments({ status: 'paid' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get recent users
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent payments
    const recentPayments = await Payment.find({ status: 'paid' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email');
    
    res.json({
      userStats: {
        total: totalUsers,
        pro: proUsers,
        free: totalUsers - proUsers
      },
      interviewStats: {
        total: totalInterviews,
        completed: completedInterviews,
        inProgress: totalInterviews - completedInterviews
      },
      paymentStats: {
        total: totalPayments,
        revenue: totalRevenue.length > 0 ? totalRevenue[0].total / 100 : 0 // Convert from paise to rupees
      },
      recentUsers,
      recentPayments
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/feedback-templates
// @desc    Get feedback templates
// @access  Admin
router.get('/feedback-templates', auth, isAdmin, async (req, res) => {
  try {
    // In a real app, you would store feedback templates in the database
    // For now, we'll return mock templates
    const templates = [
      {
        id: '1',
        name: 'Technical Interview - Positive',
        template: 'Your answer demonstrates a strong understanding of [topic]. You provided clear explanations and good examples. Consider [suggestion] to further improve your response.'
      },
      {
        id: '2',
        name: 'Technical Interview - Negative',
        template: 'Your answer shows some understanding of [topic], but lacks depth. Try to provide more specific examples and technical details. Consider [suggestion] to improve your response.'
      },
      {
        id: '3',
        name: 'HR Interview - Positive',
        template: 'Your response was well-structured and showed good self-awareness. You effectively communicated your [strength/experience]. To further improve, consider [suggestion].'
      },
      {
        id: '4',
        name: 'HR Interview - Negative',
        template: 'Your response could be more focused and structured. Try to use the STAR method (Situation, Task, Action, Result) when describing your experiences. Consider [suggestion] to improve.'
      }
    ];
    
    res.json({ templates });
  } catch (error) {
    console.error('Get feedback templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/feedback-templates
// @desc    Create feedback template
// @access  Admin
router.post('/feedback-templates', auth, isAdmin, async (req, res) => {
  try {
    const { name, template } = req.body;
    
    // In a real app, you would store the template in the database
    // For now, we'll just return a success message
    
    res.status(201).json({
      message: 'Feedback template created successfully',
      template: {
        id: Date.now().toString(),
        name,
        template
      }
    });
  } catch (error) {
    console.error('Create feedback template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/payments
// @desc    Get all payments
// @access  Admin
router.get('/payments', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payment.countDocuments(query);
    
    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Admin
router.get('/analytics', auth, isAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get user growth
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get interview completion rates
    const interviewStats = await Interview.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get revenue over time
    const revenueOverTime = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      userGrowth,
      interviewStats,
      revenueOverTime: revenueOverTime.map(item => ({
        ...item,
        revenue: item.revenue / 100 // Convert from paise to rupees
      }))
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;