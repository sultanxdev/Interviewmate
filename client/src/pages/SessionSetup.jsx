import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const SessionSetup = () => {
    const navigate = useNavigate();
    const { tokenBalance, refreshTokenBalance } = useAuth();

    const [config, setConfig] = useState({
        mode: 'interview',
        scenario: {
            role: '',
            company: '',
            description: ''
        },
        skillsToEvaluate: ['clarity', 'structure', 'confidence'],
        difficulty: 'medium',
        duration: 15
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const SESSION_COST = 10; // tokens per session

    const modes = [
        { id: 'interview', label: 'Interview', icon: '🎯', desc: 'Full interview simulation' },
        { id: 'drill', label: 'Skill Drill', icon: '💪', desc: 'Practice specific skills' },
        { id: 'presentation', label: 'Presentation', icon: '📊', desc: 'Pitch practice' },
        { id: 'custom', label: 'Custom', icon: '⚙️', desc: 'Custom scenario' }
    ];

    const skills = [
        { id: 'clarity', label: 'Clarity' },
        { id: 'structure', label: 'Structure' },
        { id: 'confidence', label: 'Confidence' },
        { id: 'depth', label: 'Depth' },
        { id: 'crossQuestionHandling', label: 'Cross-Question Handling' },
        { id: 'logicalConsistency', label: 'Logical Consistency' }
    ];

    const difficulties = [
        { id: 'easy', label: 'Easy', color: 'text-green-500' },
        { id: 'medium', label: 'Medium', color: 'text-yellow-500' },
        { id: 'hard', label: 'Hard', color: 'text-red-500' }
    ];

    const handleSkillToggle = (skillId) => {
        setConfig(prev => ({
            ...prev,
            skillsToEvaluate: prev.skillsToEvaluate.includes(skillId)
                ? prev.skillsToEvaluate.filter(s => s !== skillId)
                : [...prev.skillsToEvaluate, skillId]
        }));
    };

    const handleStartSession = async () => {
        if (tokenBalance < SESSION_COST) {
            setError(`Insufficient tokens. You need ${SESSION_COST} tokens but have ${tokenBalance}.`);
            return;
        }

        if (!config.scenario.role) {
            setError('Please enter a role/position');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/session/create', config);
            const { sessionId } = response.data;

            // Refresh token balance after session creation (tokens are locked)
            await refreshTokenBalance();

            // Navigate to live session
            navigate(`/session/${sessionId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-16 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-heading font-bold text-foreground mb-4 tracking-tight">
                        Start a New Session
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Configure your practice session and start improving
                    </p>
                    <div className="mt-4 inline-flex items-center px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <span className="text-amber-400 font-semibold">
                            Cost: {SESSION_COST} tokens
                        </span>
                        <span className="mx-2 text-gray-500">•</span>
                        <span className="text-gray-400">
                            Balance: {tokenBalance} tokens
                        </span>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                {/* Session Mode */}
                <div className="bg-card border border-primary/5 shadow-sm rounded-2xl p-8 mb-8 backdrop-blur-none">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-6">Session Mode</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {modes.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setConfig(prev => ({ ...prev, mode: mode.id }))}
                                className={`p-4 rounded-xl border-2 transition-all ${config.mode === mode.id
                                    ? 'border-primary bg-primary/5 shadow-inner transition-all transform scale-[0.98]'
                                    : 'border-white/10 hover:border-white/30'
                                    }`}
                            >
                                <div className="text-3xl mb-2">{mode.icon}</div>
                                <div className="text-white font-medium">{mode.label}</div>
                                <div className="text-gray-400 text-sm">{mode.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scenario Details */}
                <div className="bg-card border border-primary/5 shadow-sm rounded-2xl p-8 mb-8 backdrop-blur-none">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-6">Scenario Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Role / Position *</label>
                            <input
                                type="text"
                                value={config.scenario.role}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    scenario: { ...prev.scenario, role: e.target.value }
                                }))}
                                placeholder="e.g. Senior Software Engineer"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Company (Optional)</label>
                            <input
                                type="text"
                                value={config.scenario.company}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    scenario: { ...prev.scenario, company: e.target.value }
                                }))}
                                placeholder="e.g. Google, Amazon"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-gray-400 text-sm mb-2">Additional Context (Optional)</label>
                        <textarea
                            value={config.scenario.description}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                scenario: { ...prev.scenario, description: e.target.value }
                            }))}
                            placeholder="Any specific focus areas or context..."
                            rows={3}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                        />
                    </div>
                </div>

                {/* Skills to Evaluate */}
                <div className="bg-card border border-primary/5 shadow-sm rounded-2xl p-8 mb-8 backdrop-blur-none">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-6">Skills to Evaluate</h2>
                    <div className="flex flex-wrap gap-3">
                        {skills.map(skill => (
                            <button
                                key={skill.id}
                                onClick={() => handleSkillToggle(skill.id)}
                                className={`px-4 py-2 rounded-full transition-all ${config.skillsToEvaluate.includes(skill.id)
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {skill.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Difficulty & Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                        <h2 className="text-xl font-heading font-bold text-foreground mb-6">Difficulty</h2>
                        <div className="flex gap-3">
                            {difficulties.map(diff => (
                                <button
                                    key={diff.id}
                                    onClick={() => setConfig(prev => ({ ...prev, difficulty: diff.id }))}
                                    className={`flex-1 py-3 rounded-lg transition-all ${config.difficulty === diff.id
                                        ? 'bg-white/20 ring-2 ring-purple-500'
                                        : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <span className={`font-medium ${diff.color}`}>{diff.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                        <h2 className="text-xl font-heading font-bold text-foreground mb-6">Duration</h2>
                        <div className="flex gap-3">
                            {[10, 15, 20, 30].map(mins => (
                                <button
                                    key={mins}
                                    onClick={() => setConfig(prev => ({ ...prev, duration: mins }))}
                                    className={`flex-1 py-3 rounded-lg transition-all ${config.duration === mins
                                        ? 'bg-white/20 ring-2 ring-purple-500'
                                        : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <span className="text-white font-medium">{mins}m</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStartSession}
                    disabled={loading || tokenBalance < SESSION_COST}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${loading || tokenBalance < SESSION_COST
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-primary-foreground shadow-lg scale-[1.02]'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating Session...
                        </span>
                    ) : tokenBalance < SESSION_COST ? (
                        `Insufficient Tokens (Need ${SESSION_COST})`
                    ) : (
                        `Start Session (${SESSION_COST} tokens)`
                    )}
                </button>

                {tokenBalance < SESSION_COST && (
                    <button
                        onClick={() => navigate('/settings')}
                        className="w-full mt-4 py-3 border-2 border-amber-500/50 text-amber-400 rounded-xl font-semibold hover:bg-amber-500/10 transition-all"
                    >
                        Get More Tokens
                    </button>
                )}
            </div>
        </div>
    );
};

export default SessionSetup;
