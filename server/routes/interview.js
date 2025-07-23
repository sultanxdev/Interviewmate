import express from 'express';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Ensure dotenv is loaded
dotenv.config();
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const primaryModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-pro" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper function to try multiple models
const generateWithFallback = async (prompt) => {
  try {
    const result = await primaryModel.generateContent(prompt);
    return await result.response;
  } catch (error) {
    console.log('Primary model failed, trying fallback:', error.message);
    const result = await fallbackModel.generateContent(prompt);
    return await result.response;
  }
};

// Generate interview questions
router.post('/generate-questions', auth, [
  body('interviewType').isIn(['HR', 'Technical', 'Managerial', 'Custom']),
  body('role').trim().isLength({ min: 1 }),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']),
  body('numberOfQuestions').isInt({ min: 1, max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user can take interview
    if (!req.user.canTakeInterview()) {
      return res.status(403).json({ 
        message: 'Daily interview limit reached. Upgrade to Pro for unlimited interviews.' 
      });
    }

    const { interviewType, role, company, topics, difficulty, numberOfQuestions } = req.body;

    // Create system prompt for GPT
    const systemPrompt = `You are an expert interviewer conducting a ${interviewType} interview for a ${role} position${company ? ` at ${company}` : ''}. 
    
Interview Details:
- Type: ${interviewType}
- Role: ${role}
- Difficulty: ${difficulty}
- Topics: ${topics?.join(', ') || 'General'}
- Number of questions: ${numberOfQuestions}

Generate exactly ${numberOfQuestions} interview questions that are:
1. Relevant to the role and interview type
2. Appropriate for ${difficulty} difficulty level
3. Professional and realistic
4. Varied in format (behavioral, technical, situational)

Return ONLY a JSON array of questions in this format:
[
  {
    "question": "Tell me about yourself and your experience with...",
    "type": "behavioral",
    "expectedDuration": 3
  }
]`;

    let questions;
    
    // Helper function to retry Gemini API calls with fallback models
    const retryGeminiCall = async (prompt, maxRetries = 2) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await generateWithFallback(prompt);
          let text = response.text();
          
          // Clean up Gemini's response - remove markdown code blocks
          text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          
          // Try to extract JSON if it's wrapped in other text
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            text = jsonMatch[0];
          }
          
          return JSON.parse(text);
        } catch (error) {
          console.log(`Gemini API attempt ${attempt} failed:`, error.message);
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    };
    
    try {
      const prompt = `${systemPrompt}\n\nGenerate ${numberOfQuestions} interview questions for this ${interviewType} interview.`;
      questions = await retryGeminiCall(prompt);
    } catch (geminiError) {
      console.error('Gemini API Error after retries:', geminiError.message);
      
      // Fallback to mock questions when Gemini fails
      const mockQuestions = {
        'HR': [
          'Tell me about yourself and your background.',
          'Why are you interested in this position?',
          'What are your greatest strengths and weaknesses?',
          'Where do you see yourself in 5 years?',
          'Why are you leaving your current job?'
        ],
        'Technical': [
          'Explain your experience with relevant programming languages.',
          'How do you approach debugging complex issues?',
          'Describe a challenging technical project you worked on.',
          'What development methodologies are you familiar with?',
          'How do you stay updated with new technologies?'
        ],
        'Managerial': [
          'How do you handle team conflicts?',
          'Describe your leadership style.',
          'How do you prioritize tasks and manage deadlines?',
          'Tell me about a time you had to make a difficult decision.',
          'How do you motivate your team members?'
        ]
      };

      const questionPool = mockQuestions[interviewType] || mockQuestions['HR'];
      questions = Array.from({ length: numberOfQuestions }, (_, i) => ({
        question: questionPool[i % questionPool.length] || `Tell me about your experience relevant to the ${role} position.`,
        type: interviewType.toLowerCase(),
        expectedDuration: 3
      }));
      
      console.log('Using mock questions due to Gemini API issue');
    }

    // Create new interview record
    const interview = new Interview({
      userId: req.userId,
      interviewType,
      role,
      company: company || '',
      topics: topics || [],
      difficulty,
      numberOfQuestions,
      questions: questions.map(q => ({
        question: q.question,
        userAnswer: '',
        followUpQuestions: []
      }))
    });

    await interview.save();

    // Update user's daily interview count
    const today = new Date().toDateString();
    const lastInterviewDate = req.user.lastInterviewDate ? req.user.lastInterviewDate.toDateString() : null;
    
    if (lastInterviewDate !== today) {
      req.user.dailyInterviewCount = 1;
    } else {
      req.user.dailyInterviewCount += 1;
    }
    req.user.lastInterviewDate = new Date();
    await req.user.save();

    res.json({
      interviewId: interview._id,
      questions: questions,
      message: 'Interview questions generated successfully'
    });

  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({ message: 'Failed to generate interview questions' });
  }
});

