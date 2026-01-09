import fs from 'fs'
import path from 'path'

// Enhanced PDF generation utility
// Using HTML template approach for better formatting

export const generatePDFReport = async (interview, report) => {
    try {
        // Create reports directory if it doesn't exist
        const reportsDir = path.join(process.cwd(), 'uploads', 'reports')
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true })
        }

        // Generate filename
        const filename = `interview-report-${report.reportId}.pdf`
        const filepath = path.join(reportsDir, filename)

        // Try to use Puppeteer for PDF generation if available
        try {
            const pdfBuffer = await generatePDFWithPuppeteer(interview, report)
            fs.writeFileSync(filepath, pdfBuffer)

            return {
                success: true,
                url: `/uploads/reports/${filename}`,
                path: filepath,
                size: fs.statSync(filepath).size
            }
        } catch (puppeteerError) {
            console.warn('Puppeteer not available, using HTML fallback:', puppeteerError.message)

            // Fallback to HTML report
            const htmlContent = generateHTMLReport(interview, report)
            const htmlFilename = `interview-report-${report.reportId}.html`
            const htmlFilepath = path.join(reportsDir, htmlFilename)

            fs.writeFileSync(htmlFilepath, htmlContent)

            return {
                success: true,
                url: `/uploads/reports/${htmlFilename}`,
                path: htmlFilepath,
                size: fs.statSync(htmlFilepath).size,
                format: 'html'
            }
        }
    } catch (error) {
        console.error('PDF generation error:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

// Generate PDF using Puppeteer (if available)
async function generatePDFWithPuppeteer(interview, report) {
    let browser = null
    try {
        // Dynamic import to handle optional dependency
        const puppeteer = await import('puppeteer')

        browser = await puppeteer.default.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()
        const htmlContent = generateHTMLReport(interview, report)

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        })

        return pdfBuffer
    } catch (error) {
        throw new Error(`Puppeteer PDF generation failed: ${error.message}`)
    } finally {
        // Always close browser instance to prevent memory leaks
        if (browser) {
            try {
                await browser.close()
            } catch (closeError) {
                console.warn('Warning: Failed to close browser instance:', closeError.message)
            }
        }
    }
}

