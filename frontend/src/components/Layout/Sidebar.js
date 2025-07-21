import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UserIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  Cog6ToothIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Navigation items
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon
    },
    {
      name: 'Interview Setup',
      href: '/interview-setup',
      icon: PlayIcon
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: DocumentTextIcon
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon
    }
  ];
  
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              InterviewMate
            </span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  location.pathname === item.href
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    location.pathname === item.href
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div>
              {currentUser?.avatar ? (
                <img
                  className="inline-block h-9 w-9 rounded-full"
                  src={currentUser.avatar}
                  alt={currentUser.name}
                />
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-500">
                  <span className="text-sm font-medium leading-none text-white">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </span>
                </span>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentUser?.name || 'User'}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {currentUser?.subscription === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;