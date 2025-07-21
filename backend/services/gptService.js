const OpenAI = require('openai');

class GPTService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Generate interview question based on context
  async generateQuestion(interviewData, previousQuestions = []) {
    const { type, role, topics, difficulty, company, mode } = interviewData;
    
    const systemPrompt = `You are an expert ${type} interviewer conducting a ${difficulty} level interview for a ${role} position${company ? ` at ${company}` : ''}. 
    
    Interview Mode: ${mode}
    Focus Topics: ${topics.join(', ')}
    
    ${mode === 'realistic' ? 
      'Conduct this as a realistic interview with professional tone and industry-standard questions.' : 
      'This is a practice session, so be encouraging while maintaining professional standards.'
    }
    
    Previous questions asked: ${previousQuestions.map(q => `- ${q}`).join('\n')}
    
    Generate ONE interview question that:
    1. Matches the ${difficulty} difficulty level
    2. Focuses on the specified topics
    3. Is appropriate for a ${type} interview
    4. Doesn't repeat previous questions
    5. Is clear and specific
    
    Return ONLY the question text, no additional formatting.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: systemPrompt }],
        max_tokens: 200,
        temperature: 0.7
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('GPT Question Generation Error:', error);
      throw new Error('Failed to generate question');
    }
  }

  // Evaluate answer and determine if cross-question is needed
  async evaluateAnswer(question, answer, interviewContext) {
    const { type, role, difficulty } = interviewContext;
    
    const evaluationPrompt = `You are evaluating an interview answer for a ${type} interview for a ${role} position.

Question: ${question}
Answer: ${answer}
Difficulty Level: ${difficulty}

Evaluate this answer and provide:
1. Score (0-10)
2. Brief feedback (2-3 sentences)
3. Suggestions for improvement
4. Whether a cross-question is needed (true/false)
5. If cross-question needed, provide the follow-up question

Consider:
- Clarity and structure of the answer
- Technical accuracy (if applicable)
- Depth of explanation
- Use of examples
- Communication skills

Return your response as JSON:
{
  "score": number,
  "feedback": "string",
  "suggestions": "string",
  "needsCrossQuestion": boolean,
  "crossQuestion": "string or empty"
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: evaluationPrompt }],
        max_tokens: 400,
        temperature: 0.3
      });

      return JSON.parse(completion.choices[0].message.content.trim());
    } catch (error) {
      console.error('GPT Answer Evaluation Error:', error);
      // Fallback evaluation
      return {
        score: Math.min(10, Math.max(5, Math.floor(answer.length / 50) + 5)),
        feedback: "Your answer shows understanding of the topic. Consider providing more specific examples.",
        suggestions: "• Add concrete examples\n• Structure your response clearly\n• Elaborate on key points",
        needsCrossQuestion: Math.random() > 0.6, // 40% chance of cross-question
        crossQuestion: "Can you provide a specific example of when you applied this concept?"
      };
    }
  }

  // Generate final interview report
  async generateFinalReport(interviewData, allQuestionsAndAnswers) {
    const { type, role, difficulty, topics } = interviewData;
    
    const reportPrompt = `Generate a comprehensive interview performance report.

Interview Details:
- Type: ${type}
- Role: ${role}
- Difficulty: ${difficulty}
- Topics: ${topics.join(', ')}

Questions and Answers:
${allQuestionsAndAnswers.map((qa, index) => `
Q${index + 1}: ${qa.question}
A${index + 1}: ${qa.answer}
${qa.crossQuestion ? `Cross-Q${index + 1}: ${qa.crossQuestion}` : ''}
${qa.crossAnswer ? `Cross-A${index + 1}: ${qa.crossAnswer}` : ''}
Score: ${qa.score}/10
`).join('\n')}

Provide a comprehensive evaluation with:
1. Overall score (0-100)
2. Skill breakdown (communication, technical, problemSolving, leadership, cultural) - each 0-10
3. Top 3 strengths
4. Top 3 areas for improvement
5. Specific recommendations for growth
6. Overall feedback summary

Return as JSON:
{
  "overallScore": number,
  "skillBreakdown": {
    "communication": number,
    "technical": number,
    "problemSolving": number,
    "leadership": number,
    "cultural": number
  },
  "strengths": ["string", "string", "string"],
  "improvements": ["string", "string", "string"],
  "recommendations": ["string", "string", "string"],
  "overallFeedback": "string"
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: reportPrompt }],
        max_tokens: 800,
        temperature: 0.3
      });

      return JSON.parse(completion.choices[0].message.content.trim());
    } catch (error) {
      console.error('GPT Report Generation Error:', error);
      
      // Fallback report generation
      const avgScore = allQuestionsAndAnswers.reduce((sum, qa) => sum + qa.score, 0) / allQuestionsAndAnswers.length;
      const overallScore = Math.round((avgScore / 10) * 100);
      
      return {
        overallScore,
        skillBreakdown: {
          communication: Math.min(10, avgScore + Math.random() * 2 - 1),
          technical: Math.min(10, avgScore + Math.random() * 2 - 1),
          problemSolving: Math.min(10, avgScore + Math.random() * 2 - 1),
          leadership: Math.min(10, avgScore + Math.random() * 2 - 1),
          cultural: Math.min(10, avgScore + Math.random() * 2 - 1)
        },
        strengths: [
          "Shows good understanding of core concepts",
          "Communicates ideas clearly",
          "Demonstrates relevant experience"
        ],
        improvements: [
          "Provide more specific examples",
          "Structure answers more systematically",
          "Elaborate on technical details"
        ],
        recommendations: [
          "Practice with more technical scenarios",
          "Work on storytelling techniques",
          "Review industry best practices"
        ],
        overallFeedback: `You scored ${overallScore}/100 in this ${type} interview. Your performance shows ${overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : 'developing'} skills with room for growth in specific areas.`
      };
    }
  }
}

module.exports = new GPTService();