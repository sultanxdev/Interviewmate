import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
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
  Bar
} from 'recharts'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  Award,
  Clock,
  Loader2
} from 'lucide-react'

const AnalyticsPage = () => {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/user/analytics?range=${timeRange}`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for demonstration
  const mockAnalytics = {
    totalInterviews: 24,
    averageScore: 78,
    bestScore: 94,
    improvementRate: 12,
    scoreProgress: [
      { date: '2024-01-01', score: 65 },
      { date: '2024-01-08', score: 72 },
      { date: '2024-01-15', score: 78 },
      { date: '2024-01-22', score: 82 },
      { date: '2024-01-29', score: 78 }
    ],
    interviewTypes: [
      { name: 'Technical', value: 12, color: '#4F46E5' },
      { name: 'HR', value: 8, color: '#10B981' },
      { name: 'Managerial', value: 3, color: '#F59E0B' },
      { name: 'Custom', value: 1, color: '#EF4444' }
    ],
    skillBreakdown: [
      { skill: 'Communication', current: 85, previous: 78 },
      { skill: 'Technical', current: 82, previous: 75 },
      { skill: 'Problem Solving', current: 79, previous: 72 },
      { skill: 'Confidence', current: 76, previous: 70 },
      { skill: 'Leadership', current: 73, previous: 68 }
    ],
    weeklyActivity: [
      { day: 'Mon', interviews: 4 },
      { day: 'Tue', interviews: 3 },
      { day: 'Wed', interviews: 5 },
      { day: 'Thu', interviews: 2 },
      { day: 'Fri', interviews: 6 },
      { day: 'Sat', interviews: 3 },
      { day: 'Sun', interviews: 1 }
    ]
  }

  const data = analytics || mockAnalytics

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analytics & Insights
              </h1>
            </div>
            
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Interviews</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.totalInterviews}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.averageScore}%</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Best Score</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.bestScore}%</p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Improvement</p>
                  <p className="text-3xl font-bold text-green-600">+{data.improvementRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Score Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Score Progress Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.scoreProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4F46E5" 
                    strokeWidth={3}
                    dot={{ fill: '#4F46E5', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Interview Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.interviewTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.interviewTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Skills Improvement */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.skillBreakdown.map((skill, index) => {
                  const improvement = skill.current - skill.previous
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {skill.skill}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{skill.current}%</span>
                            <div className={`flex items-center space-x-1 ${
                              improvement > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {improvement > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              <span className="text-xs">+{improvement}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${skill.current}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="interviews" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Insights and Recommendations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>AI Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">🎯 Key Insights</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Your technical interview scores have improved by 15% this month</li>
                  <li>• Communication skills show consistent strength across all interviews</li>
                  <li>• Best performance days are Tuesday and Friday</li>
                  <li>• Average interview duration has decreased, showing improved efficiency</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">💡 Recommendations</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Focus on leadership questions to boost managerial interview scores</li>
                  <li>• Practice more system design questions for senior roles</li>
                  <li>• Schedule interviews on your high-performance days</li>
                  <li>• Consider upgrading to Pro for advanced analytics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsPage