import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Volume2, 
  Clock, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import VoiceRecorder from '../components/Interview/VoiceRecorder';
import axios from 'axios';

const Interview = () => {
  const { currentUser, isPro } = useAuth();
  const navigate = useNavigate();
  
  // Interview setup data
  const [setup, setSetup] = useState(null);
  
  // Interview state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  
  // Voice and recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Question and evaluation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [crossQuestion, setCrossQuestion] = useState(null);
  const [isAnsweringCross, setIsAnsweringCross] = useState(false);
  const [crossTranscription, setCrossTranscription] = useState('');
  
  // Loading states
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [error, setError] = useState('');
  
  // API base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Load interview setup on mount
  useEffect(() => {
    const setupData = localStorage.getItem('interviewSetup');
    if (!setupData) {
      navigate('/interview-setup');
      return;
    }
    
    setSetup(JSON.parse(setupData));
  }, [navigate]);

  // Create interview when setup is loaded
  useEffect(() => {
    if (!setup) return;
    
    const createInterview = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/interviews`, setup, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.interview) {
          setInterviewId(response.data.interview._id);
        }
      } catch (error) {
        console.error('Error creating interview:', error);
        setError('Failed to create interview. Please try again.');
      }
    };

    createInterview();
  }, [setup]);
  
  // Start interview and get first question
  const startInterview = async () => {
    if (!interviewId) {
      setError('Interview not created. Please try again.');
      return;
    }

    try {
      setInterviewStarted(true);
      await loadNextQuestion();
    } catch (error) {
      console.error('Error starting interview:', error);
      setError('Failed to start interview. Please try again.');
    }
  };

  // Load next question from API
  const loadNextQuestion = async () => {
    try {
      setIsLoadingQuestion(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/interviews/${interviewId}/questions`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        setCurrentQuestionData(response.data);
        
        // Play question audio if available
        if (response.data.audioAvailable && response.data.audioData) {
          playQuestionAudio(response.data.audioData);
        } else {
          // Fallback to browser TTS
          playQuestionWithTTS(response.data.question);
        }
      }
    } catch (error) {
      console.error('Error loading question:', error);
      setError('Failed to load question. Please try again.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };
  
  // Play question audio from server
  const playQuestionAudio = (audioData) => {
    setIsPlaying(true);
    
    const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
    audio.play();
    
    audio.onended = () => {
      setIsPlaying(false);
    };
    
    audio.onerror = () => {
      setIsPlaying(false);
      // Fallback to TTS if audio fails
      playQuestionWithTTS(currentQuestionData.question);
    };
  };

  // Fallback TTS using browser speech synthesis
  const playQuestionWithTTS = (questionText) => {
    setIsPlaying(true);
    
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };
  
  // Handle voice recording completion
  const handleRecordingComplete = async (audioBlob, duration) => {
    setAudioBlob(audioBlob);
    setRecordingTime(duration);
    
    if (!isAnsweringCross) {
      // Main answer
      await submitVoiceAnswer(audioBlob, duration);
    } else {
      // Cross-question answer
      await submitCrossAnswer(audioBlob, duration);
    }
  };

  // Submit voice answer to API
  const submitVoiceAnswer = async (audioBlob, duration) => {
    try {
      setIsTranscribing(true);
      setIsEvaluating(true);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.webm');
      formData.append('question', currentQuestionData.question);
      formData.append('duration', duration.toString());
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/interviews/${interviewId}/voice-answer`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data) {
        setTranscription(response.data.transcription);
        setEvaluation(response.data.evaluation);
        
        // Check for cross-question
        if (response.data.crossQuestion) {
          setCrossQuestion(response.data.crossQuestion);
          
          // Play cross-question audio if available
          if (response.data.crossQuestion.audioAvailable && response.data.crossQuestion.audioData) {
            playQuestionAudio(response.data.crossQuestion.audioData);
          } else {
            playQuestionWithTTS(response.data.crossQuestion.question);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting voice answer:', error);
      setError('Failed to process your answer. Please try again.');
    } finally {
      setIsTranscribing(false);
      setIsEvaluating(false);
    }
  };

  // Submit cross-question answer
  const submitCrossAnswer = async (audioBlob, duration) => {
    try {
      setIsTranscribing(true);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'cross-answer.webm');
      formData.append('mainQuestion', currentQuestionData.question);
      formData.append('mainAnswer', transcription);
      formData.append('crossQuestion', crossQuestion.question);
      formData.append('duration', duration.toString());
      formData.append('score', evaluation.score);
      formData.append('feedback', evaluation.feedback);
      formData.append('suggestions', evaluation.suggestions);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/interviews/${interviewId}/cross-answer`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data) {
        setCrossTranscription(response.data.crossTranscription);
        setIsAnsweringCross(false);
        
        // Check if interview is complete
        if (response.data.isComplete) {
          await completeInterview();
        }
      }
    } catch (error) {
      console.error('Error submitting cross answer:', error);
      setError('Failed to process your cross-question answer. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handle cross-question response
  const handleCrossQuestionResponse = () => {
    setIsAnsweringCross(true);
    setCrossQuestion(null);
  };

  // Move to next question
  const nextQuestion = async () => {
    if (currentQuestionData.questionNumber < currentQuestionData.totalQuestions) {
      // Reset states for next question
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentQuestionData(null);
      setTranscription('');
      setEvaluation(null);
      setCrossQuestion(null);
      setCrossTranscription('');
      setIsAnsweringCross(false);
      setRecordingTime(0);
      setAudioBlob(null);
      
      // Load next question
      await loadNextQuestion();
    } else {
      // Interview complete
      await completeInterview();
    }
  };

  // Complete interview
  const completeInterview = async () => {
    try {
      setInterviewComplete(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/interviews/${interviewId}/complete`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.interview) {
        // Navigate to report page
        navigate(`/report/${interviewId}`);
      }
    } catch (error) {
      console.error('Error completing interview:', error);
      setError('Failed to complete interview. Please try again.');
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Loading state
  if (!setup) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">
            Interview Error
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/interview-setup')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!interviewStarted ? (
        <motion.div 
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Your Interview?
          </h1>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Interview Details</h2>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 text-left">
              <li><span className="font-medium">Type:</span> {setup.type.charAt(0).toUpperCase() + setup.type.slice(1)}</li>
              <li><span className="font-medium">Role:</span> {setup.role}</li>
              <li><span className="font-medium">Topics:</span> {setup.topics.join(', ')}</li>
              <li><span className="font-medium">Difficulty:</span> {setup.difficulty.charAt(0).toUpperCase() + setup.difficulty.slice(1)}</li>
              <li><span className="font-medium">Questions:</span> {setup.numQuestions}</li>
              <li><span className="font-medium">Mode:</span> {setup.mode === 'practice' ? 'Practice' : 'Realistic'}</li>
              {setup.company && <li><span className="font-medium">Company:</span> {setup.company}</li>}
            </ul>
          </div>
          
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Before you begin:</h3>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 text-left list-disc pl-5">
              <li>Make sure you're in a quiet environment</li>
              <li>Check that your microphone is working</li>
              <li>Speak clearly and at a normal pace</li>
              <li>You'll hear the question first, then recording will start automatically</li>
              <li>Click "Stop Recording" when you've finished your answer</li>
            </ul>
          </div>
          
          <button
            onClick={startInterview}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Start Interview
          </button>
        </motion.div>
      ) : (
        <motion.div 
          className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Progress bar */}
          {currentQuestionData && (
            <div className="bg-gray-100 dark:bg-gray-700">
              <div 
                className="bg-indigo-600 h-1" 
                style={{ width: `${(currentQuestionData.questionNumber / currentQuestionData.totalQuestions) * 100}%` }}
              ></div>
            </div>
          )}
          
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {currentQuestionData ? 
                  `Question ${currentQuestionData.questionNumber} of ${currentQuestionData.totalQuestions}` :
                  'Loading Question...'
                }
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                {setup.type.charAt(0).toUpperCase() + setup.type.slice(1)} Interview
              </span>
            </div>
          </div>
          
          {/* Question and recording UI */}
          <div className="px-4 py-5 sm:p-6">
            {isLoadingQuestion ? (
              <div className="flex flex-col items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading next question...</p>
              </div>
            ) : currentQuestionData ? (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {isAnsweringCross && crossQuestion ? crossQuestion.question : currentQuestionData.question}
                  </h3>
                  
                  {isPlaying && (
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 mb-4">
                      <Volume2 className="animate-pulse mr-2 h-4 w-4" />
                      Playing question...
                    </div>
                  )}
                </div>

                {/* Voice Recorder Component */}
                <div className="mb-6">
                  <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    audioData={isAnsweringCross && crossQuestion ? crossQuestion.audioData : currentQuestionData.audioData}
                    disabled={isPlaying || isTranscribing || isEvaluating}
                  />
                </div>

                {/* Processing States */}
                {(isTranscribing || isEvaluating) && (
                  <div className="flex flex-col items-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isTranscribing ? 'Transcribing your answer...' : 'Evaluating your response...'}
                    </p>
                  </div>
                )}

                {/* Transcription Display */}
                {transcription && !isTranscribing && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Answer (Transcribed)
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {transcription}
                    </p>
                  </div>
                )}

                {/* Cross-question Transcription */}
                {crossTranscription && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Follow-up Answer (Transcribed)
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {crossTranscription}
                    </p>
                  </div>
                )}

                {/* Cross-question Display */}
                {crossQuestion && !isAnsweringCross && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <MessageSquare className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                          Follow-up Question
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                          {crossQuestion.question}
                        </p>
                        <button
                          onClick={handleCrossQuestionResponse}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700"
                        >
                          Answer Follow-up
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evaluation Results */}
                {evaluation && !crossQuestion && !isAnsweringCross && (
                  <div className="space-y-6">
                    <div className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                      <div className="mr-6">
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {evaluation.score}/10
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Score
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div 
                            className="h-3 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-500" 
                            style={{ width: `${evaluation.score * 10}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>Needs Work</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Feedback
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          {evaluation.feedback}
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Suggestions
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          {evaluation.suggestions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No question data available</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-4 sm:px-6 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {setup.mode === 'practice' ? 'Practice Mode' : 'Realistic Mode'}
              </div>
              {recordingTime > 0 && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatTime(recordingTime)}
                </div>
              )}
            </div>
            
            {evaluation && !crossQuestion && !isAnsweringCross && currentQuestionData && (
              <button
                onClick={nextQuestion}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {currentQuestionData.questionNumber < currentQuestionData.totalQuestions ? 'Next Question' : 'Finish Interview'}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Interview;