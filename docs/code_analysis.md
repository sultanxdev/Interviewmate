# Deep-Dive Codebase Analysis — InterviewMate Architecture

This document contains a comprehensive architectural and code-level breakdown of the **InterviewMate** mock interview platform. It covers every directory, configuration, data schema, route, controller, context, and page in detail.

---

## 1. Project Overview & Technology Stack

InterviewMate is a WebRTC-based AI mock interview application that mimics live phone and video screens, recording conversational audio transcripts and scoring developer performances across 8 cognitive categories.

### Technologies:
- **Backend Core**: Node.js + Express.js
- **Database Layer**: MongoDB + Mongoose ORM
- **Frontend Build**: React 19 + Vite + TailwindCSS + Vanilla CSS (shared styles)
- **AI Voice Stream**: Vapi.ai (WebRTC protocol)
- **AI Analysis Engine**: OpenRouter API → Google Gemini models (3.5 Flash, 2.5 Flash, 3.1 Pro)
- **Authentication**: Stateless JSON Web Tokens (JWT) + Bcrypt password hashing

---

## 2. Directory Structure Blueprint

The monorepo contains the following workspace structure:

```text
Interviewmate/
├── .env.example                        # Template for all environment configurations
├── Docs/
│   └── interview-flow.png              # Architecture system flow diagram
│
├── backend/
│   ├── .env                            # Backend private config (ignored)
│   ├── index.js                        # Node server entry point
│   ├── config/
│   │   └── db.js                       # Mongoose MongoDB connectivity
│   ├── controllers/
│   │   ├── authController.js           # Sign-up, Sign-in, and profile queries
│   │   └── vapiInterviewController.js  # Starts calls, stores transcripts, manages polling
│   ├── middleware/
│   │   └── auth.js                     # JWT authorization verification handler
│   ├── models/
│   │   ├── User.js                     # User account validation schema
│   │   └── interviewSessionModel.js    # Interview logs & scoring report schema
│   ├── routes/
│   │   ├── auth.js                     # Auth router definition (/api/auth)
│   │   ├── user.js                     # User profile router (currently blank)
│   │   └── vapiInterviewRoutes.js      # Main session and report router (/api/vapi-interview)
│   ├── services/
│   │   └── InterviewResponseAnalyzer.js  # OpenRouter Gemini analyzer client
│   └── utils/
│       ├── ApiError.js                 # Custom HTTP error structure handler
│       └── asyncHandler.js             # Async wrapper resolving Express try-catch blocks
│
└── frontend/
    ├── .env                            # Client base URLs & keys (ignored)
    ├── vite.config.js                  # Vite compiler configurations
    ├── tailwind.config.js              # Utility utility tailwind layouts
    ├── postcss.config.js               # CSS preprocessor configs
    └── src/
        ├── main.jsx                    # React bootstrap mounts
        ├── App.jsx                     # Router mappings & status health checker
        ├── App.css                     # Custom CSS declarations for landing page
        ├── index.css                   # Global Tailwind bindings and variable tokens
        ├── constants/
        │   └── agents.js               # 11 interviewer profile definitions
        ├── context/
        │   ├── AppContext.jsx          # Static configuration constants
        │   ├── AuthContext.jsx         # Global state for credentials & tokens
        │   └── InterviewContext.jsx    # Session states, transcripts, and reports
        ├── layout/
        │   └── InterviewLayout.jsx     # Dashboard shell (Sidebar + child page Outlet)
        ├── components/
        │   └── layouts/
        │       ├── layout.jsx          # Public navbar and premium footer
        │       └── Sidebar.jsx         # Authenticated side drawer navigation panel
        └── pages/
            ├── Homepage.jsx            # Redesigned premium landing page
            ├── SignIn.jsx              # Credentials sign-in page
            ├── SignUp.jsx              # Registration page
            ├── DashboardOverview.jsx   # Radar chart metrics summary
            ├── CreateInterview.jsx     # Left camera setup & right configuration form
            ├── InterviewSession.jsx    # Live WebRTC Vapi audio canvas UI
            ├── InterviewResult.jsx     # Detailed scoring breakdown panel
            └── PastInterviews.jsx      # Paginated table showing session archives
```

---

## 3. Detailed File Analysis: Backend

### 3.1 Server Entry Point (`backend/index.js`)
- **Responsibility**: Bootstraps the Express application.
- **Key Functions & Flow**:
  1. Loads variables via `dotenv.config()`.
  2. Invokes `connectDB()` to connect Mongoose.
  3. Registers global middlewares: `cors()` for cross-origin resource requests, and `express.json()` to parse payloads.
  4. Mounts routers:
     - `/api/auth` mapping to `routes/auth.js`.
     - `/api/vapi-interview` mapping to `routes/vapiInterviewRoutes.js`.
     - `/api/health` returning an inline status JSON: `{ status: "OK", message: "InterviewMate API is running..." }`.
  5. Registers a **Global Error Middleware** interceptor:
     ```javascript
     app.use((err, req, res, next) => {
       const statusCode = err.statusCode || 500;
       const message = err.message || "Internal Server Error";
       res.status(statusCode).json({
         success: false,
         message,
         errors: err.errors || []
       });
     });
     ```

