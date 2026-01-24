import express from 'express';
import analyticsService from '../services/analytics/analyticsService.js';
import { auth } from '../middleware/auth.js';
import { query } from 'express-validator';

const router = express.Router();

/**
 * @route   GET /api/analytics/overview
 * @desc    Get comprehensive analytics overview for user
 * @access  Private
 */
router.get('/overview', auth, async (req, res) => {
    try {
        const analytics = await analyticsService.getUserAnalytics(req.user.id);
        res.json(analytics);
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
});

/**
 * @route   GET /api/analytics/skill/:skillName
 * @desc    Get detailed insights for a specific skill
 * @access  Private
 */
router.get('/skill/:skillName', auth, async (req, res) => {
    try {
        const { skillName } = req.params;

        const validSkills = ['clarity', 'structure', 'confidence', 'depth', 'crossQuestionHandling', 'logicalConsistency'];

        if (!validSkills.includes(skillName)) {
            return res.status(400).json({ message: 'Invalid skill name' });
        }

        const insights = await analyticsService.getSkillInsights(req.user.id, skillName);
        res.json(insights);

    } catch (error) {
        console.error('Get skill insights error:', error);
        res.status(500).json({ message: 'Failed to fetch skill insights' });
    }
});

export default router;
