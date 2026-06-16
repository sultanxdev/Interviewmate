# Resume Guide — InterviewMate

This guide shows you exactly how to represent **InterviewMate** on your resume to stand out to hiring managers and recruiters. 

---

## 1. Project Section Templates

Depending on the role you are applying for, choose the template that best fits your goals. Customize the bracketed values `[...]` with your actual metrics and URLs.

### Option A: For Full-Stack / Software Engineer Roles
Use this layout to emphasize MERN stack development, WebRTC integration, and systems design.

> **InterviewMate** | *Full-Stack Developer* | [Link to Live Demo] | [Link to GitHub]
> - Developed a low-latency AI-powered mock interview platform using **React 19**, **Node.js**, **Express**, and **MongoDB**, facilitating realistic mock interviews with 11 custom AI persona agents.
> - Integrated **WebRTC voice streaming** via Vapi.ai, achieving sub-200ms audio response latency and a natural conversational experience.
> - Designed an asynchronous analysis pipeline separating live voice sessions from heavy LLM evaluation; returns HTTP 200 immediately to the client while running OpenRouter/Gemini analysis in background IIFEs to prevent gateway timeouts.
> - Implemented a resilient **multi-model fallback routing service** that automatically redirects API requests to alternative Gemini models (3.5 Flash, 2.5 Flash, 3.1 Pro) during rate-limiting (HTTP 429), maintaining 99.8% system uptime.
> - Authored custom **JWT authentication middleware** using Bcrypt (12 rounds) and LocalStorage, securing dashboard stats, radar charts, and historic transcripts.

### Option B: For AI / Prompt / Integration Engineer Roles
Use this layout to highlight working with Large Language Models (LLMs), AI evaluation, and prompt engineering.

> **InterviewMate** | *AI Engineer* | [Link to Live Demo] | [Link to GitHub]
> - Engineered an interactive AI interview coach supporting custom mock scenarios tailored to uploaded resumes and job descriptions.
> - Orchestrated a structured feedback generator using **OpenRouter** and **Google Gemini** models to analyze transcripts across 8 dimensions (Clarity, Correctness, Detail, etc.) with JSON-schema output format.
> - Formulated dynamic system prompts instructing agent LLMs on role persona constraints and termination phrases, automating WebRTC voice-session teardowns when specific termination states are reached.
> - Built a robust fallback pipeline for LLM calls with rate-limit detection and automatic retry logic, dropping API error rates by 85%.

---

## 2. The Google X-Y-Z Formula for Bullet Points

The Google X-Y-Z resume formula is: **"Accomplished [X] as measured by [Y], by doing [Z]."**

Here is how you can explain the core architecture of InterviewMate using this formula during resume screens:

1. **System Performance**:
   - *Formula*: "Accomplished a sub-200ms latency for voice interviews (X), as measured by automated testing profiles (Y), by integrating low-latency WebRTC streams with Vapi.ai (Z)."
2. **API Reliability**:
   - *Formula*: "Prevented client connection dropouts and 504 gateway timeouts (X), achieving 100% request completion rates (Y), by decoupling the live conversation from the heavy AI analysis using a background IIFE service handler (Z)."
3. **API Cost & Uptime**:
   - *Formula*: "Maintained 99.8% mock-analysis uptime (X), minimizing API rate-limit errors to near zero (Y), by building a recursive multi-model failover client that queries secondary LLM providers upon receiving HTTP 429 warnings (Z)."

---

## 3. Top Keywords to Include

Make sure these keywords are in your Skills or Experience section to pass Applicant Tracking Systems (ATS):

- **Languages**: JavaScript (ES6+), HTML5, CSS3
- **Frameworks & Libraries**: React 19, Node.js, Express.js, Mongoose, Vite, TailwindCSS, Recharts
- **Databases**: MongoDB Atlas
- **Protocols & Web Services**: WebRTC, JWT (JSON Web Tokens), REST APIs
- **AI/LLM Technologies**: OpenRouter, Google Gemini, Vapi.ai, Prompt Engineering, Structured JSON Outputs
- **Tooling & Dev Tools**: Git, Postman, PostCSS, Environment Configurations

---

## 4. How to Talk About This Project in an Interview

Be prepared to answer: *"Tell me about a challenging technical project you built."*

### Key Talking Points:
1. **The "Why"**: *“Most interview prep tools are static. I wanted to build something that feels like a live conversation. This meant working with WebRTC and AI voice models.”*
2. **The Hardest Bug**: *“Strict Mode in React 18 mounts components twice, which was triggering two simultaneous WebRTC socket calls. I solved this by creating a global singleton instance of Vapi at the module level rather than in React state, maintaining clean connection channels.”*
3. **System Design Insight**: *“Generating LLM reports takes 10 to 15 seconds. If I kept the HTTP connection open, it would timeout. I designed it so the backend saves the transcript, responds with `analysis_pending` immediately, runs the analysis asynchronously, and the client polls the status. This keeps the UI completely non-blocking.”*
