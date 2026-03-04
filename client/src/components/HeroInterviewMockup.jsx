import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

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

export default HeroInterviewMockup;