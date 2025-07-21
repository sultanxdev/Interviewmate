import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  UserCircleIcon, 
  MoonIcon, 
  SunIcon,
  BellIcon,
  BellSlashIcon,
  CreditCardIcon,
  KeyIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { currentUser, updateProfile, isPro } = useAuth();
  const fileInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    theme: 'light',
    notifications: true
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // API base URL from environment variable or default
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Load user data on mount
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        avatar: currentUser.avatar || '',
        theme: currentUser.preferences?.theme || 'light',
        notifications: currentUser.preferences?.notifications !== false
      });
    }
  }, [currentUser]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle password field changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle avatar upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }
    
    // Check file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        avatar: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };
  
  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // In a real app, you would send this data to your API
      // For now, we'll just simulate a successful update
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user in context
      await updateProfile({
        name: formData.name,
        avatar: formData.avatar,
        preferences: {
          theme: formData.theme,
          notifications: formData.notifications
        }
      });
      
      // Apply theme
      if (formData.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password change
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // In a real app, you would send this data to your API
      // For now, we'll just simulate a successful update
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    // Validate email confirmation
    if (deleteEmail !== currentUser.email) {
      setError('Email does not match');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // In a real app, you would send this request to your API
      // For now, we'll just simulate a successful deletion
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Logout and redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };
  
  // Format subscription expiry date
  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your profile and preferences
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'security'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'subscription'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Subscription
            </button>
          </nav>
        </div>
        
        {/* Content */}
        <div className="px-4 py-5 sm:p-6">
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleProfileUpdate}>
                <div className="space-y-6">
                  {/* Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profile Picture
                    </label>
                    <div className="mt-2 flex items-center">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt="Avatar"
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="ml-5 bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Change
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 sm:text-sm cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email cannot be changed
                    </p>
                  </div>
                  
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Theme
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="radio"
                          id="light"
                          name="theme"
                          value="light"
                          checked={formData.theme === 'light'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <label
                          htmlFor="light"
                          className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-medium cursor-pointer ${
                            formData.theme === 'light'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <SunIcon className="h-5 w-5 mx-auto mb-1" />
                          Light
                        </label>
                      </div>
                      <div>
                        <input
                          type="radio"
                          id="dark"
                          name="theme"
                          value="dark"
                          checked={formData.theme === 'dark'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <label
                          htmlFor="dark"
                          className={`block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-center text-sm font-medium cursor-pointer ${
                            formData.theme === 'dark'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <MoonIcon className="h-5 w-5 mx-auto mb-1" />
                          Dark
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notifications */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="notifications" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Notifications
                      </label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notifications"
                          name="notifications"
                          checked={formData.notifications}
                          onChange={handleChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor="notifications" className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {formData.notifications ? 'On' : 'Off'}
                        </label>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Receive emails about your interviews and account updates
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-8">
                {/* Change Password */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Change Password
                  </h3>
                  
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Current Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          required
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        New Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm New Password
                      </label>
                      <div className="mt-1">
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </span>
                        ) : (
                          'Update Password'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* Delete Account */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Delete Account
                  </h3>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <TrashIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Delete your account
                        </h3>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                          <p>
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                        </div>
                        
                        {showDeleteConfirm ? (
                          <div className="mt-4">
                            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                              To confirm, type your email address:
                            </p>
                            <input
                              type="email"
                              value={deleteEmail}
                              onChange={(e) => setDeleteEmail(e.target.value)}
                              placeholder={currentUser?.email}
                              className="block w-full rounded-md border-red-300 dark:border-red-700 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:text-white sm:text-sm mb-3"
                            />
                            <div className="flex space-x-3">
                              <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400"
                              >
                                {loading ? 'Deleting...' : 'Confirm Delete'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDeleteConfirm(false);
                                  setDeleteEmail('');
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(true)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Delete Account
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* Current Plan */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Current Plan
                  </h3>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {isPro() ? 'Pro Plan' : 'Free Plan'}
                        </h4>
                        {isPro() && currentUser?.subscriptionExpiry && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Expires on {formatExpiryDate(currentUser.subscriptionExpiry)}
                          </p>
                        )}
                      </div>
                      
                      {isPro() ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      ) : (
                        <a
                          href="/pricing"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Upgrade
                        </a>
                      )}
                    </div>
                    
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Plan Features
                      </h5>
                      <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                        {isPro() ? (
                          <>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Unlimited interviews
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Up to 10 questions per interview
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              PDF export of reports
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Priority access to GPT evaluation
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Advanced analytics
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              5 interviews per month
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Up to 5 questions per interview
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Basic feedback
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              No PDF export
                            </li>
                            <li className="flex items-center">
                              <svg className="h-4 w-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              No advanced analytics
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Payment History */}
                {isPro() && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Payment History
                    </h3>
                    
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        <li>
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <CreditCardIcon className="h-5 w-5 text-gray-400 mr-3" />
                                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                                  Pro Plan Subscription
                                </p>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Paid
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                  ₹499.00
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                                <p>
                                  Paid on {new Date().toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Manage Subscription */}
                {isPro() && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Manage Subscription
                    </h3>
                    
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Update Payment Method
                      </button>
                      
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;