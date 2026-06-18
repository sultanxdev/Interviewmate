import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { interviewAgents } from "../constants/agents";

const Homepage = ({ backendStatus }) => {
  const { isSignedIn } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  
  // Simulator states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simAgent, setSimAgent] = useState(interviewAgents[0]); // Rohan
  const [simStep, setSimStep] = useState(0);
  const [simTranscript, setSimTranscript] = useState([]);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);

  const faqData = [
    {
      q: "How does the AI voice session work?",
      a: "InterviewMate utilizes low-latency WebRTC streams powered by Vapi.ai to deliver near-zero latency voice responses. You talk to the AI interviewer exactly like a real video or phone call, speaking naturally without push-to-talk buttons."
    },
    {
      q: "Can I customize the interview for a specific role and level?",
      a: "Absolutely! You can enter any job title, set your experience tier (Junior, Mid, Senior, Architect), paste the target Job Description or your Resume, and choose from 11 specialized agent personas."
    },
    {
      q: "What metrics are analyzed in the performance report?",
      a: "Your report breaks down performance into 8 key metrics: Correctness, Clarity, Relevance, Detail, Efficiency, Creativity, Communication, and Problem Solving. You also receive an aggregated overall score."
    },
    {
      q: "How are the expected and improved answers generated?",
      a: "Once your session concludes, our backend compiles the transcript and forwards it to OpenRouter's advanced Gemini LLMs. The AI analyzes each question, details what was missing in your response, and provides a fully fleshed out professional model answer."
    },
    {
      q: "Is my personal data and resume secure?",
      a: "Yes. Your credentials, uploads, transcripts, and generated feedback reports are kept entirely private, bound to your authenticated account. We do not sell data or use it to train public models."
    }
  ];

  const simulationScript = [
    { role: "agent", text: "Hello! Welcome to your mock interview today. I'm Rohan. Let's start with a quick introduction. Could you tell me about yourself and your primary technical stack?" },
    { role: "user", text: "Hi Rohan! I am a full-stack engineer specializing in React, Node.js, and MongoDB. I focus on building responsive web apps and designing clean backend APIs." },
    { role: "agent", text: "Excellent foundation. Let's talk about performance. How do you handle rendering optimization in complex React interfaces?" },
    { role: "user", text: "I optimize rendering by preventing unnecessary re-renders using React.memo, useCallback, and useMemo, as well as code-splitting bundles with React.lazy." },
    { role: "agent", text: "Perfect. That shows a strong grip on runtime optimization. The interview is now concluded. I will generate your detailed feedback report now. Goodbye!" }
  ];

  // Simulation runner effect
  useEffect(() => {
    let timer;
    if (isSimulating) {
      if (simStep < simulationScript.length) {
        const currentLine = simulationScript[simStep];
        const isAgent = currentLine.role === "agent";
        
        setIsAgentSpeaking(isAgent);
        
        // Add message bubble
        timer = setTimeout(() => {
          setSimTranscript(prev => [...prev, {
            speaker: isAgent ? simAgent.name : "You",
            text: currentLine.text,
            isAgent
          }]);
          
          setIsAgentSpeaking(false);
          setSimStep(prev => prev + 1);
        }, isAgent ? 2500 : 3500); // simulate delay of talking
      } else {
        timer = setTimeout(() => {
          setIsSimulating(false);
          setSimStep(0);
        }, 3000);
      }
    }
    return () => clearTimeout(timer);
  }, [isSimulating, simStep, simAgent]);

  const startSimulation = (agent) => {
    setSimAgent(agent);
    setSimTranscript([]);
    setSimStep(0);
    setIsSimulating(true);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setSimTranscript([]);
    setSimStep(0);
    setIsAgentSpeaking(false);
  };

  return (
    <main className="landing-page-container">
      {/* 1. HERO SECTION */}
      <section className="hero-section-premium">
        <div className="hero-content-premium">
          <div className="status-badge-premium animate-fade">
            <span className={`status-dot-pulse ${backendStatus?.includes("Online") ? "green" : "red"}`}></span>
            {backendStatus || "Checking API..."}
          </div>
          
          <h1 className="hero-title-premium animate-fade">
            Master Your Next <br />
            <span className="gradient-text-premium">AI Voice Interview</span>
          </h1>
          
          <p className="hero-subtitle-premium animate-fade">
            Converse with professional AI recruiters, get rated across 8 core performance dimensions, and receive question-by-question model answers.
          </p>
          
          <div className="hero-actions-premium animate-fade">
            {!isSignedIn ? (
              <>
                <Link to="/signup">
                  <button className="btn-primary large">
                    Start Preparing Free
                  </button>
                </Link>
                <Link to="/signin">
                  <button className="btn-secondary large">Sign In</button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard">
                  <button className="btn-primary large">Go to Dashboard</button>
                </Link>
                <a href="#simulator">
                  <button className="btn-secondary large">Test Sandbox</button>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Hero Visual - Sandbox Simulator */}
        <div className="hero-visual-premium animate-fade" id="simulator">
          <div className="glass-sandbox">
            <div className="sandbox-header">
              <div className="sandbox-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="sandbox-title">Interactive Voice Sandbox</div>
              <div className={`sandbox-badge ${isSimulating ? "live" : ""}`}>
                {isSimulating ? "VOICE SESSION LIVE" : "SANDBOX READY"}
              </div>
            </div>

            <div className="sandbox-body">
              {!isSimulating ? (
                <div className="sandbox-setup">
                  <h3>Select an AI Recruiter to test</h3>
                  <div className="agent-chips-grid">
                    {interviewAgents.slice(0, 4).map((agent) => (
                      <button
                        key={agent.name}
                        onClick={() => startSimulation(agent)}
                        className={`agent-chip-btn ${simAgent.name === agent.name ? "selected" : ""}`}
                        style={{ "--agent-color": `#${agent.bg}` }}
                      >
                        <span className="agent-avatar-mini" style={{ backgroundColor: `#${agent.bg}20`, borderColor: `#${agent.bg}` }}>
                          {agent.name[0]}
                        </span>
                        <div className="agent-chip-info">
                          <span className="chip-name">{agent.name}</span>
                          <span className="chip-provider">{agent.provider}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => startSimulation(simAgent)} className="btn-primary w-full start-sim-btn">
                    Start Voice Simulation with {simAgent.name}
                  </button>
                </div>
              ) : (
                <div className="sandbox-chat">
                  <div className="chat-transcript-scroller">
                    {simTranscript.length === 0 && (
                      <div className="chat-placeholder">
                        Connecting to WebRTC gateway...
                      </div>
                    )}
                    {simTranscript.map((msg, index) => (
                      <div key={index} className={`chat-bubble-wrapper ${msg.isAgent ? "agent" : "user"}`}>
                        <span className="chat-bubble-speaker">{msg.speaker}</span>
                        <div className="chat-bubble">
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isAgentSpeaking && (
                      <div className="chat-bubble-wrapper agent">
                        <span className="chat-bubble-speaker">{simAgent.name}</span>
                        <div className="chat-bubble typing">
                          <span className="dot-bounce"></span>
                          <span className="dot-bounce"></span>
                          <span className="dot-bounce"></span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sandbox-controls">
                    <div className="voice-waves">
                      <div className={`wave-bar ${isAgentSpeaking ? "active" : ""}`}></div>
                      <div className={`wave-bar ${isAgentSpeaking ? "active animate-delay-1" : ""}`}></div>
                      <div className={`wave-bar ${isAgentSpeaking ? "active animate-delay-2" : ""}`}></div>
                      <div className={`wave-bar ${isAgentSpeaking ? "active animate-delay-3" : ""}`}></div>
                      <div className={`wave-bar ${isAgentSpeaking ? "active animate-delay-4" : ""}`}></div>
                    </div>
                    <button onClick={stopSimulation} className="btn-danger-outline">
                      End Simulation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BANNER */}
      <section className="stats-banner-premium">
        <div className="stats-grid-premium">
          <div className="stat-card-premium">
            <span className="stat-number">11+</span>
            <span className="stat-label">AI Recruiter Profiles</span>
          </div>
          <div className="stat-card-premium">
            <span className="stat-number">100ms</span>
            <span className="stat-label">Low Latency Response</span>
          </div>
          <div className="stat-card-premium">
            <span className="stat-number">8 Tiers</span>
            <span className="stat-label">Performance Metric Scores</span>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section className="features-section-premium" id="features">
        <div className="section-header-premium">
          <h2>Ultimate Interview Preparation</h2>
          <p>Everything you need to secure your dream offer, powered by low-latency voice AI.</p>
        </div>

        <div className="features-grid-premium">
          <div className="feature-card-premium">
            <div className="feature-icon-wrapper purple">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </div>
            <h3>Conversational Voice AI</h3>
            <p>Real voice conversations utilizing WebRTC technology. No buttons, no typing—just talk naturally and refine your voice delivery.</p>
          </div>

          <div className="feature-card-premium">
            <div className="feature-icon-wrapper emerald">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <h3>11 Specialised Recruiters</h3>
            <p>Select different interviewer personas (Sophia, Marcus, Rohan, and more). Each agent has a distinct personality, gender, and voice synth profile.</p>
          </div>

          <div className="feature-card-premium">
            <div className="feature-icon-wrapper blue">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h3>Job-Specific Tailoring</h3>
            <p>Upload your own resume or target job description. The AI interviewer scans the text and shapes questions directly related to your real tech stack.</p>
          </div>

          <div className="feature-card-premium">
            <div className="feature-icon-wrapper amber">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
              </svg>
            </div>
            <h3>8 Core Metric Scores</h3>
            <p>Get evaluated on Correctness, Relevance, Clarity, Detail, Efficiency, Creativity, Communication, and Problem Solving with visual feedback rings.</p>
          </div>

          <div className="feature-card-premium">
            <div className="feature-icon-wrapper rose">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h3m-3 3h1.5m12.75-12.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h3>Granular AI Feedback</h3>
            <p>Read your full transcript alongside question-by-question analysis. Review expected answers and see optimized, professional responses for improvement.</p>
          </div>

          <div className="feature-card-premium">
            <div className="feature-icon-wrapper gold">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0h.5m-.5 0h-10.5m.5 0h-3.5m3.5 0a3.75 3.75 0 0 0-3.5-3.5" />
              </svg>
            </div>
            <h3>Comprehensive History</h3>
            <p>All your practice sessions are archived. Monitor your skill progression, review past analysis cards, or trigger retries anytime from your dashboard.</p>
          </div>
        </div>
      </section>

      {/* 5. PROCESS WORKFLOW (HOW IT WORKS) */}
      <section className="workflow-section-premium" id="workflow">
        <div className="section-header-premium">
          <h2>Three Steps to Perfection</h2>
          <p>An intuitive workflow designed to fast-track your confidence in under fifteen minutes.</p>
        </div>

        <div className="workflow-timeline-premium">
          <div className="workflow-step-card">
            <div className="step-num">01</div>
            <h3>Configure Setup</h3>
            <p>Input your target role and seniority. Paste the job description or your current resume. Pick your interviewer.</p>
          </div>

          <div className="workflow-step-card">
            <div className="step-num">02</div>
            <h3>Live Voice Session</h3>
            <p>Grant camera & mic access, enter the live room, and hold a real-time conversational WebRTC audio session with the AI agent.</p>
          </div>

          <div className="workflow-step-card">
            <div className="step-num">03</div>
            <h3>Detailed AI Report</h3>
            <p>Wait 10 seconds for the backend Gemini pipeline to score the transcript. Review per-question breakdowns and model answers.</p>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="faq-section-premium" id="faq">
        <div className="section-header-premium">
          <h2>Frequently Asked Questions</h2>
          <p>Got questions about technical pipelines, billing, or security? We've got answers.</p>
        </div>

        <div className="faq-accordion-premium">
          {faqData.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className={`faq-item-premium ${isOpen ? "open" : ""}`}
                onClick={() => setOpenFaq(isOpen ? null : index)}
              >
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <span className="faq-arrow">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </div>
                <div className="faq-answer-wrapper">
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="cta-section-premium">
        <div className="cta-glow-bg"></div>
        <div className="cta-content-premium">
          <h2>Ready to Ace Your Next Interview?</h2>
          <p>Create your free account today and start practicing with our roster of AI recruiters.</p>
          {!isSignedIn ? (
            <Link to="/signup">
              <button className="btn-primary large">Get Started for Free</button>
            </Link>
          ) : (
            <Link to="/dashboard">
              <button className="btn-primary large">Go to Dashboard</button>
            </Link>
          )}
        </div>
      </section>
    </main>
  );
};

export default Homepage;
