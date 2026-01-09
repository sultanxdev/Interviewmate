import authService from '../services/authService.js'
import { sendTokenResponse } from '../middleware/auth.js'

export const register = async (req, res, next) => {
    try {
        const user = await authService.registerUser(req.body)
        sendTokenResponse(user, 201, res)
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body
        const user = await authService.loginUser(email, password)
        sendTokenResponse(user, 200, res)
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        })
    }
}

export const googleAuth = async (req, res, next) => {
    try {
        const { credential } = req.body
        if (!credential) {
            return res.status(400).json({ success: false, message: 'Google credential is required' })
        }

        const user = await authService.googleAuth(credential)
        sendTokenResponse(user, 200, res)
    } catch (error) {
        console.error('Google OAuth error:', error)
        res.status(500).json({
            success: false,
            message: 'Google authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        })
    }
}

export const getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user.id)
        res.status(200).json({ success: true, user })
    } catch (error) {
        next(error)
    }
}

export const logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })
    res.status(200).json({ success: true, message: 'User logged out successfully' })
}

export const forgotPassword = async (req, res, next) => {
    try {
        const sent = await authService.handleForgotPassword(req.body.email)

        if (!sent) {
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent'
            })
        }

        res.status(200).json({ success: true, message: 'Password reset email sent' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

export const resetPassword = async (req, res, next) => {
    try {
        const user = await authService.resetPassword(req.params.resettoken, req.body.password)
        sendTokenResponse(user, 200, res)
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}
