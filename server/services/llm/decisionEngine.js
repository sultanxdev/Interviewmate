import { GoogleGenerativeAI } from '@google/generative-ai';
import Session from '../../models/Session.js';

/**
 * LLM Decision Engine using Google Gemini
 * Handles all AI logic for the interview: opening questions, follow-up questions, evaluation
 */

class DecisionEngine {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.genAI = null;
        this.model = null;
        this.rateLimitedUntil = null;

        if (!this.apiKey) {
            console.warn('⚠️  GEMINI_API_KEY not set — LLM will use template fallbacks');
        } else {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            console.log('✅ Gemini decision engine initialized');
        }
    }

    /** Returns true if we're currently rate-limited */
    isRateLimited() {
        if (!this.rateLimitedUntil) return false;
        if (Date.now() < this.rateLimitedUntil) return true;
        this.rateLimitedUntil = null;
        console.log('✅ Gemini rate limit window cleared');
        return false;
    }

    /** Handle 429 rate limit errors */
    handleRateLimit(error) {
        const isQuota = error?.status === 429;
        if (!isQuota) return;
        let delaySecs = 60;
        try {
            const retryInfo = error.errorDetails?.find(d => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
                delaySecs = parseInt(retryInfo.retryDelay) + 5;
            }
        } catch (_) { }
        this.rateLimitedUntil = Date.now() + delaySecs * 1000;
        console.warn(`⚠️  Gemini 429: rate limited for ${delaySecs}s. Using template fallback.`);
    }

    // ─── Template-based opening questions ──────────────────────────────────────
    getTemplateOpeningQuestion(session) {
        const { mode, scenario, difficulty } = session;
        const role = (scenario?.role || 'professional').toLowerCase();
        const company = scenario?.company ? ` at ${scenario.company}` : '';
        const lvl = difficulty || 'medium';

        if (mode === 'drill') {
            const questions = [
                `Let's do a rapid-fire drill. In 60 seconds: describe your biggest technical challenge to date as a ${role}.`,
                `Drill mode — no preamble. State the most important skill that makes you qualified as a ${role}.`,
                `Speed round: What's the single most impactful project you've delivered as a ${role}? Be specific.`,
            ];
            return questions[Math.floor(Math.random() * questions.length)];
        }

        if (mode === 'presentation') {
            return `You have 2 minutes. Pitch yourself for the ${role} role${company} — structure it as Problem → Solution → Impact.`;
        }

        const byDifficulty = {
            easy: [
                `Welcome! To start, tell me about your background and what excites you most about the ${role} role${company}.`,
                `Hi! Walk me through your experience that's most relevant to the ${role} position.`,
                `Tell me — what made you pursue a career in this field, and what draws you to the ${role} opportunity?`,
            ],
            medium: [
                `Tell me about a time you had to make a difficult decision without all the information you needed. What was your process?`,
                `As a ${role}, describe the most complex problem you've solved end-to-end. Take me through your thinking.`,
                `What's the biggest professional failure in your career so far, and how did it change the way you work?`,
                `Walk me through a situation where you had to lead or influence without formal authority.`,
            ],
            hard: [
                `You have 90 seconds. Tell me about a time a project you owned failed to meet expectations — what was YOUR specific contribution to that failure, and what would you do differently?`,
                `Describe the most technically complex or strategically ambiguous challenge you've faced as a ${role}. I'll push back on your answer.`,
                `What's the most controversial decision you've made in your career? Walk me through the trade-offs you weighed.`,
                `Tell me about a time a senior stakeholder disagreed with your recommendation. How did you handle it — and who was right?`,
            ],
        };

        const pool = byDifficulty[lvl] || byDifficulty.medium;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // ─── Template-based follow-up/next questions ───────────────────────────────
    getTemplateNextQuestion(session, questionIndex) {
        const { scenario, difficulty } = session;
        const role = scenario?.role || 'this role';

        const followUps = [
            `Can you elaborate on that? What was the specific outcome or measurable impact?`,
            `Interesting. Can you walk me through your decision-making process in more detail?`,
            `That's helpful context. Now, tell me about a time you had to adapt quickly to an unexpected challenge in your work as a ${role}.`,
            `Good. Let me shift topics — how do you approach collaboration and communication with cross-functional teams?`,
            `Tell me about a project where you had to learn something new on the fly to deliver results. What was your approach?`,
            `What's a technical or professional skill you're currently working to improve, and why?`,
            `Describe a situation where you had to prioritize competing deadlines. How did you handle it?`,
            `Tell me about a time you received critical feedback. How did you respond to it?`,
        ];

        return followUps[questionIndex % followUps.length];
    }

    /**
     * Generate the opening question for a session
     * @param {string} sessionId
     * @returns {Promise<string>} Opening question text
     */
    async generateOpeningQuestion(sessionId) {
        try {
            const session = await Session.findById(sessionId);
            if (!session) throw new Error('Session not found');

            if (this.isRateLimited() || !this.model) {
                const question = this.getTemplateOpeningQuestion(session);
                console.log('📋 Using template opening question (API unavailable)');
                return question;
            }

            const { mode, scenario, difficulty } = session;
            const prompt = `You are a professional interviewer conducting a ${mode} session for the role of ${scenario.role}${scenario.company ? ` at ${scenario.company}` : ''}.

Difficulty level: ${difficulty}
Skills to evaluate: ${session.skillsToEvaluate?.join(', ') || 'general professional skills'}

Generate a concise, professional opening question to start the interview. The question should:
- Be appropriate for a ${difficulty} difficulty level
- Set a professional, natural tone
- Be relevant to the ${scenario.role} role
- Be open-ended to encourage a detailed response
- Sound natural when spoken aloud (this will be converted to speech)

Return ONLY the question text, no additional commentary, no quotation marks.`;

            const result = await this.model.generateContent(prompt);
            const question = result.response.text().trim().replace(/^["']|["']$/g, '');

            console.log(`✅ Generated opening question via Gemini`);
            return question;

        } catch (error) {
            this.handleRateLimit(error);
            console.error('Failed to generate opening question:', error.message || error);
            try {
                const session = await Session.findById(sessionId);
                if (session) return this.getTemplateOpeningQuestion(session);
            } catch (_) { }
            return "Let's begin. Walk me through your most relevant experience for this role.";
        }
    }

    /**
     * Generate the next AI question/response based on the user's answer
     * @param {string} sessionId
     * @param {string} userAnswer - User's latest answer (transcribed text)
     * @param {number} turnIndex - How many turns have happened (0-based)
     * @returns {Promise<{ text: string, isComplete: boolean }>}
     */
    async generateNextQuestion(sessionId, userAnswer, turnIndex) {
        try {
            const session = await Session.findById(sessionId);
            if (!session) throw new Error('Session not found');

            // Check if session duration is nearly up
            const maxTurns = Math.max(3, Math.floor(session.duration / 3));
            const isLastTurn = turnIndex >= maxTurns - 1;

            if (this.isRateLimited() || !this.model) {
                const text = isLastTurn
                    ? "Thank you for your time today. That brings us to the end of our interview. You've done a great job sharing your experiences. Best of luck!"
                    : this.getTemplateNextQuestion(session, turnIndex);
                return { text, isComplete: isLastTurn };
            }

            const { mode, scenario, difficulty, skillsToEvaluate } = session;

            // Build conversation history for context
            const history = session.conversationHistory
                .slice(-8) // last 4 turns (ai + user each)
                .map(h => `${h.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${h.content}`)
                .join('\n');

            const closingInstruction = isLastTurn
                ? `\n\nIMPORTANT: This is the LAST question of the interview. After the candidate answers, the interview will end. Generate a brief, warm closing statement that thanks the candidate and wraps up professionally. Do NOT ask another question — instead, say something like "Thank you for your time, [name if known], this concludes our interview. You've done a great job..." Make it sound final and warm.`
                : '';

            const prompt = `You are a professional ${mode} interviewer for the role of ${scenario.role}${scenario.company ? ` at ${scenario.company}` : ''}.

Interview context:
- Difficulty: ${difficulty}
- Skills being evaluated: ${skillsToEvaluate?.join(', ') || 'general professional skills'}
- Turn number: ${turnIndex + 1} of ${maxTurns}

Recent conversation:
${history}

The candidate just said: "${userAnswer}"

Your task: Respond naturally as the interviewer. You can:
1. Briefly acknowledge their answer (1 sentence max)
2. Ask a relevant follow-up question OR move to a new topic

Guidelines:
- Be conversational and professional
- Keep it concise — 1-3 sentences total
- Ask only ONE question
- Make it relevant to their answer or the role
- Sound natural when spoken aloud (this will be converted to audio)
- Do NOT repeat questions already asked
${closingInstruction}

Return ONLY your response text, no labels, no quotation marks.`;

            const result = await this.model.generateContent(prompt);
            const text = result.response.text().trim().replace(/^["']|["']$/g, '');

            console.log(`✅ Generated next question (turn ${turnIndex + 1}/${maxTurns})`);
            return { text, isComplete: isLastTurn };

        } catch (error) {
            this.handleRateLimit(error);
            console.error('Failed to generate next question:', error.message || error);
            try {
                const session = await Session.findById(sessionId);
                if (session) {
                    const maxTurns = Math.max(3, Math.floor(session.duration / 3));
                    const isLastTurn = turnIndex >= maxTurns - 1;
                    if (isLastTurn) {
                        return { text: "Thank you for your time. That concludes our interview today. Best of luck!", isComplete: true };
                    }
                    return { text: this.getTemplateNextQuestion(session, turnIndex), isComplete: false };
                }
            } catch (_) { }
            return { text: "Thank you for sharing that. Let's move on — tell me about another relevant experience.", isComplete: false };
        }
    }
}

// Export singleton instance
export default new DecisionEngine();
