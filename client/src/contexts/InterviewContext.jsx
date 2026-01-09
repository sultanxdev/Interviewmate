import React, { createContext, useContext, useState } from 'react'
import { apiService, handleApiResponse } from '../services/api'
import toast from 'react-hot-toast'

const InterviewContext = createContext()

export const useInterview = () => {
  const context = useContext(InterviewContext)
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider')
  }
  return context
}

export const InterviewProvider = ({ children }) => {
  const [currentInterview, setCurrentInterview] = useState(null)
  const [interviewHistory, setInterviewHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const createInterview = React.useCallback(async (interviewData) => {
    try {
      setLoading(true)
      const result = await handleApiResponse(() => apiService.interview.create(interviewData))

      if (result.success) {
        setCurrentInterview(result.data.interview)
        toast.success('Interview created successfully!')
        return { success: true, interview: result.data.interview }
      } else {
        return { success: false, message: result.error }
      }
    } catch (error) {
      const message = error.message || 'Failed to create interview'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  const getInterview = React.useCallback(async (interviewId) => {
    try {
      setLoading(true)
      const result = await handleApiResponse(() => apiService.interview.getById(interviewId))

      if (result.success) {
        setCurrentInterview(result.data.interview)
        return { success: true, interview: result.data.interview }
      } else {
        return { success: false, message: result.error }
      }
    } catch (error) {
      const message = error.message || 'Failed to fetch interview'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateInterview = React.useCallback(async (interviewId, updateData) => {
    try {
      const result = await handleApiResponse(() => apiService.interview.update(interviewId, updateData))

      if (result.success) {
        setCurrentInterview(result.data.interview)
        return { success: true, interview: result.data.interview }
      } else {
        return { success: false, message: result.error }
      }
    } catch (error) {
      const message = error.message || 'Failed to update interview'
      return { success: false, message }
    }
  }, [])

  const evaluateInterview = React.useCallback(async (interviewId, transcript) => {
    try {
      setLoading(true)
      const result = await handleApiResponse(() => apiService.interview.evaluate(interviewId, transcript))

      if (result.success) {
        setCurrentInterview(result.data.interview)
        toast.success('Interview evaluated successfully!')
        return { success: true, evaluation: result.data.evaluation }
      } else {
        return { success: false, message: result.error }
      }
    } catch (error) {
      const message = error.message || 'Failed to evaluate interview'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  const getInterviewHistory = React.useCallback(async (params = {}) => {
    try {
      setLoading(true)
      const result = await handleApiResponse(() => apiService.interview.getHistory(params))

      if (result.success) {
        setInterviewHistory(result.data.interviews)
        return {
          success: true,
          interviews: result.data.interviews,
          pagination: result.data.pagination
        }
      } else {
        // Handle rate limiting specifically
        if (result.error?.includes('429') || result.error?.includes('Too many')) {
          return { success: false, message: 'Please wait a moment before refreshing the data.' }
        }
        return { success: false, message: result.error }
      }
    } catch (error) {
      let message = error.message || 'Failed to fetch interview history'

      // Handle rate limiting errors
      if (error.response?.status === 429 || message.includes('429')) {
        message = 'Please wait a moment before refreshing the data.'
      }

      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteInterview = React.useCallback(async (interviewId) => {
    try {
      const result = await handleApiResponse(() => apiService.interview.delete(interviewId))

      if (result.success) {
        setInterviewHistory(prev => prev.filter(interview => interview._id !== interviewId))
        toast.success('Interview deleted successfully!')
        return { success: true }
      } else {
        return { success: false, message: result.error }
      }
    } catch (error) {
      const message = error.message || 'Failed to delete interview'
      return { success: false, message }
    }
  }, [])

  const getAnalytics = React.useCallback(async () => {
    try {
      const result = await handleApiResponse(() => apiService.interview.getAnalytics())

      if (result.success) {
        return { success: true, analytics: result.data.analytics }
      } else {
        // Handle rate limiting specifically
        if (result.error?.includes('429') || result.error?.includes('Too many')) {
          return { success: false, message: 'Please wait a moment before refreshing the data.' }
        }
        return { success: false, message: result.error }
      }
    } catch (error) {
      let message = error.message || 'Failed to fetch analytics'

      // Handle rate limiting errors
      if (error.response?.status === 429 || message.includes('429')) {
        message = 'Please wait a moment before refreshing the data.'
      }

      return { success: false, message }
    }
  }, [])

  const generateFollowUp = React.useCallback(async (transcript, currentQuestion) => {
    try {
      const result = await handleApiResponse(() =>
        apiService.interview.generateFollowup({ transcript, currentQuestion })
      )

      if (result.success) {
        return {
          success: true,
          followUp: result.data.followUp,
          shouldProceed: result.data.shouldProceed
        }
      } else {
        return { success: false, message: result.error }
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }, [])

  const value = React.useMemo(() => ({
    currentInterview,
    interviewHistory,
    loading,
    createInterview,
    getInterview,
    updateInterview,
    evaluateInterview,
    getInterviewHistory,
    deleteInterview,
    getAnalytics,
    generateFollowUp,
    setCurrentInterview
  }), [
    currentInterview,
    interviewHistory,
    loading,
    createInterview,
    getInterview,
    updateInterview,
    evaluateInterview,
    getInterviewHistory,
    deleteInterview,
    getAnalytics,
    generateFollowUp,
    setCurrentInterview
  ])

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  )
}