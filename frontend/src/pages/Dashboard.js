import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserIcon, 
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { currentUser, isPro } = useAuth();
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    lastInterviewDate: null
  });
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // API base URL from environment variable or default
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch user stats and recent interviews from API
        const [analyticsResponse, interviewsResponse] = await Promise.all([
          axios.get(`${API_URL}/reports/analytics/overview`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/interviews?limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (analyticsResponse.data) {
          setStats({
            totalInterviews: analyticsResponse.data.totalInterviews || 0,
            averageScore: analyticsResponse.data.averageScore || 0,
            lastInterviewDate: currentUser?.stats?.lastInterviewDate || null
          });
        }

        if (interviewsResponse.data && interviewsResponse.data.interviews) {
          setRecentInterviews(interviewsResponse.data.interviews.filter(interview => 
            interview.status === 'completed'
          ));
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Fallback to user stats if API fails
        setStats({
          totalInterviews: currentUser?.stats?.totalInterviews || 0,
          averageScore: currentUser?.stats?.averageScore || 0,
          lastInterviewDate: currentUser?.stats?.lastInterviewDate || null
        });
        
        // Set empty array for recent interviews if API fails
        setRecentInterviews([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, API_URL]);

  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Card variants for animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    })
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {currentUser?.name || 'User'}!
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your interview practice dashboard
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isPro() ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {isPro() ? 'Pro Plan' : 'Free Plan'}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Interviews
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.totalInterviews}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <DocumentTextIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Average Score
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {stats.averageScore ? `${Math.round(stats.averageScore * 10)}%` : 'N/A'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <UserIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Last Interview
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {formatDate(stats.lastInterviewDate)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <Link 
            to="/interview-setup" 
            className="block h-full bg-indigo-600 hover:bg-indigo-700 shadow rounded-lg overflow-hidden transition-colors duration-200"
          >
            <div className="px-4 py-5 sm:p-6 flex items-center justify-between">
              <div>
                <PlayIcon className="h-8 w-8 text-white mb-3" aria-hidden="true" />
                <h3 className="text-lg font-medium text-white">Start Interview</h3>
                <p className="mt-1 text-sm text-indigo-200">
                  Practice with AI interviewer
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
          </Link>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <Link 
            to="/reports" 
            className="block h-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow rounded-lg overflow-hidden transition-colors duration-200"
          >
            <div className="px-4 py-5 sm:p-6 flex items-center justify-between">
              <div>
                <ChartBarIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-3" aria-hidden="true" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">View Reports</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Check your past performance
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </div>
          </Link>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={5}
        >
          <Link 
            to="/reports/analytics/overview" 
            className="block h-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow rounded-lg overflow-hidden transition-colors duration-200"
          >
            <div className="px-4 py-5 sm:p-6 flex items-center justify-between">
              <div>
                <ChartBarIcon className="h-8 w-8 text-green-600 dark:text-green-400 mb-3" aria-hidden="true" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">View Analytics</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Track your progress
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </div>
          </Link>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={6}
        >
          <Link 
            to="/profile" 
            className="block h-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow rounded-lg overflow-hidden transition-colors duration-200"
          >
            <div className="px-4 py-5 sm:p-6 flex items-center justify-between">
              <div>
                <CogIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mb-3" aria-hidden="true" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Settings</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Update your preferences
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Recent Interviews */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Interviews</h2>
          <Link 
            to="/reports" 
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
          >
            View all
          </Link>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="px-4 py-5 sm:p-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : recentInterviews.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentInterviews.map((interview) => (
                <li key={interview._id}>
                  <Link to={`/reports/${interview._id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                          {interview.role}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            interview.totalScore >= 80 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : interview.totalScore >= 60 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {interview.totalScore}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                          <p>
                            {formatDate(interview.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No interviews yet</p>
              <Link 
                to="/interview-setup" 
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start your first interview
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;