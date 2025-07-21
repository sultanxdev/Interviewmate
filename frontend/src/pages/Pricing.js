import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';

const Pricing = () => {
  const { currentUser, isPro } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle subscription
  const handleSubscribe = async (plan) => {
    if (!currentUser) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    
    if (plan === 'free') {
      // No payment needed for free plan
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // In a real app, you would integrate with Razorpay here
      // For now, we'll just show an alert
      
      alert('Razorpay integration would be implemented here');
      
      // Simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };
  
  // Features lists
  const features = {
    free: [
      '5 interviews per month',
      'Up to 5 questions per interview',
      'Basic feedback',
      'Interview history',
      'Limited topic selection (3 max)'
    ],
    pro: [
      'Unlimited interviews',
      'Up to 10 questions per interview',
      'Detailed feedback and suggestions',
      'PDF export of reports',
      'Share reports with recruiters',
      'Advanced analytics',
      'Priority access to GPT evaluation',
      'Unlimited topic selection'
    ]
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white sm:text-center">
            Pricing Plans
          </h1>
          <p className="mt-5 text-xl text-gray-500 dark:text-gray-400 sm:text-center">
            Choose the perfect plan for your interview preparation needs
          </p>
          
          {error && (
            <div className="mt-6 max-w-md mx-auto p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
        
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">
          {/* Free Plan */}
          <motion.div 
            className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Free
              </h2>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Perfect for beginners and casual users
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹0</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/month</span>
              </p>
              <button
                onClick={() => handleSubscribe('free')}
                className="mt-8 block w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 text-center hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {currentUser ? 'Current Plan' : 'Sign up for free'}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wide">
                What's included
              </h3>
              <ul className="mt-6 space-y-4">
                {features.free.map((feature, index) => (
                  <li key={index} className="flex space-x-3">
                    <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
          
          {/* Pro Plan */}
          <motion.div 
            className="border border-indigo-500 rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Pro
              </h2>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                For serious job seekers and professionals
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹499</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/month</span>
              </p>
              <button
                onClick={() => handleSubscribe('pro')}
                disabled={loading || isPro()}
                className={`mt-8 block w-full rounded-md py-2 text-sm font-semibold text-white text-center ${
                  isPro()
                    ? 'bg-green-600 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : isPro() ? (
                  'Current Plan'
                ) : (
                  'Subscribe to Pro'
                )}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wide">
                What's included
              </h3>
              <ul className="mt-6 space-y-4">
                {features.pro.map((feature, index) => (
                  <li key={index} className="flex space-x-3">
                    <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
        
        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center">
            Frequently asked questions
          </h2>
          
          <div className="mt-12">
            <dl className="space-y-10">
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  How does the interview simulation work?
                </dt>
                <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Our AI-powered system uses voice interaction to simulate a real interview experience. You'll hear questions through text-to-speech, respond using your microphone, and receive instant feedback on your answers.
                </dd>
              </div>
              
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Can I switch between plans?
                </dt>
                <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Yes, you can upgrade to Pro at any time. If you need to downgrade, you can cancel your Pro subscription and revert to the Free plan at the end of your billing cycle.
                </dd>
              </div>
              
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  How accurate is the AI feedback?
                </dt>
                <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Our system uses advanced GPT models to evaluate your responses based on clarity, relevance, structure, and content. While it provides valuable insights, we recommend using it as a practice tool alongside human feedback.
                </dd>
              </div>
              
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  What payment methods do you accept?
                </dt>
                <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  We accept all major credit/debit cards, UPI, and net banking through our secure payment processor, Razorpay.
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-20">
          <div className="bg-indigo-600 rounded-lg shadow-xl overflow-hidden">
            <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
              <div className="lg:self-center">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                  <span className="block">Ready to ace your next interview?</span>
                </h2>
                <p className="mt-4 text-lg leading-6 text-indigo-200">
                  Start practicing today and build confidence for your dream job.
                </p>
                <Link
                  to={currentUser ? '/interview-setup' : '/signup'}
                  className="mt-8 bg-white border border-transparent rounded-md shadow px-5 py-3 inline-flex items-center text-base font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  {currentUser ? 'Start Interview' : 'Sign up for free'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;