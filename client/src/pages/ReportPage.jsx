import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
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
  Tooltip
} from 'recharts'
import jsPDF from 'jspdf'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Calendar,
  Building,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react'

const ReportPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInterviewReport()
  }, [id])

  const fetchInterviewReport = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/interview/report/${id}`)
      setInterview(response.data.interview)
    } catch (error) {
      console.error('Failed to fetch report:', error)
      setError('Failed to load interview report')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score) => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (score >= 80) return { text: 'Great', color: 'bg-blue-100 text-blue-800' }
    if (score >= 70) return { text: 'Good', color: 'bg-yellow-100 text-yellow-800' }
    if (score >= 60) return { text: 'Fair', color: 'bg-orange-100 text-orange-800' }
    return { text: 'Needs Improvement', color: 'bg-red-100 text-red-800' }
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(79, 70, 229) // Indigo color
    doc.text('InterviewMate Report', pageWidth / 2, 20, { align: 'center' })
    
    // Interview Details
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Role: ${interview.role}`, 20, 40)
    doc.text(`Type: ${interview.interviewType}`, 20, 50)
    doc.text(`Company: ${interview.company || 'N/A'}`, 20, 60)
    doc.text(`Date: ${new Date(interview.createdAt).toLocaleDateString()}`, 20, 70)
    doc.text(`Duration: ${interview.duration || 'N/A'} minutes`, 20, 80)
    
    // Overall Score
    doc.setFontSize(16)
    doc.text('Overall Score', 20, 100)
    doc.setFontSize(24)
    doc.setTextColor(79, 70, 229)
    doc.text(`${interview.overallScore}/100`, 20, 115)
    
    // Skills Breakdown
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Skills Breakdown:', 20, 140)
    
    let yPos = 155
    Object.entries(interview.skillBreakdown || {}).forEach(([skill, score]) => {
      doc.setFontSize(12)
      doc.text(`${skill.charAt(0).toUpperCase() + skill.slice(1)}: ${score}/100`, 25, yPos)
      yPos += 10
    })
    
    // Strengths
    yPos += 10
    doc.setFontSize(14)
    doc.text('Strengths:', 20, yPos)
    yPos += 15
    interview.strengths?.forEach((strength, index) => {
      doc.setFontSize(10)
      doc.text(`• ${strength}`, 25, yPos)
      yPos += 8
    })
    
    // Areas for Improvement
    yPos += 10
    doc.setFontSize(14)
    doc.text('Areas for Improvement:', 20, yPos)
    yPos += 15
    interview.weaknesses?.forEach((weakness, index) => {
      doc.setFontSize(10)
      doc.text(`• ${weakness}`, 25, yPos)
      yPos += 8
    })
    
    // Save the PDF
    doc.save(`InterviewMate_Report_${interview.role}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `InterviewMate Report - ${interview.role}`,
          text: `I scored ${interview.overallScore}/100 in my ${interview.interviewType} interview practice for ${interview.role}!`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Report link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading your interview report...</p>
        </div>
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error || 'Interview report not found'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Prepare data for charts
  const radarData = Object.entries(interview.skillBreakdown || {}).map(([skill, score]) => ({
    skill: skill.charAt(0).toUpperCase() + skill.slice(1),
    score: score
  }))

  const barData = radarData

  const scoreBadge = getScoreBadge(interview.overallScore)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                Interview Report
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={shareReport}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={generatePDF} className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interview Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{interview.role}</CardTitle>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{interview.interviewType} Interview</span>
                  </div>
                  {interview.company && (
                    <div className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>{interview.company}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                  </div>
                  {interview.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{interview.duration} minutes</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {interview.overallScore}/100
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${scoreBadge.color}`}>
                  {scoreBadge.text}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Score Visualization */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#4F46E5"
                    fill="#4F46E5"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Sections */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Strengths</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {interview.strengths?.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>Areas for Improvement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {interview.weaknesses?.map((weakness, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <TrendingDown className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Improvement Tips */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <span>Personalized Improvement Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {interview.improvementTips?.map((tip, index) => (
                <li key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Achievement Badge */}
        {interview.overallScore >= 80 && (
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Congratulations! 🎉</h2>
              <p className="text-lg">
                You scored {interview.overallScore}% - That's an excellent performance!
              </p>
              <p className="mt-2 opacity-90">
                You're ready to ace your real interviews. Keep up the great work!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/interview/setup">
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="font-medium">Practice Again</span>
                  <span className="text-sm text-gray-600 text-center">
                    Take another interview to improve further
                  </span>
                </Button>
              </Link>

              <Link to="/history">
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium">View Progress</span>
                  <span className="text-sm text-gray-600 text-center">
                    See how you're improving over time
                  </span>
                </Button>
              </Link>

              <Button 
                variant="outline" 
                onClick={shareReport}
                className="w-full h-auto p-4 flex flex-col items-center space-y-2"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">Share Results</span>
                <span className="text-sm text-gray-600 text-center">
                  Show your progress to others
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ReportPage