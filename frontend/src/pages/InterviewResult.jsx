import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { FiChevronLeft, FiMessageSquare } from "react-icons/fi";
import { useInterview } from "../context/InterviewContext";
import { useAuth } from "../context/AuthContext";

const CircularProgress = ({ score, label, size = 100 }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-3" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-zinc-800"
            strokeWidth="6"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="text-orange-600 transition-all duration-1000 ease-out"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {Math.round(score)}%
          </span>
        </div>
      </div>
      <span className="text-xs font-bold text-zinc-300">{label}</span>
    </div>
  );
};

const ExpandableText = ({ text, limit = 200 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (text.length <= limit) return <p className="leading-relaxed">{text}</p>;

  return (
    <div>
      <p className="leading-relaxed">
        {isExpanded ? text : `${text.substring(0, limit)}...`}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold transition-colors inline-flex items-center"
        >
          {isExpanded ? "read Less" : "read More"}
        </button>
      </p>
    </div>
  );
};

const InterviewResult = () => {
  const { report, setReport, transcript, setTranscript, resetInterview } =
    useInterview();
  const { getToken } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState(null);

  const [status, setStatus] = useState(null);

  useEffect(() => {
    let intervalId;
    const fetchReport = async () => {
      if (!report && sessionId) {
        try {
          const token = await getToken();
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/vapi-interview/report/${sessionId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (response.data) {
            if (response.data.report) {
              setReport(response.data.report);
              setMetadata(response.data.metadata);
              if (response.data.transcript) {
                if (Array.isArray(response.data.transcript)) {
                  setTranscript(response.data.transcript);
                }
              }
              // Stop polling if report is found
              if (intervalId) clearInterval(intervalId);
            }
            setStatus(response.data.status);

            // If status is completed or failed, stop polling
            if (
              response.data.status === "completed" ||
              response.data.status === "analysis_failed"
            ) {
              if (intervalId) clearInterval(intervalId);
            }
          }
        } catch (error) {
          console.error("Error fetching report:", error);
          if (intervalId) clearInterval(intervalId);
          navigate("/interview/setup");
        }
      } else if (!report && !sessionId) {
        navigate("/interview/setup");
      }
    };

    fetchReport();

    // Start polling if analysis is pending
    if (!report && sessionId) {
      intervalId = setInterval(fetchReport, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [report, sessionId, navigate, setReport, setTranscript]);

  if (!report || status === "analysis_pending")
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-6">
        <div className="flex flex-col items-center text-center max-w-md">
          {status === "analysis_failed" ? (
            <>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <span className="text-red-500 text-2xl">!</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Analysis Failed
              </h2>
              <p className="text-zinc-400 mb-8">
                We couldn't generate the AI analysis for this session. You can
                try regenerating it from the setup page.
              </p>
              <button
                onClick={() => navigate("/interview/setup")}
                className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all"
              >
                Go to Setup
              </button>
            </>
          ) : (
            <div className="space-y-8 animate-pulse">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
                  Analyzing Your Interview...
                </h2>
                <div className="flex flex-col gap-2">
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Our AI is currently reviewing your transcript to provide
                    detailed feedback and scores.
                  </p>
                  <p className="text-indigo-400/60 text-xs font-bold uppercase tracking-widest">
                    This usually takes 30-60 seconds
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );

  const detailedReport = report.detailedAnalysis || report;
  const questions = detailedReport.questions || [];
  const overall = detailedReport.overall || {};

  const displayScores = [
    { label: "Correctness", score: overall.correctness || 0 },
    { label: "Clarity", score: overall.clarity || 0 },
    { label: "Relevance", score: overall.relevance || 0 },
    { label: "Detail", score: overall.detail || 0 },
    { label: "Efficiency", score: overall.efficiency || 0 },
    { label: "Creativity", score: overall.creativity || 0 },
    { label: "Communication", score: overall.communication || 0 },
    { label: "Problem Solving", score: overall.problemSolving || 0 },
  ];

  return (
    <div className="min-h-screen py-20 px-6 bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Breadcrumb */}
        <div className="mb-10">
          <Link
            to="/interview/setup"
            className="text-zinc-500 hover:text-white transition-colors flex items-center text-sm font-medium"
          >
            <FiChevronLeft className="mr-2" /> Interviews
          </Link>
        </div>

        {/* Header Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-black text-white tracking-tighter">
              {metadata?.role || "Interview Performance"}
            </h1>
            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
              Completed
            </span>
          </div>
          <p className="text-zinc-500 font-medium">
            {new Date(metadata?.createdAt || Date.now()).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            )}
          </p>
        </div>

        {/* Overall Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8 mb-20 border-t border-zinc-800/50 pt-12">
          {displayScores.map((s, idx) => (
            <CircularProgress key={idx} score={s.score} label={s.label} />
          ))}
        </div>

        {/* Conversation Section */}
        <div className="space-y-10">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center mb-10">
            Interview conversation
          </h2>

          <div className="space-y-8">
            {questions.length > 0 ? (
              questions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/40 border border-zinc-800/50 rounded-[24px] overflow-hidden shadow-xl transition-all hover:border-zinc-700/50"
                >
                  <div className="p-8 space-y-6">
                    {/* Question */}
                    <div>
                      <h4 className="text-base font-bold text-white mb-2">
                        Question: {idx + 1}
                      </h4>
                      <div className="text-zinc-400 text-sm leading-relaxed">
                        <ExpandableText text={q.question} />
                      </div>
                    </div>

                    {/* Answer */}
                    <div>
                      <h4 className="text-base font-bold text-white mb-2">
                        Answer
                      </h4>
                      <div className="text-zinc-400 text-sm leading-relaxed">
                        <ExpandableText text={q.answer} />
                      </div>
                    </div>

                    {/* Expected Answer */}
                    {q.expectedAnswer && (
                      <div>
                        <h4 className="text-base font-bold text-indigo-400 mb-2">
                          Expected Answer
                        </h4>
                        <div className="text-zinc-300 text-sm leading-relaxed italic bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                          <ExpandableText text={q.expectedAnswer} />
                        </div>
                      </div>
                    )}

                    {/* Improved Answer */}
                    {q.improvedAnswer && (
                      <div>
                        <h4 className="text-base font-bold text-emerald-400 mb-2">
                          Improved Answer
                        </h4>
                        <div className="text-zinc-300 text-sm leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                          <ExpandableText text={q.improvedAnswer} />
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    <div>
                      <h4 className="text-base font-bold text-[#94f243] mb-2">
                        Feedback
                      </h4>
                      <div className="text-zinc-200 text-sm leading-relaxed">
                        <ExpandableText text={q.feedback} />
                      </div>
                    </div>

                    {/* Individual Scores */}
                    <div className="pt-4 flex flex-wrap gap-3">
                      {Object.entries(q.scores || {}).map(([key, val]) => {
                        const formattedKey = key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())
                          .replace(/_/g, " ");
                        return (
                          <div
                            key={key}
                            className="bg-[#3a2012] px-3 py-1 rounded-md border border-[#5a301a]"
                          >
                            <span className="text-[11px] font-bold text-[#f28743] uppercase tracking-tight">
                              {formattedKey}{" "}
                              <span className="ml-1 text-[#f28743] font-medium opacity-80">
                                {val}%
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-zinc-900/20 rounded-[32px] border border-zinc-800/50">
                <p className="text-zinc-500">
                  No question analysis available for this session.
                </p>
              </div>
            )}
          </div>

          <div className="pt-10 flex justify-center">
            <button
              onClick={() => {
                resetInterview();
                navigate("/interview/setup");
              }}
              className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all shadow-xl"
            >
              Start New Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewResult;
