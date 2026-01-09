import interviewService from '../services/interviewService.js'
import geminiService from '../config/gemini.js'
import resumeParser from '../utils/resumeParser.js'
import mongoose from 'mongoose'
import Interview from '../models/Interview.js'

export const getCreateData = async (req, res) => {
    try {
        const data = await interviewService.getCreateData(req.user.id)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch interview creation data' })
    }
}

export const createInterview = async (req, res, next) => {
    try {
        const interview = await interviewService.createInterview(
            req.user.id,
            req.body,
            req.ip,
            req.get('User-Agent')
        )
        res.status(201).json({ success: true, interview })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

export const getHistory = async (req, res, next) => {
    try {
        const result = await interviewService.getHistory(req.user.id, req.query)
        res.status(200).json({ success: true, ...result })
    } catch (error) {
        next(error)
    }
}

export const getInterviewById = async (req, res, next) => {
    try {
        const interview = await interviewService.getInterviewById(req.params.id, req.user.id)
        res.status(200).json({ success: true, interview })
    } catch (error) {
        res.status(404).json({ success: false, message: error.message })
    }
}

export const updateInterview = async (req, res, next) => {
    try {
        const interview = await interviewService.updateInterview(req.params.id, req.user.id, req.body)
        res.status(200).json({ success: true, interview })
    } catch (error) {
        res.status(404).json({ success: false, message: error.message })
    }
}

export const deleteInterview = async (req, res, next) => {
    try {
        await interviewService.deleteInterview(req.params.id, req.user.id)
        res.status(200).json({ success: true, message: 'Interview deleted successfully' })
    } catch (error) {
        res.status(404).json({ success: false, message: error.message })
    }
}

export const evaluateInterview = async (req, res, next) => {
    try {
        const result = await interviewService.evaluateInterview(req.params.id, req.user.id, req.body.transcript)
        res.status(200).json({
            success: true,
            ...result,
            message: result.evaluation.evaluationModel === 'fallback' ?
                'Interview evaluated with fallback system. AI evaluation temporarily unavailable.' :
                'Interview evaluated successfully.'
        })
    } catch (error) {
        next(error)
    }
}

// AI related controller methods
export const generateQuestions = async (req, res, next) => {
    const { jobDescription, difficulty = 'medium', count = 5 } = req.body
    try {
        const questions = await geminiService.generateQuestions(jobDescription, difficulty, count)
        res.status(200).json({ success: true, questions })
    } catch (error) {
        const fallbackQuestions = [
            { question: "Tell me about yourself and your background.", type: "behavioral" },
            { question: "Why are you interested in this role?", type: "behavioral" }
        ]
        res.status(200).json({ success: true, questions: fallbackQuestions, message: 'Using fallback questions' })
    }
}

export const evaluateGeneral = async (req, res, next) => {
    const { transcript, questions } = req.body
    try {
        const evaluation = await geminiService.evaluateInterview(transcript, questions)
        res.status(200).json({ success: true, evaluation })
    } catch (error) {
        res.status(200).json({ success: true, evaluation: geminiService.getFallbackEvaluation(), message: 'Using fallback evaluation' })
    }
}

export const generateFollowUp = async (req, res, next) => {
    const { transcript, currentQuestion } = req.body
    try {
        const followUp = await geminiService.generateFollowUp(transcript, currentQuestion)
        res.status(200).json({
            success: true,
            followUp: followUp === 'PROCEED' ? '' : followUp,
            shouldProceed: followUp === 'PROCEED'
        })
    } catch (error) {
        res.status(200).json({ success: true, followUp: '', shouldProceed: true })
    }
}

export const parseResume = async (req, res, next) => {
    const { filePath, fileName } = req.body
    if (!filePath || !fileName) return res.status(400).json({ success: false, message: 'File path and name are required' })

    try {
        const result = await resumeParser.parseResume(filePath, fileName)
        res.status(200).json({
            success: result.success,
            data: result.data,
            message: result.success ? 'Resume parsed successfully' : 'Resume parsing failed'
        })
    } catch (error) {
        next(error)
    }
}

export const resumeQuestions = async (req, res, next) => {
    const { resumeData, interviewType } = req.body
    try {
        const questions = await resumeParser.generateResumeBasedQuestions(resumeData, interviewType)
        res.status(200).json({ success: true, questions })
    } catch (error) {
        next(error)
    }
}

export const testGemini = async (req, res, next) => {
    try {
        const isWorking = await geminiService.testConnection()
        res.status(200).json({ success: isWorking, message: isWorking ? 'Gemini AI is working' : 'Gemini AI connection failed' })
    } catch (error) {
        res.status(200).json({ success: false, message: 'Gemini AI test failed', error: error.message })
    }
}

export const getAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.id
        const stats = await Interview.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalInterviews: { $sum: 1 },
                    averageScore: { $avg: '$evaluation.overallScore' },
                    totalMinutes: { $sum: '$configuration.duration' },
                    completedInterviews: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
                }
            }
        ])

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const performanceTrend = await Interview.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: thirtyDaysAgo }, status: 'completed' } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, averageScore: { $avg: '$evaluation.overallScore' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ])

        const skillBreakdown = await Interview.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
            {
                $group: {
                    _id: null,
                    communication: { $avg: '$evaluation.skillScores.communication' },
                    technicalKnowledge: { $avg: '$evaluation.skillScores.technicalKnowledge' },
                    problemSolving: { $avg: '$evaluation.skillScores.problemSolving' },
                    confidence: { $avg: '$evaluation.skillScores.confidence' },
                    clarity: { $avg: '$evaluation.skillScores.clarity' },
                    behavioral: { $avg: '$evaluation.skillScores.behavioral' }
                }
            }
        ])

        res.status(200).json({
            success: true,
            analytics: {
                overview: stats[0] || { totalInterviews: 0, averageScore: 0, totalMinutes: 0, completedInterviews: 0 },
                performanceTrend,
                skillBreakdown: skillBreakdown[0] || {}
            }
        })
    } catch (error) {
        next(error)
    }
}
