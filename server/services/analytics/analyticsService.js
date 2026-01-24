import User from '../../models/User.js';
import Report from '../../models/Report.js';
import Session from '../../models/Session.js';

/**
 * Analytics Service
 * Calculates user statistics, trends, and insights
 */

class AnalyticsService {
    /**
     * Get comprehensive analytics for a user
     * @param {string} userId - User ID
     * @returns {Promise<object>} Analytics data
     */
    async getUserAnalytics(userId) {
        try {
            const user = await User.findById(userId).select('analytics tokenBalance totalTokensUsed createdAt');

            if (!user) {
                throw new Error('User not found');
            }

            // Get all user reports
            const reports = await Report.find({ userId })
                .sort({ createdAt: -1 })
                .populate('sessionId', 'mode difficulty createdAt duration')
                .limit(50);

            // Calculate skill trends (last 10 sessions)
            const recentReports = reports.slice(0, 10);
            const skillTrends = this.calculateSkillTrends(recentReports);

            // Get weakness heatmap
            const weaknessHeatmap = this.generateWeaknessHeatmap(reports);

            // Session timeline
            const sessionTimeline = await this.getSessionTimeline(userId);

            // Improvement over time
            const improvementData = this.calculateImprovement(reports);

            return {
                overview: {
                    totalSessions: user.analytics.totalSessions,
                    averageScore: Math.round(user.analytics.averageScore * 10) / 10,
                    improvementRate: user.analytics.improvementRate,
                    tokenBalance: user.tokenBalance,
                    totalTokensUsed: user.totalTokensUsed,
                    memberSince: user.createdAt
                },
                skillAverages: user.analytics.skillAverages,
                skillTrends,
                weaknessHeatmap,
                sessionTimeline,
                improvementData,
                recentReports: reports.slice(0, 5).map(r => ({
                    id: r._id,
                    overallScore: r.overallScore,
                    mode: r.sessionId?.mode,
                    createdAt: r.createdAt
                }))
            };

        } catch (error) {
            console.error('Get user analytics error:', error);
            throw error;
        }
    }

    /**
     * Calculate skill trends over time
     */
    calculateSkillTrends(reports) {
        const skills = ['clarity', 'structure', 'confidence', 'depth', 'crossQuestionHandling', 'logicalConsistency'];
        const trends = {};

        skills.forEach(skill => {
            trends[skill] = reports.map(report => ({
                date: report.createdAt,
                score: report.skillBreakdown[skill]?.score || 0
            })).reverse();
        });

        return trends;
    }

    /**
     * Generate weakness heatmap
     */
    generateWeaknessHeatmap(reports) {
        const weaknessCount = {};

        reports.forEach(report => {
            report.weakPatterns?.forEach(pattern => {
                weaknessCount[pattern] = (weaknessCount[pattern] || 0) + 1;
            });
        });

        // Convert to array and sort by frequency
        return Object.entries(weaknessCount)
            .map(([pattern, count]) => ({ pattern, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    /**
     * Get session timeline
     */
    async getSessionTimeline(userId) {
        const sessions = await Session.find({ userId, status: 'completed' })
            .sort({ createdAt: 1 })
            .select('mode difficulty createdAt actualDuration')
            .limit(50);

        return sessions.map(s => ({
            id: s._id,
            mode: s.mode,
            difficulty: s.difficulty,
            date: s.createdAt,
            duration: s.actualDuration
        }));
    }

    /**
     * Calculate improvement over time
     */
    calculateImprovement(reports) {
        if (reports.length < 2) {
            return { trend: 'insufficient_data', changePercent: 0 };
        }

        const sortedReports = [...reports].sort((a, b) => a.createdAt - b.createdAt);

        // Compare first 3 vs last 3 sessions
        const firstThree = sortedReports.slice(0, 3);
        const lastThree = sortedReports.slice(-3);

        const avgFirst = firstThree.reduce((sum, r) => sum + r.overallScore, 0) / firstThree.length;
        const avgLast = lastThree.reduce((sum, r) => sum + r.overallScore, 0) / lastThree.length;

        const changePercent = ((avgLast - avgFirst) / avgFirst) * 100;

        return {
            trend: changePercent > 5 ? 'improving' : changePercent < -5 ? 'declining' : 'stable',
            changePercent: Math.round(changePercent * 10) / 10,
            firstAverage: Math.round(avgFirst * 10) / 10,
            lastAverage: Math.round(avgLast * 10) / 10
        };
    }

    /**
     * Get skill-specific insights
     */
    async getSkillInsights(userId, skillName) {
        const reports = await Report.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);

        const skillData = reports.map(r => ({
            date: r.createdAt,
            score: r.skillBreakdown[skillName]?.score || 0,
            feedback: r.skillBreakdown[skillName]?.feedback || ''
        })).reverse();

        const latestScore = skillData[skillData.length - 1]?.score || 0;
        const averageScore = skillData.reduce((sum, d) => sum + d.score, 0) / skillData.length;

        return {
            skillName,
            latestScore: Math.round(latestScore * 10) / 10,
            averageScore: Math.round(averageScore * 10) / 10,
            history: skillData,
            trend: latestScore > averageScore ? 'improving' : 'needs_work'
        };
    }
}

export default new AnalyticsService();
