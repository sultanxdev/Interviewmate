import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiService, handleApiResponse } from "../services/api";
import DashboardLayout from "../components/Layout/DashboardLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Users,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  Database,
  Activity,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Brain,
  Zap,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInterviews: 0,
    totalRevenue: 0,
    activeUsers: 0,
    freeUsers: 0,
    proUsers: 0,
    vapiMinutesUsed: 0,
    webSpeechMinutesUsed: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: "", plan: "", type: "", status: "" });

  useEffect(() => {
    // Check if user is admin
    if (!user?.isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      return;
    }

    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const [analyticsRes, healthRes] = await Promise.all([
        handleApiResponse(() => apiService.admin.getAnalytics()),
        handleApiResponse(() => apiService.admin.getHealth())
      ]);

      if (analyticsRes.success) {
        const { overview, interviewStats, dailyRegistrations, dailyInterviews, topUsers } = analyticsRes.data.analytics;
        setStats({
          totalUsers: overview.totalUsers,
          totalInterviews: overview.totalInterviews,
          totalRevenue: overview.totalRevenue,
          activeUsers: overview.activeUsers,
          proUsers: overview.proUsers,
          freeUsers: overview.totalUsers - overview.proUsers,
          vapiMinutesUsed: 0,
          webSpeechMinutesUsed: 0
        });
        setRecentUsers(topUsers);
      }

      if (healthRes.success) {
        setSystemHealth(healthRes.data.health);
      }

      fetchUsers();
      fetchInterviews();

    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      const result = await handleApiResponse(() =>
        apiService.admin.getUsers({ page, search: filters.search, plan: filters.plan })
      );
      if (result.success) {
        setRecentUsers(result.data.users);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    }
  };

  const fetchInterviews = async (page = 1) => {
    try {
      const result = await handleApiResponse(() =>
        apiService.admin.getInterviews({ page, type: filters.type, status: filters.status })
      );
      if (result.success) {
        setRecentInterviews(result.data.interviews);
      }
    } catch (error) {
      toast.error("Failed to fetch interviews");
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Sample data for charts
  const userGrowthData = [
    { month: "Jan", users: 1200, interviews: 2400 },
    { month: "Feb", users: 1450, interviews: 3100 },
    { month: "Mar", users: 1680, interviews: 3800 },
    { month: "Apr", users: 1920, interviews: 4500 },
    { month: "May", users: 2150, interviews: 5200 },
    { month: "Jun", users: 2380, interviews: 6100 },
    { month: "Jul", users: 2620, interviews: 7200 },
    { month: "Aug", users: 2847, interviews: 8934 },
  ];

  const planDistribution = [
    { name: "Free", value: stats.freeUsers, color: "#3B82F6" },
    { name: "Pro", value: stats.proUsers, color: "#10B981" },
  ];

  const interviewTypeData = [
    { type: "HR", count: 3200, percentage: 36 },
    { type: "Technical", count: 4100, percentage: 46 },
    { type: "Managerial", count: 1634, percentage: 18 },
  ];

  if (!user?.isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading admin dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Manage your InterviewMate platform
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchAdminData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", name: "Overview", icon: BarChart3 },
                { id: "users", name: "Users", icon: Users },
                { id: "interviews", name: "Interviews", icon: MessageSquare },
                { id: "analytics", name: "Analytics", icon: TrendingUp },
                { id: "system", name: "System Health", icon: Activity },
                { id: "settings", name: "Settings", icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalUsers.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      +12% from last month
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Interviews
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalInterviews.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      +18% from last month
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${stats.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      +25% from last month
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Active Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.activeUsers}
                    </p>
                    <p className="text-xs text-gray-500">Last 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Growth Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  User Growth
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#3B82F6"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="interviews"
                        stroke="#10B981"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plan Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Plan Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {planDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Users */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Users
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${user.plan === "pro"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {user.plan}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${user.status === "active"
                              ? "bg-green-500"
                              : "bg-gray-400"
                              }`}
                          ></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Interviews */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Interviews
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentInterviews.map((interview) => (
                    <div key={interview.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {interview.user}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {interview.type} • {interview.duration}min
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium ${interview.score >= 80
                              ? "text-green-600"
                              : interview.score >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                              }`}
                          >
                            {interview.score}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(interview.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">System Health</h2>

            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Database className="w-6 h-6 text-blue-600" />
                    <h3 className="font-medium text-gray-900">Database</h3>
                  </div>
                  {getHealthIcon(systemHealth.database)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getHealthColor(
                        systemHealth.database
                      )}`}
                    >
                      {systemHealth.database}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Response Time</span>
                    <span className="text-gray-900">45ms</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-6 h-6 text-green-600" />
                    <h3 className="font-medium text-gray-900">Gemini AI</h3>
                  </div>
                  {getHealthIcon(systemHealth.geminiAI)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getHealthColor(
                        systemHealth.geminiAI
                      )}`}
                    >
                      {systemHealth.geminiAI}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">API Calls Today</span>
                    <span className="text-gray-900">1,247</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-6 h-6 text-purple-600" />
                    <h3 className="font-medium text-gray-900">VAPI Service</h3>
                  </div>
                  {getHealthIcon(systemHealth.vapiService)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getHealthColor(
                        systemHealth.vapiService
                      )}`}
                    >
                      {systemHealth.vapiService}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Calls</span>
                    <span className="text-gray-900">23</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6 text-yellow-600" />
                    <h3 className="font-medium text-gray-900">
                      Payment Gateway
                    </h3>
                  </div>
                  {getHealthIcon(systemHealth.paymentGateway)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getHealthColor(
                        systemHealth.paymentGateway
                      )}`}
                    >
                      {systemHealth.paymentGateway}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transactions Today</span>
                    <span className="text-gray-900">89</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Usage Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Interview Mode Usage
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-600">
                          Web Speech API
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {stats.webSpeechMinutesUsed.toLocaleString()} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-600">VAPI AI</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {stats.vapiMinutesUsed.toLocaleString()} min
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Interview Types
                  </h4>
                  <div className="space-y-3">
                    {interviewTypeData.map((type) => (
                      <div
                        key={type.type}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">
                          {type.type}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {type.count}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({type.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs placeholders */}
        {activeTab === "users" && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              User Management
            </h3>
            <p className="text-gray-600">
              Detailed user management interface coming soon...
            </p>
          </div>
        )}

        {activeTab === "interviews" && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Interview Management
            </h3>
            <p className="text-gray-600">
              Detailed interview management interface coming soon...
            </p>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Advanced Analytics
            </h3>
            <p className="text-gray-600">
              Comprehensive analytics dashboard coming soon...
            </p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              System Settings
            </h3>
            <p className="text-gray-600">
              Platform configuration interface coming soon...
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
