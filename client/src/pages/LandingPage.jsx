import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import {
  Brain,
  Mic,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Globe,
  Zap,
  Star,
  Award,
  Target,
  TrendingUp,
  Shield,
  Clock,
  FileText,
  MessageSquare,
  User,
  Search,
} from "lucide-react";

const LandingPage = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Mock Interviews",
      description:
        "Experience realistic, professional-grade mock interviews that mimic HR, technical, and managerial interviews with dynamic questioning.",
    },
    {
      icon: MessageSquare,
      title: "Real-Time Voice Conversations",
      description:
        "Engage in natural voice-based conversations with AI interviewers that adapt dynamically with cross-questions and scenario-based questioning.",
    },
    {
      icon: TrendingUp,
      title: "Instant Performance Insights",
      description:
        "Get real-time performance analytics and comprehensive feedback to track your progress and improve specific skills over time.",
    },
    {
      icon: FileText,
      title: "Professional Reports",
      description:
        "Receive detailed, shareable final reports with skill breakdowns, strengths, weaknesses, and personalized improvement plans.",
    },
    {
      icon: Target,
      title: "Adaptive Questioning",
      description:
        "AI adapts to your responses with follow-up questions, scenario simulations, and persona-specific interview styles.",
    },
    {
      icon: Award,
      title: "Multiple Interview Types",
      description:
        "Practice HR behavioral interviews, technical coding challenges, and managerial strategy discussions.",
    },
  ];

  const interviewTypes = [
    {
      icon: Users,
      title: "HR Interviews",
      description:
        "Behavioral questions, cultural fit assessment, and soft skills evaluation",
      topics: [
        "Communication",
        "Leadership",
        "Teamwork",
        "Problem Solving",
        "Career Goals",
      ],
    },
    {
      icon: Brain,
      title: "Technical Interviews",
      description:
        "Coding challenges, system design, and technical knowledge assessment",
      topics: [
        "Data Structures",
        "Algorithms",
        "System Design",
        "Programming",
        "Databases",
      ],
    },
    {
      icon: Target,
      title: "Managerial Interviews",
      description:
        "Leadership scenarios, strategic thinking, and management skills",
      topics: [
        "Strategy",
        "Team Management",
        "Decision Making",
        "Conflict Resolution",
      ],
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "30 VAPI AI minutes/month",
        "Unlimited Web Speech API",
        "Basic interview types",
        "Performance reports",
        "Interview history",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "$0.50",
      period: "/minute",
      description: "Pay-as-you-go premium experience",
      features: [
        "Pay-per-minute VAPI AI",
        "Unlimited Web Speech API",
        "All interview types",
        "Advanced analytics",
        "Priority support",
        "Custom questions",
      ],
      cta: "Upgrade to Pro",
      popular: true,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      content:
        "InterviewMate helped me practice system design questions and improved my confidence. The AI feedback was incredibly detailed and actionable.",
      rating: 5,
    },
    {
      name: "Michael Rodriguez",
      role: "Product Manager at Microsoft",
      content:
        "The behavioral interview practice was game-changing. I felt so much more prepared for my actual interviews after using this platform.",
      rating: 5,
    },
    {
      name: "Emily Johnson",
      role: "Data Scientist at Amazon",
      content:
        "The technical interview simulations were spot-on. The AI asked follow-up questions just like real interviewers do.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center">
              <Logo size="md" showText={true} />
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-200/20 blur-[120px] rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-accent-200/20 blur-[120px] rounded-full animate-pulse-slow delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8 animate-fade-in">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-bold shadow-soft">
                <Zap className="w-4 h-4 mr-2 text-brand-500 fill-brand-500" />
                The Future of Interview Prep
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] animate-slide-up">
              Master Your Next <br />
              <span className="gradient-text">Interview with AI</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up delay-100">
              Transform your interview performance with realistic, voice-based AI simulations.
              Get dynamic feedback and professional insights to land your dream job.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up delay-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const role = e.target.role.value;
                  if (role.trim()) {
                    window.location.href = `/register?role=${encodeURIComponent(role)}`;
                  }
                }}
                className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl bg-white p-2 rounded-2xl shadow-premium border border-slate-100 hover:border-brand-200 transition-all group"
              >
                <div className="flex-1 flex items-center px-4">
                  <Search className="w-5 h-5 text-slate-400 mr-3 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="text"
                    name="role"
                    placeholder="Role you're applying for (e.g. Frontend Developer)"
                    className="w-full py-3 bg-transparent border-none focus:ring-0 text-slate-900 font-medium placeholder:text-slate-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-premium animate-shimmer"
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Start Practicing
                </button>
              </form>
            </div>

            {/* Social Proof / Features Lite */}
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 animate-fade-in delay-500 opacity-60 grayscale hover:grayscale-0 transition-all">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-slate-900">30 Free Mins</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-slate-900">No Credit Card</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-slate-900">Adaptive AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-slate-900">Voice-first</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Mockup Placeholder */}
          <div className="mt-20 relative animate-slide-up delay-300">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent z-10 h-40 bottom-0 pointer-events-none"></div>
            <div className="card-premium h-[500px] overflow-hidden bg-slate-900 relative">
              <div className="absolute top-0 left-0 w-full h-12 bg-slate-800 flex items-center px-6 border-b border-slate-700">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="ml-8 px-4 py-1 bg-slate-700/50 rounded-lg text-[10px] text-slate-400 font-mono">interviewmate.io/interview/live</div>
              </div>
              <div className="p-12 flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-24 h-24 bg-brand-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-brand-500/30 animate-float">
                    <Mic className="w-10 h-10 text-brand-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">AI Interviewer is Listening...</h3>
                  <p className="text-slate-400 max-w-md mx-auto">"Tell me about a time you had to deal with a difficult stakeholder and how you managed it?"</p>

                  <div className="mt-12 flex justify-center space-x-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`w-1 bg-brand-500 rounded-full animate-pulse`} style={{ height: `${Math.random() * 40 + 20}px`, animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7z' fill='%23f1f5f9' fill-opacity='0.4'/%3E%3C/svg%3E")`
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-6">
              <Star className="w-4 h-4 mr-2" />
              Why 10,000+ Users Choose Us
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Supercharge
              </span>{" "}
              Your Interview Game
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our AI-powered platform delivers the most realistic interview practice experience
              with cutting-edge features that guarantee results 🚀
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2"
              >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>

                {/* Icon */}
                <div className="relative mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* CTA */}
                <div className="flex items-center text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm">Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full font-semibold shadow-lg">
              <Zap className="w-5 h-5 mr-2" />
              Ready to experience the difference?
              <ArrowRight className="w-5 h-5 ml-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Interview Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Practice All Interview Types
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From HR behavioral questions to technical coding challenges and
              managerial scenarios
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {interviewTypes.map((type, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <type.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {type.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">{type.description}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Key Topics:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {type.topics.map((topic, topicIndex) => (
                      <span
                        key={topicIndex}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview Modes Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Two Powerful Interview Modes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose between premium VAPI AI or free Web Speech API based on
              your needs
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* VAPI Mode */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-200 relative">
              <div className="absolute -top-3 left-6">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  PREMIUM
                </span>
              </div>
              <div className="flex items-center mb-6">
                <Brain className="h-10 w-10 text-blue-600 mr-4" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    VAPI AI Mode
                  </h3>
                  <p className="text-blue-600 font-medium">
                    Ultra-realistic conversations
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Experience the most natural and responsive AI interviewer with
                advanced voice technology and real-time adaptation.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Ultra-low latency responses (&lt;500ms)</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Natural conversation flow with interruptions</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Advanced AI understanding & context awareness</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Professional voice quality & personas</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Dynamic follow-up questions</span>
                </li>
              </ul>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  💎 30 free minutes/month • $0.50/minute for additional usage
                </p>
              </div>
            </div>

            {/* Web Speech API Mode */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-green-200 relative">
              <div className="absolute -top-3 left-6">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  FREE FOREVER
                </span>
              </div>
              <div className="flex items-center mb-6">
                <Globe className="h-10 w-10 text-green-600 mr-4" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Web Speech API
                  </h3>
                  <p className="text-green-600 font-medium">
                    Unlimited practice
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Unlimited interview practice using your browser's built-in
                speech recognition with AI-powered question generation.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Completely free forever</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Unlimited usage with no restrictions</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Browser-based speech recognition</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>AI-generated questions & feedback</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span>Perfect for continuous practice</span>
                </li>
              </ul>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  🎯 Always available as backup • No cost ever • No limits
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Job Seekers Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See how InterviewMate helped professionals land their dream jobs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free and upgrade only when you need premium features
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white p-8 rounded-2xl shadow-lg border-2 ${plan.popular
                  ? "border-blue-500 ring-4 ring-blue-100"
                  : "border-gray-200"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-semibold mb-8">
            <Award className="w-4 h-4 mr-2 text-yellow-400" />
            Join 10,000+ Successful Job Seekers
            <span className="ml-2 px-2 py-1 bg-green-500 text-xs rounded-full animate-pulse">TRENDING</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Ready to{" "}
            <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Dominate
            </span>
            <br />
            Your Next Interview?
          </h2>

          {/* Subheading */}
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            🎯 Transform from interview anxiety to interview confidence in minutes.
            <br />
            <span className="text-white font-semibold">Join the AI revolution</span> and land your dream job faster than ever.
          </p>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12">
            <div className="flex items-center text-white">
              <div className="flex -space-x-2 mr-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full border-2 border-white"></div>
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full border-2 border-white"></div>
                <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-red-400 rounded-full border-2 border-white"></div>
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold">
                  +10K
                </div>
              </div>
              <div>
                <div className="font-semibold">10,000+ Happy Users</div>
                <div className="text-sm text-gray-300">Average 40% improvement</div>
              </div>
            </div>

            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-current" />
              ))}
              <span className="ml-2 text-white font-semibold">4.9/5 Rating</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Link
              to="/register"
              className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg rounded-2xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <Play className="relative mr-3 h-6 w-6" />
              <span className="relative">Start Free Practice Now</span>
              <Zap className="relative ml-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="group inline-flex items-center px-12 py-6 border-2 border-white/30 text-white font-bold text-lg rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:border-white/50"
            >
              <User className="mr-3 h-6 w-6" />
              <span>Sign In</span>
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Guarantee */}
          <div className="inline-flex items-center px-6 py-3 bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-300 rounded-full">
            <Shield className="w-5 h-5 mr-2" />
            <span className="font-semibold">30-Day Success Guarantee</span>
            <span className="ml-2">or your money back</span>
          </div>

          {/* Urgency */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              ⏰ <span className="text-white font-semibold">Limited Time:</span> Get 50% more free minutes this month
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white py-16 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <Logo size="lg" showText={true} textColor="text-white" />
                <span className="ml-3 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full">
                  AI POWERED
                </span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                🚀 The world's most advanced AI-powered mock interview platform.
                Transform your interview skills with realistic conversations and expert feedback.
              </p>

              {/* Social Proof */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-xs text-gray-400">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">4.9★</div>
                  <div className="text-xs text-gray-400">Rating</div>
                </div>
              </div>

              {/* Newsletter */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h4 className="font-semibold mb-3 text-white">Stay Updated 📧</h4>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                  <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-bold mb-6 text-white flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-400" />
                Product
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link to="/features" className="hover:text-blue-400 transition-colors flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-blue-400 transition-colors flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/demo" className="hover:text-blue-400 transition-colors flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Live Demo
                  </Link>
                </li>
                <li>
                  <Link to="/api" className="hover:text-blue-400 transition-colors flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    API Access
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-bold mb-6 text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
                Support
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link to="/help" className="hover:text-purple-400 transition-colors flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-purple-400 transition-colors flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-purple-400 transition-colors flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-purple-400 transition-colors flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center text-gray-400 mb-4 md:mb-0">
                <p>&copy; 2024 InterviewMate. All rights reserved.</p>
                <span className="mx-3">•</span>
                <span className="flex items-center">
                  Made with ❤️ for job seekers worldwide
                </span>
              </div>

              <div className="flex items-center space-x-6">
                <span className="text-gray-400 text-sm">Powered by</span>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                    VAPI AI
                  </span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full border border-purple-500/30">
                    GEMINI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
