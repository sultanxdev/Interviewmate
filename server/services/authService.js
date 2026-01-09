import User from '../models/User.js'
import crypto from 'crypto'
import { sendWelcomeEmail, sendPasswordResetEmail } from '../config/email.js'

class AuthService {
    async registerUser(userData) {
        const { name, email, password } = userData

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            throw new Error('User already exists with this email')
        }

        const user = await User.create({
            name,
            email,
            password
        })

        // Send welcome email (async)
        sendWelcomeEmail(user).catch(error => {
            console.error('Failed to send welcome email:', error)
        })

        return user
    }

    async loginUser(email, password) {
        const user = await User.findOne({ email }).select('+password')
        if (!user) {
            throw new Error('Invalid credentials')
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            throw new Error('Invalid credentials')
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated')
        }

        return user
    }

    async verifyGoogleToken(credential) {
        const { OAuth2Client } = await import('google-auth-library')
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload()
        if (!payload) throw new Error('Invalid Google credential')

        return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            profilePicture: payload.picture,
            emailVerified: payload.email_verified
        }
    }

    async googleAuth(credential) {
        const googleUserData = await this.verifyGoogleToken(credential)

        let user = await User.findOne({
            $or: [
                { email: googleUserData.email },
                { googleId: googleUserData.googleId }
            ]
        })

        if (user) {
            if (!user.googleId) {
                user.googleId = googleUserData.googleId
                user.profilePicture = user.profilePicture || googleUserData.profilePicture
                user.emailVerified = true
                await user.save()
            }
        } else {
            user = await User.create({
                name: googleUserData.name,
                email: googleUserData.email,
                googleId: googleUserData.googleId,
                profilePicture: googleUserData.profilePicture,
                emailVerified: true
            })

            sendWelcomeEmail(user).catch(error => {
                console.error('Failed to send welcome email:', error)
            })
        }

        return user
    }

    async getUserById(id) {
        const user = await User.findById(id)
        if (!user) throw new Error('User not found')
        return user
    }

    async handleForgotPassword(email) {
        const user = await User.findOne({ email })
        if (!user) return null

        const resetToken = crypto.randomBytes(32).toString('hex')
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

        user.passwordResetToken = hashedToken
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000

        await user.save({ validateBeforeSave: false })

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

        try {
            await sendPasswordResetEmail(user, resetUrl)
            return true
        } catch (error) {
            user.passwordResetToken = undefined
            user.passwordResetExpires = undefined
            await user.save({ validateBeforeSave: false })
            throw new Error('Email could not be sent')
        }
    }

    async resetPassword(resetToken, newPassword) {
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        })

        if (!user) {
            throw new Error('Invalid or expired reset token')
        }

        user.password = newPassword
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save()

        return user
    }
}

export default new AuthService()
