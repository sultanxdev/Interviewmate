import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  MicrophoneIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const { currentUser } = useAuth();
  
  // Features list
  const features = [
    {
      name: 'Voice-Based Interaction',
      description: 'Practice with a realistic interview experience using voice interaction. Speak your answers naturally as you would in a real interview.',
      icon: MicrophoneIcon
    },
    {
      name: 'AI-Powered Feedback',
      description: 'Receive instant, detailed feedback on your responses from our advanced GPT models, helping you improve with each practice session.',
      icon: ChatBubbleLeftRightIcon
    },
    {
      name: 'Comprehensive Reports',
      description: 'Get detailed performance reports with scores, feedback, and suggestions for improvement that you can download or share.',
      icon: DocumentTextIcon
    },
    {
      name: 'Progress Tracking',
      description: 'Track your improvement over time with analytics that show your strengths and areas for development.',
      icon: ChartBarIcon
    }
  ];
  
  // Testimonials
  const testimonials = [
    {
      content: "InterviewMate helped me prepare for my technical interviews in a way that felt like the real thing. The AI feedback was surprisingly insightful!",
      author: "Priya S.",
      role: "Frontend Developer",
      company: "Hired at a leading tech company"
    },
    {
      content: "As someone who gets nervous during interviews, the practice with InterviewMate made me much more confident. I could practice as many times as I needed.",
      author: "Rahul M.",
      role: "Product Manager",
      company: "Secured dream job after 3 weeks of practice"
    },
    {
      content: "The detailed feedback on my communication style and technical accuracy was invaluable. It helped me refine my answers and ultimately land my job.",
      author: "Ananya K.",
      role: "Data Scientist",
      company: "Improved interview score by 40%"
    }
  ];
  
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-y-0 h-full w-full" aria-hidden="true">
          <div className="relative h-full">
            <svg
              className="absolute right-full transform translate-y-1/3 translate-x-1/4 md:translate-y-1/2 sm:translate-x-1/2 lg:translate-x-full"
              width="404"
              height="784"
              fill="none"
              viewBox="0 0 404 784"
            >
              <defs>
                <pattern
                  id="e229dbec-10e9-49ee-8ec3-0286ca089edf"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="4" height="4" className="text-gray-200 dark:text-gray-700" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="784" fill="url(#e229dbec-10e9-49ee-8ec3-0286ca089edf)" />
            </svg>
            <svg
              className="absolute left-full transform -translate-y-3/4 -translate-x-1/4 sm:-translate-x-1/2 md:-translate-y-1/2 lg:-translate-x-3/4"
              width="404"
              height="784"
              fill="none"
              viewBox="0 0 404 784"
            >
              <defs>
                <pattern
                  id="d2a68204-c383-44b1-b99f-42ccff4e5365"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect x="0" y="0" width="4" height="4" className="text-gray-200 dark:text-gray-700" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="784" fill="url(#d2a68204-c383-44b1-b99f-42ccff4e5365)" />
            </svg>
          </div>
        </div>

        <div className="relative pt-6 pb-16 sm:pb-24">
          <div className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6">
            <div className="text-center">
              <motion.h1 
                className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="block">Ace Your Next Interview</span>
                <span className="block text-indigo-600 dark:text-indigo-400">with AI-Powered Practice</span>
              </motion.h1>
              <motion.p 
                className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                InterviewMate uses voice interaction and GPT-powered feedback to help you practice and improve your interview skills in a realistic environment.
              </motion.p>
              <motion.div 
                className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="rounded-md shadow">
                  <Link
                    to={currentUser ? '/interview-setup' : '/signup'}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                  >
                    {currentUser ? 'Start Interview' : 'Get Started for Free'}
                  </Link>
                </div>
                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                  <Link
                    to="/pricing"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 dark:text-indigo-400 dark:bg-gray-800 dark:hover:bg-gray-700 md:py-4 md:text-lg md:px-10"
                  >
                    View Pricing
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex flex-col" aria-hidden="true">
            <div className="flex-1" />
            <div className="flex-1 w-full bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.img
              className="relative rounded-lg shadow-lg"
              src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
              alt="Person in an interview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="relative bg-gray-100 dark:bg-gray-800 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
          <motion.h2 
            className="text-base font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Practice Makes Perfect
          </motion.h2>
          <motion.p 
            className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Everything you need to prepare for your interviews
          </motion.p>
          <motion.p 
            className="mt-5 max-w-prose mx-auto text-xl text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our platform combines cutting-edge AI technology with proven interview techniques to help you practice and improve.
          </motion.p>
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div 
                  key={feature.name} 
                  className="pt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                >
                  <div className="flow-root bg-white dark:bg-gray-900 rounded-lg px-6 pb-8 shadow-lg">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-md shadow-lg">
                          <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">{feature.name}</h3>
                      <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative bg-white dark:bg-gray-900 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-base font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Simple Process
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">
              How InterviewMate Works
            </p>
            <p className="mt-5 max-w-prose mx-auto text-xl text-gray-500 dark:text-gray-400">
              Get started in minutes and begin improving your interview skills today
            </p>
          </motion.div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-600 rounded-md p-3">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h3 className="ml-4 text-lg font-medium text-gray-900 dark:text-white">
                      Set Up Your Interview
                    </h3>
                  </div>
                  <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                    Choose the interview type, role, topics, and difficulty level to customize your practice session.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-600 rounded-md p-3">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h3 className="ml-4 text-lg font-medium text-gray-900 dark:text-white">
                      Practice with Voice
                    </h3>
                  </div>
                  <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                    Listen to interview questions and respond naturally using your voice, just like in a real interview.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-600 rounded-md p-3">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h3 className="ml-4 text-lg font-medium text-gray-900 dark:text-white">
                      Get Detailed Feedback
                    </h3>
                  </div>
                  <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                    Receive AI-generated feedback, scores, and suggestions to improve your interview performance.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div 
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link
              to={currentUser ? '/interview-setup' : '/signup'}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Start Practicing Now
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-100 dark:bg-gray-800 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-base font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Testimonials
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">
              Hear from our successful users
            </p>
          </motion.div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div 
                  key={index}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                >
                  <div className="p-6">
                    <p className="text-gray-500 dark:text-gray-400 italic">"{testimonial.content}"</p>
                    <div className="mt-6">
                      <p className="text-base font-medium text-gray-900 dark:text-white">{testimonial.author}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">{testimonial.company}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <motion.h2 
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="block">Ready to boost your interview confidence?</span>
            <span className="block text-indigo-200">Start practicing with InterviewMate today.</span>
          </motion.h2>
          <motion.div 
            className="mt-8 flex lg:mt-0 lg:flex-shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex rounded-md shadow">
              <Link
                to={currentUser ? '/interview-setup' : '/signup'}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                {currentUser ? 'Start Interview' : 'Get Started for Free'}
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-400"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;