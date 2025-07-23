import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Clock,
  MessageCircle,
  Loader2
} from 'lucide-react'

const InterviewSession = () => {
  const navigate = useNavigate()
  const [interviewSetup, setInterviewSetup] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [interviewId, setInterviewId] = useState(null)
  const [followUpQuestion, setFollowUpQuestion] = useState(null)
  const [isAnsweringFollowUp, setIsAnsweringFollowUp] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const speechSynthesisRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    // Get interview setup from sessionStorage
    const setup = sessionStorage.getItem('interviewSetup')
    if (!setup) {
      navigate('/interview/setup')
      return
    }

    setInterviewSetup(JSON.parse(setup))
    generateQuestions(JSON.parse(setup))
    setStartTime(new Date())

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (speechSynthesisRef.current) {
        speechSynthesis.cancel()
      }
    }
  }, [navigate])

  const generateQuestions = async (setup) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/api/interview/generate-questions', {
        interviewType: setup.interviewType,
        role: setup.role,
        company: setup.company,
        topics: setup.topics,
        difficulty: setup.difficulty,
        numberOfQuestions: setup.numQuestions
      })

      setQuestions(response.data.questions)
      setInterviewId(response.data.interviewId)
      
      // Speak the first question
      if (response.data.questions.length > 0) {
        speakText(response.data.questions[0].question)
      }
    } catch (error) {
      console.error('Failed to generate questions:', error)
      alert('Failed to generate interview questions. Please try again.')
      navigate('/interview/setup')
    } finally {
      setIsLoading(false)
    }
  }

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel() // Cancel any ongoing speech
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1
      
      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      
      speechSynthesis.speak(utterance)
      speechSynthesisRef.current = utterance
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await transcribeAudio(audioBlob)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob) => {
    try {
      // TODO: Implement Whisper API integration
      // For now, using a simple text input as fallback
      const transcription = prompt('Voice transcription will be implemented with Whisper API. For now, please type your answer:')
      
      if (transcription && transcription.trim()) {
        setCurrentAnswer(transcription)
        await submitAnswer(transcription)
      }
    } catch (error) {
      console.error('Transcription failed:', error)
      alert('Failed to transcribe audio. Please try again.')
    }
  }

  const submitAnswer = async (answer) => {
    try {
      setIsLoading(true)
      
      const response = await axios.post('/api/interview/submit-answer', {
        interviewId,
        questionIndex: currentQuestionIndex,
        answer: answer
      })

      if (response.data.hasFollowUp) {
        setFollowUpQuestion(response.data.followUpQuestion)
        setIsAnsweringFollowUp(true)
        speakText(response.data.followUpQuestion)
      } else {
        moveToNextQuestion()
      }
    } catch (error) {
      console.error('Failed to submit answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const submitFollowUpAnswer = async (answer) => {
    try {
      setIsLoading(true)
      
      // Submit follow-up answer (you might want to modify the API to handle this)
      await axios.post('/api/interview/submit-followup', {
        interviewId,
        questionIndex: currentQuestionIndex,
        followUpAnswer: answer
      })

      setFollowUpQuestion(null)
      setIsAnsweringFollowUp(false)
      moveToNextQuestion()
    } catch (error) {
      console.error('Failed to submit follow-up answer:', error)
      alert('Failed to submit follow-up answer. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setCurrentAnswer('')
      speakText(questions[nextIndex].question)
    } else {
      completeInterview()
    }
  }

  const completeInterview = async () => {
    try {
      setIsLoading(true)
      
      const response = await axios.post('/api/interview/complete', {
        interviewId
      })

      // Clear session storage
      sessionStorage.removeItem('interviewSetup')
      
      // Navigate to report page
      navigate(`/report/${interviewId}`)
    } catch (error) {
      console.error('Failed to complete interview:', error)
      alert('Failed to complete interview. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlayback = () => {
    if (isPlaying) {
      speechSynthesis.cancel()
      setIsPlaying(false)
    } else {
      const currentText = isAnsweringFollowUp 
        ? followUpQuestion 
        : questions[currentQuestionIndex]?.question
      if (currentText) {
        speakText(currentText)
      }
    }
  }

  if (isLoading && !questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600 dark:text-gray-300">Generating your interview questions...</p>
        </div>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Failed to load interview questions</p>
          <Button onClick={() => navigate('/interview/setup')}>
            Back to Setup
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {interviewSetup?.interviewType} Interview
              </h1>
              <span className="text-sm text-gray-500">
                {interviewSetup?.role} {interviewSetup?.company && `at ${interviewSetup.company}`}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4" />
                <span>{formatTime(elapsedTime)}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Question */}
        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-600">
                  {isAnsweringFollowUp ? 'Follow-up Question' : 'Interview Question'}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {isAnsweringFollowUp ? followUpQuestion : currentQuestion?.question}
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayback}
              className="ml-4"
            >
              {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Recording Controls */}
          <div className="text-center">
            <div className="mb-6">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white disabled:opacity-50`}
              >
                {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {isRecording ? 'Recording... Click to stop' : 'Click to start recording your answer'}
            </p>

            {/* Current Answer Display */}
            {currentAnswer && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Your Answer:</p>
                <p className="text-gray-900 dark:text-white">{currentAnswer}</p>
              </div>
            )}

            {/* Manual Text Input (Fallback) */}
            <div className="mt-6">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Or type your answer here..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={4}
              />
              <div className="flex justify-end space-x-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isAnsweringFollowUp) {
                      setFollowUpQuestion(null)
                      setIsAnsweringFollowUp(false)
                      moveToNextQuestion()
                    } else {
                      moveToNextQuestion()
                    }
                  }}
                >
                  Skip Question
                </Button>
                <Button
                  onClick={() => {
                    if (currentAnswer.trim()) {
                      if (isAnsweringFollowUp) {
                        submitFollowUpAnswer(currentAnswer)
                      } else {
                        submitAnswer(currentAnswer)
                      }
                    }
                  }}
                  disabled={!currentAnswer.trim() || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Submit Answer
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Interview Progress */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Interview Progress
          </h3>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  index === currentQuestionIndex
                    ? 'bg-indigo-50 border border-indigo-200'
                    : index < currentQuestionIndex
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === currentQuestionIndex
                      ? 'bg-indigo-600 text-white'
                      : index < currentQuestionIndex
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-sm ${
                    index === currentQuestionIndex
                      ? 'text-indigo-900 font-medium'
                      : index < currentQuestionIndex
                      ? 'text-green-900'
                      : 'text-gray-600'
                  }`}
                >
                  {question.question.substring(0, 60)}...
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default InterviewSession