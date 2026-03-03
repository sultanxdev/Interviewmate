import express from 'express';
import Report from '../models/Report.js';
import evaluationService from '../services/evaluation/evaluationService.js';
import { auth } from '../middleware/auth.js';
import { param } from 'express-validator';

const router = express.Router();

/**
 * @route   POST /api/report/generate/:sessionId
 * @desc    Generate report for a completed session
 * @access  Private
 */
router.post('/generate/:sessionId',
    auth,
    param('sessionId').isMongoId(),
    async (req, res) => {
        try {
            const { sessionId } = req.params;

            // Generate report
            const report = await evaluationService.generateReport(sessionId);

            res.json({
                message: 'Report generated successfully',
                reportId: report._id,
                overallScore: report.overallScore
            });

        } catch (error) {
            console.error('Generate report error:', error);
            res.status(500).json({ message: 'Failed to generate report', error: error.message });
        }
    }
);

/**
 * @route   GET /api/report/user/all
 * @desc    Get all reports for the authenticated user
 * @access  Private
 *
 * NOTE: This MUST be registered BEFORE /:reportId, otherwise Express
 * tries to match "user" as a MongoDB ObjectId and throws a CastError.
 */
router.get('/user/all', auth, async (req, res) => {
    try {
        const reports = await Report.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .select('-fullTranscript') // Exclude large transcript
            .populate('sessionId', 'mode difficulty createdAt')
            .limit(50);

        res.json({ reports, count: reports.length });

    } catch (error) {
        console.error('Get user reports error:', error);
        res.status(500).json({ message: 'Failed to fetch reports' });
    }
});

/**
 * @route   GET /api/report/session/:sessionId
 * @desc    Get report by session ID
 * @access  Private
 *
 * NOTE: Must be before /:reportId to avoid "session" being parsed as ObjectId.
 */
router.get('/session/:sessionId',
    auth,
    param('sessionId').isMongoId(),
    async (req, res) => {
        try {
            const report = await Report.findOne({ sessionId: req.params.sessionId })
                .populate('sessionId', 'mode difficulty duration');

            if (!report) {
                return res.status(404).json({ message: 'Report not found for this session' });
            }

            // Verify ownership
            if (report.userId.toString() !== req.userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            res.json(report);

        } catch (error) {
            console.error('Get report by session error:', error);
            res.status(500).json({ message: 'Failed to fetch report' });
        }
    }
);

/**
 * @route   GET /api/report/shared/:shareToken
 * @desc    Get shared report (public access)
 * @access  Public
 *
 * NOTE: Must be before /:reportId to avoid "shared" being parsed as ObjectId.
 */
router.get('/shared/:shareToken', async (req, res) => {
    try {
        const report = await Report.findOne({ shareToken: req.params.shareToken, isShared: true })
            .populate('userId', 'name')
            .populate('sessionId', 'mode difficulty duration createdAt');

        if (!report) {
            return res.status(404).json({ message: 'Shared report not found' });
        }

        // Return report without full transcript for privacy
        const publicReport = {
            ...report.toObject(),
            fullTranscript: undefined // Remove transcript from public view
        };

        res.json(publicReport);

    } catch (error) {
        console.error('Get shared report error:', error);
        res.status(500).json({ message: 'Failed to fetch shared report' });
    }
});

/**
 * @route   GET /api/report/:reportId
 * @desc    Get full report details
 * @access  Private
 */
router.get('/:reportId',
    auth,
    param('reportId').isMongoId(),
    async (req, res) => {
        try {
            const report = await Report.findById(req.params.reportId)
                .populate('sessionId', 'mode difficulty duration')
                .populate('userId', 'name email');

            if (!report) {
                return res.status(404).json({ message: 'Report not found' });
            }

            // Verify ownership (userId is populated so use ._id)
            if (report.userId._id.toString() !== req.userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            res.json(report);

        } catch (error) {
            console.error('Get report error:', error);
            res.status(500).json({ message: 'Failed to fetch report' });
        }
    }
);

/**
 * @route   POST /api/report/:reportId/share
 * @desc    Generate shareable link for report
 * @access  Private
 */
router.post('/:reportId/share',
    auth,
    param('reportId').isMongoId(),
    async (req, res) => {
        try {
            const report = await Report.findById(req.params.reportId);

            if (!report) {
                return res.status(404).json({ message: 'Report not found' });
            }

            // Verify ownership
            if (report.userId.toString() !== req.userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            // Generate share token
            const shareToken = report.generateShareToken();
            await report.save();

            res.json({
                message: 'Report shared successfully',
                shareUrl: `${process.env.CLIENT_URL}/report/shared/${shareToken}`
            });

        } catch (error) {
            console.error('Share report error:', error);
            res.status(500).json({ message: 'Failed to share report' });
        }
    }
);

export default router;
