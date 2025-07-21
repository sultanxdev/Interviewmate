import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // API base URL from environment variable or default
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Set up axios with auth token
  const setupAxiosInterceptors = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Load user from local storage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setupAxiosInterceptors(token);
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setCurrentUser(response.data.user);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setCurrentUser(null);
      setLoading(false);
    }
  };

  // Register a new user
  const register = async (name, email, password) => {
    try {
      setError('');
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setupAxiosInterceptors(token);
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to register');
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError('');
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setupAxiosInterceptors(token);
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to login');
      throw error;
    }
  };

  // Google OAuth login (simplified without Firebase)
  const googleLogin = async () => {
    try {
      setError('');
      
      // For now, we'll show an alert that this feature needs to be implemented
      alert('Google OAuth login will be implemented with proper OAuth flow');
      
      // In a real implementation, you would:
      // 1. Redirect to Google OAuth
      // 2. Handle the callback
      // 3. Send the authorization code to your backend
      // 4. Backend verifies with Google and creates/logs in user
      
      throw new Error('Google login not implemented yet');
    } catch (error) {
      console.error('Google login error:', error);
      setError('Google login not available');
      throw error;
    }
  };
  
  // GitHub OAuth login (simplified without Firebase)
  const githubLogin = async () => {
    try {
      setError('');
      
      // For now, we'll show an alert that this feature needs to be implemented
      alert('GitHub OAuth login will be implemented with proper OAuth flow');
      
      // In a real implementation, you would:
      // 1. Redirect to GitHub OAuth
      // 2. Handle the callback
      // 3. Send the authorization code to your backend
      // 4. Backend verifies with GitHub and creates/logs in user
      
      throw new Error('GitHub login not implemented yet');
    } catch (error) {
      console.error('GitHub login error:', error);
      setError('GitHub login not available');
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setupAxiosInterceptors(null);
    setCurrentUser(null);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setError('');
      const response = await axios.put(`${API_URL}/users/profile`, userData);
      setCurrentUser(response.data.user);
      return response.data.user;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
      throw error;
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      setError('');
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to process request');
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      setError('');
      await axios.post(`${API_URL}/auth/reset-password`, { token, password });
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
      throw error;
    }
  };

  // Check if user is Pro
  const isPro = () => {
    return currentUser?.subscription === 'pro' && 
           (!currentUser?.subscriptionExpiry || new Date(currentUser.subscriptionExpiry) > new Date());
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    googleLogin,
    githubLogin,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    isPro
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}