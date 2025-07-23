import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { ArrowLeft, Upload, Briefcase, Target, Building, Hash } from 'lucide-react'

const InterviewSetup = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    interviewType: 'HR',
    role: '',
    topics: [],
    difficulty: 'Medium',
    company: '',
    numQuestions: 5,
    customQuestions: '',
    resumeFile: null
  })

  const interviewTypes = ['HR', 'Technical', 'Managerial', 'Custom']
  const difficulties = ['Easy', 'Medium', 'Hard']
  const commonTopics = [
    'Communication Skills',
    'Problem Solving',
    'Leadership',
    'Teamwork',
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'Data Structures',
    'System Design',
    'Project Management',
    'Strategic Thinking'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTopicToggle = (topic) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }))
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    setFormData(prev => ({
      ...prev,
      resumeFile: file
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.role.trim()) {
      alert('Please enter a role')
      return
    }

    if (formData.topics.length === 0 && !formData.customQuestions.trim()) {
      alert('Please select topics or provide custom questions')
      return
    }

    // Store interview setup in sessionStorage for the interview session
    sessionStorage.setItem('interviewSetup', JSON.stringify(formData))
    
    // Navigate to interview session
    navigate('/interview/session')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Interview Setup
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Interview Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {interviewTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, interviewType: type }))}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      formData.interviewType === type
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{type}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role/Position
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="e.g., Frontend Developer, Product Manager"
                  required
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company (Optional)
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="e.g., Google, Microsoft, TCS"
                />
              </div>
            </div>

            {/* Topics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Topics/Skills to Focus On
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {commonTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicToggle(topic)}
                    className={`p-3 rounded-lg border text-sm transition-colors ${
                      formData.topics.includes(topic)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-4">
                {difficulties.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, difficulty: level }))}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      formData.difficulty === level
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Target className="h-5 w-5 mx-auto mb-2" />
                    <div className="font-medium">{level}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Questions
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="numQuestions"
                  value={formData.numQuestions}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={3}>3 Questions (Quick)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={8}>8 Questions (Comprehensive)</option>
                  <option value={10}>10 Questions (Extensive)</option>
                </select>
              </div>
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Resume (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload your resume for personalized questions
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload">
                  <Button type="button" variant="outline" className="cursor-pointer">
                    Choose File
                  </Button>
                </label>
                {formData.resumeFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {formData.resumeFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Custom Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Questions (Optional)
              </label>
              <textarea
                name="customQuestions"
                value={formData.customQuestions}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Add specific questions you'd like to practice (one per line)"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
              >
                Start Interview
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default InterviewSetup