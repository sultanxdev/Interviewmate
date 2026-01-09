/**
 * InterviewSetupForm Component
 * 
 * This component provides a comprehensive form for setting up interviews
 * with all the features specified in the InterviewMate requirements:
 * - Candidate details with resume upload
 * - Interview context configuration
 * - Mode selection (Lite/Pro)
 * - Topics and difficulty settings
 * - Duration and question count
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInterview } from '../../contexts/InterviewContext'
import { apiService, handleApiResponse } from '../../services/api'
import toast from 'react-hot-toast'
import {
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPE_DESCRIPTIONS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LEVEL_LABELS,
  INTERVIEW_MODES,
  INTERVIEW_MODE_LABELS,
  INTERVIEW_MODE_DESCRIPTIONS,
  DURATION_OPTIONS,
  QUESTION_COUNT_OPTIONS,
  INTERVIEW_TOPICS,
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES
} from '../../constants'
import {
  User,
  Building2,
  FileText,
  Upload,
  Settings,
  Clock,
  HelpCircle,
  Zap,
  Globe,
  Brain,
  DollarSign,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2
} from 'lucide-react'

const InterviewSetupForm = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createInterview } = useInterview()

  // Form state
  const [formData, setFormData] = useState({
    // Candidate Details
    candidateInfo: {
      name: user?.name || '',
      role: '',
      company: '',
      experience: EXPERIENCE_LEVELS.MID_LEVEL,
      skills: [],
      resume: null,
      jobDescription: null
    },
    // Interview Context
    type: INTERVIEW_TYPES.HR,
    // Interview Configuration
    configuration: {
      interviewMode: INTERVIEW_MODES.WEB_SPEECH,
      topics: [],
      customTopics: [],
      difficulty: DIFFICULTY_LEVELS.MEDIUM,
      numQuestions: 10,
      duration: 15,
      customQuestions: [],
      jobDescription: '',
      language: 'en'
    }
  })

  // UI state
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [customTopicInput, setCustomTopicInput] = useState('')
  const [customQuestionInput, setCustomQuestionInput] = useState('')
  const [errors, setErrors] = useState({})

  // Available topics based on interview type
  const availableTopics = INTERVIEW_TOPICS[formData.type] || []

  // Calculate cost for VAPI mode
  const vapiCost = formData.configuration.interviewMode === INTERVIEW_MODES.VAPI
    ? formData.configuration.duration * 0.5
    : 0

  // Check if user has sufficient minutes/balance
  const canAffordVapi = user?.subscription?.plan === 'free'
    ? user.subscription.vapiMinutesRemaining >= formData.configuration.duration
    : user?.subscription?.payAsYouGoBalance >= vapiCost

  // Check for pre-filled role from onboarding
  useEffect(() => {
    const targetRole = sessionStorage.getItem('targetRole')
    if (targetRole) {
      setFormData(prev => ({
        ...prev,
        candidateInfo: {
          ...prev.candidateInfo,
          role: targetRole
        }
      }))
      // Optional: Clear it so it doesn't persist forever
      sessionStorage.removeItem('targetRole')
    }
  }, [])

  /**
   * Handle form field changes
   */
  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))

    // Clear errors for this field
    if (errors[`${section}.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: null
      }))
    }
  }

  /**
   * Handle file uploads (resume, job description, custom questions)
   */
  const handleFileUpload = async (fileType, file) => {
    if (!file) return

    // Validate file size
    const maxSize = FILE_SIZE_LIMITS[fileType.toUpperCase()]
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`)
      return
    }

    // Validate file type
    const allowedTypes = ALLOWED_FILE_TYPES[fileType.toUpperCase()]
    const fileExtension = file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      toast.error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`)
      return
    }

    try {
      setUploadProgress(prev => ({ ...prev, [fileType]: 0 }))

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('type', fileType)

      const result = await handleApiResponse(() =>
        apiService.upload[fileType](formDataUpload)
      )

      if (result.success) {
        // Update form data with uploaded file info
        if (fileType === 'resume') {
          handleInputChange('candidateInfo', 'resume', {
            filename: file.name,
            path: result.data.filePath,
            uploadDate: new Date(),
            parsedData: result.data.parsedData
          })

          // Auto-fill skills if resume was parsed
          if (result.data.parsedData?.skills) {
            handleInputChange('candidateInfo', 'skills', result.data.parsedData.skills)
          }
        } else if (fileType === 'jobDescription') {
          handleInputChange('candidateInfo', 'jobDescription', {
            filename: file.name,
            path: result.data.filePath,
            uploadDate: new Date()
          })

          // Auto-fill job description text
          if (result.data.extractedText) {
            handleInputChange('configuration', 'jobDescription', result.data.extractedText)
          }
        }

        toast.success('File uploaded successfully!')
      } else {
        toast.error(result.error || 'File upload failed')
      }
    } catch (error) {
      console.error('File upload error:', error)
      toast.error('File upload failed')
    } finally {
      setUploadProgress(prev => ({ ...prev, [fileType]: null }))
    }
  }

  /**
   * Add custom topic
   */
  const addCustomTopic = () => {
    if (customTopicInput.trim() && !formData.configuration.customTopics.includes(customTopicInput.trim())) {
      handleInputChange('configuration', 'customTopics', [
        ...formData.configuration.customTopics,
        customTopicInput.trim()
      ])
      setCustomTopicInput('')
    }
  }

  /**
   * Remove custom topic
   */
  const removeCustomTopic = (topic) => {
    handleInputChange('configuration', 'customTopics',
      formData.configuration.customTopics.filter(t => t !== topic)
    )
  }

  /**
   * Add custom question
   */
  const addCustomQuestion = () => {
    if (customQuestionInput.trim()) {
      handleInputChange('configuration', 'customQuestions', [
        ...formData.configuration.customQuestions,
        customQuestionInput.trim()
      ])
      setCustomQuestionInput('')
    }
  }

  /**
   * Remove custom question
   */
  const removeCustomQuestion = (index) => {
    handleInputChange('configuration', 'customQuestions',
      formData.configuration.customQuestions.filter((_, i) => i !== index)
    )
  }

  /**
   * Handle topic selection
   */
  const handleTopicToggle = (topic) => {
    const currentTopics = formData.configuration.topics
    const isSelected = currentTopics.includes(topic)

    if (isSelected) {
      handleInputChange('configuration', 'topics', currentTopics.filter(t => t !== topic))
    } else {
      handleInputChange('configuration', 'topics', [...currentTopics, topic])
    }
  }

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {}

    // Validate candidate info
    if (!formData.candidateInfo.name.trim()) {
      newErrors['candidateInfo.name'] = 'Candidate name is required'
    }
    if (!formData.candidateInfo.role.trim()) {
      newErrors['candidateInfo.role'] = 'Role is required'
    }
    if (!formData.candidateInfo.company.trim()) {
      newErrors['candidateInfo.company'] = 'Company is required'
    }

    // Validate configuration
    if (formData.configuration.duration < 5 || formData.configuration.duration > 60) {
      newErrors['configuration.duration'] = 'Duration must be between 5 and 60 minutes'
    }
    if (formData.configuration.numQuestions < 5 || formData.configuration.numQuestions > 20) {
      newErrors['configuration.numQuestions'] = 'Number of questions must be between 5 and 20'
    }

    // Validate VAPI mode requirements
    if (formData.configuration.interviewMode === INTERVIEW_MODES.VAPI && !canAffordVapi) {
      newErrors['configuration.interviewMode'] = 'Insufficient balance for VAPI mode'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors and try again')
      return
    }

    try {
      setLoading(true)

      const result = await createInterview(formData)

      if (result.success) {
        toast.success('Interview created successfully!')
        navigate(`/interview/live/${result.interview._id}`)
      } else {
        toast.error(result.message || 'Failed to create interview')
      }
    } catch (error) {
      console.error('Interview creation error:', error)
      toast.error('Failed to create interview')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step navigation
   */
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Setup Your Interview
        </h1>
        <p className="text-gray-600">
          Configure your personalized interview experience
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { step: 1, title: 'Candidate Details', icon: User },
            { step: 2, title: 'Interview Context', icon: Settings },
            { step: 3, title: 'Configuration', icon: Brain }
          ].map(({ step, title, icon: Icon }) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= step
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-400'
                }`}>
                {currentStep > step ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= step ? 'text-blue-600' : 'text-gray-400'
                }`}>
                {title}
              </span>
              {step < 3 && (
                <div className={`w-16 h-0.5 mx-4 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Candidate Details */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Candidate Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Candidate Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  value={formData.candidateInfo.name}
                  onChange={(e) => handleInputChange('candidateInfo', 'name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors['candidateInfo.name'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter candidate name"
                />
                {errors['candidateInfo.name'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['candidateInfo.name']}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <input
                  type="text"
                  value={formData.candidateInfo.role}
                  onChange={(e) => handleInputChange('candidateInfo', 'role', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors['candidateInfo.role'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="e.g., Backend Developer, Data Scientist"
                />
                {errors['candidateInfo.role'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['candidateInfo.role']}</p>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.candidateInfo.company}
                  onChange={(e) => handleInputChange('candidateInfo', 'company', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors['candidateInfo.company'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="e.g., TCS, Amazon, Google"
                />
                {errors['candidateInfo.company'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['candidateInfo.company']}</p>
                )}
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.candidateInfo.experience}
                  onChange={(e) => handleInputChange('candidateInfo', 'experience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* File Uploads */}
            <div className="mt-6 space-y-4">
              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Resume (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload('resume', e.target.files[0])}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload resume or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, DOC, DOCX up to 10MB
                      </p>
                    </div>
                  </label>
                  {formData.candidateInfo.resume && (
                    <div className="mt-2 p-2 bg-green-50 rounded flex items-center justify-between">
                      <span className="text-sm text-green-700">
                        {formData.candidateInfo.resume.filename}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInputChange('candidateInfo', 'resume', null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Job Description (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => handleFileUpload('jobDescription', e.target.files[0])}
                    className="hidden"
                    id="jd-upload"
                  />
                  <label htmlFor="jd-upload" className="cursor-pointer">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload job description
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, DOC, DOCX, TXT up to 5MB
                      </p>
                    </div>
                  </label>
                  {formData.candidateInfo.jobDescription && (
                    <div className="mt-2 p-2 bg-green-50 rounded flex items-center justify-between">
                      <span className="text-sm text-green-700">
                        {formData.candidateInfo.jobDescription.filename}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInputChange('candidateInfo', 'jobDescription', null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Interview Context */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Interview Context
            </h2>

            {/* Interview Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interview Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(INTERVIEW_TYPE_LABELS).map(([type, label]) => (
                  <div
                    key={type}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.type === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => handleInputChange('', 'type', type)}
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{label}</h3>
                    <p className="text-sm text-gray-600">
                      {INTERVIEW_TYPE_DESCRIPTIONS[type]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Description Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description (Optional)
              </label>
              <textarea
                value={formData.configuration.jobDescription}
                onChange={(e) => handleInputChange('configuration', 'jobDescription', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste job description here or upload a file above..."
              />
            </div>

            {/* Topics Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Focus Topics
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicToggle(topic)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${formData.configuration.topics.includes(topic)
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Topics */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Topics
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add custom topic (e.g., React.js, Node.js)"
                />
                <button
                  type="button"
                  onClick={addCustomTopic}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.configuration.customTopics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.configuration.customTopics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => removeCustomTopic(topic)}
                        className="ml-2 text-green-500 hover:text-green-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Questions (Optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={customQuestionInput}
                  onChange={(e) => setCustomQuestionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQuestion())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a custom question"
                />
                <button
                  type="button"
                  onClick={addCustomQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.configuration.customQuestions.length > 0 && (
                <div className="space-y-2">
                  {formData.configuration.customQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="flex-1 text-sm text-gray-700">{question}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomQuestion(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Configuration */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Interview Configuration
            </h2>

            {/* Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interview Mode
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Web Speech Mode */}
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.configuration.interviewMode === INTERVIEW_MODES.WEB_SPEECH
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => handleInputChange('configuration', 'interviewMode', INTERVIEW_MODES.WEB_SPEECH)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="font-medium text-gray-900">Lite Mode</h3>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      FREE
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Browser-based speech recognition with AI-generated questions
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Unlimited usage</li>
                    <li>• Basic Q&A with captions</li>
                    <li>• AI evaluation included</li>
                  </ul>
                </div>

                {/* VAPI Mode */}
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.configuration.interviewMode === INTERVIEW_MODES.VAPI
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => handleInputChange('configuration', 'interviewMode', INTERVIEW_MODES.VAPI)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Zap className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-900">Pro Mode</h3>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      ₹{vapiCost}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Real-time adaptive AI interviewer with natural conversation
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Natural conversation flow</li>
                    <li>• Adaptive questioning</li>
                    <li>• Premium AI evaluation</li>
                  </ul>

                  {/* Balance Check */}
                  {formData.configuration.interviewMode === INTERVIEW_MODES.VAPI && (
                    <div className="mt-3 p-2 rounded bg-gray-50">
                      {canAffordVapi ? (
                        <div className="flex items-center text-green-600 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {user?.subscription?.plan === 'free'
                            ? `${user.subscription.vapiMinutesRemaining} minutes remaining`
                            : `₹${user.subscription.payAsYouGoBalance} balance available`
                          }
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Insufficient balance. Please upgrade or add funds.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Configuration Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={formData.configuration.difficulty}
                  onChange={(e) => handleInputChange('configuration', 'difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(DIFFICULTY_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  value={formData.configuration.duration}
                  onChange={(e) => handleInputChange('configuration', 'duration', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors['configuration.duration'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  {DURATION_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors['configuration.duration'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['configuration.duration']}</p>
                )}
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <select
                  value={formData.configuration.numQuestions}
                  onChange={(e) => handleInputChange('configuration', 'numQuestions', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors['configuration.numQuestions'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  {QUESTION_COUNT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors['configuration.numQuestions'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['configuration.numQuestions']}</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Interview Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <p className="font-medium">{INTERVIEW_TYPE_LABELS[formData.type]}</p>
                </div>
                <div>
                  <span className="text-gray-600">Mode:</span>
                  <p className="font-medium">{INTERVIEW_MODE_LABELS[formData.configuration.interviewMode]}</p>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <p className="font-medium">{formData.configuration.duration} minutes</p>
                </div>
                <div>
                  <span className="text-gray-600">Questions:</span>
                  <p className="font-medium">{formData.configuration.numQuestions}</p>
                </div>
              </div>
              {formData.configuration.interviewMode === INTERVIEW_MODES.VAPI && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium text-blue-600 ml-1">₹{vapiCost}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !canAffordVapi && formData.configuration.interviewMode === INTERVIEW_MODES.VAPI}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${loading || (!canAffordVapi && formData.configuration.interviewMode === INTERVIEW_MODES.VAPI)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
                } text-white`}
            >
              {loading ? 'Creating Interview...' : 'Start Interview'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default InterviewSetupForm