import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    PhoneOff, Sparkles, Clock, Wifi, WifiOff,
    CheckCircle2, AlertCircle, Loader2, Mic, MicOff
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Constants ────────────────────────────────────────────────────────────────
const VAD_THRESHOLD = 18;        // RMS energy to detect speech
const VAD_SILENCE_DURATION = 1800; // ms of silence after speech → auto-submit
const VAD_MIN_SPEECH_MS = 600;   // minimum ms of speech before submitting
const AI_AVATAR_SRC = '/assets/ai-avatar.png';

// ─── AIAvatar component ───────────────────────────────────────────────────────
const AIAvatar = ({ isSpeaking, phase }) => {
    const isIdle = phase === 'user_listening' || phase === 'processing';

    return (
        <div className="relative flex items-center justify-center h-full w-full">
            {/* Outer speaking rings */}
            {isSpeaking && (
                <>
                    <div className="absolute inset-0 rounded-2xl"
                        style={{
                            background: 'rgba(109,40,217,0.12)',
                            animation: 'speak-ring 1.5s ease-out infinite',
                        }} />
                    <div className="absolute inset-0 rounded-2xl"
                        style={{
                            background: 'rgba(109,40,217,0.08)',
                            animation: 'speak-ring 1.5s ease-out infinite 0.5s',
                        }} />
                    <div className="absolute inset-0 rounded-2xl"
                        style={{
                            background: 'rgba(109,40,217,0.05)',
                            animation: 'speak-ring 1.5s ease-out infinite 1s',
                        }} />
                </>
            )}

            {/* Avatar image */}
            <div
                className="relative w-full h-full rounded-2xl overflow-hidden"
                style={{
                    animation: isSpeaking ? 'breathe 0.8s ease-in-out infinite' : 'breathe 3.5s ease-in-out infinite',
                }}
            >
                <img
                    src={AI_AVATAR_SRC}
                    alt="AI Interviewer"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                {/* Fallback avatar if image not found */}
                <div className="absolute inset-0 hidden items-center justify-center flex-col gap-3"
                    style={{ background: 'linear-gradient(135deg, #6D28D9, #4C1D95)' }}>
                    <Sparkles className="h-12 w-12 text-white/90" />
                    <span className="text-white font-semibold text-sm">AI Interviewer</span>
                </div>

                {/* Talking overlay — subtle lip-sync shimmer on bottom of face */}
                {isSpeaking && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
                        style={{
                            background: 'linear-gradient(to top, rgba(109,40,217,0.15), transparent)',
                        }} />
                )}

                {/* Speaking mouth indicator overlay (bottom of avatar) */}
                {isSpeaking && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-0.5">
                        {[0.9, 0.3, 0.6, 0.1, 0.7, 0.2, 0.8].map((delay, i) => (
                            <div key={i}
                                style={{
                                    width: '3px',
                                    backgroundColor: 'rgba(255,255,255,0.85)',
                                    borderRadius: '99px',
                                    animation: `mouth-speak ${0.55 + delay * 0.3}s ease-in-out infinite ${delay * 0.15}s`,
                                    height: '4px',
                                }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Name badge */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                <div className="h-2 w-2 rounded-full"
                    style={{
                        background: isSpeaking ? '#22c55e' : '#94a3b8',
                        animation: isSpeaking ? 'status-blink 0.7s ease-in-out infinite' : 'none',
                    }} />
                <span className="text-white text-xs font-semibold">AI Interviewer</span>
            </div>

            {/* Speaking label */}
            {isSpeaking && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(109,40,217,0.85)', backdropFilter: 'blur(8px)', color: 'white' }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    Speaking
                </div>
            )}
        </div>
    );
};

// ─── UserPanel component ──────────────────────────────────────────────────────
const UserPanel = ({ videoRef, isUserSpeaking, userName, isMicOn }) => (
    <div className="relative w-full h-full rounded-2xl overflow-hidden"
        style={{ background: '#1a1a2e' }}>
        {/* Camera feed */}
        <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
        />
        {/* Listening indicator rings */}
        {isUserSpeaking && (
            <>
                <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 pointer-events-none"
                    style={{ animation: 'speak-ring 1s ease-out infinite' }} />
                <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 pointer-events-none"
                    style={{ animation: 'speak-ring 1s ease-out infinite 0.35s' }} />
            </>
        )}
        {/* Name badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
            <div className="h-2 w-2 rounded-full"
                style={{
                    background: isUserSpeaking ? '#22c55e' : isMicOn ? '#94a3b8' : '#ef4444',
                }} />
            <span className="text-white text-xs font-semibold">{userName || 'You'}</span>
        </div>
        {/* Mic off overlay */}
        {!isMicOn && (
            <div className="absolute top-3 right-3 p-2 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.85)' }}>
                <MicOff className="h-3.5 w-3.5 text-white" />
            </div>
        )}
        {/* Listening label */}
        {isUserSpeaking && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(16,185,129,0.85)', color: 'white' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Speaking
            </div>
        )}
        {/* No camera placeholder */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{ zIndex: -1 }}>
            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-white/60">{userName?.charAt(0) || 'U'}</span>
            </div>
            <span className="text-white/40 text-xs">No camera</span>
        </div>
    </div>
);

// ─── VAD Listening Indicator ──────────────────────────────────────────────────
const ListeningIndicator = ({ isListening, isUserSpeaking, hasSpeechStarted }) => {
    if (!isListening) return null;
    return (
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            {/* Bars */}
            {isUserSpeaking ? (
                <div className="flex items-end gap-0.5 h-5">
                    {[0, 0.1, 0.2, 0.15, 0.05, 0.2, 0.1].map((delay, i) => (
                        <div key={i} className="w-1 rounded-full"
                            style={{
                                background: '#22c55e',
                                animation: `listen-bar 0.5s ease-in-out infinite ${delay}s`,
                                height: '4px',
                            }} />
                    ))}
                </div>
            ) : (
                <Mic className="h-4 w-4" style={{ color: hasSpeechStarted ? '#f59e0b' : '#94a3b8' }} />
            )}
            <span className="text-xs font-medium"
                style={{ color: isUserSpeaking ? '#22c55e' : hasSpeechStarted ? '#f59e0b' : '#94a3b8' }}>
                {isUserSpeaking ? 'Detected speech…'
                    : hasSpeechStarted ? 'Finishing… speak until done'
                        : 'Listening — start speaking'}
            </span>
        </div>
    );
};

// ─── TranscriptBubble ─────────────────────────────────────────────────────────
const TranscriptBubble = ({ msg }) => {
    const isAI = msg.role === 'ai';
    return (
        <div className="flex gap-3 items-start" style={{ animation: 'msg-in 0.35s ease both' }}>
            <div className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5
                ${isAI ? 'bg-violet-600' : 'bg-white/15'}`}>
                {isAI
                    ? <Sparkles className="h-4 w-4 text-white" />
                    : <span className="text-xs font-bold text-white/80">You</span>}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold" style={{ color: isAI ? '#a78bfa' : '#94a3b8' }}>
                        {isAI ? 'AI Interviewer' : 'You'}
                    </span>
                    {msg.timestamp && (
                        <span className="text-[10px]" style={{ color: '#475569' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
                <p className="text-sm leading-relaxed" style={{
                    color: isAI ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.72)',
                }}>
                    {msg.content}
                </p>
            </div>
        </div>
    );
};

// ─── Main LiveSession Component ───────────────────────────────────────────────
const LiveSession = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    // Phase state machine:
    // loading → ai_speaking → user_listening → processing → ai_speaking → ... → completed | error
    const [phase, setPhase] = useState('loading');
    const [sessionData, setSessionData] = useState(null);
    const [transcript, setTranscript] = useState([]);  // { role, content, timestamp }
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [turnIndex, setTurnIndex] = useState(0);
    const [error, setError] = useState(null);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [hasSpeechStarted, setHasSpeechStarted] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [userName, setUserName] = useState('You');

    // Refs
    const userVideoRef = useRef(null);
    const streamRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const currentAudioRef = useRef(null);
    const timerRef = useRef(null);
    const vadFrameRef = useRef(null);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const speechStartedRef = useRef(false);
    const speechStartTimeRef = useRef(null);
    const silenceStartRef = useRef(null);
    const isSubmittingRef = useRef(false);
    const phaseRef = useRef('loading');
    const transcriptEndRef = useRef(null);
    const turnIndexRef = useRef(0);

    // Keep phaseRef and turnIndexRef in sync
    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { turnIndexRef.current = turnIndex; }, [turnIndex]);

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    // Timer
    const startTimer = () => { timerRef.current = setInterval(() => setTimeElapsed(p => p + 1), 1000); };
    const stopTimer = () => clearInterval(timerRef.current);
    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // ── Camera setup ───────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            cameraStreamRef.current = stream;
            if (userVideoRef.current) {
                userVideoRef.current.srcObject = stream;
            }
        } catch (_) {
            console.log('Camera not available — video-only mode');
        }
    }, []);

    // ── Audio playback ─────────────────────────────────────────────────────────
    const playAudio = useCallback((base64Audio) => {
        return new Promise((resolve) => {
            if (!base64Audio) { resolve(); return; }
            try {
                if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
                const bytes = atob(base64Audio);
                const arr = new Uint8Array(bytes.length);
                for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                const blob = new Blob([arr], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                currentAudioRef.current = audio;
                audio.play().catch(() => resolve());
                audio.onended = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve(); };
                audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
            } catch (_) { resolve(); }
        });
    }, []);

    // ── Stop VAD & mic ─────────────────────────────────────────────────────────
    const stopMic = useCallback(() => {
        cancelAnimationFrame(vadFrameRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop(); } catch (_) { }
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioCtxRef.current) {
            try { audioCtxRef.current.close(); } catch (_) { }
            audioCtxRef.current = null;
        }
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        speechStartedRef.current = false;
        silenceStartRef.current = null;
        speechStartTimeRef.current = null;
        setIsUserSpeaking(false);
        setHasSpeechStarted(false);
        setIsMicOn(false);
    }, []);

    // ── Submit user audio ──────────────────────────────────────────────────────
    const submitUserAudio = useCallback(async (chunks, mimeType) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;

        // Stop mic and VAD
        cancelAnimationFrame(vadFrameRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            await new Promise(res => {
                mediaRecorderRef.current.onstop = res;
                try { mediaRecorderRef.current.stop(); } catch (_) { res(); }
            });
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsMicOn(false);
        setIsUserSpeaking(false);
        setHasSpeechStarted(false);
        setPhase('processing');

        try {
            const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', audioBlob, `answer.${(mimeType || 'audio/webm').split('/')[1]?.split(';')[0] || 'webm'}`);
            formData.append('mimeType', mimeType || 'audio/webm');
            formData.append('turnIndex', String(turnIndexRef.current));

            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                `${API_URL}/api/session/${sessionId}/turn`,
                formData,
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
            );

            // Add user message to transcript
            if (data.userTranscript) {
                setTranscript(prev => [...prev, { role: 'user', content: data.userTranscript, timestamp: new Date() }]);
            }
            setTurnIndex(data.turnIndex || turnIndexRef.current + 1);

            // Add AI response to transcript
            setTranscript(prev => [...prev, { role: 'ai', content: data.aiResponse, timestamp: new Date() }]);

            if (data.isComplete) {
                setPhase('ai_speaking');
                await playAudio(data.aiAudio);
                setPhase('completed');
                stopTimer();
                await generateReport();
            } else {
                setPhase('ai_speaking');
                await playAudio(data.aiAudio);
                setPhase('user_listening');
                await startAutoListening();
            }
        } catch (err) {
            console.error('Turn error:', err);
            const msg = err.response?.data?.message || 'Could not process your answer, please try again.';
            setError(msg);
            setPhase('user_listening');
            await startAutoListening();
        } finally {
            isSubmittingRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, playAudio]);

    // ── Start auto-listening with VAD ─────────────────────────────────────────
    const startAutoListening = useCallback(async () => {
        if (phaseRef.current !== 'user_listening') return;

        try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = micStream;
            setIsMicOn(true);

            // Web Audio API for VAD
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;
            const source = ctx.createMediaStreamSource(micStream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // MediaRecorder for collecting audio
            const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
            const mimeType = preferredTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
            const recorder = new MediaRecorder(micStream, mimeType ? { mimeType } : {});
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            recorder.ondataavailable = e => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
            recorder.start(200);

            // Reset VAD state
            speechStartedRef.current = false;
            speechStartTimeRef.current = null;
            silenceStartRef.current = null;
            isSubmittingRef.current = false;

            // VAD loop
            const checkVAD = () => {
                if (phaseRef.current !== 'user_listening' || isSubmittingRef.current) return;

                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i];
                const rms = Math.sqrt(sum / bufferLength);

                if (rms > VAD_THRESHOLD) {
                    if (!speechStartedRef.current) {
                        speechStartedRef.current = true;
                        speechStartTimeRef.current = Date.now();
                        setHasSpeechStarted(true);
                    }
                    silenceStartRef.current = null;
                    setIsUserSpeaking(true);
                } else {
                    if (speechStartedRef.current) {
                        setIsUserSpeaking(false);
                        if (!silenceStartRef.current) silenceStartRef.current = Date.now();
                        const silenceDuration = Date.now() - silenceStartRef.current;
                        const speechDuration = speechStartTimeRef.current ? Date.now() - speechStartTimeRef.current : 0;

                        if (silenceDuration >= VAD_SILENCE_DURATION && speechDuration >= VAD_MIN_SPEECH_MS) {
                            // Speech complete — submit
                            submitUserAudio([...audioChunksRef.current], recorder.mimeType || mimeType);
                            return; // stop VAD loop
                        }
                    }
                }
                vadFrameRef.current = requestAnimationFrame(checkVAD);
            };
            vadFrameRef.current = requestAnimationFrame(checkVAD);

        } catch (err) {
            console.error('Mic error:', err);
            setError('Microphone access denied — cannot continue interview.');
            setPhase('error');
        }
    }, [submitUserAudio]);

    // ── Generate report ────────────────────────────────────────────────────────
    const generateReport = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/session/${sessionId}/complete`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await axios.post(
                `${API_URL}/api/report/generate/${sessionId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (_) { }
        navigate(`/report/${sessionId}`);
    }, [sessionId, navigate]);

    // ── End session (user initiated) ───────────────────────────────────────────
    const endSession = useCallback(async () => {
        stopTimer();
        stopMic();
        if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
        if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach(t => t.stop()); }
        setPhase('completed');
        await generateReport();
    }, [stopTimer, stopMic, generateReport]);

    // ── Bootstrap on mount ─────────────────────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        // Get username from JWT
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserName(payload.name?.split(' ')[0] || 'You');
        } catch (_) { }

        const bootstrap = async () => {
            try {
                setConnectionStatus('connecting');
                await startCamera();

                const { data } = await axios.post(
                    `${API_URL}/api/session/${sessionId}/start`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setSessionData({ mode: data.mode, difficulty: data.difficulty, duration: data.duration });
                setTurnIndex(data.turnIndex || 0);
                setConnectionStatus('connected');
                startTimer();

                // Seed transcript with existing history (if re-joining)
                if (data.transcript && data.transcript.length > 0) {
                    setTranscript(data.transcript.map(t => ({ role: t.speaker, content: t.text, timestamp: new Date(t.timestamp) })));
                }

                // Add opening question to transcript + play audio
                if (data.openingText) {
                    setTranscript(prev => [...prev, { role: 'ai', content: data.openingText, timestamp: new Date() }]);
                }
                setPhase('ai_speaking');
                await playAudio(data.openingAudio);

                // Hand to user
                setPhase('user_listening');
                await startAutoListening();

            } catch (err) {
                console.error('Bootstrap error:', err);
                const msg = err.response?.data?.message || 'Failed to start interview session';
                setError(msg);
                setConnectionStatus('error');
                setPhase('error');
            }
        };

        bootstrap();

        return () => {
            stopTimer();
            stopMic();
            cancelAnimationFrame(vadFrameRef.current);
            if (currentAudioRef.current) currentAudioRef.current.pause();
            if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const isSpeaking = phase === 'ai_speaking';
    const isListening = phase === 'user_listening';
    const isProcessing = phase === 'processing';

    // ── Status label & color ───────────────────────────────────────────────────
    const statusConfig = {
        loading: { label: 'Starting…', color: '#f59e0b', dot: '#f59e0b' },
        ai_speaking: { label: 'AI Speaking', color: '#a78bfa', dot: '#7c3aed' },
        user_listening: { label: 'Your Turn', color: '#22c55e', dot: '#22c55e' },
        processing: { label: 'Processing…', color: '#94a3b8', dot: '#94a3b8' },
        completed: { label: 'Completed', color: '#22c55e', dot: '#22c55e' },
        error: { label: 'Error', color: '#ef4444', dot: '#ef4444' },
    };
    const status = statusConfig[phase] || statusConfig.loading;

    // ── Error / Completed screens ──────────────────────────────────────────────
    if (phase === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: '#0d0f1a' }}>
                <div className="text-center space-y-5 max-w-sm p-10 rounded-3xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <AlertCircle className="h-12 w-12 mx-auto text-red-400" />
                    <h2 className="text-xl font-bold text-white">Session Error</h2>
                    <p className="text-sm text-white/60">{error}</p>
                    <button onClick={() => navigate('/dashboard')}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white"
                        style={{ background: 'rgba(124,58,237,0.8)' }}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'completed') {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: '#0d0f1a' }}>
                <div className="text-center space-y-5 max-w-sm p-10 rounded-3xl animate-fade-up"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-400" />
                    <h2 className="text-xl font-bold text-white">Interview Complete!</h2>
                    <p className="text-sm text-white/60">Generating your performance report…</p>
                    <div className="flex gap-1.5 justify-center">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
                                style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── Main Interview UI ──────────────────────────────────────────────────────
    return (
        <div className="h-screen flex flex-col overflow-hidden"
            style={{ background: '#0d0f1a', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header bar ── */}
            <header className="flex items-center justify-between px-6 py-3 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
                <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#4c1d95)' }}>
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-white text-sm">InterviewMate</span>
                    </div>
                    <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
                    {/* Session info */}
                    <span className="text-xs font-medium capitalize"
                        style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {sessionData?.mode || 'Interview'} · {sessionData?.difficulty || 'Medium'} · {sessionData?.duration || 15}min
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Connection */}
                    <div className="flex items-center gap-1.5">
                        {connectionStatus === 'connected'
                            ? <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                            : <WifiOff className="h-3.5 w-3.5 text-red-400" />}
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {connectionStatus === 'connected' ? 'Live' : 'Connecting…'}
                        </span>
                    </div>

                    {/* Status pill */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(255,255,255,0.07)', color: status.color }}>
                        <span className="h-1.5 w-1.5 rounded-full"
                            style={{ background: status.dot, animation: 'status-blink 1.2s ease-in-out infinite' }} />
                        {status.label}
                    </div>

                    {/* Timer */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-bold"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
                        <Clock className="h-3 w-3" />
                        {formatTime(timeElapsed)}
                    </div>

                    {/* Loader during processing */}
                    {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}

                    {/* End button */}
                    <button
                        onClick={endSession}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                        <PhoneOff className="h-3.5 w-3.5" />
                        End Interview
                    </button>
                </div>
            </header>

            {/* ── Main layout ── */}
            <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">

                {/* ── LEFT COLUMN — Video Panels ── */}
                <div className="flex flex-col gap-4 shrink-0" style={{ width: '340px' }}>

                    {/* AI Interviewer Panel */}
                    <div className="flex-1 rounded-2xl overflow-hidden relative min-h-0"
                        style={{ background: '#161822', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {/* Speaking border glow */}
                        {isSpeaking && (
                            <div className="absolute inset-0 rounded-2xl pointer-events-none"
                                style={{ boxShadow: '0 0 0 2px rgba(124,58,237,0.6), 0 0 40px rgba(124,58,237,0.15)', zIndex: 10 }} />
                        )}
                        <div className="absolute inset-0">
                            <AIAvatar isSpeaking={isSpeaking} phase={phase} />
                        </div>
                    </div>

                    {/* User Camera Panel */}
                    <div className="rounded-2xl overflow-hidden relative shrink-0"
                        style={{
                            height: '180px',
                            background: '#161822',
                            border: isUserSpeaking
                                ? '1.5px solid rgba(34,197,94,0.6)'
                                : '1px solid rgba(255,255,255,0.07)',
                            boxShadow: isUserSpeaking ? '0 0 20px rgba(34,197,94,0.15)' : 'none',
                            transition: 'border 0.2s, box-shadow 0.2s',
                        }}>
                        <UserPanel
                            videoRef={userVideoRef}
                            isUserSpeaking={isUserSpeaking}
                            userName={userName}
                            isMicOn={isMicOn}
                        />
                    </div>
                </div>

                {/* ── RIGHT COLUMN — Transcript ── */}
                <div className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-0"
                    style={{ background: '#161822', border: '1px solid rgba(255,255,255,0.07)' }}>

                    {/* Transcript header */}
                    <div className="px-5 py-3.5 shrink-0 flex items-center justify-between"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-violet-500"
                                style={{ animation: 'status-blink 2s ease-in-out infinite' }} />
                            <span className="text-sm font-bold text-white/80">Live Transcript</span>
                        </div>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {transcript.length} messages
                        </span>
                    </div>

                    {/* Transcript messages */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(124,58,237,0.3) transparent',
                        }}>

                        {/* Empty state */}
                        {transcript.length === 0 && phase === 'loading' && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                                <Sparkles className="h-8 w-8 text-violet-400" />
                                <p className="text-sm text-white/60">Setting up interview…</p>
                            </div>
                        )}

                        {transcript.map((msg, idx) => (
                            <TranscriptBubble key={idx} msg={msg} />
                        ))}

                        {/* Processing indicator in transcript */}
                        {isProcessing && (
                            <div className="flex gap-3 items-start" style={{ animation: 'msg-in 0.3s ease both' }}>
                                <div className="h-8 w-8 rounded-xl shrink-0 flex items-center justify-center bg-violet-600 mt-0.5">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold mb-1.5" style={{ color: '#a78bfa' }}>AI Interviewer</div>
                                    <div className="flex gap-1.5 items-end h-5">
                                        {[0.1, 0.25, 0.4].map((d, i) => (
                                            <div key={i} className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
                                                style={{ animationDelay: `${d}s` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={transcriptEndRef} />
                    </div>

                    {/* Status / VAD bar */}
                    <div className="px-5 py-3 shrink-0 flex items-center justify-between"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <ListeningIndicator
                            isListening={isListening}
                            isUserSpeaking={isUserSpeaking}
                            hasSpeechStarted={hasSpeechStarted}
                        />

                        {isSpeaking && (
                            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: '#a78bfa' }}>
                                <div className="flex items-end gap-0.5 h-4">
                                    {[0, 0.15, 0.3, 0.1, 0.25].map((d, i) => (
                                        <div key={i} className="w-1 rounded-full"
                                            style={{ background: '#7c3aed', animation: `mouth-speak 0.7s ease-in-out infinite ${d}s`, height: '4px' }} />
                                    ))}
                                </div>
                                AI is speaking…
                            </div>
                        )}

                        {isProcessing && (
                            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: '#94a3b8' }}>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Transcribing &amp; generating response…
                            </div>
                        )}

                        {/* Turn count */}
                        <div className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            Turn {turnIndex + 1} · {formatTime(timeElapsed)}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom bar — non-interactive info only ── */}
            <div className="flex items-center justify-center gap-6 py-2 shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    🎤 Speak naturally — the system detects when you finish automatically
                </span>
            </div>
        </div>
    );
};

export default LiveSession;