// Generate HTML report template
function generateHTMLReport(interview, report) {
    const { candidateInfo, evaluation } = interview
    const date = new Date(interview.createdAt).toLocaleDateString()
    const grade = getPerformanceGrade(evaluation.overallScore)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Report - ${candidateInfo.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        
        .report-title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .report-subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        
        .candidate-info {
            background: #f8fafc;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 4px solid #3b82f6;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
        }
        
        .info-value {
            color: #6b7280;
        }
        
        .performance-summary {
            text-align: center;
            margin: 40px 0;
            padding: 30px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border-radius: 15px;
        }
        
        .overall-score {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .grade {
            font-size: 24px;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .score-description {
            opacity: 0.8;
            font-size: 16px;
        }
        
        .skills-section {
            margin: 40px 0;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        
        .skill-item {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        
        .skill-name {
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
        }
        
        .skill-score {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 5px;
        }
        
        .skill-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .skill-progress {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .feedback-section {
            margin: 40px 0;
        }
        
        .feedback-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .feedback-box {
            background: #f9fafb;
            padding: 25px;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
        }
        
        .feedback-box.strengths {
            border-left: 4px solid #10b981;
        }
        
        .feedback-box.weaknesses {
            border-left: 4px solid #f59e0b;
        }
        
        .feedback-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .feedback-list {
            list-style: none;
        }
        
        .feedback-list li {
            padding: 8px 0;
            padding-left: 20px;
            position: relative;
            color: #6b7280;
        }
        
        .feedback-list li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #3b82f6;
            font-weight: bold;
        }
        
        .detailed-feedback {
            background: #f8fafc;
            padding: 25px;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            margin-top: 20px;
        }
        
        .badges-section {
            margin: 40px 0;
        }
        
        .badges-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .badge {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }
        
        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        
        .footer-logo {
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        
        @media print {
            .container {
                padding: 20px;
            }
            
            .performance-summary {
                background: #3b82f6 !important;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">InterviewMate</div>
            <h1 class="report-title">Interview Performance Report</h1>
            <p class="report-subtitle">AI-Powered Interview Analysis & Feedback</p>
        </div>

        <!-- Candidate Information -->
        <div class="candidate-info">
            <h2 class="section-title">Candidate Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${candidateInfo.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Role:</span>
                    <span class="info-value">${candidateInfo.role}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Company:</span>
                    <span class="info-value">${candidateInfo.company}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Experience:</span>
                    <span class="info-value">${candidateInfo.experience}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Interview Type:</span>
                    <span class="info-value">${interview.type.toUpperCase()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${interview.configuration.duration} minutes</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Difficulty:</span>
                    <span class="info-value">${interview.configuration.difficulty.toUpperCase()}</span>
                </div>
            </div>
        </div>

        <!-- Performance Summary -->
        <div class="performance-summary">
            <div class="overall-score">${evaluation.overallScore}%</div>
            <div class="grade">Grade: ${grade}</div>
            <div class="score-description">${getScoreDescription(evaluation.overallScore)}</div>
        </div>

        <!-- Skills Breakdown -->
        <div class="skills-section">
            <h2 class="section-title">Skills Assessment</h2>
            <div class="skills-grid">
                ${Object.entries(evaluation?.skillScores || {}).map(([skill, score]) => `
                    <div class="skill-item">
                        <div class="skill-name">${formatSkillName(skill)}</div>
                        <div class="skill-score">${score || 0}%</div>
                        <div class="skill-bar">
                            <div class="skill-progress" style="width: ${score || 0}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Feedback -->
        <div class="feedback-section">
            <h2 class="section-title">Performance Feedback</h2>
            <div class="feedback-grid">
                <div class="feedback-box strengths">
                    <h3 class="feedback-title">✅ Strengths</h3>
                    <ul class="feedback-list">
                        ${(evaluation?.strengths || []).map(strength => `<li>${strength}</li>`).join('')}
                    </ul>
                </div>
                <div class="feedback-box weaknesses">
                    <h3 class="feedback-title">⚠️ Areas for Improvement</h3>
                    <ul class="feedback-list">
                        ${(evaluation?.weaknesses || []).map(weakness => `<li>${weakness}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            ${evaluation.detailedFeedback ? `
                <div class="detailed-feedback">
                    <h3 class="feedback-title">Detailed Analysis</h3>
                    <p>${evaluation.detailedFeedback}</p>
                </div>
            ` : ''}
        </div>

        <!-- Recommendations -->
        <div class="feedback-section">
            <h2 class="section-title">Recommendations for Improvement</h2>
            <div class="feedback-box">
                <ul class="feedback-list">
                    ${(evaluation?.recommendations || []).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>

        <!-- Badges -->
        ${evaluation?.badges && evaluation.badges.length > 0 ? `
            <div class="badges-section">
                <h2 class="section-title">Achievement Badges</h2>
                <div class="badges-grid">
                    ${evaluation.badges.map(badge => `<span class="badge">${badge}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        <!-- Transcript Section -->
        ${interview.session?.transcript ? `
            <div class="transcript-section" style="margin-top: 40px; page-break-before: always;">
                <h2 class="section-title">Interview Transcript Highlights</h2>
                <div style="background: #f1f5f9; padding: 20px; border-radius: 10px; font-size: 14px; white-space: pre-wrap; color: #475569;">
                    ${interview.session.transcript}
                </div>
            </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <div class="footer-logo">InterviewMate AI</div>
            <p>Report ID: ${report.reportId}</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Powered by Advanced AI Analysis</p>
        </div>
    </div>
</body>
</html>`
}

// Helper functions
function getPerformanceGrade(score) {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    return 'D'
}

function getScoreDescription(score) {
    if (score >= 90) return 'Outstanding Performance - Exceeds Expectations'
    if (score >= 80) return 'Strong Performance - Meets and Often Exceeds Expectations'
    if (score >= 70) return 'Good Performance - Meets Most Expectations'
    if (score >= 60) return 'Adequate Performance - Meets Basic Expectations'
    return 'Needs Improvement - Below Expectations'
}

function formatSkillName(skill) {
    return skill.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}


// Legacy text-based report generation (fallback)
const generateReportContent = (interview, report) => {
    const { candidateInfo, evaluation } = interview
    const date = new Date(interview.createdAt).toLocaleDateString()
    const grade = getPerformanceGrade(evaluation.overallScore)

    return `
INTERVIEWMATE - INTERVIEW REPORT
================================

Candidate: ${candidateInfo.name}
Role: ${candidateInfo.role}
Company: ${candidateInfo.company}
Date: ${date}
Type: ${interview.type.toUpperCase()}
Duration: ${interview.configuration.duration} minutes
Difficulty: ${interview.configuration.difficulty.toUpperCase()}

PERFORMANCE SUMMARY
==================
Overall Score: ${evaluation.overallScore}%
Grade: ${grade}
Performance Level: ${getScoreDescription(evaluation.overallScore)}

SKILL BREAKDOWN
===============
Communication: ${evaluation.skillScores?.communication || 0}%
Technical Knowledge: ${evaluation.skillScores?.technicalKnowledge || 0}%
Problem Solving: ${evaluation.skillScores?.problemSolving || 0}%
Confidence: ${evaluation.skillScores?.confidence || 0}%
Clarity: ${evaluation.skillScores?.clarity || 0}%
Behavioral: ${evaluation.skillScores?.behavioral || 0}%

STRENGTHS
=========
${evaluation.strengths?.map(s => `• ${s}`).join('\n') || 'None listed'}

AREAS FOR IMPROVEMENT
====================
${evaluation.weaknesses?.map(w => `• ${w}`).join('\n') || 'None listed'}

RECOMMENDATIONS
===============
${evaluation.recommendations?.map(r => `• ${r}`).join('\n') || 'None listed'}

DETAILED FEEDBACK
================
${evaluation.detailedFeedback || 'No detailed feedback available'}

ACHIEVEMENT BADGES
==================
${evaluation.badges?.length ? evaluation.badges.map(b => `🏆 ${b}`).join('\n') : 'No badges earned'}

---
Generated by InterviewMate AI
Report ID: ${report.reportId}
Generated on: ${new Date().toLocaleString()}
Powered by Advanced AI Analysis
`
}

export default {
    generatePDFReport
}