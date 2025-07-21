const express = require('express');
const Interview = require('../models/Interview');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports
// @desc    Get user's interview reports
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, role, dateRange } = req.query;
    
    const filter = { 
      userId: req.user.userId,
      status: 'completed'
    };
    
    if (type) filter.type = type;
    if (role) filter.role = new RegExp(role, 'i');
    
    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      if (dateRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    const reports = await Interview.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Interview.countDocuments(filter);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get specific report
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.userId,
      status: 'completed'
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/analytics/overview
// @desc    Get user's analytics overview
// @access  Private
router.get('/analytics/overview', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get basic stats
    const totalInterviews = await Interview.countDocuments({
      userId,
      status: 'completed'
    });
    
    // Get average score
    const scoreAggregation = await Interview.aggregate([
      { $match: { userId: req.user.userId, status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$totalScore' } } }
    ]);
    
    const averageScore = scoreAggregation.length > 0 ? scoreAggregation[0].avgScore : 0;
    
    // Get recent performance (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentInterviews = await Interview.find({
      userId,
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });
    
    // Get performance by interview type
    const performanceByType = await Interview.aggregate([
      { $match: { userId: req.user.userId, status: 'completed' } },
      { 
        $group: { 
          _id: '$type', 
          avgScore: { $avg: '$totalScore' },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    // Get skill breakdown average
    const skillAggregation = await Interview.aggregate([
      { $match: { userId: req.user.userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          communication: { $avg: '$skillBreakdown.communication' },
          technical: { $avg: '$skillBreakdown.technical' },
          problemSolving: { $avg: '$skillBreakdown.problemSolving' },
          leadership: { $avg: '$skillBreakdown.leadership' },
          cultural: { $avg: '$skillBreakdown.cultural' }
        }
      }
    ]);
    
    const skillBreakdown = skillAggregation.length > 0 ? skillAggregation[0] : {
      communication: 0,
      technical: 0,
      problemSolving: 0,
      leadership: 0,
      cultural: 0
    };
    
    delete skillBreakdown._id;

    res.json({
      totalInterviews,
      averageScore: Math.round(averageScore * 10) / 10,
      recentPerformance: recentInterviews.map(interview => ({
        date: interview.createdAt,
        score: interview.totalScore,
        type: interview.type
      })),
      performanceByType,
      skillBreakdown
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/:id/share
// @desc    Generate shareable link for report
// @access  Private
router.post('/:id/share', auth, async (req, res) => {
  try {
    const report = await Interview.findOne({
      _id: req.params.id,
      userId: req.user.userId,
      status: 'completed'
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user has pro subscription
    const user = req.userDoc;
    if (!user.isPro()) {
      return res.status(403).json({ 
        message: 'Sharing reports is a Pro feature. Please upgrade your plan.' 
      });
    }

    // In a real app, you would generate a secure shareable link
    // For now, we'll just return a mock link
    const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared-report/${report._id}`;

    res.json({
      message: 'Shareable link generated successfully',
      shareableLink,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  } catch (error) {
    console.error('Share report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;