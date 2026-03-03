import { GoogleGenerativeAI } from '@google/generative-ai';
import Session from '../../models/Session.js';

/**
 * LLM Decision Engine using Google Gemini
 * Evaluates user responses in real-time and makes intelligent decisions
 */

class DecisionEngine {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.genAI = null;
        this.model = null;
        this.rateLimitedUntil = null; // timestamp — skip API calls until this clears

        if (!this.apiKey) {
            console.warn('⚠️  GEMINI_API_KEY not set — LLM will use template fallbacks');
        } else {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            console.log('✅ Gemini decision engine initialized with API key');
            console.log('✅ Gemini model set to gemini-2.0-flash');
        }
    }

    /** Returns true if we're currently rate-limited */
    isRateLimited() {
        if (!this.rateLimitedUntil) return false;
        if (Date.now() < this.rateLimitedUntil) return true;
        // Limit expired — clear it
        this.rateLimitedUntil = null;
        console.log('✅ Gemini rate limit window cleared — resuming API calls');
        return false;
    }

    /** Extract retryDelay seconds from a 429 error and set rateLimitedUntil */
    handleRateLimit(error) {
        const isQuota = error?.status === 429;
        if (!isQuota) return;
        // Try to parse the retryDelay from errorDetails
        let delaySecs = 60; // safe default
        try {
            const retryInfo = error.errorDetails?.find(d => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
                delaySecs = parseInt(retryInfo.retryDelay) + 5; // +5s buffer
            }
        } catch (_) { }
        this.rateLimitedUntil = Date.now() + delaySecs * 1000;
        const waitMin = Math.ceil(delaySecs / 60);
        console.warn(`⚠️  Gemini 429: rate limited for ${delaySecs}s (~${waitMin} min). Using template fallback until then.`);
    }

    // ─── Template-based opening questions ──────────────────────────────────────
    getTemplateOpeningQuestion(session) {
        const { mode, scenario, difficulty } = session;
        const role = (scenario?.role || 'professional').toLowerCase();
        const company = scenario?.company ? ` at ${scenario.company}` : '';
        const lvl = difficulty || 'medium';

        // Mode-specific openers
        if (mode === 'drill') {
            const drillQuestions = [
                `Let's do a rapid-fire drill. I'll give you 60 seconds: describe your biggest technical challenge to date as ${role}.`,
                `Drill mode. No preamble — directly state the most important skill that makes you qualified as a ${role}.`,
                `Speed round: What's the single most impactful project you've delivered as a ${role}? Be specific.`,
            ];
            return drillQuestions[Math.floor(Math.random() * drillQuestions.length)];
        }

        if (mode === 'presentation') {
            return `You have 2 minutes. Pitch yourself for the ${role} role${company} — structure it as Problem → Solution → Impact.`;
        }

        // Interview mode — keyed by difficulty
        const byDifficulty = {
            easy: [
                `Welcome! To start, tell me about your background and what excites you most about the ${role} role${company}.`,
                `Let's begin. Walk me through your experience that's most relevant to the ${role} position.`,
                `Hi! Tell me — what made you pursue a career in this field, and what draws you to the ${role} opportunity?`,
            ],
            medium: [
                `Tell me about a time you had to make a difficult decision without all the information you needed. What was your process?`,
                `As a ${role}, describe the most complex problem you've solved end-to-end. Take me through your thinking.`,
                `What's the biggest failure in your career so far, and how did it change the way you work?`,
                `Walk me through a situation where you had to lead or influence without formal authority.`,
            ],
            hard: [
                `You have 90 seconds. Tell me about a time a project you owned failed to meet expectations — what was YOUR specific contribution to that failure and what would you do differently?`,
                `Describe the most technically complex or strategically ambiguous challenge you've faced as a ${role}. I'll push back on your answer.`,
                `What's the most controversial decision you've made in your career? Walk me through the trade-offs you weighed.`,
                `Tell me about a time a senior stakeholder disagreed with your recommendation. How did you handle it — and who was right?`,
            ],
        };

        const pool = byDifficulty[lvl] || byDifficulty.medium;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // ─── Template-based probe questions (used when API is down) ────────────────
    getTemplateProbeFallback(partialTranscript) {
        const probes = [
            'Can you be more specific? What was your exact role in that?',
            'Tell me more — what was the measurable outcome of that?',
            'Pause there. What was the biggest risk in that approach?',
            'Good. Now quantify it — what was the actual impact?',
            'Interesting. What would you do differently if you had to do it again?',
        ];
        return probes[Math.floor(Math.random() * probes.length)];
    }

    /**
     * Build system prompt for evaluation
     */
    buildPrompt(session, partialTranscript, conversationHistory) {
        const { mode, scenario, skillsToEvaluate, difficulty, state } = session;

        return `You are a strict communication evaluator conducting a ${mode} session.

**Session Context:**
- Role: ${scenario.role}
- Company: ${scenario.company || 'N/A'}
- Skills to evaluate: ${skillsToEvaluate.join(', ')}
- Current difficulty: ${difficulty}  
- Conversation stage: ${state.stage}
- Current difficulty curve: ${state.difficultyCurve}/10

**User's current response (partial):** "${partialTranscript}"

**Recent conversation history:**
${conversationHistory.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}

**Your task:** Evaluate the user's response in REAL-TIME and return EXACTLY ONE action.

**Available Actions:**
1. **CONTINUE_LISTENING** - User is coherent and making sense, let them finish
2. **INTERRUPT** - User is rambling, unclear, or going off-topic - request clarification
3. **PROBE_DEEPER** - User finished a point but needs follow-up on last statement
4. **CHANGE_DIRECTION** - Shift topic or increase difficulty based on performance
5. **MOVE_FORWARD** - Close current topic and proceed to next question

**Evaluation criteria:**
- Clarity: Are they structuring thoughts clearly?
- Structure: Are they using frameworks (STAR, problem-solution)?
- Confidence: Are they hesitating or showing certainty?
- Depth: Are they providing sufficient detail?

**Response format (MUST be valid JSON):**
{
  "action": "INTERRUPT",
  "response": "Pause. Can you clarify what you mean by X?",
  "reason": "User is using vague language without structure",
  "weaknessDetected": "clarity",
  "difficultyAdjustment": 0
}

**Important rules:**
- Use INTERRUPT sparingly - only when genuinely needed
- PROBE_DEEPER should ask about specifics from their last statement
- difficultyAdjustment: -1 to 1 (decrease/increase difficulty curve)
- weaknessDetected: one of [clarity, structure, confidence, depth] or null

Return ONLY the JSON object, no additional text.`;
    }

    /**
     * Evaluate partial transcript and make decision
     * @param {string} sessionId - Session ID
     * @param {string} partialTranscript - Current user speech
     * @returns {Promise<object>} Decision object
     */
    async evaluate(sessionId, partialTranscript) {
        // AI interruption and live evaluation is disabled for clean platform operation
        return {
            action: 'CONTINUE_LISTENING',
            response: '',
            reason: 'Live AI interruption disabled',
            weaknessDetected: null
        };
    }

    /**
     * Generate opening question based on session setup
     * @param {string} sessionId - Session ID
     * @returns {Promise<string>} Opening question
     */
    async generateOpeningQuestion(sessionId) {
        try {
            const session = await Session.findById(sessionId);
            if (!session) throw new Error('Session not found');

            // If rate-limited or no model — use smart template immediately
            if (this.isRateLimited() || !this.model) {
                const question = this.getTemplateOpeningQuestion(session);
                console.log('📋 Using template opening question (API unavailable)');
                await session.addTranscript('ai', question);
                return question;
            }

            const { mode, scenario, difficulty } = session;
            const prompt = `You are conducting a ${mode} session for the role of ${scenario.role}${scenario.company ? ` at ${scenario.company}` : ''}.

Difficulty level: ${difficulty}

Generate a concise, professional opening question to start the session. The question should:
- Be appropriate for a ${difficulty} difficulty level
- Set a professional tone
- Be relevant to the ${scenario.role} role
- Be open-ended to encourage detailed responses

Return ONLY the question text, no additional commentary.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const question = response.text().trim();

            session.conversationHistory.push({ role: 'ai', content: question, timestamp: new Date() });
            session.systemPrompt = prompt;
            await session.save();

            return question;

        } catch (error) {
            this.handleRateLimit(error);
            console.error('Failed to generate opening question:', error.message || error);
            // Always return a contextual fallback — never a blank or generic message
            try {
                const session = await Session.findById(sessionId);
                if (session) return this.getTemplateOpeningQuestion(session);
            } catch (_) { }
            return "Let's begin. Walk me through your most relevant experience for this role.";
        }
    }
}

// Export singleton instance
export default new DecisionEngine();
