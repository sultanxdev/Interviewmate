import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMoreVertical, FiLoader } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { interviewAgents } from "../constants/agents";

const PastInterviews = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pastInterviews, setPastInterviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPastInterviews = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/vapi-interview/user`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (Array.isArray(res.data)) {
          setPastInterviews(res.data);
        } else {
          setPastInterviews([]);
        }
      } catch (err) {
        console.error("Error fetching past interviews:", err);
      }
    };
    fetchPastInterviews();
  }, []);

  const handleGenerateReport = async (e, sessionId) => {
    e.stopPropagation();
    const token = await getToken();
    setLoading(true);
    navigate(`/interview/result/${sessionId}`);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/vapi-interview/retry-analysis`,
        { sessionId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInterviews = Array.isArray(pastInterviews)
    ? pastInterviews.slice(indexOfFirstItem, indexOfLastItem)
    : [];
  const totalPages = Math.ceil(
    (Array.isArray(pastInterviews) ? pastInterviews.length : 0) / itemsPerPage,
  );

  return (
    <div className="min-h-screen bg-background dark:bg-background text-zinc-100 transition-colors font-sans selection:bg-primary/30 pb-20">
      <div className="max-w-6xl mx-auto px-6 w-full animate-fade-in-up mt-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold dark:text-white text-black">
            Your Interviews
          </h2>
        </div>

        <div className="overflow-hidden rounded-xl border dark:border-white/5 border-black/5 dark:bg-[#1a1a1a]/40 bg-gray-100/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-white/5 border-black/5 dark:text-zinc-400 text-gray-600 text-xs font-medium dark:bg-[#1a1a1a]/50 bg-gray-100/50">
                  <th className="px-6 py-4 font-medium">Interviewer</th>
                  <th className="px-6 py-4 font-medium">Job Title</th>
                  <th className="px-6 py-4 font-medium">Interview Type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {currentInterviews.length > 0 ? (
                  currentInterviews.map((session) => {
                    const agentName = session.metadata?.agentName || "Rohan";
                    const agent = interviewAgents.find(
                      (a) => a.name === agentName,
                    ) || {
                      bg: "6366f1",
                      image: "/assets/interviewers/male1.png",
                    };
                    return (
                      <tr
                        key={session._id}
                        onClick={() =>
                          navigate(`/interview/result/${session._id}`)
                        }
                        className="border-b dark:border-white/5 border-black/5 dark:bg-[#1a1a1a]/50 bg-gray-100/50 dark:hover:bg-[#1a1a1a] hover:bg-white transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={agent.image}
                              alt={agentName}
                              className="w-8 h-8 rounded-full border dark:border-zinc-700 border-gray-300 object-cover"
                            />
                            <span className="dark:text-zinc-200 text-gray-800 font-medium group-hover:text-indigo-400 transition-colors">
                              {agentName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="dark:text-white text-black font-medium">
                            {session.metadata?.role || "Interview Session"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="dark:text-zinc-300 text-gray-700 capitalize">
                            {session.interviewType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 text-[11px] font-semibold rounded-md ${
                              session.status === "completed"
                                ? "dark:bg-[#253321] dark:text-[#93dc65] bg-green-600 text-white border dark:border-[#3e5338]"
                                : session.status === "analysis_pending"
                                  ? "dark:bg-blue-500/10 dark:text-blue-400 border bg-blue-500 text-white dark:border-blue-500/20"
                                  : session.status === "analysis_failed"
                                    ? "dark:bg-red-500/10 dark:text-red-400 border bg-red-500 text-white dark:border-red-500/20"
                                    : "dark:bg-yellow-500/10 dark:text-yellow-400 border bg-yellow-500 text-white dark:border-yellow-500/20"
                            }`}
                          >
                            {session.status === "completed"
                              ? "Completed"
                              : session.status === "analysis_pending"
                                ? "Analyzing..."
                                : session.status === "analysis_failed"
                                  ? "Analysis Failed"
                                  : "Incomplete"}
                          </span>
                        </td>
                        <td className="px-6 py-4 dark:text-zinc-300 text-gray-700 font-medium truncate max-w-[120px]">
                          {formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(session.status === "analysis_pending" ||
                              session.status === "analysis_failed") && (
                              <button
                                onClick={(e) =>
                                  handleGenerateReport(e, session._id)
                                }
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20"
                              >
                                Generate Report
                              </button>
                            )}
                            <button
                              className="dark:text-zinc-500 text-gray-500 dark:hover:text-white hover:text-black transition-colors p-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FiMoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                      No interviews found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === i + 1
                    ? "bg-primary text-black"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PastInterviews;