### 3.2 MongoDB Database Connection (`backend/config/db.js`)
- **Responsibility**: Manages the connection pool to MongoDB.
- **Key Function**:
  - `connectDB()`: Calls `mongoose.connect(process.env.MONGODB_URI)`. Returns connection metadata on success or terminates the Node process with code `1` on error.

### 3.3 Custom JWT Authentication Middleware (`backend/middleware/auth.js`)
- **Responsibility**: Authenticates and authorizes secure API calls.
- **Key Flow**:
  1. Inspects headers for `Authorization: Bearer <JWT>`. Throws a `401 Unauthorized` if missing.
  2. Runs `jwt.verify(token, process.env.JWT_SECRET)`. If expired or tempered, catches error and returns `401`.
  3. Decodes the token to find `userId`, and performs a database lookup: `await User.findById(decoded.userId).select("-password")`.
  4. If the user does not exist, returns `404 Not Found`.
  5. Attaches profile metadata to the request (`req.user = user`) and calls `next()`.

### 3.4 Data Models

#### User Schema (`backend/models/User.js`)
Stores authentication profiles:
- `email`: String (lowercase, unique, trimmed, required)
- `password`: String (required) - stores 12-round Bcrypt hashes
- `firstName`: String (trimmed)
- `lastName`: String (trimmed)
- `avatar`: String (URL, optional)
- `role`: String (enum: `['user', 'admin']`, default: `'user'`)
- Timestamps enabled (`createdAt`, `updatedAt` auto-tracked).

#### Interview Session Schema (`backend/models/interviewSessionModel.js`)
Saves mock interview transcripts, configurations, and AI ratings:
- `userId`: ObjectId (required, references `'User'`)
- `interviewType`: String (enum: `['behavioral', 'technical', 'hr', 'general']`, required)
- `status`: String (enum: `['initialized', 'in_progress', 'analysis_pending', 'completed', 'analysis_failed', 'failed']`, default: `'initialized'`)
- `vapiCallId`: String (optional)
- `transcript`: String (default: `""`) - saves conversational speech
- `report`:
  - `overallScore`: Number
  - `feedback`: String
  - `strengths`: [String]
  - `weaknesses`: [String]
  - `suggestions`: [String]
  - `detailedAnalysis`: Mixed (stores raw OpenRouter JSON object schema)
- `metadata`:
  - `uploadedInfo`: String (Resume or Job Description content)
  - `role`: String (Job Title)
  - `level`: String (Seniority level)
  - `agentName`: String (Interviewer persona name)
- `createdAt`: Date (default: `Date.now`)

### 3.5 Handlers & Controllers

#### Authentication Controller (`backend/controllers/authController.js`)
- **`register`**: Extracts sign-up details, enforces uniqueness checks, hashes the password via `bcrypt.hash(password, 12)`, saves the user document, issues a signed JWT, and returns the token and user data.
- **`login`**: Finds user by email, compares password hashes using `bcrypt.compare(password, user.password)`, generates a signed JWT, and returns it.
- **`getMe`**: Returns the caller's user record (previously decoded and attached by middleware).

#### Interview Controller (`backend/controllers/vapiInterviewController.js`)
- **`startInterview`**:
  - Creates a new `InterviewSession` document in the database with status `initialized`.
  - Dynamically builds a system prompt injecting job role, level, and resume/JD details.
  - Returns `sessionId`, `systemPrompt`, and `vapiPublicKey`.
- **`getInterviewReport`**:
  - Queries the DB for the session by ID. Used by the client to poll the status.
- **`generateReportFromTranscript`**:
  - Saves the raw transcript array as a single formatted text block.
  - Sets the status to `analysis_pending`.
  - Immediately returns an HTTP 200 response to release the client thread.
  - Triggers an asynchronous IIFE in the background to execute `AnalyzeFullTranscript(transcript)`. Upon completion, updates the session report fields and sets the status to `completed` (or `analysis_failed` if the LLM call fails).
- **`retryAnalysis`**:
  - Re-triggers the background IIFE generator for a session that failed analysis previously.
- **`getUserInterviews`**:
  - Retrieves all historical mock records for `req.user._id` sorted in descending chronological order.

### 3.6 LLM Evaluation Service (`backend/services/InterviewResponseAnalyzer.js`)
- **Responsibility**: Sends the conversation transcript to OpenRouter and parses structured AI feedback.
- **Core Function**:
  - `AnalyzeFullTranscript(transcript)`: Uses an array of Gemini models (`google/gemini-3-flash-preview` → `google/gemini-2.5-flash` → `google/gemini-3.1-pro-preview`) as a failover chain.
  - Formulates system evaluation prompts instructing the model to grade the interview transcript.
  - Enforces structured outputs by passing `response_format: { type: "json_object" }`.
  - **Failover Logic**: If the active model returns an HTTP 429, logs a warning and retries using the next model in the array.
  - **Response Cleaning**: Strips markdown backticks (e.g. ` ```json ` and ` ``` `) and uses Regex patterns to extract clean JSON matching the target schema.

