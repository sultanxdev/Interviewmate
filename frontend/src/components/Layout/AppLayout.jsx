import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize theme from user preferences or localStorage
  useEffect(() => {
    const savedTheme = user?.preferences?.theme || localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, [user]);

  // Handle theme toggle
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Update user preferences if logged in
    if (user) {
      // This would typically make an API call to update user preferences
      console.log('Update user theme preference:', newTheme);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if current route should show sidebar
  const showSidebar = !location.pathname.includes('/interview/session');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar component */}
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            user={user}
          />
        </>
      )}

      {/* Main content area */}
      <div className={`${showSidebar ? 'lg:pl-64' : ''} flex flex-col min-h-screen`}>
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          onThemeToggle={toggleTheme}
          onLogout={handleLogout}
          theme={theme}
          user={user}
          showMenuButton={showSidebar}
        />

        {/* Page content */}
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <p>&copy; 2024 InterviewMate. All rights reserved.</p>
              <div className="flex space-x-4">
                <a href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">
                  Privacy Policy
                </a>
                <a href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">
                  Terms of Service
                </a>
                <a href="/support" className="hover:text-gray-700 dark:hover:text-gray-300">
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;