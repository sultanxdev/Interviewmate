import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { 
  Play, 
  BarChart3, 
  History, 
  User, 
  Settings, 
  Crown,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    recentInterviews: []
  })

  useEffect(() => {
    // Fetch user stats
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    // This would be an API call to get user statistics
    // For now, using mock data
    setStats({
      totalInterviews: 12,
      averageScore: 78,
      bestScore: 92,
      recentInterviews: [
        { id: 1, role: 'Frontend Developer', score: 85, date: '2024-01-15', type: 'Technical' },
        { id: 2, role: 'Product Manager', score: 78, date: '2024-01-14', type: 'HR' },
        { id: 3, role: 'Backend Developer', score: 92, date: '2024-01-13', type: 'Technical' }
      ]
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r">
        <div className="p-6">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            InterviewMate
          </Link>
        </div>
        
        <nav className="mt-6">
          <div className="px-6 space-y-2">
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/interview/setup" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Play className="h-5 w-5" />
              <span>Interview Setup</span>
            </Link>
            <Link 
              to="/history" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <History className="h-5 w-5" />
              <span>Reports</span>
            </Link>
            <Link 
              to="/profile" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
            <Link 
              to="/settings" 
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </div>
          
          {/* Subscription Badge */}
          <div className="px-6 mt-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="h-5 w-5 text-yellow-300" />
                <span className="font-semibold">{user?.subscription || 'Free'} Plan</span>
              </div>
              {(!user?.subscription || user?.subscription === 'free') && (
                <>
                  <p className="text-sm text-indigo-100 mb-3">
                    Upgrade to Pro for unlimited interviews
                  </p>
                  <Button size="sm" className="w-full bg-white text-indigo-600 hover:bg-gray-100">
                    Upgrade Now
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getGreeting()}, {user?.name}! 👋
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Ready to practice your interview skills today?
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{user?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">


        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/interview/setup">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-indigo-200 hover:border-indigo-300">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Play className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Start Interview</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Begin new practice</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/history">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <History className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">View History</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Past interviews</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/analytics">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Performance insights</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/profile">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <User className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Profile</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Account settings</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Interviews</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalInterviews}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Score</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.averageScore}%</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Best Score</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.bestScore}%</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Interviews */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Interviews</h2>
            <Link to="/history">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {stats.recentInterviews.length > 0 ? (
            <div className="space-y-4">
              {stats.recentInterviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      interview.score >= 80 ? 'bg-green-500' : 
                      interview.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{interview.role}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{interview.type} • {interview.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {interview.score}%
                    </span>
                    <Link to={`/report/${interview.id}`}>
                      <Button variant="outline" size="sm">View Report</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300 mb-4">No interviews yet</p>
              <Link to="/interview/setup">
                <Button>Start Your First Interview</Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Upgrade Banner for Free Users */}
        {(!user?.subscription || user?.subscription === 'Free') && (
          <Card className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
                <p className="text-indigo-100">
                  Unlock unlimited interviews, advanced analytics, and PDF exports
                </p>
              </div>
              <Button className="bg-white text-indigo-600 hover:bg-gray-100">
                Upgrade Now
              </Button>
            </div>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard