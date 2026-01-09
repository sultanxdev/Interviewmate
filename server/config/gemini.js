import { GoogleGenerativeAI } from '@google/generative-ai'

class GeminiService {
  constructor() {
    this.genAI = null
    this.model = null
    this.isInitialized = false
    this.lastError = null
    this.lastErrorTime = 0
    this.requestCount = 0
    this.lastResetTime = Date.now()
  }

  initialize() {
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.warn('⚠️ GEMINI_API_KEY is not configured - using fallback evaluation')
        return false
      }

      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      this.model = this.genAI.getGenerativeModel({ 
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        generationConfig: {
          temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      })

      this.isInitialized = true
      console.log('✅ Gemini AI initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error.message)
      this.isInitialized = false
      return false
    }
  }

  async evaluateInterview(interviewData, transcript) {
    if (!this.isInitialized) {
      this.initialize()
    }

    // Check rate limits
    if (!this.checkRateLimit()) {
      console.log('⚠️ Gemini rate limit reached, using fallback evaluation')
      return this.getFallbackEvaluation()
    }

    try {
      const prompt = this.generateEvaluationPrompt(interviewData, transcript)
      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      this.requestCount++
      return this.parseEvaluationResponse(text)
    } catch (error) {
      console.error('❌ Gemini evaluation error:', error.message)
      
      // If quota exceeded, use fallback
      if (error.message.includes('quota') || error.message.includes('429')) {
        console.log('⚠️ Gemini quota exceeded, using fallback evaluation')
        return this.getFallbackEvaluation()
      }
      
      throw error
    }
  }

  checkRateLimit() {
    const now = Date.now()
    const oneMinute = 60 * 1000

    // Reset counter every minute
    if (now - this.lastResetTime > oneMinute) {
      this.requestCount = 0
      this.lastResetTime = now
    }

    // More conservative rate limiting to prevent 429 errors
    return this.requestCount < 5 // Very conservative limit
  }

  generateEvaluationPrompt(interviewData, transcript) {
    const { type, candidateInfo, configuration } = interviewData

    return `
You are an expert interview evaluator. Analyze this ${type} interview transcript and provide a comprehensive evaluation.

INTERVIEW CONTEXT:
- Type: ${type.charAt(0).toUpperCase() + type.slice(1)} Interview
- Role: ${candidateInfo.role}
- Company: ${candidateInfo.company}
- Experience Level: ${candidateInfo.experience}
- Duration: ${configuration.duration} minutes
- Difficulty: ${configuration.difficulty}
- Focus Topics: ${configuration.topics?.join(', ') || 'General'}

TRANSCRIPT:
${transcript}

EVALUATION REQUIREMENTS:
Please provide a detailed evaluation in the following JSON format:

{
  "overallScore": <number 0-100>,
  "skillScores": {
    "communication": <number 0-100>,
    "technicalKnowledge": <number 0-100>,
    "problemSolving": <number 0-100>,
    "confidence": <number 0-100>,
    "clarity": <number 0-100>,
    "behavioral": <number 0-100>
  },
  "strengths": [<array of 3-5 specific strengths>],
  "weaknesses": [<array of 2-4 areas for improvement>],
  "recommendations": [<array of 3-5 actionable recommendations>],
  "detailedFeedback": "<comprehensive 200-300 word feedback>",
  "badges": [<array of achievement badges for exceptional performance>]
}

EVALUATION CRITERIA:
1. Communication: Clarity, articulation, listening skills, professional language
2. Technical Knowledge: Domain expertise, problem-solving approach, technical accuracy
3. Problem Solving: Analytical thinking, creativity, structured approach
4. Confidence: Self-assurance, composure, ability to handle pressure
5. Clarity: Clear explanations, logical flow, concise responses
6. Behavioral: Cultural fit, teamwork, leadership potential, motivation

SCORING GUIDELINES:
- 90-100: Exceptional performance, exceeds expectations
- 80-89: Strong performance, meets and often exceeds expectations
- 70-79: Good performance, meets most expectations
- 60-69: Adequate performance, meets basic expectations
- Below 60: Needs improvement, below expectations

BADGES (award for scores ≥ 85 in specific areas):
- "Excellent Communicator" (communication ≥ 85)
- "Technical Expert" (technicalKnowledge ≥ 85)
- "Problem Solver" (problemSolving ≥ 85)
- "Confident Leader" (confidence ≥ 85)
- "Clear Thinker" (clarity ≥ 85)
- "Cultural Fit" (behavioral ≥ 85)
- "Outstanding Performance" (overallScore ≥ 90)

Be constructive, specific, and actionable in your feedback. Focus on both strengths and growth opportunities.
`
  }

  parseEvaluationResponse(text) {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const evaluation = JSON.parse(jsonMatch[0])

      // Validate and sanitize the evaluation
      return this.validateEvaluation(evaluation)
    } catch (error) {
      console.error('❌ Error parsing evaluation response:', error)
      
      // Return fallback evaluation
      return this.getFallbackEvaluation()
    }
  }

  validateEvaluation(evaluation) {
    // Ensure all required fields exist with proper types and ranges
    const validated = {
      overallScore: Math.max(0, Math.min(100, evaluation.overallScore || 75)),
      skillScores: {
        communication: Math.max(0, Math.min(100, evaluation.skillScores?.communication || 75)),
        technicalKnowledge: Math.max(0, Math.min(100, evaluation.skillScores?.technicalKnowledge || 70)),
        problemSolving: Math.max(0, Math.min(100, evaluation.skillScores?.problemSolving || 75)),
        confidence: Math.max(0, Math.min(100, evaluation.skillScores?.confidence || 70)),
        clarity: Math.max(0, Math.min(100, evaluation.skillScores?.clarity || 75)),
        behavioral: Math.max(0, Math.min(100, evaluation.skillScores?.behavioral || 75))
      },
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths.slice(0, 5) : [
        'Participated actively in the interview',
        'Provided thoughtful responses'
      ],
      weaknesses: Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses.slice(0, 4) : [
        'Could provide more specific examples'
      ],
      recommendations: Array.isArray(evaluation.recommendations) ? evaluation.recommendations.slice(0, 5) : [
        'Continue practicing interview skills',
        'Prepare more specific examples from experience'
      ],
      detailedFeedback: evaluation.detailedFeedback || 'The candidate demonstrated good interview skills with room for improvement in providing more specific examples and demonstrating deeper knowledge in key areas.',
      badges: Array.isArray(evaluation.badges) ? evaluation.badges.slice(0, 6) : [],
      evaluatedAt: new Date(),
      evaluationModel: 'gemini-pro'
    }

    // Auto-generate badges based on scores
    if (validated.skillScores.communication >= 85) validated.badges.push('Excellent Communicator')
    if (validated.skillScores.technicalKnowledge >= 85) validated.badges.push('Technical Expert')
    if (validated.skillScores.problemSolving >= 85) validated.badges.push('Problem Solver')
    if (validated.skillScores.confidence >= 85) validated.badges.push('Confident Leader')
    if (validated.skillScores.clarity >= 85) validated.badges.push('Clear Thinker')
    if (validated.skillScores.behavioral >= 85) validated.badges.push('Cultural Fit')
    if (validated.overallScore >= 90) validated.badges.push('Outstanding Performance')

    // Remove duplicates
    validated.badges = [...new Set(validated.badges)]

    return validated
  }

  getFallbackEvaluation() {
    return {
      overallScore: 75,
      skillScores: {
        communication: 75,
        technicalKnowledge: 70,
        problemSolving: 75,
        confidence: 70,
        clarity: 75,
        behavioral: 75
      },
      strengths: [
        'Participated actively in the interview',
        'Provided thoughtful responses',
        'Demonstrated good communication skills'
      ],
      weaknesses: [
        'Could provide more specific examples',
        'Room for improvement in technical depth'
      ],
      recommendations: [
        'Practice with more specific examples from your experience',
        'Research common interview questions for your field',
        'Work on providing more detailed technical explanations'
      ],
      detailedFeedback: 'The candidate demonstrated solid interview skills with good communication and engagement. There are opportunities to improve by providing more specific examples and demonstrating deeper technical knowledge. Overall, a positive interview performance with clear areas for growth.',
      badges: [],
      evaluatedAt: new Date(),
      evaluationModel: 'fallback'
    }
  }

  async generateQuestions(jobDescription, difficulty = 'medium', count = 5) {
    if (!this.isInitialized) {
      this.initialize()
    }

    if (!this.checkRateLimit()) {
      console.log('⚠️ Gemini rate limit reached, using fallback questions')
      return this.getFallbackQuestions(count)
    }

    try {
      const prompt = `
Generate ${count} interview questions for the following job description.
Difficulty level: ${difficulty}

Job Description:
${jobDescription}

Please provide questions that are:
1. Relevant to the role
2. Appropriate for ${difficulty} difficulty level
3. Mix of technical and behavioral questions
4. Clear and concise

Format the response as a JSON array of objects with 'question' and 'type' fields.
Example: [{"question": "What is your experience with...", "type": "technical"}]
`

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      this.requestCount++

      // Try to parse JSON response
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0])
          return Array.isArray(questions) ? questions : this.getFallbackQuestions(count)
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON, extracting questions manually')
      }

      // Fallback: extract questions from text
      const questions = this.extractQuestionsFromText(text)
      return questions.map(q => ({ question: q, type: 'behavioral' })).slice(0, count)
    } catch (error) {
      console.error('❌ Gemini question generation error:', error)
      throw error
    }
  }

  getFallbackQuestions(count = 5) {
    const questions = [
      { question: "Tell me about yourself and your background.", type: "behavioral" },
      { question: "Why are you interested in this role?", type: "behavioral" },
      { question: "What are your greatest strengths?", type: "behavioral" },
      { question: "Describe a challenging situation you faced and how you handled it.", type: "behavioral" },
      { question: "Where do you see yourself in 5 years?", type: "behavioral" },
      { question: "What motivates you in your work?", type: "behavioral" },
      { question: "How do you handle stress and pressure?", type: "behavioral" },
      { question: "Describe your ideal work environment.", type: "behavioral" }
    ]
    return questions.slice(0, count)
  }

  async generateFollowUp(transcript, currentQuestion) {
    if (!this.isInitialized) {
      this.initialize()
    }

    try {
      const prompt = `
You are an expert interviewer. You just asked this question: "${currentQuestion}"
The candidate's response was: "${transcript}"

Analyze the response and provide a single follow-up response.
- If the response was vague, incomplete, or lacked examples, ask a specific follow-up question to dig deeper.
- If the response was thorough, acknowledge it briefly and tell the user we are moving to the next topic (return "PROCEED").
- If the candidate mentioned something very interesting or a specific technology, ask a deep-dive question about it.

Keep the follow-up concise and natural.
Return ONLY the follow-up text or "PROCEED".
`
      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      return text.trim()
    } catch (error) {
      console.error('❌ Gemini follow-up generation error:', error)
      return "PROCEED" // Fallback to next question
    }
  }

  extractQuestionsFromText(text) {
    // Extract questions from text using various patterns
    const questionPatterns = [
      /\d+\.\s*(.+\?)/g,
      /[-•]\s*(.+\?)/g,
      /(.+\?)/g
    ]

    let questions = []
    
    for (const pattern of questionPatterns) {
      const matches = [...text.matchAll(pattern)]
      if (matches.length > 0) {
        questions = matches.map(match => match[1].trim()).slice(0, 8)
        break
      }
    }

    // If no questions found, return fallback
    if (questions.length === 0) {
      questions = [
        "Tell me about yourself and your background.",
        "Why are you interested in this role?",
        "What are your greatest strengths?",
        "Describe a challenging situation you faced and how you handled it.",
        "Where do you see yourself in 5 years?",
        "Do you have any questions for me?"
      ]
    }

    return questions
  }

  async testConnection() {
    try {
      if (!this.isInitialized) {
        const initialized = this.initialize()
        if (!initialized) {
          console.log('⚠️ Gemini AI not initialized - using fallback evaluation')
          return false
        }
      }

      if (!this.model) {
        console.log('⚠️ Gemini model not available - using fallback evaluation')
        return false
      }

      // Skip test if we've recently hit rate limits or errors
      const now = Date.now()
      const cooldownPeriod = 5 * 60 * 1000 // 5 minutes cooldown
      
      if (this.lastError && now - this.lastErrorTime < cooldownPeriod) {
        console.log('⚠️ Skipping Gemini test due to recent error (cooldown active)')
        return false
      }

      // Don't test if we're close to rate limit
      if (!this.checkRateLimit()) {
        console.log('⚠️ Skipping Gemini test due to rate limit')
        return false
      }

      // Simple test with minimal content
      const result = await this.model.generateContent('Hello')
      const response = result.response
      const text = response.text()
      
      this.requestCount++
      console.log('✅ Gemini AI connection verified successfully')
      return text.length > 0
    } catch (error) {
      console.error('❌ Gemini connection test failed:', error.message)
      this.lastError = error.message
      this.lastErrorTime = Date.now()
      
      // Handle specific error types with better messaging
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.warn('⚠️ Gemini model not available - using fallback evaluation')
        console.warn('💡 Try updating your Google AI SDK or check model availability')
      } else if (error.message.includes('overloaded') || error.message.includes('503')) {
        console.warn('⚠️ Gemini AI is temporarily overloaded - will use fallback evaluation')
      } else if (error.message.includes('quota') || error.message.includes('429')) {
        console.warn('⚠️ Gemini AI quota exceeded - using fallback mode')
      } else if (error.message.includes('API key') || error.message.includes('401')) {
        console.error('❌ Invalid Gemini API key - check your configuration')
      } else {
        console.warn('⚠️ Gemini AI temporarily unavailable - using fallback evaluation')
      }
      
      return false
    }
  }
}

// Create singleton instance
const geminiService = new GeminiService()

export default geminiService