import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Trophy, 
  TrendingUp, 
  MessageSquare,
  Clock,
  Target
} from 'lucide-react';
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
} from 'recharts';
import jsPDF from 'jspdf';

const ReportViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else {
        setError('Report not found');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Interview Performance Report', margin, 30);

    // Interview Details
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Role: ${report.role}`, margin, 50);
    doc.text(`Type: ${report.type.charAt(0).toUpperCase() + report.type.slice(1)}`, margin, 60);
    doc.text(`Difficulty: ${report.difficulty.charAt(0).toUpperCase() + report.difficulty.slice(1)}`, margin, 70);
    doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, margin, 80);

    // Overall Score
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`Overall Score: ${report.totalScore}/100`, margin, 100);

    // Skill Breakdown
    doc.setFontSize(14);
    doc.text('Skill Breakdown:', margin, 120);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    let yPos = 135;
    Object.entries(report.skillBreakdown).forEach(([skill, score]) => {
      doc.text(`${skill.charAt(0).toUpperCase() + skill.slice(1)}: ${score.toFixed(1)}/10`, margin, yPos);
      yPos += 10;
    });

    // AI Insights
    if (report.aiInsights) {
      yPos += 10;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Strengths:', margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      report.aiInsights.strengths.forEach(strength => {
        doc.text(`• ${strength}`, margin, yPos);
        yPos += 10;
      });

      yPos += 5;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Areas for Improvement:', margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      report.aiInsights.weaknesses.forEach(weakness => {
        doc.text(`• ${weakness}`, margin, yPos);
        yPos += 10;
      });
    }

    doc.save(`interview-report-${report.role}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const shareReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (navigator.share) {
          await navigator.share({
            title: 'My Interview Performance Report',
            text: `Check out my interview performance report for ${report.role}!`,
            url: data.shareableLink
          });
        } else {
          navigator.clipboard.writeText(data.shareableLink);
          alert('Shareable link copied to clipboard!');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to generate shareable link');
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      alert('Failed to share report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Report not found'}
          </h2>
          <button
            onClick={() => navigate('/reports')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const skillData = Object.entries(report.skillBreakdown).map(([skill, score]) => ({
    skill: skill.charAt(0).toUpperCase() + skill.slice(1),
    score: parseFloat(score.toFixed(1)),
    fullMark: 10
  }));

  const questionScores = report.questions.map((q, index) => ({
    question: `Q${index + 1}`,
    score: q.score
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Reports
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={shareReport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Report Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Interview Performance Report
              </h1>
              <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  {report.role}
                </span>
                <span className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-2">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {report.totalScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Overall Score
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Skill Breakdown Radar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Skill Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skillData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis angle={90} domain={[0, 10]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Question-wise Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Question Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={questionScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="question" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="score" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights */}
        {report.aiInsights && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Strengths */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-4">
                Strengths
              </h3>
              <ul className="space-y-2">
                {report.aiInsights.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start text-green-700 dark:text-green-300">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-400 mb-4">
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {report.aiInsights.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start text-orange-700 dark:text-orange-300">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-4">
                Recommendations
              </h3>
              <ul className="space-y-2">
                {report.aiInsights.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start text-blue-700 dark:text-blue-300">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Detailed Q&A Transcript */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Interview Transcript
          </h3>
          <div className="space-y-6">
            {report.questions.map((qa, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Question {index + 1}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {qa.question}
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-3">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Your Answer:
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300">
                      {qa.userAnswer}
                    </p>
                  </div>

                  {qa.crossQuestion && (
                    <>
                      <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Follow-up: {qa.crossQuestion}
                      </p>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-3">
                        <p className="text-gray-700 dark:text-gray-300">
                          {qa.crossAnswer}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Score: {qa.score}/10
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        Duration: {Math.floor(qa.duration / 60)}:{(qa.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {qa.feedback && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Feedback:</strong> {qa.feedback}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;