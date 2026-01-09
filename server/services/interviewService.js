import Interview from '../models/Interview.js'
import User from '../models/User.js'
import { clearUserCache } from '../middleware/cache.js'
import geminiService from '../config/gemini.js'

class InterviewService {
    async getCreateData(userId) {
        const user = await User.findById(userId)
        return {
            userPlan: user.subscription.plan,
            vapiMinutesRemaining: user.subscription.vapiMinutesRemaining,
            payAsYouGoBalance: user.subscription.payAsYouGoBalance,
            interviewTypes: ['hr', 'technical', 'managerial', 'custom'],
            experienceLevels: ['fresher', 'mid-level', 'senior', 'executive'],
            difficulties: ['easy', 'medium', 'hard'],
            durations: [5, 10, 15, 30, 45, 60]
        }
    }

    async createInterview(userId, interviewData, ip, userAgent) {
        const { type, candidateInfo, configuration, mode: reqMode } = interviewData

        // Check if user has enough VAPI minutes (only for VAPI mode)
        const user = await User.findById(userId)
        const mode = reqMode || configuration?.interviewMode || 'webspeech'

        if (mode === 'vapi') {
            if (user.subscription.plan === 'free' && user.subscription.vapiMinutesRemaining < configuration.duration) {
                throw new Error('Insufficient VAPI minutes remaining. Please upgrade to Pro plan or use Web Speech API mode.')
            }

            if (user.subscription.plan === 'pro') {
                const cost = configuration.duration * 0.5
                if (user.subscription.payAsYouGoBalance < cost) {
                    throw new Error(`Insufficient balance. Need $${cost.toFixed(2)} for ${configuration.duration} minutes. Please add funds.`)
                }
            }
        }

        const interview = await Interview.create({
            userId,
            type,
            candidateInfo,
            configuration,
            metadata: {
                ipAddress: ip,
                userAgent
            }
        })

        interview.generateVapiConfig()
        await interview.save()

        clearUserCache(userId)
        return interview
    }

    async getHistory(userId, query) {
        const page = parseInt(query.page) || 1
        const limit = parseInt(query.limit) || 10
        const skip = (page - 1) * limit

        const filter = { userId }
        if (query.type) filter.type = query.type
        if (query.status) filter.status = query.status
        if (query.startDate || query.endDate) {
            filter.createdAt = {}
            if (query.startDate) filter.createdAt.$gte = new Date(query.startDate)
            if (query.endDate) filter.createdAt.$lte = new Date(query.endDate)
        }

        const interviews = await Interview.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()

        const total = await Interview.countDocuments(filter)

        return {
            interviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }

    async getInterviewById(id, userId) {
        const interview = await Interview.findOne({ _id: id, userId })
        if (!interview) throw new Error('Interview not found')
        return interview
    }

    async updateInterview(id, userId, updateData) {
        const allowedUpdates = ['status', 'session', 'vapiConfig']
        const updates = {}
        Object.keys(updateData).forEach(key => {
            if (allowedUpdates.includes(key)) updates[key] = updateData[key]
        })

        const interview = await Interview.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true, runValidators: true }
        )
        if (!interview) throw new Error('Interview not found')
        return interview
    }

    async deleteInterview(id, userId) {
        const interview = await Interview.findOne({ _id: id, userId })
        if (!interview) throw new Error('Interview not found')
        await interview.deleteOne()
        return true
    }

    async evaluateInterview(id, userId, transcript) {
        const interview = await Interview.findOne({ _id: id, userId })
        if (!interview) throw new Error('Interview not found')

        interview.session.transcript = transcript
        interview.session.endTime = new Date()
        interview.status = 'completed'

        let evaluation
        try {
            evaluation = await geminiService.evaluateInterview(interview, transcript)
        } catch (error) {
            console.error('AI Evaluation Error:', error)
            evaluation = geminiService.getFallbackEvaluation()
        }

        interview.evaluation = evaluation

        // Update user stats
        try {
            const user = await User.findById(userId)
            if (user) {
                user.updateStats({
                    duration: interview.configuration.duration,
                    score: evaluation.overallScore
                })
                await user.save()
            }
        } catch (error) {
            console.error('Error updating user stats:', error)
        }

        await interview.save()
        clearUserCache(userId)
        return { interview, evaluation }
    }
}

export default new InterviewService()
