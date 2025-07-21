const OpenAI = require('openai');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Build system prompt based on interview configuration
  buildSystemPrompt(interviewConfig) {
    const { type, role, topics, difficulty, company, questionCount } = interviewConfig;
    
    return `You are an expert ${type} interviewer conducting a ${difficulty.toLowerCase()} level interview for a ${role} position${company ? ` at ${company}` : ''}.

Your task is to:
1. Generate exactly ${questionCount} personalized interview questions based on the following topics: ${topics.join(', ')}
2. Ask questions that are appropriate for the ${difficulty.toLowerCase()} difficulty level
3. Focus on ${type} interview style (HR focuses on behavioral, Technical on skills, Managerial on leadership)

Guidelines:
- Start with basic questions and progress to more specific ones
- Ask one question at a time
- Keep questions clear and professional
- Vary question types (behavioral, situational, technical based on interview type)
- Make questions relevant to the ${role} role

When evaluating answers, determine if a follow-up (cross) question would be valuable to:
- Clarify unclear responses
- Dive deeper into interesting points
- Test knowledge further
- Simulate real interview dynamics

Respond with structured JSON only.`;
  }

  // Generate personalized interview questions
  async generateQuestions(interviewConfig) {
    try {
      const systemPrompt = this.buildSystemPrompt(interviewConfig);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Generate ${interviewConfig.questionCount} interview questions for this configuration. Return as JSON array with format: [{"question": "question text", "category": "behavioral/technical/situational"}]`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate interview questions');
    }
  }

  // Determine if cross-question is needed and generate it
  async generateCrossQuestion(question, answer, context = {}) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an interviewer deciding whether to ask a follow-up question. Analyze the answer and determine if a cross-question would add value. Respond with JSON format: {"needsCrossQuestion": boolean, "crossQuestion": "question text or null"}'
          },
          {
            role: 'user',
            content: `Question: "${question}"\nAnswer: "${answer}"\n\nShould I ask a follow-up question to clarify, dive deeper, or test further? If yes, what should it be?`
          }
        ],
        temperature: 0.6,
        max_tokens: 300
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating cross-question:', error);
      return { needsCrossQuestion: false, crossQuestion: null };
    }
  }

  // Generate final interview evaluation report
  async generateFinalReport(transcript, interviewConfig) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert interview evaluator. Analyze the complete interview transcript and provide a comprehensive evaluation report.

Evaluate based on:
- Communication skills and clarity
- Confidence and professionalism  
- Technical knowledge (if applicable)
- Problem-solving approach
- Behavioral responses
- Overall interview performance

Provide scores out of 100 and detailed feedback.`
          },
          {
            role: 'user',
            content: `Interview Configuration: ${JSON.stringify(interviewConfig)}

Complete Interview Transcript:
${transcript}

Please provide a detailed evaluation report in JSON format:
{
  "overallScore": number (0-100),
  "skillBreakdown": {
    "communication": number (0-100),
    "confidence": number (0-100), 
    "clarity": number (0-100),
    "technicalKnowledge": number (0-100),
    "problemSolving": number (0-100)
  },
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["area1", "area2", ...],
  "tips": ["tip1", "tip2", ...],
  "detailedFeedback": "comprehensive feedback text"
}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating final report:', error);
      throw new Error('Failed to generate interview evaluation');
    }
  }
}

module.exports = new AIService();