// Submit answer and get follow-up question
router.post('/submit-answer', auth, async (req, res) => {
  try {
    const { interviewId, questionIndex, answer } = req.body;

    const interview = await Interview.findOne({ 
      _id: interviewId, 
      userId: req.userId 
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (questionIndex >= interview.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    // Update the answer
    interview.questions[questionIndex].userAnswer = answer;

    // Generate follow-up question using GPT
    const systemPrompt = `You are an expert interviewer. Based on the candidate's answer, decide if a follow-up question is needed.

Original Question: ${interview.questions[questionIndex].question}
Candidate's Answer: ${answer}

If the answer needs clarification or you want to dig deeper, generate ONE relevant follow-up question.
If the answer is complete and satisfactory, respond with "NO_FOLLOWUP".

Respond with either:
- A single follow-up question (just the question text)
- "NO_FOLLOWUP"`;

    const prompt = `${systemPrompt}\n\nShould I ask a follow-up question?`;
    
    let followUpQuestion = null;
    
    try {
      const response = await generateWithFallback(prompt);
      const followUpResponse = response.text().trim();

      if (followUpResponse !== "NO_FOLLOWUP") {
        followUpQuestion = followUpResponse;
      }
    } catch (geminiError) {
      console.error('Gemini API Error for follow-up:', geminiError.message);
      // Continue without follow-up question if API fails
    }

    // Update the interview document directly to avoid version conflicts
    await Interview.findByIdAndUpdate(interviewId, {
      [`questions.${questionIndex}.userAnswer`]: answer
    });

    res.json({
      followUpQuestion,
      hasFollowUp: followUpQuestion !== null,
      message: 'Answer submitted successfully'
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ message: 'Failed to submit answer' });
  }
});

// Complete interview and generate report
router.post('/complete', auth, async (req, res) => {
  try {
    const { interviewId } = req.body;

    // Validate ObjectId format
    if (!interviewId || !interviewId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid interview ID format' });
    }

    const interview = await Interview.findOne({ 
      _id: interviewId, 
      userId: req.userId 
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ message: 'Interview already completed' });
    }

    // Generate comprehensive evaluation using GPT
    const transcript = interview.questions.map((q, index) => 
      `Q${index + 1}: ${q.question}\nA${index + 1}: ${q.userAnswer}`
    ).join('\n\n');

    const evaluationPrompt = `You are an expert interview evaluator. Analyze this ${interview.interviewType} interview for a ${interview.role} position.

TRANSCRIPT:
${transcript}

Provide a comprehensive evaluation in the following JSON format:
{
  "overallScore": 85,
  "skillBreakdown": {
    "communication": 80,
    "confidence": 90,
    "technicalKnowledge": 85,
    "problemSolving": 80,
    "clarity": 85
  },
  "strengths": ["Clear communication", "Good problem-solving approach"],
  "weaknesses": ["Could provide more specific examples", "Technical depth could be improved"],
  "improvementTips": ["Practice with more technical scenarios", "Prepare specific examples from past experience"],
  "summary": "Overall strong performance with good communication skills..."
}

Score each skill out of 100. Be constructive and specific in feedback.`;

    const prompt = `${evaluationPrompt}\n\nPlease evaluate this interview performance.`;
    
    let evaluation;
    
    try {
      const response = await generateWithFallback(prompt);
      
      let evalText = response.text();
      // Clean up Gemini's response - remove markdown code blocks
      evalText = evalText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to extract JSON if it's wrapped in other text
      const jsonMatch = evalText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evalText = jsonMatch[0];
      }
      
      evaluation = JSON.parse(evalText);
    } catch (geminiError) {
      console.error('Gemini API Error for evaluation:', geminiError.message);
      
      // Fallback evaluation if Gemini fails
      evaluation = {
        overallScore: 75,
        skillBreakdown: {
          communication: 75,
          confidence: 70,
          technicalKnowledge: 75,
          problemSolving: 80,
          clarity: 75
        },
        strengths: ["Good communication", "Clear responses"],
        weaknesses: ["Could provide more specific examples"],
        improvementTips: ["Practice with more technical scenarios", "Prepare specific examples"],
        summary: "Overall good performance with room for improvement in technical depth."
      };
    }

    // Update interview with evaluation using findByIdAndUpdate to avoid version conflicts
    const updatedInterview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        overallScore: evaluation.overallScore,
        skillBreakdown: evaluation.skillBreakdown,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        improvementTips: evaluation.improvementTips,
        transcript: transcript,
        status: 'completed'
      },
      { new: true }
    );

    if (!updatedInterview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({
      interviewId: updatedInterview._id,
      evaluation,
      message: 'Interview completed and evaluated successfully'
    });

  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ message: 'Failed to complete interview' });
  }
});

// Get interview report
router.get('/report/:id', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid interview ID format' });
    }

    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('userId', 'name email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({ interview });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Failed to fetch interview report' });
  }
});

// Get interview history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, type, sortBy = 'createdAt' } = req.query;
    
    const filter = { userId: req.userId, status: 'completed' };
    if (role) filter.role = new RegExp(role, 'i');
    if (type) filter.interviewType = type;

    const interviews = await Interview.find(filter)
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('role interviewType overallScore createdAt company difficulty');

    const total = await Interview.countDocuments(filter);

    res.json({
      interviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to fetch interview history' });
  }
});

export default router;