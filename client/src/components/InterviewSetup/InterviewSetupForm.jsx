import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInterview } from '../../contexts/InterviewContext'
import { apiService, handleApiResponse } from '../../services/api'
import toast from 'react-hot-toast'
import {
  INTERVIEW_TYPES,
  EXPERIENCE_LEVELS,
  INTERVIEW_MODES,
  DURATION_OPTIONS,
  QUESTION_COUNT_OPTIONS,
  DIFFICULTY_LEVEL_LABELS,
  INTERVIEW_TOPICS,
  FILE_UPLOAD,
  ALLOWED_FILE_TYPES
} from '../../constants'
import {
  Brain,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

// Sub-components - FIXED PATHS
import CandidateDetailsStep from '../../features/InterviewSetup/components/steps/CandidateDetailsStep'
import InterviewContextStep from '../../features/InterviewSetup/components/steps/InterviewContextStep'
import LogicConfigurationStep from '../../features/InterviewSetup/components/steps/LogicConfigurationStep'

const InterviewSetupForm = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createInterview } = useInterview()

  // Form state
  const [formData, setFormData] = useState({
    candidateInfo: {
      name: user?.name || '',
      role: '',
      company: '',
      experience: EXPERIENCE_LEVELS.MID_LEVEL,
      skills: [],
      resume: null,
      jobDescription: null
    },
    type: INTERVIEW_TYPES.HR,
    configuration: {
      interviewMode: INTERVIEW_MODES.WEB_SPEECH,
      topics: [],
      customTopics: [],
      difficulty: 'medium',
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

  const availableTopics = INTERVIEW_TOPICS[formData.type] || []
  const vapiCost = formData.configuration.interviewMode === INTERVIEW_MODES.VAPI
    ? formData.configuration.duration * 0.5
    : 0

  const canAffordVapi = user?.subscription?.plan === 'free'
    ? user.subscription.vapiMinutesRemaining >= formData.configuration.duration
    : user?.subscription?.payAsYouGoBalance >= vapiCost

  useEffect(() => {
    const targetRole = sessionStorage.getItem('targetRole')
    if (targetRole) {
      setFormData(prev => ({
        ...prev,
        candidateInfo: { ...prev.candidateInfo, role: targetRole }
      }))
      sessionStorage.removeItem('targetRole')
    }
  }, [])

  const handleInputChange = (section, field, value) => {
    if (!section) {
      setFormData(prev => ({ ...prev, [field]: value }))
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }))
    }
    const errorKey = section ? `${section}.${field}` : field
    if (errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: null }))
  }

  const handleFileUpload = async (fileType, file) => {
    if (!file) return

    const maxSize = FILE_UPLOAD.MAX_SIZE
    if (file.size > maxSize) {
      toast.error(`File size exceeds limit`)
      return
    }

    // Check if type is allowed
    const allowedTypes = ALLOWED_FILE_TYPES[fileType.toUpperCase()]
    const fileExtension = file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      toast.error(`Invalid file type`)
      return
    }

    try {
      setUploadProgress(prev => ({ ...prev, [fileType]: 0 }))
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('type', fileType)

      const result = await handleApiResponse(() => apiService.upload[fileType](formDataUpload))

      if (result.success) {
        if (fileType === 'resume') {
          handleInputChange('candidateInfo', 'resume', { filename: file.name, path: result.data.filePath, uploadDate: new Date(), parsedData: result.data.parsedData })
          if (result.data.parsedData?.skills) handleInputChange('candidateInfo', 'skills', result.data.parsedData.skills)
        } else if (fileType === 'jobDescription') {
          handleInputChange('candidateInfo', 'jobDescription', { filename: file.name, path: result.data.filePath, uploadDate: new Date() })
          if (result.data.extractedText) handleInputChange('configuration', 'jobDescription', result.data.extractedText)
        }
        toast.success('File uploaded!')
      }
    } catch (error) {
      toast.error('File upload failed')
    } finally {
      setUploadProgress(prev => ({ ...prev, [fileType]: null }))
    }
  }

  const handleTopicToggle = (topic) => {
    const currentTopics = formData.configuration.topics
    const isSelected = currentTopics.includes(topic)
    handleInputChange('configuration', 'topics', isSelected ? currentTopics.filter(t => t !== topic) : [...currentTopics, topic])
  }

  const addCustomTopic = () => {
    if (customTopicInput.trim() && !formData.configuration.customTopics.includes(customTopicInput.trim())) {
      handleInputChange('configuration', 'customTopics', [...formData.configuration.customTopics, customTopicInput.trim()])
      setCustomTopicInput('')
    }
  }

  const removeCustomTopic = (topic) => {
    handleInputChange('configuration', 'customTopics', formData.configuration.customTopics.filter(t => t !== topic))
  }

  const addCustomQuestion = () => {
    if (customQuestionInput.trim()) {
      handleInputChange('configuration', 'customQuestions', [...formData.configuration.customQuestions, customQuestionInput.trim()])
      setCustomQuestionInput('')
    }
  }

  const removeCustomQuestion = (index) => {
    handleInputChange('configuration', 'customQuestions', formData.configuration.customQuestions.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.candidateInfo.name.trim()) newErrors['candidateInfo.name'] = 'Required'
    if (!formData.candidateInfo.role.trim()) newErrors['candidateInfo.role'] = 'Required'
    if (!formData.candidateInfo.company.trim()) newErrors['candidateInfo.company'] = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      setLoading(true)
      const result = await createInterview(formData)
      if (result.success) {
        toast.success('Interview created!')
        navigate(`/interview/live/${result.interview._id}`)
      } else {
        toast.error(result.error || 'Failed to create interview')
      }
    } catch (error) {
      toast.error('Failed to create interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center px-4 py-1.5 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 text-xs font-black uppercase tracking-widest mb-4 shadow-soft">
          <Brain className="w-4 h-4 mr-2 text-brand-500 fill-brand-500" /> Intelligence Lab
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
          Setup Your <span className="gradient-text">Interview Suite</span>
        </h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-12 max-w-3xl mx-auto">
        <div className="relative flex items-center justify-between">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 -z-10 rounded-full">
            <div className="h-full bg-brand-500 transition-all duration-500 rounded-full shadow-glow" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
          </div>
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-4 ${currentStep >= step ? 'bg-brand-600 border-white text-white shadow-premium scale-110' : 'bg-white border-slate-100 text-slate-400'}`}>
                {currentStep > step ? <CheckCircle className="w-6 h-6" /> : <span>{step}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {currentStep === 1 && <CandidateDetailsStep formData={formData} handleInputChange={handleInputChange} handleFileUpload={handleFileUpload} errors={errors} />}
        {currentStep === 2 && (
          <InterviewContextStep
            formData={formData}
            handleInputChange={handleInputChange}
            handleTopicToggle={handleTopicToggle}
            availableTopics={availableTopics}
            customTopicInput={customTopicInput}
            setCustomTopicInput={setCustomTopicInput}
            addCustomTopic={addCustomTopic}
            removeCustomTopic={removeCustomTopic}
            customQuestionInput={customQuestionInput}
            setCustomQuestionInput={setCustomQuestionInput}
            addCustomQuestion={addCustomQuestion}
            removeCustomQuestion={removeCustomQuestion}
          />
        )}
        {currentStep === 3 && (
          <>
            <LogicConfigurationStep formData={formData} handleInputChange={handleInputChange} vapiCost={vapiCost} canAffordVapi={canAffordVapi} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Target Duration</label>
                <select
                  value={formData.configuration.duration}
                  onChange={(e) => handleInputChange('configuration', 'duration', parseInt(e.target.value))}
                  className="input-premium appearance-none"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Complexity Matrix</label>
                <select
                  value={formData.configuration.difficulty}
                  onChange={(e) => handleInputChange('configuration', 'difficulty', e.target.value)}
                  className="input-premium appearance-none"
                >
                  {Object.entries(DIFFICULTY_LEVEL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Query Count</label>
                <select
                  value={formData.configuration.numQuestions}
                  onChange={(e) => handleInputChange('configuration', 'numQuestions', parseInt(e.target.value))}
                  className="input-premium appearance-none"
                >
                  {QUESTION_COUNT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-12">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className={`px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-soft'}`}
          >
            Back
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
              className="btn-premium group shadow-glow"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || (formData.configuration.interviewMode === INTERVIEW_MODES.VAPI && !canAffordVapi)}
              className="btn-premium !bg-emerald-600 hover:!bg-emerald-700 shadow-premium group disabled:opacity-50"
            >
              {loading ? 'Synthesizing...' : 'Launch Session'} <Zap className="w-4 h-4 ml-2 fill-current" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default InterviewSetupForm
