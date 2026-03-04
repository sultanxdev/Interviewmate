import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import {
    Target, Dumbbell, Monitor, Settings2, Coins,
    Zap, ChevronLeft, AlertCircle
} from 'lucide-react';

const SessionSetup = () => {
    const navigate = useNavigate();
    const { tokenBalance, refreshTokenBalance } = useAuth();

    const [config, setConfig] = useState({
        mode: 'interview',
        scenario: { role: '', company: '', description: '' },
        skillsToEvaluate: ['clarity', 'structure', 'confidence'],
        difficulty: 'medium',
        duration: 15
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const SESSION_COST = 10;

    const modes = [
        { id: 'interview', label: 'Interview', Icon: Target, desc: 'Full interview simulation' },
        { id: 'drill', label: 'Skill Drill', Icon: Dumbbell, desc: 'Practice specific skills' },
        { id: 'presentation', label: 'Presentation', Icon: Monitor, desc: 'Pitch practice' },
        { id: 'custom', label: 'Custom', Icon: Settings2, desc: 'Custom scenario' },
    ];

    const skills = [
        { id: 'clarity', label: 'Clarity' },
        { id: 'structure', label: 'Structure' },
        { id: 'confidence', label: 'Confidence' },
        { id: 'depth', label: 'Depth' },
        { id: 'crossQuestionHandling', label: 'Cross-Question Handling' },
        { id: 'logicalConsistency', label: 'Logical Consistency' },
    ];

    const difficulties = [
        { id: 'easy', label: 'Easy', color: 'text-emerald-500', ring: 'ring-emerald-500/50' },
        { id: 'medium', label: 'Medium', color: 'text-amber-500', ring: 'ring-amber-500/50' },
        { id: 'hard', label: 'Hard', color: 'text-red-500', ring: 'ring-red-500/50' },
    ];

    const handleSkillToggle = (id) =>
        setConfig(p => ({
            ...p,
            skillsToEvaluate: p.skillsToEvaluate.includes(id)
                ? p.skillsToEvaluate.filter(s => s !== id)
                : [...p.skillsToEvaluate, id]
        }));

    const handleStart = async () => {
        if (tokenBalance < SESSION_COST) {
            setError(`You need ${SESSION_COST} tokens. Current balance: ${tokenBalance}.`);
            return;
        }
        if (!config.scenario.role) { setError('Please enter a role / position.'); return; }

        setLoading(true); setError('');
        try {
            const { data } = await axios.post('/api/session/create', config);
            await refreshTokenBalance();
            navigate(`/session/${data.sessionId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create session.');
        } finally {
            setLoading(false);
        }
    };

    /* shared card style */
    const card = 'rounded-2xl p-7 border mb-5';
    const cardStyle = { background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' };

    const inputCls = `w-full px-4 py-3 rounded-xl border text-sm font-medium transition-colors
        bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40`;
    const inputStyle = { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' };

    return (
        <div className="min-h-screen py-14 px-4">
            <div className="max-w-3xl mx-auto">

                {/* Back */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1.5 text-sm font-medium mb-8 hover:text-primary transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <ChevronLeft className="h-4 w-4" /> Dashboard
                </button>

                {/* Page header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-heading font-extrabold tracking-tight mb-2">
                        New Session
                    </h1>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Configure your AI mock interview and start practising.
                    </p>
                </div>

                {/* Token / cost notice */}
                <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl border mb-7"
                    style={{
                        background: 'hsl(var(--primary)/0.06)',
                        borderColor: 'hsl(var(--primary)/0.2)'
                    }}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Coins className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                        <span style={{ color: 'hsl(var(--primary))' }}>Cost: {SESSION_COST} tokens</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Balance: <strong style={{ color: 'hsl(var(--foreground))' }}>{tokenBalance}</strong>
                    </span>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border mb-6 text-sm"
                        style={{ background: 'hsl(var(--destructive)/0.08)', borderColor: 'hsl(var(--destructive)/0.25)', color: 'hsl(var(--destructive))' }}>
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        {error}
                    </div>
                )}

                {/* ── Mode ── */}
                <div className={card} style={cardStyle}>
                    <h2 className="text-base font-heading font-bold mb-5">Session Mode</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {modes.map(({ id, label, Icon, desc }) => {
                            const active = config.mode === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setConfig(p => ({ ...p, mode: id }))}
                                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all hover:-translate-y-0.5
                                        ${active ? 'border-primary bg-primary/6 shadow-lg shadow-primary/10' : 'border-transparent hover:border-primary/20'}`}
                                    style={!active ? { background: 'hsl(var(--secondary))' } : {}}>
                                    <div className={`p-2 rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{label}</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Scenario ── */}
                <div className={card} style={cardStyle}>
                    <h2 className="text-base font-heading font-bold mb-5">Scenario Details</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                                style={{ color: 'hsl(var(--muted-foreground))' }}>
                                Role / Position *
                            </label>
                            <input
                                type="text"
                                value={config.scenario.role}
                                onChange={(e) => setConfig(p => ({ ...p, scenario: { ...p.scenario, role: e.target.value } }))}
                                placeholder="e.g. Senior Software Engineer"
                                className={inputCls}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                                style={{ color: 'hsl(var(--muted-foreground))' }}>
                                Company (Optional)
                            </label>
                            <input
                                type="text"
                                value={config.scenario.company}
                                onChange={(e) => setConfig(p => ({ ...p, scenario: { ...p.scenario, company: e.target.value } }))}
                                placeholder="e.g. Google, Stripe"
                                className={inputCls}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                            style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Additional Context
                        </label>
                        <textarea
                            value={config.scenario.description}
                            onChange={(e) => setConfig(p => ({ ...p, scenario: { ...p.scenario, description: e.target.value } }))}
                            placeholder="Any specific focus areas or context…"
                            rows={3}
                            className={`${inputCls} resize-none`}
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* ── Skills ── */}
                <div className={card} style={cardStyle}>
                    <h2 className="text-base font-heading font-bold mb-5">Skills to Evaluate</h2>
                    <div className="flex flex-wrap gap-2">
                        {skills.map(({ id, label }) => {
                            const on = config.skillsToEvaluate.includes(id);
                            return (
                                <button
                                    key={id}
                                    onClick={() => handleSkillToggle(id)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all
                                        ${on ? 'border-primary bg-primary/10 text-primary' : 'border-transparent hover:border-primary/30'}`}
                                    style={!on ? { background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' } : {}}>
                                    {on && '✓ '}{label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Difficulty & Duration ── */}
                <div className="grid md:grid-cols-2 gap-5 mb-5">
                    <div className={`rounded-2xl p-7 border`} style={cardStyle}>
                        <h2 className="text-base font-heading font-bold mb-5">Difficulty</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {difficulties.map(({ id, label, color, ring }) => (
                                <button
                                    key={id}
                                    onClick={() => setConfig(p => ({ ...p, difficulty: id }))}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2
                                        ${config.difficulty === id ? `ring-2 ${ring} border-transparent` : 'border-transparent'}`}
                                    style={{ background: 'hsl(var(--secondary))' }}>
                                    <span className={color}>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={`rounded-2xl p-7 border`} style={cardStyle}>
                        <h2 className="text-base font-heading font-bold mb-5">Duration</h2>
                        <div className="grid grid-cols-4 gap-2">
                            {[10, 15, 20, 30].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setConfig(p => ({ ...p, duration: m }))}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2
                                        ${config.duration === m ? 'border-primary bg-primary/10 text-primary' : 'border-transparent'}`}
                                    style={config.duration !== m ? { background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' } : {}}>
                                    {m}m
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── CTA ── */}
                <Button
                    onClick={handleStart}
                    disabled={loading || tokenBalance < SESSION_COST}
                    className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all gap-2">
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Creating Session…
                        </>
                    ) : tokenBalance < SESSION_COST ? (
                        `Insufficient Tokens (Need ${SESSION_COST})`
                    ) : (
                        <>
                            <Zap className="h-5 w-5" />
                            Start Session · {SESSION_COST} tokens
                        </>
                    )}
                </Button>

                {tokenBalance < SESSION_COST && (
                    <Button
                        variant="outline"
                        onClick={() => navigate('/settings')}
                        className="w-full mt-3 h-12 rounded-2xl font-bold text-amber-500 border-amber-500/30 hover:bg-amber-500/8 hover:text-amber-500">
                        Get More Tokens
                    </Button>
                )}
            </div>
        </div>
    );
};

export default SessionSetup;
