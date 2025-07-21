import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  MicrophoneIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  UserIcon, 
  CogIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose, user }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Start Interview', href: '/interview/setup', icon: MicrophoneIcon },
    { name: 'Interview History', href: '/interviews', icon: DocumentTextIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
    
    return (
      <NavLink
        to={item.href}
        onClick={onClose}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          isActive
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
        }`}
      >
        <item.icon
          className={`mr-3 flex-shrink-0 h-6 w-6 ${
            isActive 
              ? 'text-blue-500 dark:text-blue-300' 
              : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
          }`}
        />
        {item.name}
      </NavLink>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 pt-5 pb-4 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MicrophoneIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  InterviewMate
                </h1>
              </div>
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="flex items-center px-4 py-3 mt-4 bg-gray-50 dark:bg-gray-700 mx-4 rounded-lg">
              <div className="flex-shrink-0">
                {user.avatar ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={user.avatar}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <div className="flex items-center mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.hasPro 
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900 dark:to-pink-900 dark:text-purple-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                  }`}>
                    {user.hasPro && <SparklesIcon className="h-3 w-3 mr-1" />}
                    {user.hasPro ? 'Pro' : 'Free'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* Upgrade prompt for free users */}
          {user && !user.hasPro && (
            <div className="flex-shrink-0 px-4 py-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <SparklesIcon className="h-6 w-6" />
                  <div className="ml-3">
                    <p className="text-sm font-medium">Upgrade to Pro</p>
                    <p className="text-xs opacity-90">Unlimited interviews & more</p>
                  </div>
                </div>
                <NavLink
                  to="/upgrade"
                  className="mt-3 block w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-center py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Upgrade Now
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="flex">
          {/* Sidebar panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
            {/* Close button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Sidebar content - same as desktop */}
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <MicrophoneIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      InterviewMate
                    </h1>
                  </div>
                </div>
              </div>

              {/* User info */}
              {user && (
                <div className="flex items-center px-4 py-3 mt-4 bg-gray-50 dark:bg-gray-700 mx-4 rounded-lg">
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.avatar}
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.hasPro 
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 dark:from-purple-900 dark:to-pink-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                      }`}>
                        {user.hasPro && <SparklesIcon className="h-3 w-3 mr-1" />}
                        {user.hasPro ? 'Pro' : 'Free'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </nav>

              {/* Upgrade prompt for free users */}
              {user && !user.hasPro && (
                <div className="flex-shrink-0 px-4 py-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                    <div className="flex items-center">
                      <SparklesIcon className="h-6 w-6" />
                      <div className="ml-3">
                        <p className="text-sm font-medium">Upgrade to Pro</p>
                        <p className="text-xs opacity-90">Unlimited interviews & more</p>
                      </div>
                    </div>
                    <NavLink
                      to="/upgrade"
                      onClick={onClose}
                      className="mt-3 block w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-center py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Upgrade Now
                    </NavLink>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;