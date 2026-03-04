import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Play, ArrowRight, Star, ChevronDown, ChevronUp,
  Check, Mic, BarChart3, FileText, Brain,
  Shield, Zap, TrendingUp, Users, Award
} from 'lucide-react';

// ─── Inline mock interview panel (hero visual) ────────────────────────────────
const HeroInterviewMockup = () => {
  const [activeLine, setActiveLine] = useState(0);
  const lines = [
    { role: 'ai', text: "Tell me about a challenge you overcame at work." },
    { role: 'user', text: "Sure! At my last role, I led a team migration to microservices…" },
    { role: 'ai', text: "Interesting. What was the biggest technical risk you faced?" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLine(p => (p + 1) % lines.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl"
      style={{
        background: '#0d0f1a',
        border: '1.5px solid rgba(255,255,255,0.10)',
        boxShadow: '0 40px 120px rgba(109,40,217,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Live Interview · 04:32</span>
          </div>
        </div>
      </div>

      <div className="flex" style={{ height: '280px' }}>
        {/* Left — video feeds */}
        <div className="flex flex-col gap-3 p-4" style={{ width: '200px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {/* AI avatar */}
          <div className="flex-1 rounded-xl relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#3b0764,#1e1b4b)' }}>
            <img src="/assets/ai-avatar.png" alt="AI"
              className="w-full h-full object-cover object-top"
              onError={e => e.target.style.display = 'none'} />
            {/* Speaking ring */}
            {activeLine % 3 === 0 && (
              <div className="absolute inset-0 rounded-xl"
                style={{ boxShadow: '0 0 0 2px rgba(124,58,237,0.8), 0 0 20px rgba(124,58,237,0.3)', animation: 'breathe 1s ease-in-out infinite' }} />
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
              <div className="h-1.5 w-1.5 rounded-full"
                style={{ background: activeLine % 3 === 0 ? '#7c3aed' : '#475569', animation: activeLine % 3 === 0 ? 'status-blink 0.7s infinite' : 'none' }} />
              <span className="text-[10px] text-white font-medium">AI Coach</span>
            </div>
          </div>
          {/* User */}
          <div className="rounded-xl relative overflow-hidden shrink-0"
            style={{ height: '85px', background: '#1e1e2e', border: activeLine === 1 ? '1.5px solid rgba(34,197,94,0.6)' : '1px solid rgba(255,255,255,0.08)' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-violet-900/60 flex items-center justify-center">
                <span className="text-white font-bold">Y</span>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.7)' }}>
              <div className="h-1.5 w-1.5 rounded-full"
                style={{ background: activeLine === 1 ? '#22c55e' : '#475569' }} />
              <span className="text-[10px] text-white font-medium">You</span>
            </div>
          </div>
        </div>

        {/* Right — transcript */}
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-1"
            style={{ color: 'rgba(255,255,255,0.25)' }}>Live Transcript</div>
          {lines.map((line, i) => (
            <div key={i}
              className="flex gap-2.5 transition-all duration-500"
              style={{ opacity: i <= activeLine ? 1 : 0.2 }}>
              <div className={`h-6 w-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5
                                ${line.role === 'ai' ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/60'}`}>
                {line.role === 'ai' ? <Sparkles style={{ height: 10, width: 10 }} /> : 'Y'}
              </div>
              <div>
                <div className="text-[10px] font-semibold mb-0.5"
                  style={{ color: line.role === 'ai' ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
                  {line.role === 'ai' ? 'AI Interviewer' : 'You'}
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: i === activeLine ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)' }}>
                  {line.text}
                </p>
              </div>
            </div>
          ))}
          {/* Listening indicator */}
          {activeLine === lines.length - 1 && (
            <div className="flex items-center gap-2 mt-auto pt-1"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-end gap-0.5">
                {[0, .1, .2, .15, .05].map((d, i) => (
                  <div key={i} style={{ width: 2.5, background: '#22c55e', borderRadius: 99, animation: `listen-bar 0.5s ease-in-out infinite ${d}s`, height: 3 }} />
                ))}
              </div>
              <span className="text-[10px] font-medium text-emerald-400">Listening…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Stats bar ────────────────────────────────────────────────────────────────
const STATS = [
  { value: '50K+', label: 'Interviews Completed' },
  { value: '94%', label: 'Interview Success Rate' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '120+', label: 'Companies Covered' },
];

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: 'Adaptive AI Interviewer',
    desc: 'Gemini 2.0 Flash generates intelligent, context-aware follow-up questions based on your answers in real time.',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
  },
  {
    icon: <Mic className="h-6 w-6" />,
    title: 'Natural Speech Recognition',
    desc: 'ElevenLabs Scribe transcribes your voice instantly — speak naturally, no typing, no push-to-talk.',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.08)',
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: 'Human-Quality AI Voice',
    desc: 'The interviewer speaks in a natural, professional voice via ElevenLabs TTS — feels like a real video call.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Deep Performance Report',
    desc: 'Get scored on clarity, structure, confidence, and depth with specific improvement tips after every session.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Role-Specific Scenarios',
    desc: 'Choose your industry, job title, and seniority level. The AI tailors every question to what you\'ll actually face.',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.08)',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Private & Secure',
    desc: 'Your interview data is private. Sessions are never shared, never used for training without consent.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
  },
];

// ─── How it works steps ───────────────────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Define Your Role', desc: 'Pick job title, company type, difficulty level, and interview mode (behavioral, technical, or mixed).', icon: <FileText className="h-5 w-5" /> },
  { n: '02', title: 'Start the AI Interview', desc: 'The AI interviewer greets you, asks the opening question, and the session begins — no setup required.', icon: <Play className="h-5 w-5" /> },
  { n: '03', title: 'Speak Naturally', desc: 'Just talk. The system detects when you\'re done speaking and hands the turn back to the AI automatically.', icon: <Mic className="h-5 w-5" /> },
  { n: '04', title: 'Get Your Report', desc: 'Receive a detailed scorecard with per-skill ratings, example answers, and a personalized improvement plan.', icon: <BarChart3 className="h-5 w-5" /> },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Product Manager @ Google', text: 'InterviewMate felt like a real interview — the AI pushed back on vague answers just like a real interviewer would. Landed my offer after 2 weeks.', rating: 5 },
  { name: 'Daniel Kariuki', role: 'Software Engineer @ Stripe', text: 'The VAD auto-detection is genius. No button-pressing — you just talk like it\'s a real call. The voice quality is shockingly human.', rating: 5 },
  { name: 'Aisha Raza', role: 'Marketing Manager @ HubSpot', text: 'I went from blanking on every question to speaking confidently. The report after each session showed exactly what to fix.', rating: 5 },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'How is this different from a normal mock interview?', a: 'Unlike traditional mock interviews, our AI listens actively, asks real follow-ups based on your answers, evaluates your tone and structure, and gives instant, unfiltered feedback — no scheduling, no awkwardness.' },
  { q: 'Do I need any special microphone or setup?', a: 'No. Any device with a standard microphone works. The system uses browser-native audio APIs — nothing to install.' },
  { q: 'Can I practice for free?', a: 'Yes. You get 50 tokens on signup — enough for 5 full sessions. No credit card required.' },
  { q: 'What roles and industries are covered?', a: 'Software engineering, product management, marketing, finance, design, consulting, HR, and more. You can also write a custom role description.' },
  { q: 'Is my session data private?', a: 'Completely. Your sessions are private by default and never used for training without explicit consent. You can delete your data anytime.' },
];

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const heroRef = useRef(null);

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 1px 0 rgba(109,40,217,0.06)',
        }}>
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: '#1a1a2e' }}>
            Interviewmate</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm font-medium"
          style={{ color: '#64748b' }}>
          <a href="#how-it-works" className="hover:text-violet-700 transition-colors">How it works</a>
          <a href="#features" className="hover:text-violet-700 transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-violet-700 transition-colors">Reviews</a>
          <a href="#faq" className="hover:text-violet-700 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-white/60"
            style={{ color: '#7c3aed' }}>
            Sign In
          </Link>
          <Link to="/signup"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
            }}>
            Get Started Free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center px-8 py-20 overflow-hidden">
        {/* Hero grid layout */}
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div className="space-y-8 animate-fade-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: 'rgba(124,58,237,0.10)',
                border: '1px solid rgba(124,58,237,0.20)',
                color: '#7c3aed',
              }}>
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
              AI-Powered Mock Interviews · No credit card needed
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight"
              style={{ color: '#0f0f1a' }}>
              Ace Your Next<br />
              Interview with{' '}
              <span style={{
                background: 'linear-gradient(135deg,#7c3aed,#c026d3,#db2777)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                AI-Powered Practice
              </span>
            </h1>

            <p className="text-lg leading-relaxed" style={{ color: '#64748b', maxWidth: '480px' }}>
              Practice realistic interviews with an AI that listens, responds, and gives instant feedback.
              Speak naturally — no buttons, no scripts. Just like the real thing.
            </p>



            <div className="flex items-center flex-wrap gap-4">
              <button
                id="hero-start-btn"
                onClick={() => navigate('/signup')}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                  boxShadow: '0 8px 32px rgba(124,58,237,0.40)',
                }}>
                <Zap className="h-5 w-5" />
                Start Free Interview
              </button>
            </div>

            {/* Bullets */}
            <div className="flex flex-wrap gap-4">
              {['No credit card', 'Auto speech detection', 'Instant report'].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#64748b' }}>
                  <Check className="h-4 w-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right — mockup */}
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <HeroInterviewMockup />
            {/* Floating badges */}
            <div className="absolute -bottom-6 -left-4 px-4 py-3 rounded-2xl shadow-xl animate-float hidden lg:flex items-center gap-3"
              style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: '#0f0f1a' }}>Interview Score</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>+18 pts this week</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────── */}
      <section className="py-10 px-8">
        <div className="max-w-5xl mx-auto glass rounded-3xl px-8 py-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold tracking-tight gradient-text">{s.value}</p>
                <p className="text-sm mt-1 font-medium" style={{ color: '#64748b' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust logos ─────────────────────────────────────────────── */}
      <section className="py-8 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#94a3b8' }}>
            Practitioners from top companies trust InterviewMate
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {['Google', 'Microsoft', 'Amazon', 'Meta', 'Stripe', 'Notion', 'Figma'].map(co => (
              <span key={co} className="text-lg font-extrabold tracking-tight" style={{ color: '#cbd5e1' }}>{co}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7c3aed' }}>HOW IT WORKS</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: '#0f0f1a' }}>
              Simple Process. Powerful Results.
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#64748b' }}>
              From setup to scorecard in under a minute.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="relative glass rounded-2xl p-6 animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden md:block"
                    style={{ width: '24px', height: '2px', background: 'linear-gradient(90deg,rgba(124,58,237,0.4),transparent)' }} />
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-black"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 4px 12px rgba(124,58,237,0.30)' }}>
                    {step.n}
                  </div>
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#0f0f1a' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7c3aed' }}>KEY FEATURES</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: '#0f0f1a' }}>
              Smart Tools for AI-Powered Interview Practice
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Practice smarter — our AI tools simulate real interview scenarios and help you improve with every session.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i}
                className="glass rounded-2xl p-6 group hover:-translate-y-1 transition-all duration-200 cursor-default animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#0f0f1a' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="py-10 px-8">
        <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg,#1a0533,#2d1b69,#1a0533)',
            boxShadow: '0 20px 80px rgba(109,40,217,0.3)',
          }}>
          {/* Glow orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 h-48 w-48 rounded-full blur-[80px] opacity-30"
              style={{ background: '#7c3aed' }} />
            <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full blur-[80px] opacity-20"
              style={{ background: '#ec4899' }} />
          </div>
          <div className="relative text-center py-16 px-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
              Your Dream Role — One Session Away
            </h2>
            <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Join 50,000+ professionals who practice smarter with AI.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg,#10b981,#059669)',
                color: 'white',
                boxShadow: '0 8px 32px rgba(16,185,129,0.40)',
              }}>
              <Zap className="h-5 w-5" />
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7c3aed' }}>TESTIMONIALS</p>
            <h2 className="text-4xl font-extrabold tracking-tight" style={{ color: '#0f0f1a' }}>What Our Users Say</h2>
            <p className="text-lg mt-3" style={{ color: '#64748b' }}>
              Real stories from professionals who landed their dream jobs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i}
                className="glass rounded-2xl p-7 animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#374151' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#0f0f1a' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7c3aed' }}>FAQ</p>
            <h2 className="text-4xl font-extrabold tracking-tight" style={{ color: '#0f0f1a' }}>Everything You Need to Know</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i}
                className="glass rounded-2xl overflow-hidden cursor-pointer"
                style={{ border: openFaq === i ? '1.5px solid rgba(124,58,237,0.30)' : '1.5px solid rgba(255,255,255,0.65)' }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="flex items-center justify-between px-6 py-5">
                  <span className="font-semibold text-sm pr-4" style={{ color: '#0f0f1a' }}>{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="h-4 w-4 shrink-0 text-violet-600" />
                    : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: '#94a3b8' }} />}
                </div>
                {openFaq === i && (
                  <div className="px-6 pb-5 animate-fade-up">
                    <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="py-12 px-8"
        style={{
          background: '#0d0f1a',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4c1d95)' }}>
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-white">InterviewMate</span>
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
                AI-powered mock interview platform. Practice, improve, and land your dream job.
              </p>
            </div>
            {[
              { title: 'Product', links: ['How it works', 'Features', 'Pricing', 'Report'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-bold text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm transition-colors hover:text-violet-400"
                        style={{ color: 'rgba(255,255,255,0.35)' }}>{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              © 2026 InterviewMate. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <span>Powered by</span>
              <span style={{ color: 'rgba(124,58,237,0.7)' }}>Gemini AI</span>
              <span>+</span>
              <span style={{ color: 'rgba(124,58,237,0.7)' }}>ElevenLabs</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Watermark letter large */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center overflow-hidden pointer-events-none -z-10">
        <span className="text-[180px] font-black leading-none select-none"
          style={{ color: 'rgba(109,40,217,0.04)', letterSpacing: '-8px' }}>
          InterviewMate
        </span>
      </div>
    </div>
  );
};

export default LandingPage;
