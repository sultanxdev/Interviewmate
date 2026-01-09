import nodemailer from 'nodemailer'

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ Email configuration not complete - email features disabled')
    return null
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
}

// Send email function
export const sendEmail = async (options) => {
  const transporter = createTransporter()

  if (!transporter) {
    console.log('Email not configured, skipping email send')
    return { success: false, message: 'Email not configured' }
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'InterviewMate <noreply@interviewmate.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return { success: false, error: error.message }
  }
}

// Email templates
export const emailTemplates = {
  welcome: (name, loginUrl) => ({
    subject: 'Welcome to InterviewMate! 🎉',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px; font-weight: bold;">IM</span>
            </div>
            <h1 style="color: #1F2937; margin: 0; font-size: 28px; font-weight: bold;">Welcome to InterviewMate!</h1>
            <p style="color: #6B7280; margin: 10px 0 0; font-size: 16px;">Your AI-powered interview practice partner</p>
          </div>

          <!-- Content -->
          <div style="margin-bottom: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${name}</strong>,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Welcome to InterviewMate! We're excited to help you ace your next interview with our AI-powered practice platform.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Here's what you can do with your free account:
            </p>
            
            <!-- Features -->
            <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <ul style="margin: 0; padding: 0; list-style: none;">
                <li style="color: #374151; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center;">
                  <span style="color: #10B981; margin-right: 10px; font-size: 16px;">✓</span>
                  30 minutes of premium VAPI voice interviews
                </li>
                <li style="color: #374151; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center;">
                  <span style="color: #10B981; margin-right: 10px; font-size: 16px;">✓</span>
                  Unlimited Web Speech API interviews
                </li>
                <li style="color: #374151; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center;">
                  <span style="color: #10B981; margin-right: 10px; font-size: 16px;">✓</span>
                  AI-powered performance analysis
                </li>
                <li style="color: #374151; font-size: 14px; margin-bottom: 0; display: flex; align-items: center;">
                  <span style="color: #10B981; margin-right: 10px; font-size: 16px;">✓</span>
                  Professional PDF reports
                </li>
              </ul>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${loginUrl || process.env.CLIENT_URL + '/interview/setup'}" 
               style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
              Start Your First Interview 🚀
            </a>
          </div>

          <!-- Tips -->
          <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
            <h3 style="color: #1E40AF; margin: 0 0 15px; font-size: 16px; font-weight: bold;">💡 Pro Tips for Success:</h3>
            <ul style="margin: 0; padding: 0 0 0 20px; color: #1E40AF;">
              <li style="margin-bottom: 8px;">Practice in a quiet environment</li>
              <li style="margin-bottom: 8px;">Speak clearly and at a moderate pace</li>
              <li style="margin-bottom: 8px;">Review your reports to track improvement</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              Need help? Reply to this email or visit our 
              <a href="${process.env.CLIENT_URL}/help" style="color: #3B82F6; text-decoration: none;">Help Center</a>
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 10px 0 0;">
              Best regards,<br>The InterviewMate Team
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Welcome to InterviewMate, ${name}!
      
      We're excited to help you ace your next interview with our AI-powered practice platform.
      
      Get started: ${loginUrl || process.env.CLIENT_URL + '/interview/setup'}
      
      Your free account includes:
      - 30 minutes of premium VAPI voice interviews
      - Unlimited Web Speech API interviews  
      - AI-powered performance analysis
      - Professional PDF reports
      
      Best regards,
      The InterviewMate Team
    `
  }),

  passwordReset: (name, resetUrl) => ({
    subject: 'Reset Your InterviewMate Password 🔐',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #EF4444, #F59E0B); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px;">🔐</span>
            </div>
            <h1 style="color: #1F2937; margin: 0; font-size: 24px; font-weight: bold;">Password Reset Request</h1>
          </div>

          <!-- Content -->
          <div style="margin-bottom: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${name}</strong>,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your InterviewMate password. Click the button below to create a new password:
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #EF4444, #F59E0B); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
              Reset My Password
            </a>
          </div>

          <!-- Security Notice -->
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
            <h3 style="color: #92400E; margin: 0 0 10px; font-size: 14px; font-weight: bold;">⚠️ Security Notice:</h3>
            <p style="color: #92400E; margin: 0; font-size: 14px; line-height: 1.5;">
              This link will expire in <strong>1 hour</strong> for your security. If you didn't request this reset, please ignore this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              If the button doesn't work, copy and paste this link:<br>
              <a href="${resetUrl}" style="color: #3B82F6; word-break: break-all; font-size: 12px;">${resetUrl}</a>
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 15px 0 0;">
              Best regards,<br>The InterviewMate Team
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
      Password Reset Request
      
      Hi ${name},
      
      We received a request to reset your InterviewMate password.
      
      Reset your password: ${resetUrl}
      
      This link will expire in 1 hour for your security.
      If you didn't request this reset, please ignore this email.
      
      Best regards,
      The InterviewMate Team
    `
  }),

  interviewCompleted: (name, interviewData) => ({
    subject: `🎉 Interview Complete! Your score: ${interviewData.score}%`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #10B981, #3B82F6); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px;">🎉</span>
            </div>
            <h1 style="color: #1F2937; margin: 0; font-size: 24px; font-weight: bold;">Interview Complete!</h1>
          </div>

          <!-- Content -->
          <div style="margin-bottom: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${name}</strong>,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Congratulations on completing your ${interviewData.type} interview practice session!
            </p>
            
            <!-- Score Display -->
            <div style="background: linear-gradient(135deg, #10B981, #3B82F6); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: white; margin: 0 0 10px; font-size: 48px; font-weight: bold;">${interviewData.score}%</h2>
              <p style="color: white; margin: 0; font-size: 18px; opacity: 0.9;">Overall Score</p>
              <p style="color: white; margin: 10px 0 0; font-size: 16px; opacity: 0.8;">Grade: ${interviewData.grade}</p>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.CLIENT_URL}/interview/report/${interviewData.id}" 
               style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
              View Full Report 📊
            </a>
          </div>

          <!-- Next Steps -->
          <div style="background: #F0F9FF; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 0 8px 8px 0;">
            <h3 style="color: #1E40AF; margin: 0 0 15px; font-size: 16px; font-weight: bold;">🚀 What's Next?</h3>
            <ul style="margin: 0; padding: 0 0 0 20px; color: #1E40AF;">
              <li style="margin-bottom: 8px;">Review your detailed performance report</li>
              <li style="margin-bottom: 8px;">Practice the recommended improvement areas</li>
              <li style="margin-bottom: 8px;">Take another interview to track progress</li>
            </ul>
          </div>
        </div>
      </div>
    `,
    text: `
      Interview Complete!
      
      Hi ${name},
      
      Congratulations on completing your ${interviewData.type} interview practice session!
      
      Your Score: ${interviewData.score}% (Grade: ${interviewData.grade})
      
      View your full report: ${process.env.CLIENT_URL}/interview/report/${interviewData.id}
      
      Keep practicing to improve your interview skills!
      
      Best regards,
      The InterviewMate Team
    `
  }),

  subscriptionUpgrade: (name, plan) => ({
    subject: `🎉 Welcome to InterviewMate ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #F59E0B, #EF4444); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px;">👑</span>
            </div>
            <h1 style="color: #1F2937; margin: 0; font-size: 24px; font-weight: bold;">Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)}!</h1>
          </div>

          <!-- Content -->
          <div style="margin-bottom: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${name}</strong>,
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for upgrading to InterviewMate ${plan.charAt(0).toUpperCase() + plan.slice(1)}! You now have access to premium features.
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.CLIENT_URL}/dashboard" 
               style="background: linear-gradient(135deg, #F59E0B, #EF4444); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
              Access Premium Features 🚀
            </a>
          </div>
        </div>
      </div>
    `,
    text: `
      Welcome to InterviewMate ${plan.charAt(0).toUpperCase() + plan.slice(1)}!
      
      Hi ${name},
      
      Thank you for upgrading! You now have access to premium features.
      
      Access your dashboard: ${process.env.CLIENT_URL}/dashboard
      
      Best regards,
      The InterviewMate Team
    `
  })
}

// Helper function to send welcome email
export const sendWelcomeEmail = async (user) => {
  const template = emailTemplates.welcome(user.name, process.env.CLIENT_URL + '/dashboard')
  return await sendEmail({
    to: user.email,
    ...template
  })
}

// Helper function to send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
  const template = emailTemplates.passwordReset(user.name, resetUrl)
  return await sendEmail({
    to: user.email,
    ...template
  })
}

// Helper function to send interview completion email
export const sendInterviewCompletionEmail = async (user, interview) => {
  const interviewData = {
    id: interview._id,
    type: interview.type,
    score: interview.evaluation?.overallScore || 0,
    grade: interview.performanceGrade || 'N/A'
  }
  const template = emailTemplates.interviewCompleted(user.name, interviewData)
  return await sendEmail({
    to: user.email,
    ...template
  })
}

// Helper function to send subscription upgrade email
export const sendSubscriptionUpgradeEmail = async (user, plan) => {
  const template = emailTemplates.subscriptionUpgrade(user.name, plan)
  return await sendEmail({
    to: user.email,
    ...template
  })
}

export default {
  sendEmail,
  emailTemplates,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendInterviewCompletionEmail,
  sendSubscriptionUpgradeEmail
}