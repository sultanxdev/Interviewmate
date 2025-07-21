const Interview = require('../models/Interview');
const Report = require('../models/Report');
const aiService = require('./aiService');
const voiceService = require('./voiceService');

class InterviewService {
  // Create new interview session
  async createSession(userId, config) {
    try {
      // Generate personalized questions using AI
      const questions = await aiService.generateQuestions(config);
      
      const interview = new Interview({
        userId,
        config,
        status: 'setup',
        questions: questions.map(q => ({
          mainQuestion: q.question,
          category: q.category,
          answer: '',
          crossQuestion: '',
          crossAnswer: '',
          audioFiles: {},
          timestamp: new Date()
        })),
        startedAt: null,
        completedAt: null
      });

      await interview.save();
      return interview;
    } catch (error) {
      console.error('Error creating interview session:', error);
      throw new Error('Failed to create interview session');
    }
  }

  // Start interview session
  async startSession(sessionId) {
    try {
      const interview = await Interview.findById(sessionId);
      if (!interview) {
        throw new Error('Interview session not found');
      }

      interview.status = 'in_progress';
      interview.startedAt = new Date();
      await interview.save();

      // Generate audio for first question
      const firstQuestion = interview.questions[0];
      const audioResult = await voiceService.textToSpeech(firstQuestion.mainQuestion);
      
      firstQuestion.audioFiles.questionAudio = audioResult.audioUrl;
      await interview.save();

      return {
        interview,
        currentQuestion: firstQuestion,
        questionAudio: audioResult.audioUrl
      };
    } catch (error) {
      console.error('Error starting interview session:', error);
      throw new Error('Failed to start interview session');
    }
  }

  // Process user's answer to a question
  async processAnswer(sessionId, questionIndex, audioBuffer) {
    try {
      const interview = await Interview.findById(sessionId);
      if (!interview) {
        throw new Error('Interview session not found');
      }

      const question = interview.questions[questionIndex];
      if (!question) {
        throw new Error('Question not found');
      }

      // Transcribe the audio answer
      const transcription = await voiceService.speechToText(audioBuffer);
      question.answer = transcription.transcript;

      // Check if cross-question is needed
      const crossQuestionResult = await aiService.generateCrossQuestion(
        question.mainQuestion,
        question.answer,
        { interviewConfig: interview.config }
      );

      let crossQuestionAudio = null;
      if (crossQuestionResult.needsCrossQuestion && crossQuestionResult.crossQuestion) {
        question.crossQuestion = crossQuestionResult.crossQuestion;
        
        // Generate audio for cross-question
        const audioResult = await voiceService.textToSpeech(crossQuestionResult.crossQuestion);
        question.audioFiles.crossQuestionAudio = audioResult.audioUrl;
        crossQuestionAudio = audioResult.audioUrl;
      }

      await interview.save();

      return {
        transcription: transcription.transcript,
        needsCrossQuestion: crossQuestionResult.needsCrossQuestion,
        crossQuestion: crossQuestionResult.crossQuestion,
        crossQuestionAudio
      };
    } catch (error) {
      console.error('Error processing answer:', error);
      throw new Error('Failed to process answer');
    }
  }

  // Process cross-question answer
  async processCrossAnswer(sessionId, questionIndex, audioBuffer) {
    try {
      const interview = await Interview.findById(sessionId);
      if (!interview) {
        throw new Error('Interview session not found');
      }

      const question = interview.questions[questionIndex];
      if (!question) {
        throw new Error('Question not found');
      }

      // Transcribe the cross-answer
      const transcription = await voiceService.speechToText(audioBuffer);
      question.crossAnswer = transcription.transcript;

      await interview.save();

      return {
        transcription: transcription.transcript
      };
    } catch (error) {
      console.error('Error processing cross-answer:', error);
      throw new Error('Failed to process cross-answer');
    }
  }

  // Get next question with audio
  async getNextQuestion(sessionId, currentIndex) {
    try {
      const interview = await Interview.findById(sessionId);
      if (!interview) {
        throw new Error('Interview session not found');
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex >= interview.questions.length) {
        return null; // No more questions
      }

      const nextQuestion = interview.questions[nextIndex];
      
      // Generate audio if not already generated
      if (!nextQuestion.audioFiles.questionAudio) {
        const audioResult = await voiceService.textToSpeech(nextQuestion.mainQuestion);
        nextQuestion.audioFiles.questionAudio = audioResult.audioUrl;
        await interview.save();
      }

      return {
        question: nextQuestion,
        questionIndex: nextIndex,
        questionAudio: nextQuestion.audioFiles.questionAudio
      };
    } catch (error) {
      console.error('Error getting next question:', error);
      throw new Error('Failed to get next question');
    }
  }

  // Complete interview and generate report
  async completeInterview(sessionId) {
    try {
      const interview = await Interview.findById(sessionId);
      if (!interview) {
        throw new Error('Interview session not found');
      }

      interview.status = 'completed';
      interview.completedAt = new Date();
      await interview.save();

      // Generate complete transcript
      const transcript = this.generateTranscript(interview.questions);

      // Generate AI evaluation report
      const evaluation = await aiService.generateFinalReport(transcript, interview.config);

      // Create and save report
      const report = new Report({
        userId: interview.userId,
        interviewId: interview._id,
        evaluation,
        transcript,
        createdAt: new Date()
      });

      await report.save();

      return {
        interview,
        report,
        evaluation
      };
    } catch (error) {
      console.error('Error completing interview:', error);
      throw new Error('Failed to complete interview');
    }
  }

  // Generate formatted transcript from questions
  generateTranscript(questions) {
    let transcript = '';
    
    questions.forEach((q, index) => {
      transcript += `\n--- Question ${index + 1} ---\n`;
      transcript += `Interviewer: ${q.mainQuestion}\n`;
      transcript += `Candidate: ${q.answer}\n`;
      
      if (q.crossQuestion && q.crossAnswer) {
        transcript += `Interviewer (Follow-up): ${q.crossQuestion}\n`;
        transcript += `Candidate: ${q.crossAnswer}\n`;
      }
    });

    return transcript;
  }

  // Get interview session details
  async getSession(sessionId) {
    try {
      const interview = await Interview.findById(sessionId).populate('userId', 'name email');
      if (!interview) {
        throw new Error('Interview session not found');
      }

      return interview;
    } catch (error) {
      console.error('Error getting interview session:', error);
      throw new Error('Failed to get interview session');
    }
  }

  // Get user's interview history
  async getUserInterviews(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const interviews = await Interview.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email');

      const total = await Interview.countDocuments({ userId });

      return {
        interviews,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      console.error('Error getting user interviews:', error);
      throw new Error('Failed to get interview history');
    }
  }
}

module.exports = new InterviewService();