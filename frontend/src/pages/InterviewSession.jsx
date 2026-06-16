import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Vapi from "@vapi-ai/web";
import axios from "axios";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiPhoneOff,
  FiMessageSquare,
  FiUser,
  FiCheckCircle,
  FiLoader,
  FiMonitor,
  FiBarChart2,
  FiInfo,
  FiStar,
  FiArrowRight,
  FiShield,
  FiMoreVertical,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useInterview } from "../context/InterviewContext";
import { AppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const vapiSpeechConfig = {
  responseDelaySeconds: 1.5,
  startSpeakingPlan: {
    waitSeconds: 1.2,
    transcriptionEndpointingPlan: {
      onPunctuationSeconds: 0.8,
      onNoPunctuationSeconds: 2.2,
      onNumberSeconds: 0.8,
    },
  },
  stopSpeakingPlan: {
    numWords: 3,
    voiceSeconds: 0.5,
    backoffSeconds: 2.0,
  },
};

let globalVapiInstance = null;
let globalVapiStopPromise = null;

const InterviewSession = () => {
  const {
    interviewData,
    sessionId,
    setSessionId,
    transcript,
    setTranscript,
    callStatus,
    setCallStatus,
    interviewDuration,
    setInterviewDuration,
    setReport,
    resetInterview,
    isCameraEnabled,
    setIsCameraEnabled,
    isMicEnabled,
    setIsMicEnabled,
  } = useInterview();
  const { backend_URL } = useContext(AppContext);
  const { user, getToken } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams();
  const systemPrompt = location.state?.systemPrompt;

  // ── DEV PREVIEW MODE ─────────────────────────────────────────────────────
  // Visit /session?preview=true to design UI without a real call.
  const isPreview =
    new URLSearchParams(location.search).get("preview") === "true";

  const MOCK_INTERVIEW_DATA = {
    interviewType: "Technical",
    role: "Senior Frontend Engineer",
    level: "Senior",
    content: "",
    agentName: "Rohan",
    agentVoiceProvider: "vapi",
    agentVoiceId: "Rohan",
  };
  const MOCK_TRANSCRIPT = [
    {
      id: 1,
      role: "assistant",
      speaker: "Rohan",
      text: "Hello! I'm Rohan, your AI interviewer. Welcome! Could you please begin by introducing yourself?",
      stableText:
        "Hello! I'm Rohan, your AI interviewer. Welcome! Could you please begin by introducing yourself?",
      timestamp: "10:00 AM",
      isAgent: true,
    },
    {
      id: 2,
      role: "user",
      speaker: "You",
      text: "Hi Rohan! I'm a senior frontend engineer with 5 years of experience building React applications.",
      stableText:
        "Hi Rohan! I'm a senior frontend engineer with 5 years of experience building React applications.",
      timestamp: "10:01 AM",
      isAgent: false,
    },
    {
      id: 3,
      role: "assistant",
      speaker: "Rohan",
      text: "Great! Let's dive into some technical questions. Can you explain the difference between `useMemo` and `useCallback` in React?",
      stableText:
        "Great! Let's dive into some technical questions. Can you explain the difference between `useMemo` and `useCallback` in React?",
      timestamp: "10:01 AM",
      isAgent: true,
    },
    {
      id: 4,
      role: "user",
      speaker: "You",
      text: "`useMemo` memoizes a computed value while `useCallback` memoizes a function reference. Both help avoid unnecessary re-renders.",
      stableText:
        "`useMemo` memoizes a computed value while `useCallback` memoizes a function reference. Both help avoid unnecessary re-renders.",
      timestamp: "10:02 AM",
      isAgent: false,
    },

    {
      id: 5,
      role: "assistant",
      speaker: "Rohan",
      text: "Great! Let's dive into some technical questions. Can you explain the difference between `useMemo` and `useCallback` in React?",
      stableText:
        "Great! Let's dive into some technical questions. Can you explain the difference between `useMemo` and `useCallback` in React?",
      timestamp: "10:01 AM",
      isAgent: true,
    },
    {
      id: 6,
      role: "user",
      speaker: "You",
      text: "`useMemo` memoizes a computed value while `useCallback` memoizes a function reference. Both help avoid unnecessary re-renders.",
      stableText:
        "`useMemo` memoizes a computed value while `useCallback` memoizes a function reference. Both help avoid unnecessary re-renders.",
      timestamp: "10:02 AM",
      isAgent: false,
    },
  ];
  // ─────────────────────────────────────────────────────────────────────────

  const [isMuted, setIsMuted] = useState(!isMicEnabled);
  const [isVideoOn, setIsVideoOn] = useState(isCameraEnabled);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentReady, setAgentReady] = useState(false);
  const [isUserFocus, setIsUserFocus] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false); // New state for "AI is thinking"
  const [hasCallEnded, setHasCallEnded] = useState(false);

  const vapi = useRef(null);
  const transcriptEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const sessionIdRef = useRef(sessionId);
  const hasEndedRef = useRef(false);
  const endTimeoutRef = useRef(null);
  const agentSpeakingTimeoutRef = useRef(null);
  const userSpeakingTimeoutRef = useRef(null); // New ref
  const pendingEndRef = useRef(false);
  const agentSpeakingRef = useRef(false);
  const agentVolumeCircleRef = useRef(null);

  useEffect(() => {
    if (urlSessionId && urlSessionId !== sessionId) {
      setSessionId(urlSessionId);
    }
  }, [urlSessionId, sessionId, setSessionId]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Redirect if no sessionId or systemPrompt (skip in preview mode)
  useEffect(() => {
    if (isPreview) {
      setCallStatus("active");
      setInterviewDuration(142);
      setTranscript(MOCK_TRANSCRIPT);
      return;
    }

    if (!sessionId || !systemPrompt) {
      toast.error("Please setup the interview first.");
      navigate("/interview/setup");
      return;
    }

    // Initial check for camera/mic
    if (!isCameraEnabled || !isMicEnabled) {
      toast.error("Camera and Microphone must be enabled to join the session.");
      navigate("/interview/setup");
    }
  }, []); // Only check on mount to prevent redirection when toggling during session

  // Camera Management
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      if (isVideoOn) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: false,
          });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access denied:", err);
          setIsVideoOn(false);
        }
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOn, isUserFocus]);

  const handleGenerateReport = async (forcedTranscript = null) => {
    if (isProcessing) return;
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) {
      toast.error("Session not found. Please start a new interview.");
      return;
    }

    const finalTranscript = forcedTranscript || transcript;
    if (finalTranscript.length === 0) {
      console.warn("No transcript to process.");
      return;
    }

    setIsProcessing(true);
    const token = await getToken();
    try {
      const response = await axios.post(
        `${backend_URL}/api/vapi-interview/report-from-transcript`,
        { sessionId: currentSessionId, transcript: finalTranscript },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.status === "completed" && response.data.report) {
        setReport(response.data.report);
        setIsProcessing(false);
        toast.success("Interview report generated!");
        navigate(`/interview/result/${currentSessionId}`);
        return;
      }

      // If it's still in progress or just saved, navigate to the result page
      // which has its own polling mechanism
      navigate(`/interview/result/${currentSessionId}`);
    } catch (error) {
      console.error("Report generation error:", error);
      // Fallback: navigate to results anyway so the user sees the loader/polling
      navigate(`/interview/result/${currentSessionId}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize Vapi
  useEffect(() => {
    if (isPreview || !systemPrompt || !sessionId) return;

    let isMounted = true;

    const initVapi = async () => {
      try {
        const token = await getToken();
        if (!isMounted) return;

        try {
          const sessionRes = await axios.get(
            `${backend_URL}/api/vapi-interview/report/${sessionId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (!isMounted) return;

          if (sessionRes.data && sessionRes.data.status === "completed") {
            toast.info("This interview session is already completed.");
            navigate(`/interview/result/${sessionId}`);
            return;
          }
        } catch (err) {
          console.error("Error checking session status:", err);
          // Non-blocking error, allow session to start as fallback
        }

        if (!globalVapiInstance) {
          const VapiConstructor = Vapi.default || Vapi;
          globalVapiInstance = new VapiConstructor(
            import.meta.env.VITE_VAPI_PUBLIC_KEY,
          );
        }

        vapi.current = globalVapiInstance;

        // Wait for any pending stop operation to complete before proceeding
        if (globalVapiStopPromise) {
          console.log("Waiting for pending Vapi stop operation to complete...");
          try {
            await globalVapiStopPromise;
          } catch (e) {
            console.error("Error waiting for stop:", e);
          }
          globalVapiStopPromise = null;
        }

        if (!isMounted) return;

        vapi.current.removeAllListeners("call-start");
        vapi.current.removeAllListeners("speech-start");
        vapi.current.removeAllListeners("speech-end");
        vapi.current.removeAllListeners("call-end");
        vapi.current.removeAllListeners("volume-level");
        vapi.current.removeAllListeners("error");
        vapi.current.removeAllListeners("message");

        setAgentReady(true);

        vapi.current.on("call-start", () => {
          hasEndedRef.current = false;
          pendingEndRef.current = false;
          agentSpeakingRef.current = false;
          setIsAiThinking(false);
          if (endTimeoutRef.current) {
            clearTimeout(endTimeoutRef.current);
            endTimeoutRef.current = null;
          }
          setCallStatus("active");
          setHasCallEnded(false);
          toast.success("Connection secured. Interview started.");
        });

        vapi.current.on("speech-start", () => {
          setIsAgentSpeaking(true);
          agentSpeakingRef.current = true;
          setIsAiThinking(false);
        });

        vapi.current.on("speech-end", () => {
          setIsAgentSpeaking(false);
          agentSpeakingRef.current = false;
        });

        vapi.current.on("call-end", () => {
          hasEndedRef.current = true;
          pendingEndRef.current = false;
          agentSpeakingRef.current = false;
          if (endTimeoutRef.current) {
            clearTimeout(endTimeoutRef.current);
            endTimeoutRef.current = null;
          }
          setCallStatus("inactive");
          setHasCallEnded(true);
          setIsProcessing(false);
          setIsVideoOn(false);
          setIsMuted(true);
        });

        vapi.current.on("volume-level", (volume) => {
          if (agentVolumeCircleRef.current) {
            const v = volume || 0;
            const scale = 1 + v * 1.5;
            agentVolumeCircleRef.current.style.transform = `scale(${scale})`;
          }
        });

        vapi.current.on("error", (error) => {
          console.error("Vapi error:", error);
          setCallStatus("inactive");
          toast.error("Bridge connection failed.");
        });

        const scheduleEndAfterSpeech = () => {
          if (!pendingEndRef.current) return;

          // Clear any existing timeout to avoid multiple scheduled stops
          if (endTimeoutRef.current) {
            clearTimeout(endTimeoutRef.current);
            endTimeoutRef.current = null;
          }

          const waitForSilence = () => {
            if (!pendingEndRef.current) {
              endTimeoutRef.current = null;
              return;
            }

            // If agent is still speaking (either via Vapi event or our fallback timeout)
            if (agentSpeakingRef.current || isAgentSpeaking) {
              endTimeoutRef.current = setTimeout(() => {
                endTimeoutRef.current = null;
                waitForSilence();
              }, 300);
              return;
            }

            // Agent stopped speaking, wait 2 seconds for a natural pause then stop the call
            endTimeoutRef.current = setTimeout(() => {
              if (vapi.current && pendingEndRef.current) {
                console.log(
                  "Auto-stopping call as interview end phrase detected and agent finished speaking.",
                );
                vapi.current.stop();
              }
              endTimeoutRef.current = null;
            }, 2000);
          };

          waitForSilence();
        };

        vapi.current.on("message", (message) => {
          if (message.type === "transcript") {
            const role = message.role;
            const text = message.transcript || "";
            const isFinal = message.transcriptType === "final";

            const currentTime = new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            if (role === "assistant" || role === "agent") {
              agentSpeakingRef.current = true;
              setIsAgentSpeaking(true);
              if (agentSpeakingTimeoutRef.current) {
                clearTimeout(agentSpeakingTimeoutRef.current);
              }
              agentSpeakingTimeoutRef.current = setTimeout(() => {
                agentSpeakingRef.current = false;
                setIsAgentSpeaking(false);
                if (pendingEndRef.current) {
                  scheduleEndAfterSpeech();
                }
              }, 1200);
            }

            if (role === "user") {
              setIsUserSpeaking(true);
              setIsAiThinking(true); // User spoke, AI will start thinking
              if (userSpeakingTimeoutRef.current) {
                clearTimeout(userSpeakingTimeoutRef.current);
              }
              userSpeakingTimeoutRef.current = setTimeout(() => {
                setIsUserSpeaking(false);
              }, 2500); // Wait 2.5s of silence before declaring user "not speaking"
            }

            setTranscript((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === role) {
                const updated = [...prev];
                const stableText = lastMsg.stableText || "";
                const newText =
                  stableText + (stableText && text ? " " : "") + text;
                updated[updated.length - 1] = {
                  ...lastMsg,
                  text: newText,
                  stableText: isFinal ? newText : stableText,
                  timestamp: currentTime,
                };
                return updated;
              } else {
                const isAgentRole = role === "assistant" || role === "agent";
                return [
                  ...prev,
                  {
                    id: Date.now(),
                    role: role,
                    speaker: isAgentRole ? "AI Interviewer" : "You",
                    text: text,
                    stableText: isFinal ? text : "",
                    timestamp: currentTime,
                    isAgent: isAgentRole,
                  },
                ];
              }
            });

            // Auto-disconnect if the AI says the magic concluding phrase
            if (role === "assistant" && !hasEndedRef.current) {
              const normalized = text.toLowerCase();
              const endPhrases = [
                "this concludes",
                "concludes our interview",
                "that concludes",
                "interview is complete",
                "interview is now concluded",
                "interview is concluded",
                "have a great day",
                "thank you for your time",
                "reached the end",
                "goodbye",
                "good luck",
                "see you next time",
                "interview has finished",
                "thank you for joining us",
              ];

              const shouldEnd = endPhrases.some((phrase) =>
                normalized.includes(phrase),
              );

              if (shouldEnd) {
                console.log("End phrase detected:", normalized);
                hasEndedRef.current = true;
                pendingEndRef.current = true;
                scheduleEndAfterSpeech();
              }
            }
          }
        });

        // Start call automatically — agent speaks first on connect
        setCallStatus("connecting");
        await vapi.current.start({
          model: {
            provider: "openai",
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }],
          },
          voice: {
            provider: displayData.agentVoiceProvider || "openai",
            voiceId: displayData.agentVoiceId || "echo",
          },
          firstMessage: `Hello! I'm ${displayData.agentName || "Rohan"}, your AI interviewer. Welcome! Let's get started whenever you're ready. Could you please begin by introducing yourself?`,
          firstMessageMode: "assistant-speaks-first",
          responseDelaySeconds: vapiSpeechConfig.responseDelaySeconds,
          startSpeakingPlan: vapiSpeechConfig.startSpeakingPlan,
          stopSpeakingPlan: vapiSpeechConfig.stopSpeakingPlan,
          metadata: { sessionId: sessionId },
        });
      } catch (error) {
        console.error("Failed to start Vapi:", error);
        toast.error("Failed to connect to AI agent.");
        navigate("/interview/setup");
      }
    };

    initVapi();

    return () => {
      console.log("Cleaning up InterviewSession...");
      if (endTimeoutRef.current) {
        clearTimeout(endTimeoutRef.current);
        endTimeoutRef.current = null;
      }
      if (agentSpeakingTimeoutRef.current) {
        clearTimeout(agentSpeakingTimeoutRef.current);
        agentSpeakingTimeoutRef.current = null;
      }
      pendingEndRef.current = false;
      agentSpeakingRef.current = false;
      if (vapi.current) {
        console.log("Stopping Vapi instance...");
        vapi.current.removeAllListeners("call-start");
        vapi.current.removeAllListeners("speech-start");
        vapi.current.removeAllListeners("speech-end");
        vapi.current.removeAllListeners("call-end");
        vapi.current.removeAllListeners("volume-level");
        vapi.current.removeAllListeners("error");
        vapi.current.removeAllListeners("message");

        // Track the stopping process so any immediate restart waits for it
        try {
          const stopOp = vapi.current.stop();
          if (stopOp instanceof Promise) {
            globalVapiStopPromise = stopOp;
          } else {
            // Provide a small buffer time for Daily JS to safely destroy iframe
            globalVapiStopPromise = new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (e) {
          console.error("Error stopping VAPI instance:", e);
          globalVapiStopPromise = new Promise((resolve) => setTimeout(resolve, 1000));
        }

        vapi.current = null;
      }
    };
  }, [systemPrompt, sessionId]);

  // Timer
  useEffect(() => {
    let interval;
    if (callStatus === "active") {
      interval = setInterval(() => {
        setInterviewDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [transcript]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const stopInterview = () => {
    if (vapi.current) {
      vapi.current.stop();
    }
  };

  const toggleMute = () => {
    if (vapi.current) {
      if (isMuted) vapi.current.unmute();
      else vapi.current.mute();
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      setIsMicEnabled(!newMuted);
    }
  };

  const toggleVideo = () => {
    const newVideoOn = !isVideoOn;
    setIsVideoOn(newVideoOn);
    setIsCameraEnabled(newVideoOn);
  };

  const toggleVideoFocus = () => {
    setIsUserFocus((prev) => !prev);
  };

  const displayData = isPreview ? MOCK_INTERVIEW_DATA : interviewData;

  const agentImages = {
    Rohan: "/assets/interviewers/male1.png",
    Sophia: "/assets/interviewers/female1.png",
    Marcus: "/assets/interviewers/male2.png",
    Emma: "/assets/interviewers/female2.png",
    Elliot: "/assets/interviewers/male3.png",
    Rachel: "/assets/interviewers/female1.png",
    Drew: "/assets/interviewers/male1.png",
    Clyde: "/assets/interviewers/male2.png",
    Mimi: "/assets/interviewers/female2.png",
    Fin: "/assets/interviewers/male3.png",
    Nicole: "/assets/interviewers/female1.png",
  };

  const getAgentImage = (agentName) => {
    return agentImages[agentName] || "/assets/interviewers/male1.png";
  };

  return (
    <div className="min-h-screen dark:bg-zinc-950 bg-white dark:text-zinc-100 text-gray-900 font-sans">
      <div className="h-full flex flex-col overflow-hidden min-h-[90vh]">
        <header className="px-4 md:px-6 py-3 flex items-center justify-between bg-zinc-950/80 border-b dark:border-white/5 border-black/5 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => navigate("/interview/setup")}
              className="p-2 dark:bg-zinc-900/70 bg-gray-100/70 dark:hover:bg-zinc-800 hover:bg-gray-200 cursor-pointer rounded-xl transition-colors dark:text-zinc-400 text-gray-600 dark:hover:text-white hover:text-black"
            >
              <FiArrowRight className="rotate-180" size={18} />
            </button>
            <div>
              <h1 className="text-sm md:text-lg font-semibold dark:text-white text-black tracking-tight truncate max-w-[160px] md:max-w-none">
                {displayData.role}
              </h1>
              <p className="text-[10px] md:text-[11px] dark:text-zinc-500 text-gray-500 font-medium">
                {displayData.interviewType} • {displayData.level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full dark:bg-zinc-900 bg-gray-50 border dark:border-white/5 border-black/5 shadow-inner">
              <div
                className={`w-2 h-2 rounded-full ${callStatus === "active" ? "bg-emerald-400 animate-pulse" : "bg-yellow-400"}`}
              />
              <span className="text-[10px] font-mono font-semibold dark:text-zinc-300 text-gray-700">
                {formatDuration(interviewDuration)}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full dark:bg-zinc-900 bg-gray-50 border dark:border-white/5 border-black/5 text-[10px] font-semibold dark:text-zinc-300 text-gray-700">
              {isMuted ? <FiMicOff size={12} /> : <FiMic size={12} />}
              <span>{isMuted ? "Mic Off" : "Mic On"}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full dark:bg-zinc-900 bg-gray-50 border dark:border-white/5 border-black/5 text-[10px] font-semibold dark:text-zinc-300 text-gray-700">
              {isVideoOn ? <FiVideo size={12} /> : <FiVideoOff size={12} />}
              <span>{isVideoOn ? "Cam On" : "Cam Off"}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 font-bold text-[10px] dark:bg-zinc-900 bg-gray-50 dark:text-zinc-300 text-gray-700 rounded-lg border dark:border-white/5 border-black/5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </div>
          </div>
        </header>

        <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-6">
          <div className="flex flex-col gap-6 min-w-0">
            <div className="relative aspect-video  dark:bg-zinc-900/40 bg-gray-100/40 rounded-[28px] overflow-hidden border dark:border-indigo-500 border-black/5 shadow-[0_0_60px_rgba(24,24,27,0.7)]">
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                {callStatus === "active" && (
                  <div className="absolute inset-0 dark:bg-zinc-800 bg-gray-100 blur-[90px] animate-pulse-slow pointer-events-none" />
                )}
                {hasCallEnded && !isProcessing && (
                  <div className="absolute inset-0 dark:bg-black/80 bg-white/80 backdrop-blur-md flex items-center justify-center z-40">
                    <div className="text-center w-full max-w-sm px-6">
                      <FiCheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                      <h2 className="text-xl font-bold dark:text-white text-black mb-2">
                        Interview Ended
                      </h2>
                      <p className="dark:text-zinc-400 text-gray-600 text-xs leading-relaxed mb-6">
                        Your interview session has ended. Generate a report if
                        you want detailed feedback.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            if (transcript.length > 0) {
                              handleGenerateReport(transcript);
                            } else {
                              handleGenerateReport();
                            }
                          }}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs py-3 rounded-2xl transition-all active:scale-[0.98]"
                        >
                          Generate Report
                        </button>
                        <button
                          onClick={() => {
                            resetInterview();
                            navigate("/interview/setup");
                          }}
                          className="flex-1 dark:bg-zinc-900/80 bg-gray-100/80 dark:hover:bg-zinc-800 hover:bg-gray-200 dark:text-white text-black font-bold text-xs py-3 rounded-2xl border dark:border-white/10 border-black/10 transition-all active:scale-[0.98]"
                        >
                          Exit Session
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {isUserFocus ? (
                  isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror z-10"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col z-10 items-center justify-center  dark:text-zinc-400 text-gray-600">
                      {user?.avatar ? (
                        <img
                          src={user?.avatar}
                          alt="User Avatar"
                          className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-indigo-500/50"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 border-2 border-indigo-500/50">
                          <FiUser className="text-4xl text-indigo-400" />
                        </div>
                      )}
                      <span className="text-[10px] font-semibold uppercase mt-2">
                        Camera Off
                      </span>
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-950/40">
                    <div className="relative flex items-center justify-center">
                      <div
                        ref={agentVolumeCircleRef}
                        className={`absolute inset-0 rounded-full bg-blue-900/40 transition-transform duration-75 ease-out pointer-events-none ${isAgentSpeaking ? "opacity-100" : "opacity-0"}`}
                        style={{ transform: "scale(1)" }}
                      />
                      <div
                        className={`relative w-28 h-28 rounded-full dark:bg-zinc-900/80 bg-gray-100/80 border ${isAgentSpeaking ? "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.6)]" : "dark:border-white/10 border-black/10"} shadow-2xl backdrop-blur-md flex items-center justify-center overflow-hidden z-10 transition-all duration-300`}
                      >
                        <div className="w-24 h-24 rounded-full bg-indigo-500 border dark:border-white/10 border-black/10 shadow-2xl backdrop-blur-md flex items-center justify-center overflow-hidden">
                          <img
                            src={getAgentImage(displayData.agentName)}
                            alt={displayData.agentName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={toggleVideoFocus}
                className={`absolute bottom-4 z-20  right-4 aspect-[16/10] dark:bg-black bg-white rounded-2xl border dark:border-indigo-500/10 border-indigo-500/10 overflow-hidden shadow-2xl transition-transform hover:scale-105 w-52 md:w-50`}
              >
                {isUserFocus ? (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-950/50">
                    <div className="relative flex items-center justify-center">
                      <div
                        ref={agentVolumeCircleRef}
                        className={`absolute inset-0 rounded-full bg-blue-900/40  transition-transform duration-75 ease-out pointer-events-none ${isAgentSpeaking ? "opacity-100" : "opacity-0"}`}
                        style={{ transform: "scale(1)" }}
                      />
                      <div
                        className={`relative w-16 h-16 rounded-full dark:bg-zinc-900/80 bg-gray-100/80 border ${isAgentSpeaking ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "dark:border-white/10 border-black/10"} shadow-xl backdrop-blur-md flex items-center justify-center overflow-hidden z-10 transition-all duration-300`}
                      >
                        <div className="w-14 h-14 rounded-full bg-indigo-500 border dark:border-white/10 border-black/10 shadow-2xl backdrop-blur-md flex items-center justify-center overflow-hidden">
                          <img
                            src={getAgentImage(displayData.agentName)}
                            alt={displayData.agentName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isVideoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950/80 dark:text-zinc-400 text-gray-600">
                    {user?.avatar ? (
                      <img
                        src={user?.avatar}
                        alt="User Avatar"
                        className="w-14 h-14 rounded-full object-cover mb-4 border-2 border-indigo-500/50"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 border-2 border-indigo-500/50">
                        <FiUser className="text-4xl text-indigo-400" />
                      </div>
                    )}
                  </div>
                )}
                <div className="absolute top-2 left-2   rounded-full ml-2 ">
                  <span className="text-[9px] font-semibold dark:text-white text-black  tracking-tighter">
                    {isUserFocus ? displayData.agentName : "You"}
                  </span>
                </div>
              </button>

              <div className="absolute bottom-5 z-20 left-1/2 -translate-x-1/2 flex items-center gap-2 dark:bg-black/50 bg-white/50 backdrop-blur-xl p-2 rounded-2xl border dark:border-white/10 border-black/10 shadow-2xl">
                {isUserSpeaking && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full flex items-center gap-2 animate-bounce-slow">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      Listening
                    </span>
                  </div>
                )}
                {!isUserSpeaking &&
                  !isAgentSpeaking &&
                  isAiThinking &&
                  callStatus === "active" && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 rounded-full flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">
                        Thinking...
                      </span>
                    </div>
                  )}
                {!isUserSpeaking &&
                  !isAgentSpeaking &&
                  !isAiThinking &&
                  callStatus === "active" && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 rounded-full flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                        Your Turn
                      </span>
                    </div>
                  )}
                <button
                  onClick={toggleMute}
                  className={`p-3 cursor-pointer rounded-xl transition-all ${isMuted ? "bg-red-500 dark:text-white text-black" : "dark:bg-zinc-900/70 bg-gray-100/70 dark:hover:bg-zinc-800 hover:bg-gray-200 dark:text-white text-black"}`}
                >
                  {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-3 cursor-pointer rounded-xl transition-all ${!isVideoOn ? "bg-red-500 dark:text-white text-black" : "dark:bg-zinc-900/70 bg-gray-100/70 dark:hover:bg-zinc-800 hover:bg-gray-200 dark:text-white text-black"}`}
                >
                  {!isVideoOn ? (
                    <FiVideoOff size={18} />
                  ) : (
                    <FiVideo size={18} />
                  )}
                </button>

                <button
                  onClick={stopInterview}
                  className="p-3 bg-red-600 cursor-pointer hover:bg-red-500 dark:text-white text-black rounded-xl shadow-lg transition-all active:scale-95"
                >
                  <FiPhoneOff size={18} />
                </button>
              </div>

              {callStatus === "connecting" && (
                <div className="absolute inset-0 dark:bg-black/80 bg-white/80 backdrop-blur-md flex items-center justify-center z-50">
                  <div className="text-center animate-fade-in px-6">
                    <FiLoader className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold dark:text-white text-black mb-1">
                      Connecting...
                    </h2>
                    <p className="dark:text-zinc-500 text-gray-500 text-xs">
                      Establishing secure interview channel
                    </p>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 dark:bg-black/90 bg-white/90 backdrop-blur-2xl flex items-center justify-center z-50">
                  <div className="text-center w-full max-w-sm px-6">
                    <FiBarChart2 className="w-10 h-10 text-emerald-400 animate-pulse mx-auto mb-4" />
                    <h2 className="text-xl font-bold dark:text-white text-black mb-2">
                      Finalizing Analysis
                    </h2>
                    <p className="dark:text-zinc-500 text-gray-500 text-xs leading-relaxed px-4 mb-6">
                      Constructing your performance metrics and behavioral
                      insights...
                    </p>
                    <div className="w-full dark:bg-zinc-800 bg-gray-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full animate-progress"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {hasCallEnded && !isProcessing && (
                <div className="rounded-2xl dark:bg-zinc-900/80 bg-gray-100/80 border border-emerald-500/20 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-200">
                      Interview ended
                    </p>
                    <p className="text-[10px] dark:text-zinc-500 text-gray-500">
                      Generate your report to review feedback and strengths.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateReport}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-[10px] font-black hover:bg-emerald-400 transition-all"
                    >
                      Generate Report
                    </button>
                    <button
                      onClick={() => {
                        resetInterview();
                        navigate("/interview/setup");
                      }}
                      className="px-4 py-2 rounded-xl dark:bg-zinc-900/80 bg-gray-100/80 dark:text-white text-black text-[10px] font-semibold border dark:border-white/10 border-black/10 dark:hover:bg-zinc-800 hover:bg-gray-200 transition-all"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b dark:border-white/5 border-black/5">
                <h3 className="text-[11px] font-bold dark:text-zinc-500 text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-3 bg-emerald-400 rounded-full" />
                  Session Overview
                </h3>
                <button className="p-1.5 dark:hover:bg-white/5 hover:bg-black/5 rounded-lg dark:text-zinc-500 text-gray-500 dark:hover:text-white hover:text-black transition-colors">
                  <FiMoreVertical size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="dark:bg-zinc-900/60 bg-gray-100/60 px-4 py-3 rounded-2xl border dark:border-white/5 border-black/5 flex flex-col gap-1">
                  <span className="text-[9px] font-bold dark:text-zinc-500 text-gray-500 uppercase tracking-tighter flex items-center gap-1.5">
                    <FiInfo size={10} className="text-emerald-400" /> Date
                  </span>
                  <p className="text-[11px] font-semibold dark:text-white text-black">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="dark:bg-zinc-900/60 bg-gray-100/60 px-4 py-3 rounded-2xl border dark:border-white/5 border-black/5 flex flex-col gap-1">
                  <span className="text-[9px] font-bold dark:text-zinc-500 text-gray-500 uppercase tracking-tighter flex items-center gap-1.5">
                    <FiStar size={10} className="text-emerald-400" /> Type
                  </span>
                  <p className="text-[11px] font-semibold dark:text-white text-black uppercase">
                    {displayData.interviewType}
                  </p>
                </div>
                <div className="dark:bg-zinc-900/60 bg-gray-100/60 px-4 py-3 rounded-2xl border dark:border-white/5 border-black/5 flex flex-col gap-1">
                  <span className="text-[9px] font-bold dark:text-zinc-500 text-gray-500 uppercase tracking-tighter flex items-center gap-1.5">
                    <FiUser size={10} className="text-emerald-400" />{" "}
                    Participants
                  </span>
                  <p className="text-[11px] font-semibold dark:text-white text-black truncate">
                    AI Agent, You
                  </p>
                </div>
                <div className="dark:bg-zinc-900/60 bg-gray-100/60 px-4 py-3 rounded-2xl border dark:border-white/5 border-black/5 flex flex-col gap-1">
                  <span className="text-[9px] font-bold dark:text-zinc-500 text-gray-500 uppercase tracking-tighter flex items-center gap-1.5">
                    <FiShield size={10} className="text-emerald-400" /> Status
                  </span>
                  <p className="text-[11px] font-semibold dark:text-white text-black uppercase">
                    {callStatus}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4">
                <div className="p-6 rounded-[26px] bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center dark:text-white text-black shadow-lg shadow-emerald-500/20">
                      <FiCheckCircle size={14} />
                    </div>
                    <h4 className="text-[13px] font-bold text-emerald-100">
                      Live Guidance
                    </h4>
                  </div>
                  <p className="text-[12px] text-emerald-100/80 leading-relaxed font-medium">
                    {isProcessing
                      ? "Constructing final evaluation report..."
                      : "Maintain concise answers, highlight measurable impact, and think aloud for reasoning clarity."}
                  </p>
                </div>
                <div className="p-5 rounded-[26px] dark:bg-zinc-900/70 bg-gray-100/70 border dark:border-white/5 border-black/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg dark:bg-zinc-800 bg-gray-100 flex items-center justify-center dark:text-zinc-200 text-gray-800">
                      <FiMonitor size={14} />
                    </div>
                    <h4 className="text-[13px] font-bold dark:text-zinc-100 text-gray-900">
                      Quick Tips
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-full dark:bg-zinc-800 bg-gray-100 text-[10px] font-semibold dark:text-zinc-300 text-gray-700">
                      STAR method
                    </span>
                    <span className="px-2 py-1 rounded-full dark:bg-zinc-800 bg-gray-100 text-[10px] font-semibold dark:text-zinc-300 text-gray-700">
                      Quantify impact
                    </span>
                    <span className="px-2 py-1 rounded-full dark:bg-zinc-800 bg-gray-100 text-[10px] font-semibold dark:text-zinc-300 text-gray-700">
                      Ask clarifying Qs
                    </span>
                    <span className="px-2 py-1 rounded-full dark:bg-zinc-800 bg-gray-100 text-[10px] font-semibold dark:text-zinc-300 text-gray-700">
                      Summarize at end
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col min-w-0 gap-4">
            <div className="flex flex-col dark:bg-zinc-900/60 bg-gray-100/60 rounded-2xl border dark:border-white/5 border-black/5 overflow-hidden shadow-2xl h-[640px]">
              <div className="p-3 flex items-center gap-2 dark:bg-zinc-900 bg-gray-50 border-b dark:border-white/5 border-black/5">
                <div className="flex-1 flex gap-1">
                  <button className="flex-1 py-2 px-3 rounded-xl dark:bg-zinc-800 bg-gray-100 dark:text-white text-black text-[10px] font-bold shadow-md">
                    Live Transcript
                  </button>
                  <button className="flex-1 py-2 px-3 rounded-xl dark:text-zinc-400 text-gray-600 dark:hover:text-white hover:text-black dark:hover:bg-white/5 hover:bg-black/5 text-[10px] font-bold transition-all">
                    Timeline
                  </button>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-zinc-800/80 bg-gray-200/80 dark:text-zinc-400 text-gray-600 text-[10px] font-semibold border dark:border-white/5 border-black/5">
                  <FiMessageSquare size={12} />
                  Auto-scroll
                </div>
              </div>
              <div className="px-3 py-2 border-b dark:border-white/5 border-black/5 dark:bg-zinc-900/80 bg-gray-100/80">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search transcript"
                      className="w-full dark:bg-zinc-800/80 bg-gray-200/80 dark:text-zinc-200 text-gray-800 placeholder:dark:text-zinc-500 text-gray-500 text-[11px] px-3 py-2 rounded-xl border dark:border-white/5 border-black/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <button className="px-3 py-2 rounded-xl dark:bg-zinc-800/80 bg-gray-200/80 dark:text-zinc-300 text-gray-700 text-[10px] font-semibold border dark:border-white/5 border-black/5">
                    Filter
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none overscroll-contain">
                {transcript.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 px-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center opacity-40">
                      Ready to sync...
                    </p>
                  </div>
                ) : (
                  transcript.map((msg) => (
                    <div key={msg.id} className="group animate-message-in">
                      <div
                        className={`flex items-center gap-2 mb-1.5 ${msg.isAgent ? "" : "flex-row-reverse"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden ${msg.isAgent ? "bg-indigo-500/90 dark:text-white text-black" : "dark:bg-zinc-800 bg-gray-100 dark:text-zinc-300 text-gray-700"}`}
                        >
                          {msg.isAgent ? (
                            <img
                              src={getAgentImage(displayData.agentName)}
                              alt={msg.speaker}
                              className="w-full h-full object-cover"
                            />
                          ) : user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt="User"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            "U"
                          )}
                        </div>
                        <span className="text-xs font-semibold dark:text-zinc-400 text-gray-600 uppercase tracking-tighter">
                          {msg.speaker} • {msg.timestamp}
                        </span>
                      </div>
                      <div
                        className={`flex ${msg.isAgent ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`p-4 rounded-2xl text-sm w-[75%] transition-all shadow-sm ${msg.isAgent
                            ? "dark:bg-zinc-800/80 bg-gray-200/80 dark:text-zinc-200 text-gray-800 border dark:border-white/5 border-black/5 rounded-tl-none"
                            : "bg-indigo-500 dark:text-white text-black border border-indigo-500/20 rounded-tr-none"
                            }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} className="h-1" />
              </div>
              <div className="p-3 border-t dark:border-white/5 border-black/5 dark:bg-zinc-900/80 bg-gray-100/80 flex items-center justify-between text-[10px] dark:text-zinc-400 text-gray-600">
                <span className="flex items-center gap-2">
                  <FiInfo size={12} />
                  Transcript updates live as you speak
                </span>
                <span className="hidden sm:flex items-center gap-2">
                  <FiShield size={12} />
                  Secure session
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl dark:bg-zinc-900/70 bg-gray-100/70 border dark:border-white/5 border-black/5 p-4">
                <div className="flex items-center gap-2 mb-2 dark:text-zinc-300 text-gray-700">
                  <FiMessageSquare size={14} />
                  <span className="text-[11px] font-semibold">Notes</span>
                </div>
                <p className="text-[11px] dark:text-zinc-500 text-gray-500">
                  Capture key points for your report review.
                </p>
              </div>
              <div className="rounded-2xl dark:bg-zinc-900/70 bg-gray-100/70 border dark:border-white/5 border-black/5 p-4">
                <div className="flex items-center gap-2 mb-2 dark:text-zinc-300 text-gray-700">
                  <FiBarChart2 size={14} />
                  <span className="text-[11px] font-semibold">Progress</span>
                </div>
                <div className="w-full dark:bg-zinc-800 bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-2/3 rounded-full"></div>
                </div>
                <p className="text-[10px] dark:text-zinc-500 text-gray-500 mt-2">
                  AI feedback generated at the end of the session.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
