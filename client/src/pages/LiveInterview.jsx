/**
 * LiveInterview Component
 * 
 * This component provides the real-time interview interface with:
 * - Zoom/Google Meet-style interface
 * - Audio controls (mute/unmute)
 * - Real-time captions and transcription
 * - Interviewer persona display
 * - Adaptive question display
 * - Timer and progress tracking
 * - Support for both Lite (Web Speech) and Pro (VAPI) modes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInterview } from '../contexts/InterviewContext'
import { useAuth } from '../contexts/AuthContext'
import vapiService from '../services/vapi'
import webSpeechService from '../services/webSpeechService'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Settings,
  Maximize,
  Minimize,
  Clock,
  Activity,
  Brain,
  User,
  MessageSquare,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Loader,
  Play,
  Pause,
  SkipForward,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  INTERVIEW_MODES,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_STATUS
} from '../constants'

const LiveInterview = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getInterview, updateInterview, evaluateInterview, generateFollowUp } = useInterview()

  // Refs
  const timerRef = useRef(null)
  const transcriptRef = useRef(null)

  // Core state
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Interview session state
  const [sessionStatus, setSessionStatus] = useState('idle') // idle, initializing, active, paused, ended
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState([])
  const [transcript, setTranscript] = useState('')
  const [transcriptHistory, setTranscriptHistory] = useState([])
  const [startTime, setStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)

  // Audio/Video controls
  const [isMuted, setIsMuted] = useState(false)
  const [isVolumeOn, setIsVolumeOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // UI state
  const [showTranscript, setShowTranscript] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Service state
  const [serviceMode, setServiceMode] = useState(null)
  const [serviceConnected, setServiceConnected] = useState(false)

  /**
   * Initialize interview session
   */
  useEffect(() => {
    if (id) {
      initializeInterview()
    }
  }, [id])

  /**
   * Timer effect
   */
  useEffect(() => {
    if (sessionStatus === 'active' && startTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTime) / 1000)
        const remaining = Math.max(0, (interview?.configuration?.duration * 60) - elapsed)

        setElapsedTime(elapsed)
        setRemainingTime(remaining)

        // Auto-end interview when time is up
        if (remaining === 0) {
          handleEndInterview()
        }
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [sessionStatus, startTime, interview])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  /**
   * Load interview data
   */
  const initializeInterview = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getInterview(id)

      if (result.success) {
        const interviewData = result.interview
        setInterview(interviewData)
        setServiceMode(interviewData.configuration.interviewMode)
        setRemainingTime(interviewData.configuration.duration * 60)

        // Initialize questions
        await generateInitialQuestions(interviewData)

        console.log('Interview loaded:', interviewData)
      } else {
        setError(result.message || 'Failed to load interview')
        toast.error('Failed to load interview')
      }
    } catch (error) {
      console.error('Failed to initialize interview:', error)
      setError('Failed to initialize interview')
      toast.error('Failed to initialize interview')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Generate initial questions based on interview configuration
   */
  const generateInitialQuestions = async (interviewData) => {
    try {
      // Use custom questions if provided
      if (interviewData.configuration.customQuestions?.length > 0) {
        setQuestions(interviewData.configuration.customQuestions)
        setCurrentQuestion(interviewData.configuration.customQuestions[0])
        return
      }

      // Generate questions using AI
      const questionData = {
        interviewType: interviewData.type,
        role: interviewData.candidateInfo.role,
        company: interviewData.candidateInfo.company,
        experience: interviewData.candidateInfo.experience,
        topics: [...(interviewData.configuration.topics || []), ...(interviewData.configuration.customTopics || [])],
        difficulty: interviewData.configuration.difficulty,
        numQuestions: interviewData.configuration.numQuestions,
        jobDescription: interviewData.configuration.jobDescription
      }

      // For now, use fallback questions
      const fallbackQuestions = generateFallbackQuestions(interviewData)
      setQuestions(fallbackQuestions)
      setCurrentQuestion(fallbackQuestions[0])

    } catch (error) {
      console.error('Failed to generate questions:', error)
      const fallbackQuestions = generateFallbackQuestions(interviewData)
      setQuestions(fallbackQuestions)
      setCurrentQuestion(fallbackQuestions[0])
    }
  }

  /**
   * Generate fallback questions based on interview type
   */
  const generateFallbackQuestions = (interviewData) => {
    const baseQuestions = {
      hr: [
        "Tell me about yourself and your background.",
        "Why are you interested in this role?",
        "What are your greatest strengths?",
        "Describe a challenging situation you faced and how you handled it.",
        "How do you handle stress and pressure?",
        "Where do you see yourself in 5 years?",
        "Why do you want to work at our company?",
        "Do you have any questions for me?"
      ],
      technical: [
        "Walk me through your technical background.",
        "What programming languages are you most comfortable with?",
        "Explain a complex technical project you've worked on.",
        "How do you approach debugging a difficult problem?",
        "What's your experience with system design?",
        "How do you stay updated with new technologies?",
        "Describe your development workflow.",
        "What questions do you have about our technical stack?"
      ],
      managerial: [
        "Tell me about your leadership experience.",
        "How do you motivate your team?",
        "Describe a difficult management decision you had to make.",
        "How do you handle conflicts within your team?",
        "What's your approach to performance management?",
        "How do you prioritize tasks and projects?",
        "Describe your management style.",
        "What questions do you have about the team you'd be managing?"
      ],
      custom: [
        "Tell me about yourself.",
        "Why are you interested in this position?",
        "What are your key strengths?",
        "Describe a challenge you've overcome.",
        "How do you handle difficult situations?",
        "What are your career goals?",
        "Why should we hire you?",
        "Do you have any questions for me?"
      ]
    }

    return baseQuestions[interviewData.type] || baseQuestions.custom
  }

  /**
   * Start the interview session
   */
  const handleStartInterview = async () => {
    try {
      setSessionStatus('initializing')
      setError(null)

      // Initialize the appropriate service
      if (serviceMode === INTERVIEW_MODES.VAPI) {
        await initializeVapiService()
      } else {
        await initializeWebSpeechService()
      }

      // Update interview status
      await updateInterview(id, {
        status: INTERVIEW_STATUS.IN_PROGRESS,
        session: {
          startTime: new Date(),
          transcript: '',
          recording: {}
        }
      })

      setStartTime(Date.now())
      setSessionStatus('active')
      toast.success('Interview started!')

    } catch (error) {
      console.error('Failed to start interview:', error)
      setError('Failed to start interview')
      setSessionStatus('idle')
      toast.error('Failed to start interview')
    }
  }

  /**
   * Initialize VAPI service
   */
  const initializeVapiService = async () => {
    try {
      const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY
      if (!publicKey) {
        throw new Error('VAPI public key not configured')
      }

      const initialized = await vapiService.initialize(publicKey)
      if (!initialized) {
        throw new Error('Failed to initialize VAPI service')
      }

      // Set up VAPI callbacks
      vapiService.setCallbacks({
        onCallStart: () => {
          console.log('VAPI call started')
          setServiceConnected(true)
        },
        onCallEnd: () => {
          console.log('VAPI call ended')
          setServiceConnected(false)
          if (sessionStatus === 'active') {
            handleEndInterview()
          }
        },
        onTranscript: (transcriptData) => {
          handleTranscriptUpdate(transcriptData)
        },
        onError: (error) => {
          console.error('VAPI error:', error)
          toast.error('Voice service error. Switching to fallback mode.')
          // Switch to web speech as fallback
          setServiceMode(INTERVIEW_MODES.WEB_SPEECH)
          initializeWebSpeechService()
        }
      })

      // Start VAPI call
      const callResult = await vapiService.startCall(interview.type, {
        interviewId: id,
        candidateInfo: interview.candidateInfo,
        type: interview.type,
        difficulty: interview.configuration.difficulty
      })

      if (!callResult.success) {
        throw new Error('Failed to start VAPI call')
      }

    } catch (error) {
      console.error('VAPI initialization failed:', error)
      // Fallback to Web Speech
      toast.error('Premium voice mode unavailable. Using fallback mode.')
      setServiceMode(INTERVIEW_MODES.WEB_SPEECH)
      await initializeWebSpeechService()
    }
  }

  /**
   * Initialize Web Speech service
   */
  const initializeWebSpeechService = async () => {
    try {
      const initialized = await webSpeechService.initialize(interview.type)
      if (!initialized) {
        throw new Error('Web Speech API not supported')
      }

      // Set up Web Speech callbacks
      webSpeechService.setCallbacks({
        onTranscript: (transcriptData) => {
          handleTranscriptUpdate(transcriptData)
        },
        onSpeechStart: () => {
          console.log('User started speaking')
        },
        onSpeechEnd: (finalText) => {
          console.log('User finished speaking:', finalText)
          handleUserResponse(finalText)
        },
        onError: (error) => {
          console.error('Web Speech error:', error)
          toast.error('Speech recognition error')
        },
        shouldRestart: () => sessionStatus === 'active'
      })

      // Start the first question
      await askQuestion(currentQuestion)
      setServiceConnected(true)

    } catch (error) {
      console.error('Web Speech initialization failed:', error)
      throw error
    }
  }

  /**
   * Ask a question using the current service
   */
  const askQuestion = async (question) => {
    try {
      setIsProcessing(true)

      if (serviceMode === INTERVIEW_MODES.VAPI) {
        // VAPI handles questions automatically
        return
      } else {
        // Use Web Speech TTS
        await webSpeechService.speak(question)

        // Add to transcript
        addToTranscript('assistant', question)

        // Start listening for response
        webSpeechService.startListening()
      }
    } catch (error) {
      console.error('Failed to ask question:', error)
      toast.error('Failed to ask question')
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Handle user response (Web Speech mode)
   */
  const handleUserResponse = async (response) => {
    if (!response?.trim() || isProcessing) return

    try {
      setIsProcessing(true)
      // Add user response to transcript
      addToTranscript('user', response)

      // Generate follow-up using AI
      const followUpResult = await generateFollowUp(response, currentQuestion)

      if (followUpResult.success && !followUpResult.shouldProceed && followUpResult.followUp) {
        // AI returned a follow-up question
        toast.success('Interesting point! Let\'s dig deeper.')
        setCurrentQuestion(followUpResult.followUp)

        // Wait a bit then ask follow-up
        setTimeout(() => {
          askQuestion(followUpResult.followUp)
        }, 1500)
      } else {
        // Move to next question
        const nextIndex = questionIndex + 1
        if (nextIndex < questions.length) {
          setQuestionIndex(nextIndex)
          setCurrentQuestion(questions[nextIndex])

          // Ask next question after a brief pause
          setTimeout(() => {
            askQuestion(questions[nextIndex])
          }, 2000)
        } else {
          // Interview completed
          handleEndInterview()
        }
      }
    } catch (error) {
      console.error('Failed to handle user response:', error)
      // Fallback: just move to next question
      const nextIndex = questionIndex + 1
      if (nextIndex < questions.length) {
        setQuestionIndex(nextIndex)
        setCurrentQuestion(questions[nextIndex])
        setTimeout(() => askQuestion(questions[nextIndex]), 2000)
      } else {
        handleEndInterview()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Handle transcript updates
   */
  const handleTranscriptUpdate = (transcriptData) => {
    if (transcriptData.isFinal) {
      addToTranscript(transcriptData.role || 'user', transcriptData.text)
    } else {
      // Update live transcript for interim results
      setTranscript(transcriptData.text)
    }
  }

  /**
   * Add message to transcript history
   */
  const addToTranscript = (role, text) => {
    const timestamp = new Date()
    const entry = {
      role,
      text,
      timestamp,
      id: Date.now() + Math.random()
    }

    setTranscriptHistory(prev => [...prev, entry])
    setTranscript('') // Clear interim transcript

    // Auto-scroll transcript
    setTimeout(() => {
      if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
      }
    }, 100)
  }

  /**
   * Handle mute toggle
   */
  const handleMuteToggle = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)

    if (serviceMode === INTERVIEW_MODES.VAPI) {
      vapiService.setMuted(newMutedState)
    } else {
      webSpeechService.setMuted(newMutedState)
    }
  }

  /**
   * Handle volume toggle
   */
  const handleVolumeToggle = () => {
    const newVolumeState = !isVolumeOn
    setIsVolumeOn(newVolumeState)

    if (serviceMode === INTERVIEW_MODES.WEB_SPEECH) {
      webSpeechService.setVolume(newVolumeState ? 1 : 0)
    }
  }

  /**
   * Handle pause/resume
   */
  const handlePauseToggle = () => {
    if (sessionStatus === 'active') {
      setSessionStatus('paused')
      if (serviceMode === INTERVIEW_MODES.WEB_SPEECH) {
        webSpeechService.stopListening()
      }
      toast.success('Interview paused')
    } else if (sessionStatus === 'paused') {
      setSessionStatus('active')
      if (serviceMode === INTERVIEW_MODES.WEB_SPEECH) {
        webSpeechService.startListening()
      }
      toast.success('Interview resumed')
    }
  }

  /**
   * Skip to next question
   */
  const handleSkipQuestion = () => {
    if (questionIndex < questions.length - 1) {
      const nextIndex = questionIndex + 1
      setQuestionIndex(nextIndex)
      setCurrentQuestion(questions[nextIndex])

      if (serviceMode === INTERVIEW_MODES.WEB_SPEECH) {
        askQuestion(questions[nextIndex])
      }
    }
  }

  /**
   * End the interview
   */
  const handleEndInterview = async () => {
    try {
      setSessionStatus('ended')

      // Stop services
      cleanup()

      // Prepare final transcript
      const finalTranscript = transcriptHistory
        .map(entry => `${entry.role}: ${entry.text}`)
        .join('\n')

      // Update interview with final data
      await updateInterview(id, {
        status: INTERVIEW_STATUS.COMPLETED,
        session: {
          ...interview.session,
          endTime: new Date(),
          actualDuration: Math.floor(elapsedTime / 60),
          transcript: finalTranscript
        }
      })

      // Start evaluation
      setIsProcessing(true)
      toast.success('Interview completed! Generating evaluation...')

      const evaluationResult = await evaluateInterview(id, finalTranscript)

      if (evaluationResult.success) {
        toast.success('Evaluation completed!')
        navigate(`/interview/report/${id}`)
      } else {
        toast.error('Evaluation failed, but interview was saved')
        navigate(`/interview/report/${id}`)
      }

    } catch (error) {
      console.error('Failed to end interview:', error)
      toast.error('Failed to save interview')
      navigate('/dashboard')
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Cleanup services
   */
  const cleanup = () => {
    if (serviceMode === INTERVIEW_MODES.VAPI) {
      vapiService.cleanup()
    } else if (serviceMode === INTERVIEW_MODES.WEB_SPEECH) {
      webSpeechService.cleanup()
    }

    setServiceConnected(false)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  /**
   * Format time display
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Get interviewer persona info
   */
  const getInterviewerPersona = () => {
    const personas = {
      hr: { name: 'Sarah', title: 'HR Manager', avatar: '👩‍💼' },
      technical: { name: 'Alex', title: 'Technical Lead', avatar: '👨‍💻' },
      managerial: { name: 'Michael', title: 'Senior Manager', avatar: '👨‍💼' },
      custom: { name: 'Jordan', title: 'Interviewer', avatar: '👤' }
    }

    return personas[interview?.type] || personas.custom
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Loading interview...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Interview Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const persona = getInterviewerPersona()

  return (
    <div className={`min-h-screen bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-white">
                {INTERVIEW_TYPE_LABELS[interview?.type]} Interview
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{interview?.candidateInfo?.role}</span>
              <span>•</span>
              <span>{interview?.candidateInfo?.company}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="flex items-center space-x-2 text-white">
              <Clock className="w-4 h-4" />
              <span className="font-mono">
                {formatTime(elapsedTime)} / {formatTime(interview?.configuration?.duration * 60)}
              </span>
            </div>

            {/* Progress */}
            <div className="flex items-center space-x-2 text-white">
              <BarChart3 className="w-4 h-4" />
              <span>{questionIndex + 1} / {questions.length}</span>
            </div>

            {/* Status */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${sessionStatus === 'active' ? 'bg-green-100 text-green-800' :
              sessionStatus === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                sessionStatus === 'ended' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
              }`}>
              {sessionStatus.charAt(0).toUpperCase() + sessionStatus.slice(1)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Interview Area */}
        <div className="flex-1 flex flex-col">
          {/* Video/Avatar Area */}
          <div className="flex-1 bg-gray-800 relative">
            {/* Interviewer Persona */}
            <div className="absolute top-6 left-6 bg-gray-700 rounded-lg p-4 max-w-sm">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{persona.avatar}</div>
                <div>
                  <h3 className="font-medium text-white">{persona.name}</h3>
                  <p className="text-sm text-gray-400">{persona.title}</p>
                </div>
                {serviceConnected && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Current Question Display */}
            {currentQuestion && sessionStatus === 'active' && (
              <div className="absolute bottom-6 left-6 right-6 bg-gray-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-white">{currentQuestion}</p>
                    {isProcessing && (
                      <div className="flex items-center space-x-2 mt-2 text-gray-400">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Center Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {sessionStatus === 'idle' && (
                <div className="text-center">
                  <div className="text-6xl mb-4">{persona.avatar}</div>
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Ready to start your interview?
                  </h2>
                  <p className="text-gray-400 mb-6">
                    You'll be interviewed by {persona.name}, your {persona.title}
                  </p>
                  <button
                    onClick={handleStartInterview}
                    disabled={sessionStatus === 'initializing'}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                  >
                    {sessionStatus === 'initializing' ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Start Interview</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {sessionStatus === 'ended' && (
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Interview Completed!
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Generating your evaluation report...
                  </p>
                  {isProcessing && (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="text-gray-400">Processing evaluation...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
            <div className="flex items-center justify-center space-x-4">
              {/* Mute Button */}
              <button
                onClick={handleMuteToggle}
                disabled={sessionStatus !== 'active' && sessionStatus !== 'paused'}
                className={`p-3 rounded-full transition-colors ${isMuted
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-600 hover:bg-gray-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Volume Button */}
              <button
                onClick={handleVolumeToggle}
                disabled={sessionStatus !== 'active' && sessionStatus !== 'paused'}
                className={`p-3 rounded-full transition-colors ${!isVolumeOn
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-600 hover:bg-gray-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isVolumeOn ? (
                  <Volume2 className="w-5 h-5 text-white" />
                ) : (
                  <VolumeX className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Pause/Resume Button */}
              {(sessionStatus === 'active' || sessionStatus === 'paused') && (
                <button
                  onClick={handlePauseToggle}
                  className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
                >
                  {sessionStatus === 'paused' ? (
                    <Play className="w-5 h-5 text-white" />
                  ) : (
                    <Pause className="w-5 h-5 text-white" />
                  )}
                </button>
              )}

              {/* Skip Question Button */}
              {sessionStatus === 'active' && serviceMode === INTERVIEW_MODES.WEB_SPEECH && (
                <button
                  onClick={handleSkipQuestion}
                  disabled={questionIndex >= questions.length - 1}
                  className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>
              )}

              {/* End Interview Button */}
              {(sessionStatus === 'active' || sessionStatus === 'paused') && (
                <button
                  onClick={handleEndInterview}
                  className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <PhoneOff className="w-5 h-5 text-white" />
                </button>
              )}

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5 text-white" />
                ) : (
                  <Maximize className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Transcript Panel */}
        {showTranscript && (
          <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-medium text-white">Live Transcript</h3>
              <button
                onClick={() => setShowTranscript(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {transcriptHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg ${entry.role === 'assistant'
                    ? 'bg-blue-900/50 border-l-4 border-blue-500'
                    : 'bg-gray-700 border-l-4 border-green-500'
                    }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {entry.role === 'assistant' ? (
                      <Brain className="w-4 h-4 text-blue-400" />
                    ) : (
                      <User className="w-4 h-4 text-green-400" />
                    )}
                    <span className="text-xs text-gray-400">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white text-sm">{entry.text}</p>
                </div>
              ))}

              {/* Live transcript */}
              {transcript && (
                <div className="p-3 rounded-lg bg-gray-700 border-l-4 border-yellow-500 opacity-75">
                  <div className="flex items-center space-x-2 mb-1">
                    <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="text-xs text-gray-400">Live</span>
                  </div>
                  <p className="text-white text-sm">{transcript}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Interview Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mode
                </label>
                <p className="text-white">
                  {serviceMode === INTERVIEW_MODES.VAPI ? 'Pro Mode (VAPI)' : 'Lite Mode (Web Speech)'}
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showTranscript}
                    onChange={(e) => setShowTranscript(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-gray-300">Show transcript</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveInterview