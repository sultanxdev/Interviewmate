import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  ClipboardList,
  Briefcase,
  User,
  MessageCircle,
  Activity,
  ChevronDown,
  Linkedin,
  Globe
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      staggerChildren: 0.2,
      when: "beforeChildren"
    }
  }
};

const cardHover = {
  hover: {
    y: -8,
    boxShadow: "0 10px 30px -5px rgba(245, 121, 59, 0.3)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 10
    }
  }
};

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <motion.div
      className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-lg hover:border-[#7F6FEA]/30"
      variants={sectionVariants}
      whileHover={cardHover}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5793B] to-[#7F6FEA]">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      {/* Hero Section */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="pt-32 pb-24 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1 
            className="text-6xl md:text-7xl font-bold text-slate-100 mb-8 leading-tight"
          >
            <span className="bg-gradient-to-r from-[#F5793B] to-[#7F6FEA] bg-clip-text text-transparent">
              Master Your Interviews
            </span>
            <div className="mt-4 text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              With AI Precision
            </div>
          </motion.h1>

          <motion.p 
            className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto"
          >
            Transform your interview skills through realistic AI simulations and 
            <span className="bg-gradient-to-r from-[#F5793B] to-[#7F6FEA] bg-clip-text text-transparent font-medium">
              {" "}data-driven feedback
            </span>
          </motion.p>
        </div>
      </motion.section>

      {/* Core Values */}
      <motion.section
        className="py-20 relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-900/50"
      >
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-12">
            Why InterviewMate?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Mic}
              title="Realistic Practice"
              description="AI-powered mock interviews with industry-specific questions"
            />
            <FeatureCard
              icon={ClipboardList}
              title="Instant Feedback"
              description="Detailed analysis of answers and body language metrics"
            />
            <FeatureCard
              icon={Briefcase}
              title="Industry Focused"
              description="Tech, HR, Finance, and 30+ other industries covered"
            />
            <FeatureCard
              icon={User}
              title="Personalized Coaching"
              description="AI-powered personalized improvement plans"
            />
            <FeatureCard
              icon={MessageCircle}
              title="Multi-Modal Practice"
              description="Voice, video, and text-based interview modes"
            />
            <FeatureCard
              icon={Activity}
              title="Progress Analytics"
              description="Track improvement with detailed performance dashboards"
            />
          </div>
        </div>
      </motion.section>

      {/* Metrics */}
      <motion.section
        className="py-20 bg-gradient-to-br from-[#F5793B]/10 to-[#7F6FEA]/10"
      >
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-12">
            Our Impact
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            {[ 
              { icon: User, value: "10k+", label: "Users Empowered" },
              { icon: Briefcase, value: "95%", label: "Success Rate" },
              { icon: Globe, value: "30+", label: "Industries Covered" },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-lg hover:border-[#7F6FEA]/30"
                whileHover={{ scale: 1.05 }}
              >
                <item.icon className="w-10 h-10 text-[#F5793B] mx-auto mb-4" />
                <div className="text-3xl font-bold text-slate-100 mb-2">
                  {item.value}
                </div>
                <div className="text-slate-400 text-sm">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

   

      {/* CTA */}
      <motion.section
        className="py-20 bg-gradient-to-br from-[#F5793B]/10 to-[#7F6FEA]/10"
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-[#F5793B]/30 to-[#7F6FEA]/30 p-1 rounded-2xl backdrop-blur-lg">
            <div className="bg-slate-900/80 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-slate-100 mb-6">
                Start Your Journey to Success
              </h3>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.a
                  href="/signup"
                  className="bg-gradient-to-r from-[#F5793B] to-[#7F6FEA] text-white hover:from-[#F5793B]/90 hover:to-[#7F6FEA]/90 px-8 py-3 rounded-full text-lg font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  Get Started Free
                </motion.a>
                <motion.a
                  href="/demo"
                  className="border border-[#7F6FEA] text-[#7F6FEA] hover:bg-[#7F6FEA]/10 px-8 py-3 rounded-full text-lg font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  Live Demo
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}

export default AboutUs;