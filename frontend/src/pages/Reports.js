import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ShareIcon, 
  ArrowDownTrayIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { jsPDF } from 'jspdf';

const Reports = () => {
  const { currentUser, isPro } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [interviews, setInterviews] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    role: '',
    type: '',
    dateRange: 'all'
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // API base URL from environment variable or default
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Load interviews on mount
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        
        // In a real app, you would fetch this data from your API
        // For now, we'll use mock data
        
        // Mock interviews data
        const mockInterviews = [];
        for (let i = 1; i <= 15; i++) {
          mockInterviews.push({
            _id: `interview-${i}`,
            type: i % 3 === 0 ? 'hr' : i % 3 === 1 ? 'technical' : 'managerial',
            role: i % 3 === 0 ? 'Product Manager' : i % 3 === 1 ? 'Frontend Developer' : 'Data Scientist',
            totalScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
            createdAt: new Date(Date.now() - (i * 86400000)).toISOString(), // i days ago
            questions: Array(5).fill().map((_, j) => ({
              question: `Mock question ${j + 1}`,
              userAnswer: `Mock answer ${j + 1}`,
              score: Math.floor(Math.random() * 3) + 7 // Random score between 7-10
            })),
            skillBreakdown: {
              communication: Math.floor(Math.random() * 3) + 7,
              technical: Math.floor(Math.random() * 3) + 7,
              problemSolving: Math.floor(Math.random() * 3) + 7,
              leadership: Math.floor(Math.random() * 3) + 7,
              cultural: Math.floor(Math.random() * 3) + 7
            }
          });
        }
        
        setInterviews(mockInterviews);
        setTotalPages(Math.ceil(mockInterviews.length / itemsPerPage));
        
        // If id is provided, load that specific report
        if (id) {
          if (id === 'latest') {
            // Get the latest interview
            const latestReport = mockInterviews[0];
            setCurrentReport(latestReport);
          } else {
            // Get the interview with the matching id
            const report = mockInterviews.find(interview => interview._id === id);
            if (report) {
              setCurrentReport(report);
            } else {
              setError('Report not found');
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching interviews:', error);
        setError('Failed to load interviews');
        setLoading(false);
      }
    };
    
    fetchInterviews();
  }, [id]);
  
  // Filter interviews
  const filteredInterviews = interviews.filter(interview => {
    // Filter by role
    if (filters.role && interview.role.toLowerCase() !== filters.role.toLowerCase()) {
      return false;
    }
    
    // Filter by type
    if (filters.type && interview.type !== filters.type) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateRange !== 'all') {
      const interviewDate = new Date(interview.createdAt);
      const now = new Date();
      
      if (filters.dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (interviewDate < weekAgo) {
          return false;
        }
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (interviewDate < monthAgo) {
          return false;
        }
      }
    }
    
    return true;
  });
  
  // Paginated interviews
  const paginatedInterviews = filteredInterviews.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page when filters change
  };
  
  // Format date to readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Generate PDF report
  const generatePDF = async () => {
    if (!currentReport || !isPro()) return;
    
    try {
      setPdfGenerating(true);
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Interview Report', 105, 20, { align: 'center' });
      
      // Add interview details
      doc.setFontSize(12);
      doc.text(`Role: ${currentReport.role}`, 20, 40);
      doc.text(`Type: ${currentReport.type.charAt(0).toUpperCase() + currentReport.type.slice(1)} Interview`, 20, 50);
      doc.text(`Date: ${formatDate(currentReport.createdAt)}`, 20, 60);
      doc.text(`Score: ${currentReport.totalScore}%`, 20, 70);
      
      // Add skill breakdown
      doc.setFontSize(16);
      doc.text('Skill Breakdown', 20, 90);
      
      doc.setFontSize(12);
      doc.text(`Communication: ${currentReport.skillBreakdown.communication}/10`, 30, 100);
      doc.text(`Technical: ${currentReport.skillBreakdown.technical}/10`, 30, 110);
      doc.text(`Problem Solving: ${currentReport.skillBreakdown.problemSolving}/10`, 30, 120);
      doc.text(`Leadership: ${currentReport.skillBreakdown.leadership}/10`, 30, 130);
      doc.text(`Cultural Fit: ${currentReport.skillBreakdown.cultural}/10`, 30, 140);
      
      // Add questions and answers
      doc.setFontSize(16);
      doc.text('Questions & Answers', 20, 160);
      
      let yPos = 170;
      currentReport.questions.forEach((q, i) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`Question ${i + 1}: ${q.question}`, 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.text(`Your Answer: ${q.userAnswer.substring(0, 100)}${q.userAnswer.length > 100 ? '...' : ''}`, 30, yPos);
        yPos += 10;
        
        doc.text(`Score: ${q.score}/10`, 30, yPos);
        yPos += 20;
      });
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Generated by InterviewMate - Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }
      
      // Save the PDF
      doc.save(`InterviewReport_${currentReport.role}_${formatDate(currentReport.createdAt)}.pdf`);
      
      setPdfGenerating(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfGenerating(false);
    }
  };
  
  // Share report
  const shareReport = () => {
    // In a real app, you would implement sharing functionality
    // For now, we'll just show an alert
    alert('Sharing functionality would be implemented here');
  };
  
  // Delete report
  const deleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }
    
    try {
      // In a real app, you would delete the report from your API
      // For now, we'll just update the state
      
      setInterviews(interviews.filter(interview => interview._id !== id));
      
      if (currentReport && currentReport._id === id) {
        setCurrentReport(null);
        navigate('/reports');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };
  
  // Prepare chart data
  const prepareSkillData = (report) => {
    if (!report) return [];
    
    return [
      { subject: 'Communication', A: report.skillBreakdown.communication, fullMark: 10 },
      { subject: 'Technical', A: report.skillBreakdown.technical, fullMark: 10 },
      { subject: 'Problem Solving', A: report.skillBreakdown.problemSolving, fullMark: 10 },
      { subject: 'Leadership', A: report.skillBreakdown.leadership, fullMark: 10 },
      { subject: 'Cultural Fit', A: report.skillBreakdown.cultural, fullMark: 10 }
    ];
  };
  
  const prepareQuestionData = (report) => {
    if (!report) return [];
    
    return report.questions.map((q, i) => ({
      name: `Q${i + 1}`,
      score: q.score
    }));
  };
  
  // If loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // If viewing a specific report
  if (currentReport) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => {
              setCurrentReport(null);
              navigate('/reports');
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Reports
          </button>
        </div>
        
        <motion.div 
          className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentReport.role} Interview
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(currentReport.createdAt)} • {currentReport.type.charAt(0).toUpperCase() + currentReport.type.slice(1)} Interview
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button
                  onClick={shareReport}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ShareIcon className="h-4 w-4 mr-1" />
                  Share
                </button>
                
                <button
                  onClick={generatePDF}
                  disabled={!isPro() || pdfGenerating}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isPro() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {pdfGenerating ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      {isPro() ? 'Download PDF' : 'Pro Feature'}
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => deleteReport(currentReport._id)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
          
          {/* Score overview */}
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="mb-4 sm:mb-0 sm:mr-8">
                <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                  {currentReport.totalScore}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Overall Score
                </div>
              </div>
              
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div 
                    className={`h-4 rounded-full ${
                      currentReport.totalScore >= 80 
                        ? 'bg-green-500' 
                        : currentReport.totalScore >= 60 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${currentReport.totalScore}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Performance Analysis
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skill Breakdown
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius="80%" data={prepareSkillData(currentReport)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 10]} />
                      <Radar
                        name="Skills"
                        dataKey="A"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Bar Chart */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Scores
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareQuestionData(currentReport)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          
          {/* Questions and Answers */}
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Questions & Answers
            </h3>
            
            <div className="space-y-6">
              {currentReport.questions.map((q, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Question {i + 1}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      q.score >= 8 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : q.score >= 6 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {q.score}/10
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-900 dark:text-white">
                    {q.question}
                  </p>
                  
                  <div className="mt-4">
                    <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Your Answer
                    </h5>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {q.userAnswer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {!isPro() && (
          <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Upgrade to Pro</h3>
                <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-300">
                  <p>Get access to more features:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Download reports as PDF</li>
                    <li>Share reports with recruiters</li>
                    <li>Access advanced analytics</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <Link
                    to="/pricing"
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                  >
                    View pricing <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Reports list view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Interview Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and analyze your past interviews
          </p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="">All Roles</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Data Scientist">Data Scientist</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Interview Type
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="technical">Technical</option>
              <option value="hr">HR</option>
              <option value="managerial">Managerial</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date Range
            </label>
            <select
              id="dateRange"
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Reports list */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Your Reports
          </h2>
        </div>
        
        {error ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : paginatedInterviews.length > 0 ? (
          <div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedInterviews.map((interview) => (
                <li key={interview._id}>
                  <div className="block hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                            interview.totalScore >= 80 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : interview.totalScore >= 60 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            <span className="text-sm font-medium">{interview.totalScore}%</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {interview.role}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview • {formatDate(interview.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setCurrentReport(interview);
                              navigate(`/reports/${interview._id}`);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                          
                          <button
                            onClick={() => deleteReport(interview._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(page * itemsPerPage, filteredInterviews.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredInterviews.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            page === i + 1
                              ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-200'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          } text-sm font-medium`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-5 sm:p-6 text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {Object.values(filters).some(f => f) 
                ? 'Try changing your filters or create a new interview'
                : 'Get started by creating your first interview'}
            </p>
            <div className="mt-6">
              <Link
                to="/interview-setup"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start Interview
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;