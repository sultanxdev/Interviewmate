import { GoogleGenerativeAI } from '@google/generative-ai';
import Report from '../../models/Report.js';
import Session from '../../models/Session.js';
import User from '../../models/User.js';

/**
 * Evaluation Service
 * Generates comprehensive session reports using Gemini
 */

class EvaluationService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.genAI = null;
        this.model = null;

        if (this.apiKey) {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: 'gemini-pro',
                generationConfig: {
                    temperature: 0.4,
                    topK: 40,
                    topP: 0.95,
                }
            });
        }
    }

    /**
     * Generate comprehensive evaluation report for a completed session
     * @param {string} sessionId - Session ID
     * @returns {Promise<object>} Report document
     */
    async generateReport(sessionId) {
        try {
            const session = await Session.findById(sessionId).populate('userId');

            if (!session) {
                throw new Error('Session not found');
            }

            if (session.status !== 'completed') {
                throw new Error('Session not completed');
            }

            // Build full transcript
            const fullTranscript = session.transcript
                .map(t => `[${t.speaker.toUpperCase()}]: ${t.text}`)
                .join('\n');

            // Generate evaluation using Gemini
            const evaluation = await this.performEvaluation(session, fullTranscript);

            // Create report document
            const report = new Report({
                sessionId: session._id,
                userId: session.userId._id,
                overallScore: evaluation.overallScore,
                skillBreakdown: evaluation.skillBreakdown,
                strengths: evaluation.strengths,
                weaknesses: evaluation.weaknesses,
                weakPatterns: evaluation.weakPatterns,
                improvementActions: evaluation.improvementActions,
                improvedResponses: evaluation.improvedResponses,
                fullTranscript,
                sessionDuration: session.actualDuration,
                interruptionsMade: session.state.interruptionCount
            });

            await report.save();

            // Update user analytics
            await this.updateUserAnalytics(session.userId._id, evaluation);

            return report;

        } catch (error) {
            console.error('Report generation error:', error);
            throw error;
        }
    }

    /**
     * Perform evaluation using Gemini
     */
    async performEvaluation(session, fullTranscript) {
        const prompt = `Analyze this communication session transcript and provide structured, detailed feedback.

**Session Details:**
- Mode: ${session.mode}
- Role: ${session.scenario.role}
- Skills evaluated: ${session.skillsToEvaluate.join(', ')}
- Duration: ${Math.floor(session.actualDuration / 60)} minutes
- Interruptions made: ${session.state.interruptionCount}
- Difficulty: ${session.difficulty}

**Full Transcript:**
${fullTranscript}

**Your task:** Provide a comprehensive evaluation in JSON format.

**Response format:**
{
  "overallScore": 75,
  "skillBreakdown": {
    "clarity": {
      "score": 70,
      "feedback": "User occasionally used vague language but improved over time..."
    },
    "structure": {
      "score": 65,
      "feedback": "Responses lacked clear framework initially..."
    },
    "confidence": {
      "score": 80,
      "feedback": "Demonstrated strong confidence throughout..."
    },
    "depth": {
      "score": 75,
      "feedback": "Provided good detail in most responses..."
    },
    "crossQuestionHandling": {
      "score": 70,
      "feedback": "Handled follow-ups reasonably well..."
    },
    "logicalConsistency": {
      "score": 80,
      "feedback": "Maintained logical flow in arguments..."
    }
  },
  "strengths": [
    "Strong opening introduction",
    "Used specific examples effectively",
    "Maintained good eye contact and posture"
  ],
  "weaknesses": [
    "Tendency to ramble under pressure",
    "Weak structure in technical explanations",
    "Overused filler words"
  ],
  "weakPatterns": [
    "Rambles when discussing technical concepts",
    "Avoids quantifying achievements",
    "Repeats 'basically' and 'like' frequently"
  ],
  "improvementActions": [
    {
      "area": "Structure",
      "priority": "high",
      "suggestion": "Use STAR method for behavioral questions",
      "example": "Situation: ..., Task: ..., Action: ..., Result: ..."
    },
    {
      "area": "Clarity",
      "priority": "medium",
      "suggestion": "Pause before answering to organize thoughts",
      "example": "Take 2-3 seconds to mentally outline your response"
    }
  ],
  "improvedResponses": [
    {
      "originalQuestion": "Tell me about a challenging project",
      "userResponse": "Um, so like, there was this project...",
      "improvedVersion": "I'd like to share a project where I led a team of 5 developers to migrate our legacy system. Situation: Our system was...",
      "explanation": "Added structure, removed fillers, started with clear topic sentence"
    }
  ]
}

**Scoring guidelines:**
- 90-100: Exceptional, professional-level
- 75-89: Strong, above average
- 60-74: Adequate, room for improvement
- 40-59: Needs work
- 0-39: Significant improvement needed

Return ONLY the JSON object, no additional text.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const evaluation = JSON.parse(cleanedText);

            return evaluation;

        } catch (error) {
            console.error('Evaluation error:', error);
            // Return default evaluation
            return {
                overallScore: 50,
                skillBreakdown: {
                    clarity: { score: 50, feedback: 'Unable to evaluate' },
                    structure: { score: 50, feedback: 'Unable to evaluate' },
                    confidence: { score: 50, feedback: 'Unable to evaluate' },
                    depth: { score: 50, feedback: 'Unable to evaluate' },
                    crossQuestionHandling: { score: 50, feedback: 'Unable to evaluate' },
                    logicalConsistency: { score: 50, feedback: 'Unable to evaluate' }
                },
                strengths: [],
                weaknesses: [],
                weakPatterns: [],
                improvementActions: [],
                improvedResponses: []
            };
        }
    }

    /**
     * Update user analytics based on session results
     */
    async updateUserAnalytics(userId, evaluation) {
        try {
            const user = await User.findById(userId);

            if (!user) return;

            // Update session count
            user.analytics.totalSessions += 1;

            // Update average score
            const totalSessions = user.analytics.totalSessions;
            const currentAvg = user.analytics.averageScore || 0;
            user.analytics.averageScore =
                (currentAvg * (totalSessions - 1) + evaluation.overallScore) / totalSessions;

            // Update skill averages
            Object.keys(evaluation.skillBreakdown).forEach(skill => {
                if (user.analytics.skillAverages[skill] !== undefined) {
                    const currentSkillAvg = user.analytics.skillAverages[skill] || 0;
                    user.analytics.skillAverages[skill] =
                        (currentSkillAvg * (totalSessions - 1) + evaluation.skillBreakdown[skill].score) / totalSessions;
                }
            });

            // Simple improvement rate calculation (if more than 1 session)
            if (totalSessions > 1) {
                // Compare current overall score to average
                const improvement = evaluation.overallScore - currentAvg;
                user.analytics.improvementRate = improvement;
            }

            user.analytics.lastUpdated = new Date();
            await user.save();

        } catch (error) {
            console.error('Failed to update user analytics:', error);
        }
    }
}

export default new EvaluationService();