---

## 4. Detailed File Analysis: Frontend

### 4.1 Global Contexts & Providers

#### Auth Context (`frontend/src/context/AuthContext.jsx`)
Manages stateless authentication tokens and local user data:
- On mount: Reads `im_token` from `localStorage`. If it exists, calls `GET /api/auth/me` to restore the user session. Once resolved, sets `isLoaded = true`.
- Exposes:
  - `user` state (holds credentials, first/last names).
  - `token` token string.
  - `isSignedIn` boolean indicator.
  - `isLoaded` authentication restoration status indicator.
  - `login(email, password)` and `register(...)` HTTP action hooks.
  - `logout()` helper (clears `localStorage` and resets states).

#### Interview Context (`frontend/src/context/InterviewContext.jsx`)
Manages configuration parameters and state variables for the current interview session:
- States tracked:
  - `interviewData`: Holds the type, job role, level, context string, and agent selections.
  - `sessionId`: Database session identifier.
  - `transcript`: Array of speech bubbles streamed from WebRTC events.
  - `report`: Evaluation metrics and feedback details.
  - `callStatus`: Enum: `['inactive', 'connecting', 'active']`.
  - `isCameraEnabled` & `isMicEnabled`: Audio/video toggle switches.
- Core Helpers:
  - `resetInterview()`: Clears configuration and state history.

### 4.2 Application Pages

#### Home page (`frontend/src/pages/Homepage.jsx`)
- **Responsibility**: Serves as the landing page and public marketing portal.
- **Key Elements**:
  - Displays platform metrics (11+ personas, low-latency communication, 8 evaluation scores).
  - **Interactive Voice Sandbox Widget**: Runs mock interviews using React timers. Simulates live speech transcript bubbles, typing states, and wave indicators.
  - **FAQ Accordion**: Built using local React state to toggle detail views.
  - **Footer Indicator**: Connects to the backend health endpoint, showing a dynamic "System Online" badge.

#### Setup Room (`frontend/src/pages/CreateInterview.jsx`)
- **Left Panel (Green Room)**:
  - Accesses user cameras using `navigator.mediaDevices.getUserMedia(video: true)` to display a real-time video preview in a `<video>` canvas.
  - Toggles microphone and camera media streams, saving preferences to local contexts.
- **Right Panel (Form)**:
  - Captures the target job title and seniority level.
  - Provides text areas to paste the resume or job description.
  - Selector grid displaying 11 recruiters from `agents.js`.
  - Calls `POST /api/vapi-interview/start` on submit and redirects to `/session`.

#### Interview Session canvas (`frontend/src/pages/InterviewSession.jsx`)
The core interface of the platform:
- **WebRTC Connection**: Initialises Vapi Web SDK with `VITE_VAPI_PUBLIC_KEY` and parameters (`voiceId`, `messages: [systemPrompt]`).
- **Events Handler**:
  - `vapi.on('speech-start')` and `vapi.on('speech-end')`: Toggle active talking indicators and wave animations.
  - `vapi.on('volume-level')`: Reads speaker volume signals and dynamically scales target visualizer divs in the DOM.
  - `vapi.on('message', handler)`: Listens for transcript updates. Appends new speech chunks to the transcript stream in real time.
- **Ending Sequences**: Listens for termination sequences. When detected, terminates connections via `vapi.stop()` and displays a "Generate Report" CTA.

#### Interview Report Panel (`frontend/src/pages/InterviewResult.jsx`)
- **Poller**: Sets up an interval to poll the GET `/report/:id` endpoint every 3 seconds while status is `analysis_pending`.
- **Display Layout**:
  - Uses custom SVG circle containers (`CircularProgress`) to animate the 8 score rings.
  - Renders the full transcript side-by-side with question-by-question cards detailing expected answers, feedback, and optimized response models.

#### Dashboard Overview (`frontend/src/pages/DashboardOverview.jsx`)
- Fetches all user sessions via GET `/api/vapi-interview/user`.
- Calculates cumulative preparation stats (total sessions, active time).
- Renders progress trends using Recharts.

---

## 5. Security Architecture

1. **Stateless JWT Authorization**: User credentials are saved securely via signed tokens. Token signatures are verified cryptographically by the Express server for every request to protected routes.
2. **Password Hashing**: Enforces Bcrypt algorithm hashing using 12 salt rounds for all user passwords. Raw passwords are never stored in the database.
3. **Database Projections**: Mongoose model queries exclude password hashes by default during lookups (e.g., using `.select('-password')`).
4. **Environment Separation**: Private keys and credentials (MongoDB URLs, JWT secrets, API tokens) are loaded from system environment variables rather than hardcoded in the codebase.
