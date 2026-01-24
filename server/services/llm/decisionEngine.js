import { GoogleGenerativeAI } from '@google/generative-ai';
import Session from '../../models/Session.js';

/**
 * LLM Decision Engine using Google Gemini
 * Evaluates user responses in real-time and makes intelligent decisions
 */

class DecisionEngine {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            console.warn('GEMINI_API_KEY not set - Decision engine will not function');
        } else {
            console.log('✅ Gemini decision engine initialized with API key');
        }

        this.genAI = null;
        this.model = null;

        if (this.apiKey) {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
            });
            console.log('✅ Gemini model set to gemini-1.5-flash');
        }
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
        try {
            if (!this.model) {
                throw new Error('Gemini model not initialized');
            }

            // Fetch session
            const session = await Session.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Build prompt
            const prompt = this.buildPrompt(session, partialTranscript, session.conversationHistory);

            // Call Gemini
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON response
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const decision = JSON.parse(cleanedText);

            // Validate decision
            const validActions = ['CONTINUE_LISTENING', 'INTERRUPT', 'PROBE_DEEPER', 'CHANGE_DIRECTION', 'MOVE_FORWARD'];
            if (!validActions.includes(decision.action)) {
                console.warn('Invalid action from Gemini:', decision.action);
                decision.action = 'CONTINUE_LISTENING';
            }

            // Update session state if weakness detected
            if (decision.weaknessDetected && session.state.weaknessTracker[decision.weaknessDetected] !== undefined) {
                session.state.weaknessTracker[decision.weaknessDetected] += 1;
            }

            // Adjust difficulty curve
            if (decision.difficultyAdjustment) {
                session.state.difficultyCurve = Math.max(0, Math.min(10,
                    session.state.difficultyCurve + decision.difficultyAdjustment
                ));
            }

            // Update interruption or probe counts
            if (decision.action === 'INTERRUPT') {
                session.state.interruptionCount += 1;
            } else if (decision.action === 'PROBE_DEEPER') {
                session.state.probeDepthCount += 1;
            }

            await session.save();

            return decision;

        } catch (error) {
            console.error('Decision engine error:', error);
            // Fallback to safe default
            return {
                action: 'CONTINUE_LISTENING',
                response: '',
                reason: 'Error in evaluation',
                weaknessDetected: null
            };
        }
    }

    /**
     * Generate opening question based on session setup
     * @param {string} sessionId - Session ID
     * @returns {Promise<string>} Opening question
     */
    async generateOpeningQuestion(sessionId) {
        try {
            if (!this.model) {
                throw new Error('Gemini model not initialized');
            }

            const session = await Session.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
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

            // Store in conversation history
            session.conversationHistory.push({
                role: 'ai',
                content: question,
                timestamp: new Date()
            });

            session.systemPrompt = prompt;
            await session.save();

            return question;

        } catch (error) {
            console.error('Failed to generate opening question:', error);
            // Fallback to a safe default question if session fetch fails
            return "Hello! I'm your interviewer today. To get started, could you please introduce yourself and tell me about your background?";
        }
    }
}

// Export singleton instance
export default new DecisionEngine();
