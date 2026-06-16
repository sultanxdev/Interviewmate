import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiUser,
  FiLoader,
  FiShield,
  FiChevronDown,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useInterview } from "../context/InterviewContext";
import { useAuth } from "../context/AuthContext";

import { interviewAgents } from "../constants/agents";

const CreateInterview = () => {
  const {
    interviewData,
    setInterviewData,
    setSessionId,
    resetInterview,
    isCameraEnabled,
    setIsCameraEnabled,
    isMicEnabled,
    setIsMicEnabled,
  } = useInterview();

  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState("both"); // 'resume', 'jobDescription', 'both'
  const [jobDescription, setJobDescription] = useState("");
  const [resumeContent, setResumeContent] = useState("");
  const [showAllAgents, setShowAllAgents] = useState(false);
  const [isExperienceDropdownOpen, setIsExperienceDropdownOpen] = useState(false);

  const localVideoRef = useRef(null);
  const experienceDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    resetInterview();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (experienceDropdownRef.current && !experienceDropdownRef.current.contains(event.target)) {
        setIsExperienceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      if (isCameraEnabled) {
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
          setIsCameraEnabled(false);
          toast.error("Could not access camera. Please check permissions.");
        }
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraEnabled]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInterviewData((prev) => ({ ...prev, [name]: value }));
  };

  const startInterview = async () => {
    if (!isCameraEnabled || !isMicEnabled) {
      toast.error("Please enable both camera and microphone to start.");
      return;
    }

    let combinedContent = "";
    if (inputType === "resume") combinedContent = `Resume: ${resumeContent}`;
    else if (inputType === "jobDescription")
      combinedContent = `Job Description: ${jobDescription}`;
    else {
      if (!resumeContent && !jobDescription) {
        toast.error("Please provide resume or job description content.");
        return;
      }
      if (resumeContent) combinedContent += `Resume: ${resumeContent}\n`;
      if (jobDescription)
        combinedContent += `Job Description: ${jobDescription}`;
    }

    if (!combinedContent.trim()) {
      toast.error("Please provide resume or job description content.");
      return;
    }

    const finalInterviewData = {
      ...interviewData,
      content: combinedContent,
    };

    setLoading(true);
    const token = await getToken();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/vapi-interview/start`,
        finalInterviewData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const { systemPrompt, sessionId: newSessionId } = response.data;
      setSessionId(newSessionId);

      navigate(`/session/${newSessionId}`, {
        state: { systemPrompt },
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize interview.");
    } finally {
      setLoading(false);
    }
  };

  const toggleVideo = () => setIsCameraEnabled(!isCameraEnabled);

  return (
    <div className="min-h-screen bg-background dark:bg-background text-zinc-100 transition-colors font-sans selection:bg-primary/30 pb-20">
      <div className="flex flex-col lg:flex-row items-start justify-center gap-12 max-w-7xl mx-auto animate-fade-in-up mt-8 px-4">
        {/* Pre-call Preview / Green Room - Sticky Section */}
        <div className="w-full lg:w-1/2 flex  flex-col sticky top-8 space-y-4 animate-fade-in-left">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold dark:text-white text-black tracking-tight">
              Practice Interview{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                with AI
              </span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium">Prepare for your dream job with real-time AI feedback.</p>
          </div>

          <div className="relative aspect-video bg-zinc-950 rounded-[2rem] border-2 border-primary/20 overflow-hidden group shadow-2xl shadow-indigo-500/10">
            {isCameraEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover mirror"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm">
                <div className="flex flex-col items-center opacity-80">
                  {user?.avatar ? (
                    <img
                      src={user?.avatar}
                      alt="User Avatar"
                      className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-indigo-500/30"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 border-2 border-indigo-500/50">
                      <span className="text-3xl font-bold text-indigo-400">
                        {[user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || <FiUser className="text-4xl text-indigo-400" />}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-zinc-400 tracking-wide uppercase">
                    Camera is Off
                  </span>
                </div>
              </div>
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-2xl p-2.5 rounded-3xl border border-white/10 transition-all duration-300 shadow-2xl hover:bg-zinc-900">
              <button
                onClick={() => setIsMicEnabled(!isMicEnabled)}
                className={`p-4 rounded-2xl transition-all cursor-pointer ${!isMicEnabled ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 hover:bg-white/10 text-white"}`}
              >
                {!isMicEnabled ? <FiMicOff className="text-xl" /> : <FiMic className="text-xl" />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-2xl transition-all cursor-pointer ${!isCameraEnabled ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 hover:bg-white/10 text-white"}`}
              >
                {!isCameraEnabled ? <FiVideoOff className="text-xl" /> : <FiVideo className="text-xl" />}
              </button>
            </div>

            <div className="absolute top-6 left-6 flex items-center space-x-2 bg-zinc-900/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold tracking-widest text-white uppercase opacity-90">
                System Ready
              </span>
            </div>
          </div>

          <div className="dark:bg-[#1a1a1a] bg-white p-7 shadow-xl rounded-[2rem] border dark:border-white/5 border-gray-100 ring-1 ring-black/5">
            <h3 className="text-lg font-bold dark:text-white text-black mb-3 flex items-center">
              <FiShield className="mr-3 text-indigo-400 text-xl" /> Professional
              Environment
            </h3>
            <p className="text-sm dark:text-zinc-400 text-gray-600 leading-relaxed font-medium">
              Ensure you are in a quiet room with good lighting. Our AI
              interviewer will analyze both your tone and content to provide
              detailed feedback.
            </p>
          </div>
        </div>

        {/* Setup Form */}
        <div className="w-1/3 flex flex-col gap-6 animate-fade-in-right px-4">
          <div className="pb-2">
            <h2 className="text-base font-bold dark:text-white text-black mb-1">
              Interview details
            </h2>
            <p className="dark:text-zinc-500 text-gray-500 text-sm">
              Give the job details you want to apply for
            </p>
          </div>

          <div className="space-y-6">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-semibold dark:text-white text-black mb-2">
                Job title
              </label>
              <input
                name="role"
                value={interviewData?.role || ""}
                onChange={handleInputChange}
                placeholder="Frontend Developer"
                className="w-full px-4 py-2.5 bg-black border border-zinc-700 rounded-xl text-white focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none text-sm placeholder-gray-400 shadow-sm"
              />
            </div>

            <hr className="dark:border-white/5 border-black/5" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold dark:text-white text-black">
                  Context source
                </label>
                <div className="flex dark:bg-black rounded-full p-1 border border-zinc-800 w-fit shadow-sm">
                  <button
                    onClick={() => setInputType("jobDescription")}
                    className={`px-4 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${inputType === "jobDescription" ? "dark:bg-zinc-700 bg-gray-200 dark:text-white text-black shadow-sm" : "dark:text-zinc-500 text-gray-500 dark:hover:text-zinc-300 hover:text-gray-700"}`}
                  >
                    Job Description
                  </button>
                  <button
                    onClick={() => setInputType("resume")}
                    className={`px-4 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${inputType === "resume" ? "dark:bg-zinc-700 bg-gray-200 dark:text-white text-black shadow-sm" : "dark:text-zinc-500 text-gray-500 dark:hover:text-zinc-300 hover:text-gray-700"}`}
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => setInputType("both")}
                    className={`px-4 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${inputType === "both" ? "dark:bg-zinc-700 bg-gray-200 dark:text-white text-black shadow-sm" : "dark:text-zinc-500 text-gray-500 dark:hover:text-zinc-300 hover:text-gray-700"}`}
                  >
                    Both
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(inputType === "jobDescription" || inputType === "both") && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-semibold dark:text-white text-black">
                        Paste the job description here
                      </label>
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows="4"
                      placeholder="e.g. We are seeking a React.js Developer to join our dynamic team in..."
                      className="w-full p-4 bg-black  border border-zinc-700 rounded-xl text-white  focus:ring-1 focus:ring-indigo-500/50 transition-all outline-none resize-none text-sm dark:placeholder-zinc-600 placeholder-gray-500 shadow-sm"
                    ></textarea>
                  </div>
                )}

                {(inputType === "resume" || inputType === "both") && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-semibold dark:text-white text-black">
                        Paste your resume text here
                      </label>
                    </div>
                    <textarea
                      value={resumeContent}
                      onChange={(e) => setResumeContent(e.target.value)}
                      rows="4"
                      placeholder="Paste your core resume points, skills, and experience..."
                      className="w-full p-4 bg-black  border border-zinc-700 rounded-xl text-white  focus:ring-1 focus:ring-indigo-500/50 transition-all outline-none resize-none text-sm dark:placeholder-zinc-600 placeholder-gray-500 shadow-sm"
                    ></textarea>
                  </div>
                )}
              </div>
            </div>

            <hr className="dark:border-white/5 border-black/5" />

            {/* Experience Level */}
            <div className="relative" ref={experienceDropdownRef}>
              <label className="block text-sm font-semibold dark:text-white text-black mb-2">
                Experience level
              </label>
              <button
                type="button"
                onClick={() => setIsExperienceDropdownOpen(!isExperienceDropdownOpen)}
                className="w-full md:w-1/2 flex items-center justify-between px-4 py-2.5 bg-black border border-zinc-700 rounded-xl text-white focus:ring-1 focus:ring-indigo-500/50 outline-none text-sm shadow-sm transition-colors cursor-pointer"
              >
                <span>
                  {
                    [
                      { value: "Junior", label: "Entry Level" },
                      { value: "Mid-Level", label: "Mid-Level Associate" },
                      { value: "Senior", label: "Senior Professional" },
                      { value: "Architect", label: "Architect / Lead" }
                    ].find((level) => level.value === (interviewData.level || "Junior"))?.label
                  }
                </span>
                <FiChevronDown className={`transition-transform duration-200 text-gray-500 ${isExperienceDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isExperienceDropdownOpen && (
                <div className="absolute z-10 w-full md:w-1/2 mt-2 bg-black border border-zinc-700 rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
                  {[
                    { value: "Junior", label: "Entry Level" },
                    { value: "Mid-Level", label: "Mid-Level Associate" },
                    { value: "Senior", label: "Senior Professional" },
                    { value: "Architect", label: "Architect / Lead" },
                  ].map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => {
                        handleInputChange({ target: { name: "level", value: level.value } });
                        setIsExperienceDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                        (interviewData.level || "Junior") === level.value
                          ? "dark:bg-indigo-500/10 bg-indigo-50 dark:text-indigo-400 text-indigo-600 font-semibold"
                          : "dark:text-zinc-300 text-gray-700 dark:hover:bg-zinc-800 hover:bg-gray-100"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <hr className="dark:border-white/5 border-black/5" />

            {/* Interviewer Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold dark:text-white text-black">
                  Select Interviewer
                </label>
                <button
                  onClick={() => setShowAllAgents(!showAllAgents)}
                  className="text-[11px] font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  {showAllAgents ? "Show Less" : "View All"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 transition-all duration-300">
                {interviewAgents
                  .slice(0, showAllAgents ? undefined : 4)
                  .map((agent) => (
                    <div
                      key={agent.name}
                      onClick={() =>
                        setInterviewData((p) => ({
                          ...p,
                          agentName: agent.name,
                          agentVoiceProvider: agent.provider,
                          agentVoiceId: agent.voiceId,
                        }))
                      }
                      style={{
                        borderColor:
                          interviewData.agentName === agent.name
                            ? `#${agent.bg}`
                            : "",
                        backgroundColor:
                          interviewData.agentName === agent.name
                            ? `#${agent.bg}15`
                            : "",
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${interviewData.agentName === agent.name
                        ? "shadow-md scale-[1.02]"
                        : "border-zinc-700  bg-zinc-900 hover:border-zinc-600 opacity-80 hover:opacity-100"
                        }`}
                    >
                      <div
                        className={`relative rounded-full p-0.5 transition-all ${interviewData.agentName === agent.name
                          ? "scale-110"
                          : ""
                          }`}
                        style={{
                          background:
                            interviewData.agentName === agent.name
                              ? `linear-gradient(135deg, #${agent.bg}, #${agent.bg}88)`
                              : "transparent",
                        }}
                      >
                        <img
                          src={agent.image}
                          alt={agent.name}
                          className={`w-10 h-10 rounded-full object-cover border-2 ${interviewData.agentName === agent.name
                            ? "border-transparent"
                            : "border-transparent grayscale-0"
                            }`}
                        />
                      </div>
                      <div>
                        <p
                          className="text-sm font-bold dark:text-white text-black transition-colors"
                          style={{
                            color:
                              interviewData.agentName === agent.name
                                ? `#${agent.bg}`
                                : "",
                          }}
                        >
                          {agent.name}
                        </p>
                        <p className="text-[10px] dark:text-zinc-500 text-gray-500 font-medium">
                          {agent.label} Voice
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <hr className="dark:border-white/5 border-black/5" />

            {/* Interview Types */}
            <div className="space-y-5 pt-1">
              {/* Technical */}
              <label className="flex items-start gap-4 cursor-pointer group">
                <div
                  className={`mt-0.5 flex flex-shrink-0 items-center justify-center w-4 h-4 rounded-full border transition-colors ${interviewData.interviewType === "technical" ? "border-blue-500 bg-blue-500" : "border-zinc-600 dark:bg-zinc-800 bg-gray-100"}`}
                >
                  {interviewData.interviewType === "technical" && (
                    <div className="w-2 h-2 bg-zinc-300 rounded-full"></div>
                  )}
                </div>
                <input
                  type="radio"
                  className="hidden"
                  name="interviewType"
                  value="technical"
                  onChange={() =>
                    setInterviewData((p) => ({
                      ...p,
                      interviewType: "technical",
                    }))
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[15px] dark:text-zinc-100 text-gray-900 font-bold">
                      Technical
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium whitespace-nowrap">
                      Problem solving
                    </span>
                  </div>
                  <p className="text-sm dark:text-zinc-400 text-gray-600 font-medium">
                    Test your expertise and problem-solving skills
                  </p>
                </div>
              </label>

              {/* Behavioral */}
              <label className="flex items-start gap-4 cursor-pointer group">
                <div
                  className={`mt-0.5 flex flex-shrink-0 items-center justify-center w-4 h-4 rounded-full border transition-colors ${interviewData.interviewType === "behavioral" ? "border-blue-500 bg-blue-500" : "border-zinc-600 dark:bg-zinc-800 bg-gray-100"}`}
                >
                  {interviewData.interviewType === "behavioral" && (
                    <div className="w-2 h-2 bg-zinc-300 rounded-full"></div>
                  )}
                </div>
                <input
                  type="radio"
                  className="hidden"
                  name="interviewType"
                  value="behavioral"
                  onChange={() =>
                    setInterviewData((p) => ({
                      ...p,
                      interviewType: "behavioral",
                    }))
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[15px] dark:text-zinc-100 text-gray-900 font-bold">
                      Behavioral
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-medium whitespace-nowrap">
                      Soft skills
                    </span>
                  </div>
                  <p className="text-sm dark:text-zinc-400 text-gray-600 font-medium">
                    Evaluate your experiences and interpersonal skills
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-4">
              <button
                onClick={startInterview}
                disabled={loading}
                className="w-full md:w-auto px-10 bg-indigo-500 hover:bg-indigo-600 cursor-pointer text-white font-bold py-3 rounded-xl transition-all inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(190,242,100,0.15)]"
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" /> Starting...
                  </>
                ) : (
                  "Start Interview"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CreateInterview;
