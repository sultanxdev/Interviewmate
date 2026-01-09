import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useInterview } from "../contexts/InterviewContext";
import DashboardLayout from "../components/Layout/DashboardLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Play,
  BarChart3,
  Clock,
  Trophy,
  TrendingUp,
  Users,
  Code,
  Calendar,
  ArrowRight,
  Zap,
  Globe,
  Brain,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { getInterviewHistory, getAnalytics } = useInterview();
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const defaultAnalytics = {
    overview: {
      totalInterviews: 0,
      averageScore: 0,
      totalMinutes: 0,
      completedInterviews: 0,
    },
    performanceTrend: [],
    skillBreakdown: {},
  };

  const fetchDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (hasFetchedRef.current && retryCountRef.current === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch recent interviews with error handling
      try {
        const historyResult = await getInterviewHistory({ limit: 5 });
        if (historyResult.success) {
          setRecentInterviews(
            historyResult.data?.interviews || historyResult.interviews || []
          );
        } else {
          console.log("No interview history found:", historyResult.message);
          setRecentInterviews([]);
        }
      } catch (historyError) {
        console.error("Failed to fetch interview history:", historyError);
        setRecentInterviews([]);
      }

      // Fetch analytics with error handling
      try {
        const analyticsResult = await getAnalytics();
        if (analyticsResult.success) {
          setAnalytics(
            analyticsResult.data?.analytics ||
            analyticsResult.analytics ||
            defaultAnalytics
          );
        } else {
          console.log("No analytics found:", analyticsResult.message);
          setAnalytics(defaultAnalytics);
        }
      } catch (analyticsError) {
        console.error("Failed to fetch analytics:", analyticsError);
        setAnalytics(defaultAnalytics);
      }

      hasFetchedRef.current = true;
      retryCountRef.current = 0;
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);

      // Handle 429 errors specifically
      if (error.message?.includes("429") || error.response?.status === 429) {
        setError("Too many requests. Please wait a moment before refreshing.");

        // Exponential backoff for retries
        if (retryCountRef.current < maxRetries) {
          const delay = Math.pow(2, retryCountRef.current) * 1000; // 1s, 2s, 4s
          retryCountRef.current++;

          setTimeout(() => {
            fetchDashboardData();
          }, delay);
          return;
        }
      } else {
        setError(
          "Failed to load dashboard data. Please try refreshing the page."
        );
      }

      // Set default empty state
      setRecentInterviews([]);
      setAnalytics(defaultAnalytics);
    } finally {
      setLoading(false);
    }
  }, [getInterviewHistory, getAnalytics]);

  useEffect(() => {
    if (user && !hasFetchedRef.current) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Memoize static data to prevent unnecessary re-renders
  const quickActions = useMemo(
    () => [
      {
        title: "HR Interview",
        description: "Practice behavioral and cultural fit questions",
        icon: Users,
        color: "bg-blue-500",
        href: "/interview/setup?type=hr",
      },
      {
        title: "Technical Interview",
        description: "Test your coding and technical knowledge",
        icon: Code,
        color: "bg-green-500",
        href: "/interview/setup?type=technical",
      },
    ],
    []
  );

  // Memoize computed stats to prevent recalculation on every render
  const stats = useMemo(
    () => [
      {
        name: "Total Interviews",
        value: analytics?.overview?.totalInterviews || 0,
        icon: Calendar,
        color: "text-blue-600",
      },
      {
        name: "Average Score",
        value: analytics?.overview?.averageScore
          ? `${Math.round(analytics.overview.averageScore)}%`
          : "0%",
        icon: Trophy,
        color: "text-yellow-600",
      },
      {
        name: "Practice Time",
        value: analytics?.overview?.totalMinutes
          ? `${Math.round(analytics.overview.totalMinutes)}m`
          : "0m",
        icon: Clock,
        color: "text-green-600",
      },
      {
        name: "Completed",
        value: analytics?.overview?.completedInterviews || 0,
        icon: BarChart3,
        color: "text-purple-600",
      },
    ],
    [analytics?.overview]
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Unable to Load Dashboard
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                hasFetchedRef.current = false;
                retryCountRef.current = 0;
                fetchDashboardData();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-premium transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <span className="text-2xl font-black text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">
                  Welcome back, {user?.name?.split(" ")[0]}! 👋
                </h1>
                <p className="text-slate-500 font-medium">
                  You've completed <span className="text-brand-600 font-bold">{analytics?.overview?.totalInterviews || 0}</span> sessions this month.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/interview/setup" className="btn-premium group">
                <Play className="w-4 h-4 mr-2 fill-current" />
                Start New Session
              </Link>
              <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-brand-600 hover:border-brand-100 transition-all shadow-soft">
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Subscription Status with Badge */}
        <div className="mb-10 glass-card p-6 rounded-2xl border-brand-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="w-32 h-32 text-brand-500" />
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  Membership Status
                </h3>
                <span
                  className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${user?.subscription?.plan === "free"
                      ? "bg-slate-200 text-slate-600"
                      : "bg-brand-500 text-white shadow-glow"
                    }`}
                >
                  {user?.subscription?.plan === "free" ? "Free Member" : "Pro Professional"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-premium !p-4 !bg-white/50 border-white">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">VAPI Minutes</p>
                      <p className="text-lg font-black text-slate-900">{user?.subscription?.vapiMinutesRemaining || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="card-premium !p-4 !bg-white/50 border-white">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-accent-100 rounded-lg text-accent-600">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Web Speech</p>
                      <p className="text-lg font-black text-slate-900">UNLIMITED</p>
                    </div>
                  </div>
                </div>

                {user?.subscription?.plan === "pro" ? (
                  <div className="card-premium !p-4 !bg-white/50 border-white">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Wallet Balance</p>
                        <p className="text-lg font-black text-slate-900">${(user?.subscription?.payAsYouGoBalance || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Link
                      to="/subscription"
                      className="text-brand-600 hover:text-brand-700 font-bold text-sm flex items-center group"
                    >
                      Maximize potential with PRO
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {user?.subscription?.plan === "free" && (
              <Link
                to="/pricing"
                className="btn-premium whitespace-nowrap !bg-slate-900 hover:!bg-black shadow-none"
              >
                Go Unlimited Pro
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="card-premium group hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-slate-50 ${stat.color} shadow-soft group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {stat.name}
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="card-premium h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Practice Lab
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Choose your focus area today</p>
                </div>
                <Link
                  to="/interview/setup"
                  className="p-2 text-slate-400 hover:text-brand-600 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="group relative p-6 bg-slate-50 rounded-2xl border border-transparent hover:border-brand-200 hover:bg-white transition-all duration-300 hover:shadow-premium"
                  >
                    <div className="flex flex-col h-full">
                      <div
                        className={`w-12 h-12 rounded-xl ${action.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform`}
                      >
                        <action.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-black text-slate-900 mb-2">
                        {action.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 flex-1">
                        {action.description}
                      </p>
                      <div className="flex items-center text-[11px] font-black uppercase tracking-widest text-brand-600">
                        <Play className="w-3 h-3 mr-2 fill-current" />
                        Start Session
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Custom Interview Inline */}
              <div className="mt-8 p-6 bg-brand-600 rounded-2xl relative overflow-hidden group shadow-premium">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Brain className="w-24 h-24 text-white" />
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-black mb-1">Custom Adaptive Suite</h4>
                    <p className="text-brand-100 text-xs font-medium">Tailor every question and AI persona</p>
                  </div>
                  <Link
                    to="/interview/setup"
                    className="px-6 py-2 bg-white text-brand-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-50 transition-colors"
                  >
                    Launch Lab
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-premium !p-0 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">
                Sessions
              </h2>
              <Link
                to="/history"
                className="text-brand-600 hover:text-brand-700 font-bold text-xs uppercase tracking-widest"
              >
                All history
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[480px]">
              {recentInterviews.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {recentInterviews.map((interview) => (
                    <div
                      key={interview._id}
                      className="p-5 hover:bg-slate-50/50 transition-colors group"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${interview.type === "hr"
                              ? "bg-brand-50 text-brand-600"
                              : "bg-accent-50 text-accent-600"
                            }`}
                        >
                          {interview.type === "hr" ? (
                            <Users className="w-5 h-5" />
                          ) : (
                            <Code className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                            {interview.candidateInfo.role}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {new Date(interview.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} •
                            {interview.evaluation?.overallScore
                              ? ` Score: ${interview.evaluation.overallScore}%`
                              : " Evaluation Pending"}
                          </p>
                        </div>
                        {interview.status === "completed" && (
                          <Link
                            to={`/interview/report/${interview._id}`}
                            className="p-2 text-slate-300 hover:text-brand-600 transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium mb-8">No interview sessions found</p>
                  <Link
                    to="/interview/setup"
                    className="btn-premium w-full text-center inline-block"
                  >
                    Launch Lab
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        {analytics?.performanceTrend &&
          analytics.performanceTrend.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Performance Trend
                </h2>
                <Link
                  to="/analytics"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                >
                  View detailed analytics
                  <TrendingUp className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    Performance chart will be displayed here
                  </p>
                  <p className="text-sm text-gray-400">
                    Install chart library to enable visualization
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
