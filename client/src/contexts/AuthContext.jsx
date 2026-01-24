import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

// Configure axios base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
axios.defaults.baseURL = API_URL

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [tokenBalance, setTokenBalance] = useState(0)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data.user)
      setTokenBalance(response.data.user.tokenBalance || 0)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = async (credential) => {
    try {
      const response = await axios.post('/api/auth/google', { credential })
      const { token, user } = response.data

      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      setTokenBalance(user.tokenBalance || 0)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Google login failed'
      }
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { token, user } = response.data

      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      setTokenBalance(user.tokenBalance || 0)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      }
    }
  }

  const signup = async (name, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', { name, email, password })
      const { token, user } = response.data

      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      setTokenBalance(user.tokenBalance || 50) // Default 50 free tokens
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setTokenBalance(0)
    delete axios.defaults.headers.common['Authorization']
  }

  const refreshTokenBalance = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setTokenBalance(response.data.user.tokenBalance || 0)
    } catch (error) {
      console.error('Failed to refresh token balance:', error)
    }
  }

  const value = {
    user,
    login,
    googleLogin,
    signup,
    logout,
    loading,
    isAuthenticated: !!user,
    tokenBalance,
    refreshTokenBalance,
    API_URL
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}