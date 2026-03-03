import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
    Mic, MicOff, Square, Sparkles, Clock, ChevronLeft,
    Volume2, Zap, MessageSquare, ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ACTION_LABEL = {
    interruption: { label: 'Interrupt', color: 'border-red-500/30 bg-red-500/10 text-red-400' },
    probe: { label: 'Probe', color: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
    redirect: { label: 'Redirect', color: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
    move_forward: { label: 'Next Q', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
};

const LiveSession = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [socket, setSocket] = useState(null);
    const [sessionStatus, setSessionStatus] = useState('connecting');
    const [transcript, setTranscript] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [openingQuestion, setOpeningQuestion] = useState(null);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [error, setError] = useState(null);
    const [timeElapsed, setTimeElapsed] = useState(0);

    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const transcriptEndRef = useRef(null);

    /* Auto-scroll transcript */
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    /* WebSocket setup */
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const newSocket = io(API_URL, { auth: { token } });

        newSocket.on('connect', () => newSocket.emit('session:join', { sessionId }));

        newSocket.on('session:joined', (data) => {
            setSessionData(data);
            setSessionStatus('ready');
        });

        newSocket.on('session:started', (data) => {
            // Show the opening question prominently first
            setOpeningQuestion(data.openingText);
            setTranscript(prev => [...prev, { speaker: 'ai', text: data.openingText, timestamp: new Date() }]);
            if (data.openingAudio) playAudio(data.openingAudio);
            setSessionStatus('active');
            startTimer();
            // Scroll to top of transcript after brief delay
            setTimeout(() => transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
        });

        newSocket.on('transcript:partial', (data) => {
            setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last && last.speaker === 'user' && !last.isFinal)
                    return [...prev.slice(0, -1), { ...data, timestamp: new Date() }];
                return [...prev, { ...data, timestamp: new Date() }];
            });
        });

        ['ai:interrupt', 'ai:probe', 'ai:redirect', 'ai:move_forward'].forEach(event => {
            newSocket.on(event, (data) => {
                const typeMap = { 'ai:interrupt': 'interruption', 'ai:probe': 'probe', 'ai:redirect': 'redirect', 'ai:move_forward': 'move_forward' };
                setTranscript(prev => [...prev, { speaker: 'ai', text: data.text, type: typeMap[event], timestamp: new Date() }]);
                if (data.audio) playAudio(data.audio);
            });
        });

        newSocket.on('session:ended', async (data) => {
            setSessionStatus('completed');
            stopTimer();
            stopRecording();
            try {
                const t = localStorage.getItem('token');
                await axios.post(`${API_URL}/api/report/generate/${sessionId}`, {}, {
                    headers: { Authorization: `Bearer ${t}` }
                });
                navigate(`/report/${sessionId}`);
            } catch (err) {
                console.error('Report generation failed:', err);
            }
        });

        // Handle paused session reconnect — resume it
        newSocket.on('session:resumed', (data) => {
            setSessionStatus('active');
            startTimer();
        });

        newSocket.on('session:error', (data) => {
            console.error('Session error:', data.message);
            // If session is dead, redirect to setup instead of showing a blank error
            if (data.message?.includes('completed') || data.message?.includes('abandoned')) {
                navigate('/session/setup');
            } else {
                setError(data.message);
            }
        });

        setSocket(newSocket);
        return () => { newSocket.close(); stopTimer(); };
    }, [sessionId, navigate]);

    const startTimer = () => {
        timerRef.current = setInterval(() => setTimeElapsed(p => p + 1), 1000);
    };
    const stopTimer = () => clearInterval(timerRef.current);

    const playAudio = (base64) => {
        try {
            setAiSpeaking(true);
            const blob = base64ToBlob(base64, 'audio/mpeg');
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
            audio.onended = () => { setAiSpeaking(false); URL.revokeObjectURL(url); };
        } catch { setAiSpeaking(false); }
    };

    const base64ToBlob = (b64, mime) => {
        const bytes = atob(b64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        return new Blob([arr], { type: mime });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0 && socket) socket.emit('audio:stream', e.data);
            };
            mediaRecorderRef.current.start(1000);
            setIsRecording(true);
            socket.emit('audio:start');
        } catch {
            setError('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            setIsRecording(false);
            socket?.emit('audio:stop');
        }
    };

    const endSession = () => socket?.emit('session:end');

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    /* ─ Error state ─ */
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
                <div className="glass rounded-3xl p-10 max-w-sm w-full text-center space-y-5 shadow-2xl">
                    <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                        <Square className="h-7 w-7 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-heading font-bold">Session Error</h2>
                        <p className="text-sm mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{error}</p>
                    </div>
                    <Button onClick={() => navigate('/dashboard')} className="w-full rounded-xl">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    /* ─ Main UI ─ */
    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>

            {/* ── Top bar ── */}
            <header className="glass border-b px-6 py-3 flex items-center justify-between sticky top-0 z-20"
                style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-secondary"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <p className="font-heading font-bold text-sm">
                            {sessionData?.mode ? sessionData.mode.charAt(0).toUpperCase() + sessionData.mode.slice(1) : 'Live Session'}
                        </p>
                        <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {sessionData?.difficulty && sessionData.difficulty.charAt(0).toUpperCase() + sessionData.difficulty.slice(1)} difficulty
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* AI speaking indicator */}
                    {aiSpeaking && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                            style={{ background: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))' }}>
                            <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                            AI speaking…
                        </div>
                    )}

                    {/* Timer */}
                    <div className="flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1.5 rounded-xl"
                        style={{ background: 'hsl(var(--secondary))' }}>
                        <Clock className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
                        {formatTime(timeElapsed)}
                    </div>

                    {/* Status badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
            ${sessionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500'
                            : sessionStatus === 'completed' ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-amber-500/10 text-amber-500'}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                        {sessionStatus}
                    </div>

                    {sessionStatus === 'active' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={endSession}
                            className="h-8 px-3 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive">
                            End Session
                        </Button>
                    )}
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6 gap-6">

                {/* Connecting state */}
                {sessionStatus === 'connecting' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fade-up">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center">
                                <Sparkles className="h-10 w-10 animate-pulse" style={{ color: 'hsl(var(--primary))' }} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-heading font-bold">Setting up your AI Interviewer…</h2>
                            <p className="text-sm mt-2 max-w-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                Generating your opening question. This takes a moment.
                            </p>
                        </div>
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="h-2 w-2 rounded-full bg-primary animate-bounce"
                                    style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Ready state */}
                {sessionStatus === 'ready' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-fade-up">
                        <div className="h-20 w-20 rounded-3xl bg-amber-500/10 flex items-center justify-center">
                            <Sparkles className="h-9 w-9 text-amber-500 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-heading font-bold">AI Interviewer is ready</h2>
                            <p className="text-sm mt-2 max-w-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                Your opening question is being generated…
                            </p>
                        </div>
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="h-2 w-2 rounded-full bg-amber-500 animate-bounce"
                                    style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Transcript + opening question prompt */}
                {(sessionStatus === 'active' || sessionStatus === 'completed') && (
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                        {/* Opening question spotlight — only while hasn't started recording yet */}
                        {openingQuestion && !isRecording && transcript.length <= 1 && sessionStatus === 'active' && (
                            <div className="rounded-2xl border-2 p-5 space-y-3 animate-fade-up"
                                style={{ borderColor: 'hsl(var(--primary)/0.3)', background: 'hsl(var(--primary)/0.06)' }}>
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                                        style={{ background: 'hsl(var(--primary))' }}>
                                        <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest"
                                        style={{ color: 'hsl(var(--primary))' }}>AI Interviewer — Opening Question</span>
                                </div>
                                <p className="text-base font-semibold leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>
                                    {openingQuestion}
                                </p>
                                <div className="flex items-center gap-2 pt-1 text-xs font-bold animate-pulse"
                                    style={{ color: 'hsl(var(--primary))' }}>
                                    <Mic className="h-3.5 w-3.5" />
                                    Click "Start Speaking" below to answer
                                </div>
                            </div>
                        )}
                        {transcript.map((item, idx) => (
                            <TranscriptBubble key={idx} item={item} />
                        ))}
                        {/* Typing indicator if ai speaking */}
                        {aiSpeaking && (
                            <div className="flex gap-3 items-end animate-fade-up">
                                <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center shadow"
                                    style={{ background: 'hsl(var(--primary))' }}>
                                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl rounded-bl-sm border"
                                    style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                                    <div className="flex gap-1 items-center h-5">
                                        {[0.1, 0.3, 0.5].map((d, i) => (
                                            <div key={i} className="h-2 w-2 rounded-full bg-primary animate-bounce"
                                                style={{ animationDelay: `${d}s` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={transcriptEndRef} />
                    </div>
                )}

                {/* ── Controls ── */}
                {sessionStatus === 'active' && (
                    <div className="rounded-2xl border p-5 flex flex-col items-center gap-4"
                        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>

                        {/* Waveform when recording */}
                        {isRecording && (
                            <div className="flex items-end gap-1 h-8">
                                {[14, 22, 30, 26, 18, 30, 22].map((h, i) => (
                                    <div key={i} className="waveform-bar w-1.5" style={{ height: `${h}px`, animationDelay: `${i * 0.07}s` }} />
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            {!isRecording ? (
                                <button
                                    onClick={startRecording}
                                    disabled={aiSpeaking}
                                    className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl disabled:opacity-50
                    hover:-translate-y-0.5 active:scale-95"
                                    style={{
                                        background: aiSpeaking ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
                                        color: 'hsl(var(--primary-foreground))',
                                        boxShadow: aiSpeaking ? 'none' : '0 8px 30px hsl(var(--primary)/0.35)'
                                    }}>
                                    <Mic className="h-5 w-5" />
                                    {aiSpeaking ? 'Wait for AI…' : 'Start Speaking'}
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm bg-red-500 text-white
                    hover:-translate-y-0.5 active:scale-95 transition-all shadow-xl shadow-red-500/30">
                                    <MicOff className="h-5 w-5" />
                                    Stop Recording
                                </button>
                            )}
                        </div>

                        <p className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {isRecording
                                ? '🔴 Recording — speak naturally, AI will respond'
                                : aiSpeaking
                                    ? '🔊 AI is speaking — listen carefully'
                                    : '🎤 Click to start your answer'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ── Transcript bubble ─────────────────────────────────── */
function TranscriptBubble({ item }) {
    const isUser = item.speaker === 'user';
    const actionStyle = item.type ? ACTION_LABEL[item.type] : null;

    return (
        <div className={`flex gap-3 items-end animate-fade-up ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`h-9 w-9 rounded-xl shrink-0 flex items-center justify-center shadow
        ${isUser ? 'bg-secondary' : 'bg-primary'}`}>
                {isUser
                    ? <MessageSquare className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    : <Sparkles className="h-4 w-4 text-primary-foreground" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Action badge */}
                {actionStyle && (
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border w-fit ${actionStyle.color}`}>
                        ⚡ {actionStyle.label}
                    </span>
                )}

                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed border
          ${isUser
                        ? 'rounded-br-sm text-foreground'
                        : item.type === 'interruption'
                            ? 'rounded-bl-sm border-red-500/20 bg-red-500/8'
                            : 'rounded-bl-sm'}`}
                    style={
                        isUser
                            ? { background: 'hsl(var(--secondary))', borderColor: 'hsl(var(--border))' }
                            : { background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }
                    }>
                    {item.text}
                    {!item.isFinal && item.speaker === 'user' && (
                        <span className="inline-block w-1 h-3 ml-1 bg-primary animate-pulse rounded-full align-middle" />
                    )}
                </div>

                <p className="text-[10px] px-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {item.speaker === 'user' ? 'You' : 'AI Interviewer'}
                </p>
            </div>
        </div>
    );
}

export default LiveSession;
