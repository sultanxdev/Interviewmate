import geminiService from './gemini'
// Using console logs instead of toast notifications

class WebSpeechService {
  constructor() {
    this.recognition = null
    this.synthesis = null
    this.isListening = false
    this.isInitialized = false
    this.currentUtterance = null
    this.manualStop = false
    this.callbacks = {
      onTranscript: null,
      onSpeechStart: null,
      onSpeechEnd: null,
      onError: null,
      onQuestionGenerated: null
    }
    this.interviewData = null
    this.conversationHistory = []
    this.currentQuestionIndex = 0
    this.questions = []
  }

  // Initialize Web Speech API
  initialize() {
    try {
      // Check browser support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech Recognition not supported in this browser')
      }

      if (!('speechSynthesis' in window)) {
        throw new Error('Speech Synthesis not supported in this browser')
      }

      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()

      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'
      this.recognition.maxAlternatives = 1

      // Initialize Speech Synthesis
      this.synthesis = window.speechSynthesis

      this.setupRecognitionListeners()
      this.isInitialized = true

      return true
    } catch (error) {
      console.error('Failed to initialize Web Speech API:', error)
      console.error('Speech recognition not supported in this browser')
      return false
    }
  }

  // Setup speech recognition event listeners
  setupRecognitionListeners() {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isListening = true
      this.callbacks.onSpeechStart?.()
    }

    this.recognition.onend = () => {
      this.isListening = false
      // Pass the last transcript if available
      this.callbacks.onSpeechEnd?.(this.lastTranscript || '')
      this.lastTranscript = '' // Clear for next session

      // Restart recognition if still in interview mode and not manually stopped
      if (this.isInitialized && this.interviewData && !this.manualStop) {
        setTimeout(() => {
          if (this.isInitialized && this.interviewData) {
            this.startListening()
          }
        }, 500)
      }
    }

    this.recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      // Send interim results for real-time display
      if (interimTranscript) {
        this.callbacks.onTranscript?.({
          role: 'user',
          text: interimTranscript,
          isFinal: false
        })
      }

      // Process final transcript
      if (finalTranscript.trim()) {
        this.lastTranscript = finalTranscript.trim()
        this.callbacks.onTranscript?.({
          role: 'user',
          text: finalTranscript,
          isFinal: true
        })

        this.processUserResponse(finalTranscript.trim())
      }
    }

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)

      // Handle specific errors gracefully
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing...')
        // Don't treat this as a real error, just restart
        setTimeout(() => {
          if (this.isInitialized && this.interviewData && !this.manualStop) {
            this.startListening()
          }
        }, 1000)
      } else if (event.error === 'audio-capture') {
        this.callbacks.onError?.(new Error('Microphone access denied. Please allow microphone access and try again.'))
      } else if (event.error === 'not-allowed') {
        this.callbacks.onError?.(new Error('Microphone permission denied. Please enable microphone access in your browser settings.'))
      } else if (event.error === 'network') {
        this.callbacks.onError?.(new Error('Network error. Please check your internet connection.'))
      } else {
        this.callbacks.onError?.(new Error(`Speech recognition error: ${event.error}`))
      }
    }
  }

  // Start interview with Web Speech API
  async startInterview(interviewData) {
    try {
      if (!this.isInitialized) {
        const initialized = this.initialize()
        if (!initialized) {
          throw new Error('Web Speech API not initialized and failed to initialize')
        }
      }

      this.interviewData = interviewData
      this.conversationHistory = []
      this.currentQuestionIndex = 0

      // Generate initial questions using Gemini AI
      try {
        await this.generateQuestions()
      } catch (error) {
        console.warn('Failed to generate questions with AI, using fallback questions')
        this.questions = this.getFallbackQuestions()
      }

      // Start with first question
      await this.askNextQuestion()

      // Start listening for user responses
      this.startListening()

      return true
    } catch (error) {
      console.error('Failed to start Web Speech API interview:', error)
      throw error
    }
  }

  // Generate questions using Gemini AI
  async generateQuestions() {
    try {
      const prompt = this.buildQuestionGenerationPrompt()
      const response = await geminiService.generateQuestions(prompt)

      if (response && response.questions) {
        this.questions = response.questions
      } else {
        // Fallback questions if Gemini fails
        this.questions = this.getFallbackQuestions()
      }

    } catch (error) {
      console.error('Failed to generate questions:', error)
      this.questions = this.getFallbackQuestions()
    }
  }

  // Build prompt for question generation
  buildQuestionGenerationPrompt() {
    const { type, candidateInfo, configuration } = this.interviewData

    return `Generate ${configuration.duration / 3} interview questions for a ${type} interview.

Candidate Details:
- Name: ${candidateInfo.name}
- Role: ${candidateInfo.role}
- Company: ${candidateInfo.company}
- Experience: ${candidateInfo.experience}
- Topics: ${configuration.topics?.join(', ') || 'General'}
- Difficulty: ${configuration.difficulty}

Requirements:
- Questions should be appropriate for ${candidateInfo.experience} level
- Focus on ${type} interview type
- Include ${configuration.topics?.join(', ') || 'general'} topics
- Difficulty level: ${configuration.difficulty}
- Return as JSON array with format: {"questions": ["question1", "question2", ...]}

Generate engaging, relevant questions that test both technical knowledge and soft skills.`
  }

  // Get fallback questions if AI generation fails
  getFallbackQuestions() {
    const { type } = this.interviewData

    const fallbackQuestions = {
      hr: [
        "Tell me about yourself and your background.",
        "Why are you interested in this role?",
        "What are your greatest strengths?",
        "Describe a challenging situation you faced at work and how you handled it.",
        "Where do you see yourself in 5 years?",
        "Why do you want to work for our company?",
        "What motivates you in your work?",
        "Do you have any questions for me?"
      ],
      technical: [
        "Tell me about your technical background and experience.",
        "What programming languages are you most comfortable with?",
        "Explain the difference between SQL and NoSQL databases.",
        "How would you approach debugging a performance issue?",
        "Describe your experience with version control systems.",
        "What's your preferred development methodology and why?",
        "How do you stay updated with new technologies?",
        "Do you have any technical questions for me?"
      ]
    }

    return fallbackQuestions[type] || fallbackQuestions.hr
  }

  // Ask the next question
  async askNextQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      await this.endInterview()
      return
    }

    const question = this.questions[this.currentQuestionIndex]

    // Add to conversation history
    this.conversationHistory.push({
      role: 'interviewer',
      text: question,
      timestamp: new Date()
    })

    // Notify callback
    this.callbacks.onTranscript?.({
      role: 'interviewer',
      text: question,
      isFinal: true
    })

    this.callbacks.onQuestionGenerated?.(question)

    // Speak the question
    await this.speakText(question)

    this.currentQuestionIndex++
  }

  // Process user response and generate follow-up
  async processUserResponse(response) {
    // Add user response to history
    this.conversationHistory.push({
      role: 'user',
      text: response,
      timestamp: new Date()
    })

    // Generate follow-up or next question using Gemini
    try {
      const followUp = await this.generateFollowUp(response)

      if (followUp && followUp.trim()) {
        // Add follow-up to conversation
        this.conversationHistory.push({
          role: 'interviewer',
          text: followUp,
          timestamp: new Date()
        })

        this.callbacks.onTranscript?.({
          role: 'interviewer',
          text: followUp,
          isFinal: true
        })

        // Speak follow-up
        await this.speakText(followUp)

        // Wait a moment then ask next question
        setTimeout(() => {
          this.askNextQuestion()
        }, 2000)
      } else {
        // No follow-up, move to next question
        setTimeout(() => {
          this.askNextQuestion()
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to generate follow-up:', error)
      // Move to next question on error
      setTimeout(() => {
        this.askNextQuestion()
      }, 1000)
    }
  }

  // Generate follow-up question using Gemini
  async generateFollowUp(userResponse) {
    try {
      const prompt = `Based on the candidate's response: "${userResponse}"
      
Interview Context:
- Type: ${this.interviewData.type}
- Role: ${this.interviewData.candidateInfo.role}
- Experience: ${this.interviewData.candidateInfo.experience}

Generate a brief follow-up question or comment (1-2 sentences max) to dig deeper into their response. 
If the response is complete and satisfactory, return empty string to move to next question.

Keep it conversational and natural.`

      const response = await geminiService.generateFollowUp(prompt)
      return response || ''
    } catch (error) {
      console.error('Failed to generate follow-up:', error)
      return ''
    }
  }

  // Convert text to speech
  async speakText(text) {
    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        this.synthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)

        // Configure voice settings
        utterance.rate = 0.9
        utterance.pitch = 1.0
        utterance.volume = 1.0

        // Try to use a professional voice
        const voices = this.synthesis.getVoices()
        const preferredVoice = voices.find(voice =>
          voice.name.includes('Google') ||
          voice.name.includes('Microsoft') ||
          voice.lang.startsWith('en')
        )

        if (preferredVoice) {
          utterance.voice = preferredVoice
        }

        utterance.onend = () => {
          this.currentUtterance = null
          resolve()
        }

        utterance.onerror = (error) => {
          this.currentUtterance = null
          console.error('Speech synthesis error:', error)
          reject(error)
        }

        this.currentUtterance = utterance
        this.synthesis.speak(utterance)
      } catch (error) {
        reject(error)
      }
    })
  }

  // Start listening for speech
  startListening() {
    if (!this.recognition || this.isListening) return

    try {
      this.manualStop = false
      this.recognition.start()
    } catch (error) {
      console.error('Failed to start listening:', error)
      // Try again after a short delay
      setTimeout(() => {
        if (!this.isListening && !this.manualStop) {
          this.startListening()
        }
      }, 1000)
    }
  }

  // Stop listening
  stopListening() {
    this.manualStop = true
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  // Set mute state
  setMuted(muted) {
    if (muted) {
      this.stopListening()
    } else if (this.interviewData && this.isInitialized) {
      this.startListening()
    }
  }

  // Stop speech synthesis
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
    this.currentUtterance = null
  }

  // Set volume for TTS
  setVolume(volume) {
    if (this.currentUtterance) {
      this.currentUtterance.volume = volume
    }
    this.volume = volume
  }

  // Alias for speakText for compatibility
  async speak(text) {
    return this.speakText(text)
  }

  // Stop method for compatibility
  stop() {
    this.stopListening()
    this.stopSpeaking()
  }

  // End interview
  async endInterview() {
    try {
      const closingMessage = "Thank you for your time. The interview is now complete. You'll receive your detailed feedback report shortly."

      this.callbacks.onTranscript?.({
        role: 'interviewer',
        text: closingMessage,
        isFinal: true
      })

      await this.speakText(closingMessage)

      // Stop all speech processes
      this.stopListening()
      this.stopSpeaking()

    } catch (error) {
      console.error('Error ending interview:', error)
    }
  }

  // Get conversation transcript
  getTranscript() {
    return this.conversationHistory
      .map(entry => `[${entry.timestamp.toLocaleTimeString()}] ${entry.role === 'interviewer' ? 'AI Interviewer' : 'You'}: ${entry.text}`)
      .join('\n\n')
  }

  // Set callback functions
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  // Check if browser supports Web Speech API
  static isSupported() {
    return ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
      ('speechSynthesis' in window)
  }

  // Cleanup resources
  cleanup() {
    this.manualStop = true
    this.stopListening()
    this.stopSpeaking()

    // Clear all timeouts to prevent memory leaks
    const timeouts = [this.questionTimeout, this.followUpTimeout, this.restartTimeout]
    timeouts.forEach(timeout => {
      if (timeout) {
        clearTimeout(timeout)
      }
    })

    // Reset timeout references
    this.questionTimeout = null
    this.followUpTimeout = null
    this.restartTimeout = null

    // Remove all event listeners from recognition
    if (this.recognition) {
      this.recognition.onstart = null
      this.recognition.onend = null
      this.recognition.onresult = null
      this.recognition.onerror = null
      this.recognition.onspeechstart = null
      this.recognition.onspeechend = null
      this.recognition.onnomatch = null
      this.recognition.onaudiostart = null
      this.recognition.onaudioend = null
      this.recognition.onsoundstart = null
      this.recognition.onsoundend = null

      // Stop and nullify recognition
      try {
        this.recognition.stop()
      } catch (error) {
        // Ignore errors when stopping already stopped recognition
      }
      this.recognition = null
    }

    // Clear speech synthesis
    if (this.currentUtterance) {
      speechSynthesis.cancel()
      this.currentUtterance = null
    }

    // Reset all state
    this.isInitialized = false
    this.isListening = false
    this.isSpeaking = false
    this.interviewData = null
    this.questions = []
    this.currentQuestionIndex = 0
    this.transcript = ''
    this.callbacks = {}
    this.manualStop = false
    this.conversationHistory = []
    this.questions = []
    this.currentQuestionIndex = 0
  }
}

// Create singleton instance
const webSpeechService = new WebSpeechService()

export default webSpeechService