# Interview Preparation — Technical Questions & Answers

This guide prepares you to defend the technical design and coding decisions of **InterviewMate** in engineering job interviews or project presentations.

---

## Category 1: System Design & AI Voice Integration

### Q1: How did you implement real-time voice streaming with near-zero latency?
**Answer:**
We integrated the **Vapi.ai Web SDK** using WebRTC connection protocols on the frontend. Rather than uploading static audio blocks from the microphone, WebRTC opens a low-latency, bidirectional media stream. Vapi handles speech-to-text (STT) parsing on their gateway, routes text to an LLM context (GPT-4o), and streams synthesis audio back using low-latency text-to-speech (TTS) models. This flow achieves an average audio response latency of under 200 milliseconds, mimicking human phone conversations.

### Q2: Why did you decouple the live interview voice stream from the transcript analysis?
**Answer:**
Generating a multi-dimensional performance analysis report (scoring 8 metrics and generating custom model answers for every question) is computationally heavy and takes 10 to 15 seconds. 
If we made this request synchronous:
1. The user's browser would freeze, showing a blocking loader for a long duration.
2. The HTTP connection would likely trigger a **504 Gateway Timeout** in production (most host servers close connections after 10-15 seconds).
By separating them, the conversation ends instantly, the backend responds immediately with `analysis_pending`, and a background worker evaluates the transcript asynchronously. The frontend simply polls the result status, keeping the user experience responsive.

### Q3: How does your multi-model fallback queue work on the backend?
**Answer:**
LLM API services are prone to rate limits (HTTP 429) and network failures. To make the evaluation pipeline robust, I created a fallback loop in the backend analysis service:
- We define an array of three candidate OpenRouter LLM endpoints in order: Gemini 3.5 Flash, Gemini 2.5 Flash, and Gemini 3.1 Pro.
- The service wraps requests in a `try...catch` block.
- If an endpoint returns an HTTP 429 status code or fails, the code catches the error, logs a warning, and immediately continues the loop to request the transcript analysis from the next available model in the array.

---

## Category 2: Frontend Engineering (React 19 & Vite)

### Q4: React 18+ mounts components twice in Strict Mode during development. Did this affect your WebRTC connection, and how did you resolve it?
**Answer:**
Yes, this was a significant issue. In Strict Mode, the double-mounting of the `InterviewSession` component triggered Vapi's startup effect twice, resulting in two concurrent WebRTC connections. This caused audio echoing and doubled API usage costs.
I resolved this by implementing a **singleton pattern outside of the React lifecycle**. I declared `globalVapiInstance` at the module scope of the file rather than inside a React `useState` or `useRef`. During mounting, the effect checks if an instance is already active; if so, it reuses it instead of spinning up a second connection.

### Q5: How did you prevent the "login page flash" when a logged-in user refreshes the page?
**Answer:**
On page refresh, the user's React state is reset. If the app immediately redirects based on state, it will briefly display the `/signin` page because loading the token from `localStorage` and validating it via the backend takes a few hundred milliseconds.
To fix this, I added an `isLoaded` state to the `AuthContext`. 
```javascript
const ProtectedRoute = () => {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null; // Render nothing during restore check
  return isSignedIn ? <Outlet /> : <Navigate to="/signin" replace />;
};
```
The `ProtectedRoute` renders a blank state or a spinner while `isLoaded` is false. Only after the validation fetch resolves and `isLoaded` changes to true does the router redirect or render the dashboard.

---

## Category 3: Backend & Database (Node.js & MongoDB)

### Q6: Why did you build custom JWT authentication instead of using hosted services like Clerk or Auth0?
**Answer:**
While Clerk and Auth0 are good for fast development, they limit your architectural control over route protection and tie you to external vendors. I implemented custom JWT auth to:
1. Retain complete control over authorization payloads and tokens.
2. Establish secure, database-level route protection without relying on third-party API availability.
3. Make the codebase self-contained, lightweight, and free from external user quotas or pricing tiers.

### Q7: Mongoose models use the `ref` option to define relations. What is a common bug here, and does it exist in your project?
**Answer:**
A common bug occurs when the `ref` string in a schema does not match the exact model name registered in `mongoose.model()`. 
In this project, the `InterviewSession` schema defines a relation to users:
```javascript
userId: { type: Schema.Types.ObjectId, ref: 'userModel' }
```
However, the user model is registered with mongoose as `'User'`. While this does not break queries that search by `userId` explicitly, it would cause Mongoose's `.populate('userId')` to fail since it would search for a model registered as `'userModel'`. To fix this, the reference parameter must be updated to `'User'`.

---

## Category 4: Scalability & Performance

### Q8: If this platform scaled to 10,000 active concurrent users, what bottlenecks would you hit and how would you resolve them?
**Answer:**
We would hit three primary bottlenecks:
1. **API Rate Limits**: OpenRouter/Gemini endpoints would hit concurrent rate limits quickly.
   - *Resolution*: Introduce a Redis-backed message broker (such as BullMQ) to queue transcript analysis tasks, processing them at a controlled rate without dropping requests.
2. **Database Connection Limits**: MongoDB would experience high write pressure during concurrent transcript saves.
   - *Resolution*: Implement MongoDB indexing on `userId` and `createdAt` keys, and use connection pooling to manage the concurrent load.
3. **WebRTC Gateway Costs**: Direct Vapi voice gateway connections would become expensive.
   - *Resolution*: Move towards hosting our own open-source WebRTC signaling servers (e.g., LiveKit) to directly stream voice inputs to LLM models, lowering integration costs.
