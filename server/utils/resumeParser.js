import fs from 'fs'
import path from 'path'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import geminiService from '../config/gemini.js'

class ResumeParser {
  constructor() {
    this.supportedFormats = ['.pdf', '.doc', '.docx', '.txt']
  }

  // Parse resume and extract structured data
  async parseResume(filePath, fileName) {
    try {
      const fileExtension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'))

      if (!this.supportedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported file format: ${fileExtension}`)
      }

      // Extract text from file
      const extractedText = await this.extractTextFromFile(filePath, fileExtension)

      // Use Gemini AI to parse and structure the resume data
      const structuredData = await this.parseWithAI(extractedText)

      return {
        success: true,
        data: structuredData,
        rawText: extractedText
      }
    } catch (error) {
      console.error('Resume parsing error:', error)
      return {
        success: false,
        error: error.message,
        data: this.getFallbackData(fileName)
      }
    }
  }

  // Extract text from different file formats
  async extractTextFromFile(filePath, extension) {
    try {
      if (extension === '.txt') {
        return fs.readFileSync(filePath, 'utf8')
      }

      if (extension === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath)
        const data = await pdf(dataBuffer)
        return data.text
      }

      if (extension === '.docx' || extension === '.doc') {
        const result = await mammoth.extractRawText({ path: filePath })
        return result.value
      }

      throw new Error(`Unsupported file format for text extraction: ${extension}`)
    } catch (error) {
      throw new Error(`Failed to extract text from ${extension} file: ${error.message}`)
    }
  }

  // Use Gemini AI to parse resume content
  async parseWithAI(resumeText) {
    try {
      const prompt = `
Parse the following resume and extract structured information in JSON format:

RESUME TEXT:
${resumeText}

Please extract and return ONLY a valid JSON object with the following structure:
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, country"
  },
  "summary": "Professional summary or objective",
  "skills": {
    "technical": ["skill1", "skill2", "skill3"],
    "soft": ["skill1", "skill2"],
    "tools": ["tool1", "tool2"],
    "languages": ["language1", "language2"]
  },
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start - End",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "Institution Name",
      "year": "Graduation Year",
      "gpa": "GPA if mentioned"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["tech1", "tech2"],
      "url": "project url if available"
    }
  ],
  "certifications": ["cert1", "cert2"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Extract only the information that is clearly present in the resume. Use null for missing fields.
Return ONLY the JSON object, no additional text.
`

      const response = await geminiService.generateContent(prompt)

      if (response && response.text) {
        // Try to parse the JSON response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0])
          return this.validateAndCleanData(parsedData)
        }
      }

      throw new Error('Failed to parse AI response')
    } catch (error) {
      console.error('AI parsing error:', error)
      throw new Error('Failed to parse resume with AI')
    }
  }

  // Validate and clean the parsed data
  validateAndCleanData(data) {
    const cleaned = {
      personalInfo: {
        name: data.personalInfo?.name || null,
        email: data.personalInfo?.email || null,
        phone: data.personalInfo?.phone || null,
        location: data.personalInfo?.location || null
      },
      summary: data.summary || null,
      skills: {
        technical: Array.isArray(data.skills?.technical) ? data.skills.technical : [],
        soft: Array.isArray(data.skills?.soft) ? data.skills.soft : [],
        tools: Array.isArray(data.skills?.tools) ? data.skills.tools : [],
        languages: Array.isArray(data.skills?.languages) ? data.skills.languages : []
      },
      experience: Array.isArray(data.experience) ? data.experience.map(exp => ({
        title: exp.title || 'Unknown Title',
        company: exp.company || 'Unknown Company',
        duration: exp.duration || 'Unknown Duration',
        description: exp.description || '',
        technologies: Array.isArray(exp.technologies) ? exp.technologies : []
      })) : [],
      education: Array.isArray(data.education) ? data.education.map(edu => ({
        degree: edu.degree || 'Unknown Degree',
        institution: edu.institution || 'Unknown Institution',
        year: edu.year || 'Unknown Year',
        gpa: edu.gpa || null
      })) : [],
      projects: Array.isArray(data.projects) ? data.projects.map(proj => ({
        name: proj.name || 'Unnamed Project',
        description: proj.description || '',
        technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
        url: proj.url || null
      })) : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      keywords: Array.isArray(data.keywords) ? data.keywords : []
    }

    return cleaned
  }

  // Fallback data when parsing fails
  getFallbackData(fileName) {
    return {
      personalInfo: {
        name: null,
        email: null,
        phone: null,
        location: null
      },
      summary: null,
      skills: {
        technical: [],
        soft: [],
        tools: [],
        languages: []
      },
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      keywords: [],
      note: `Resume uploaded: ${fileName} - manual review required`
    }
  }

  // Generate interview questions based on resume
  async generateResumeBasedQuestions(resumeData, interviewType = 'technical') {
    try {
      const skills = [
        ...resumeData.skills.technical,
        ...resumeData.skills.tools
      ].join(', ')

      const experience = resumeData.experience.map(exp =>
        `${exp.title} at ${exp.company}`
      ).join(', ')

      const prompt = `
Based on this candidate's resume, generate 5 relevant ${interviewType} interview questions:

CANDIDATE PROFILE:
- Skills: ${skills}
- Experience: ${experience}
- Projects: ${resumeData.projects.map(p => p.name).join(', ')}

Generate questions that:
1. Test their claimed skills and experience
2. Are appropriate for ${interviewType} interviews
3. Reference specific technologies/projects from their resume
4. Vary in difficulty from basic to advanced

Return as JSON array: [{"question": "...", "focus": "skill/experience area"}]
`

      const response = await geminiService.generateContent(prompt)

      if (response && response.text) {
        const jsonMatch = response.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }

      return this.getFallbackQuestions(interviewType)
    } catch (error) {
      console.error('Question generation error:', error)
      return this.getFallbackQuestions(interviewType)
    }
  }

  // Fallback questions when AI generation fails
  getFallbackQuestions(interviewType) {
    const questions = {
      technical: [
        { question: "Walk me through your most challenging technical project.", focus: "problem-solving" },
        { question: "How do you approach debugging complex issues?", focus: "technical skills" },
        { question: "Describe your experience with the technologies listed on your resume.", focus: "technical knowledge" },
        { question: "How do you stay updated with new technologies?", focus: "learning" },
        { question: "Tell me about a time you had to learn a new technology quickly.", focus: "adaptability" }
      ],
      hr: [
        { question: "Tell me about yourself and your career journey.", focus: "background" },
        { question: "Why are you interested in this role?", focus: "motivation" },
        { question: "Describe a challenging situation at work and how you handled it.", focus: "problem-solving" },
        { question: "What are your career goals for the next 5 years?", focus: "ambition" },
        { question: "How do you handle working in a team environment?", focus: "teamwork" }
      ],
      managerial: [
        { question: "Describe your leadership style and experience.", focus: "leadership" },
        { question: "How do you handle conflicts within your team?", focus: "conflict resolution" },
        { question: "Tell me about a time you had to make a difficult decision.", focus: "decision making" },
        { question: "How do you motivate and develop your team members?", focus: "team development" },
        { question: "Describe your approach to project management.", focus: "project management" }
      ]
    }

    return questions[interviewType] || questions.technical
  }
}

// Create singleton instance
const resumeParser = new ResumeParser()

export default resumeParser