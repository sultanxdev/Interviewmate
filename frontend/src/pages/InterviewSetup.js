import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';

const InterviewSetup = () => {
  const { currentUser, isPro } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'technical',
    role: '',
    topics: [],
    difficulty: 'medium',
    company: '',
    numQuestions: 5,
    mode: 'practice'
  });
  
  // Available topics based on interview type
  const topicOptions = {
    technical: [
      'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C#', 'SQL',
      'Data Structures', 'Algorithms', 'System Design', 'DevOps', 'Cloud',
      'Frontend', 'Backend', 'Full Stack', 'Mobile', 'Machine Learning'
    ],
    hr: [
      'Leadership', 'Teamwork', 'Communication', 'Problem Solving', 
      'Conflict Resolution', 'Time Management', 'Adaptability',
      'Work Ethic', 'Career Goals', 'Strengths & Weaknesses'
    ],
    managerial: [
      'Team Management', 'Project Management', 'Resource Allocation',
      'Performance Reviews', 'Hiring', 'Strategic Planning', 'Delegation',
      'Mentoring', 'Conflict Resolution', 'Decision Making'
    ]
  };
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // API base URL from environment variable or default
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset topics when interview type changes
    if (name === 'type') {
      setFormData(prev => ({ ...prev, topics: [] }));
    }
  };
  
  // Handle topic selection
  const handleTopicToggle = (topic) => {
    setFormData(prev => {
      const topics = [...prev.topics];
      if (topics.includes(topic)) {
        return { ...prev, topics: topics.filter(t => t !== topic) };
      } else {
        // Limit topics to 5 for free users
        if (!isPro() && topics.length >= 3) {
          return prev;
        }
        return { ...prev, topics: [...topics, topic] };
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Validate form data
      if (!formData.role) {
        setError('Please enter a job role');
        setLoading(false);
        return;
      }
      
      if (formData.topics.length === 0) {
        setError('Please select at least one topic');
        setLoading(false);
        return;
      }
      
      // In a real app, you would send this data to your API
      // For now, we'll just simulate a successful response
      
      // Create interview session in local storage
      localStorage.setItem('interviewSetup', JSON.stringify({
        ...formData,
        userId: currentUser.id,
        createdAt: new Date().toISOString()
      }));
      
      // Navigate to interview page
      navigate('/interview');
    } catch (error) {
      console.error('Error setting up interview:', error);
      setError('Failed to set up interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Next step
  const nextStep = () => {
    if (step === 1 && !formData.role) {
      setError('Please enter a job role');
      return;
    }
    
    if (step === 2 && formData.topics.length === 0) {
      setError('Please select at least one topic');
      return;
    }
    
    setError('');
    setStep(step + 1);
  };
  
  // Previous step
  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };
  
  // Render form steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Interview Type
              </label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['technical', 'hr', 'managerial'].map((type) => (
                  <div key={type}>
                    <input
                      type="radio"
                      id={type}
                      name="type"
                      value={type}
                      checked={formData.type === type}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor={type}
                      className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-medium cursor-pointer ${
                        formData.type === type
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Job Role
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="e.g. Frontend Developer, Product Manager"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Company (Optional)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Google, Amazon, Microsoft"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Topics {!isPro() && <span className="text-xs text-gray-500">(Max 3 for free plan)</span>}
              </label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {topicOptions[formData.type].map((topic) => (
                  <div key={topic}>
                    <button
                      type="button"
                      onClick={() => handleTopicToggle(topic)}
                      className={`w-full rounded-md px-3 py-2 text-sm font-medium ${
                        formData.topics.includes(topic)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {topic}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Difficulty Level
              </label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['easy', 'medium', 'hard'].map((level) => (
                  <div key={level}>
                    <input
                      type="radio"
                      id={level}
                      name="difficulty"
                      value={level}
                      checked={formData.difficulty === level}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor={level}
                      className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-medium cursor-pointer ${
                        formData.difficulty === level
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Number of Questions {!isPro() && <span className="text-xs text-gray-500">(Max 5 for free plan)</span>}
              </label>
              <div className="mt-2">
                <input
                  type="range"
                  id="numQuestions"
                  name="numQuestions"
                  min={3}
                  max={isPro() ? 10 : 5}
                  value={formData.numQuestions}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>3</span>
                  <span>{formData.numQuestions}</span>
                  <span>{isPro() ? 10 : 5}</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Interview Mode
              </label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['practice', 'realistic'].map((mode) => (
                  <div key={mode}>
                    <input
                      type="radio"
                      id={mode}
                      name="mode"
                      value={mode}
                      checked={formData.mode === mode}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor={mode}
                      className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-medium cursor-pointer ${
                        formData.mode === mode
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {mode === 'practice' ? 'Practice Mode' : 'Realistic Mode'}
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {formData.mode === 'practice' 
                  ? 'Practice Mode: Get immediate feedback after each question.'
                  : 'Realistic Mode: Complete the full interview before seeing feedback.'}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Interview Summary</h3>
              <ul className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <li><span className="font-medium">Type:</span> {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}</li>
                <li><span className="font-medium">Role:</span> {formData.role}</li>
                <li><span className="font-medium">Topics:</span> {formData.topics.join(', ')}</li>
                <li><span className="font-medium">Difficulty:</span> {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)}</li>
                <li><span className="font-medium">Questions:</span> {formData.numQuestions}</li>
                <li><span className="font-medium">Mode:</span> {formData.mode === 'practice' ? 'Practice' : 'Realistic'}</li>
                {formData.company && <li><span className="font-medium">Company:</span> {formData.company}</li>}
              </ul>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Set Up Your Interview
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize your interview experience
        </p>
      </div>
      
      {/* Progress steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {[
              { id: 1, name: 'Basic Info' },
              { id: 2, name: 'Topics' },
              { id: 3, name: 'Settings' }
            ].map((s, i) => (
              <li key={s.id} className={`${i !== 0 ? 'ml-8 sm:ml-16' : ''} relative`}>
                <div className="flex items-center">
                  {i !== 0 && (
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className={`h-0.5 w-full ${step > s.id ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => s.id < step && setStep(s.id)}
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                      step > s.id
                        ? 'bg-indigo-600 hover:bg-indigo-800'
                        : step === s.id
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    } ${s.id < step ? 'cursor-pointer' : 'cursor-default'}`}
                    aria-current={step === s.id ? 'step' : undefined}
                  >
                    {step > s.id ? (
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className={`text-sm font-medium ${step === s.id ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {s.id}
                      </span>
                    )}
                  </button>
                </div>
                <span className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                  {s.name}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      
      {/* Form */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {renderStep()}
          
          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting...
                  </span>
                ) : (
                  'Start Interview'
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>
      
      {/* Pro plan upsell */}
      {!isPro() && (
        <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Upgrade to Pro</h3>
              <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-300">
                <p>Get access to more features:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Up to 10 questions per interview</li>
                  <li>Select up to 10 topics</li>
                  <li>PDF export of reports</li>
                  <li>Priority access to GPT evaluation</li>
                </ul>
              </div>
              <div className="mt-4">
                <a
                  href="/pricing"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                >
                  View pricing <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSetup;