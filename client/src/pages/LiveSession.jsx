import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LiveSession = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [socket, setSocket] = useState(null);
    const [sessionStatus, setSessionStatus] = useState('connecting');
    const [transcript, setTranscript] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [error, setError] = useState(null);
    const [timeElapsed, setTimeElapsed] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    // Initialize WebSocket connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const newSocket = io(API_URL, {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket');
            // Join session
            newSocket.emit('session:join', { sessionId });
        });

        newSocket.on('session:joined', (data) => {
            console.log('Session joined:', data);
            setSessionData(data);
            setSessionStatus('ready');
        });

        newSocket.on('session:started', (data) => {
            console.log('Session started with opening:', data);
            setTranscript(prev => [...prev, {
                speaker: 'ai',
                text: data.openingText,
                timestamp: new Date()
            }]);

            // Play opening audio if available
            if (data.openingAudio) {
                playAudio(data.openingAudio);
            }

            setSessionStatus('active');
            startTimer();
        });

        newSocket.on('transcript:partial', (data) => {
            console.log('Partial transcript:', data);
            setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last && last.speaker === 'user' && !last.isFinal) {
                    // Update last partial
                    return [...prev.slice(0, -1), { ...data, timestamp: new Date() }];
                }
                return [...prev, { ...data, timestamp: new Date() }];
            });
        });

        newSocket.on('ai:interrupt', (data) => {
            console.log('AI interruption:', data);
            setTranscript(prev => [...prev, {
                speaker: 'ai',
                text: data.text,
                type: 'interruption',
                reason: data.reason,
                timestamp: new Date()
            }]);
            playAudio(data.audio);
        });

        newSocket.on('ai:probe', (data) => {
            console.log('AI probe:', data);
            setTranscript(prev => [...prev, {
                speaker: 'ai',
                text: data.text,
                type: 'probe',
                timestamp: new Date()
            }]);
            playAudio(data.audio);
        });

        newSocket.on('ai:redirect', (data) => {
            console.log('AI redirect:', data);
            setTranscript(prev => [...prev, {
                speaker: 'ai',
                text: data.text,
                type: 'redirect',
                timestamp: new Date()
            }]);
            playAudio(data.audio);
        });

        newSocket.on('ai:move_forward', (data) => {
            console.log('AI move forward:', data);
            setTranscript(prev => [...prev, {
                speaker: 'ai',
                text: data.text,
                type: 'move_forward',
                timestamp: new Date()
            }]);
            playAudio(data.audio);
        });

        newSocket.on('session:ended', async (data) => {
            console.log('Session ended:', data);
            setSessionStatus('completed');
            stopTimer();
            stopRecording();

            // Generate report
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${API_URL}/api/report/generate/${sessionId}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                navigate(`/report/${sessionId}`);
            } catch (err) {
                console.error('Failed to generate report:', err);
            }
        });

        newSocket.on('session:error', (data) => {
            console.error('Session error:', data);
            setError(data.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
            stopTimer();
        };
    }, [sessionId, navigate]);

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const playAudio = (base64Audio) => {
        try {
            setAiSpeaking(true);
            const audioBlob = base64ToBlob(base64Audio, 'audio/mpeg');
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
            audio.onended = () => {
                setAiSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };
        } catch (err) {
            console.error('Failed to play audio:', err);
            setAiSpeaking(false);
        }
    };

    const base64ToBlob = (base64, mimeType) => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0 && socket) {
                    socket.emit('audio:stream', event.data);
                }
            };

            mediaRecorderRef.current.start(1000); // Send chunks every 1 second
            setIsRecording(true);

            // Notify server to start STT
            socket.emit('audio:start');

        } catch (err) {
            console.error('Failed to start recording:', err);
            setError('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            socket?.emit('audio:stop');
        }
    };

    const endSession = () => {
        if (socket) {
            socket.emit('session:end');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                    <p className="text-gray-700 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Live Session</h1>
                            <p className="text-gray-600 mt-1">
                                {sessionData?.mode || 'Loading...'} • {sessionData?.difficulty || ''}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-mono text-indigo-600">{formatTime(timeElapsed)}</div>
                            <div className="text-sm text-gray-500 mt-1">
                                Status: <span className="font-semibold">{sessionStatus}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transcript Area */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 min-h-[400px] max-h-[500px] overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Conversation</h2>
                    <div className="space-y-4">
                        {transcript.map((item, index) => (
                            <div
                                key={index}
                                className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] p-4 rounded-lg ${item.speaker === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : item.type === 'interruption'
                                                ? 'bg-orange-100 border-2 border-orange-500 text-gray-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    <div className="font-semibold text-sm mb-1">
                                        {item.speaker === 'user' ? 'You' : 'AI Evaluator'}
                                        {item.type && ` (${item.type})`}
                                    </div>
                                    <div>{item.text}</div>
                                    {item.reason && (
                                        <div className="text-xs mt-2 opacity-75">Reason: {item.reason}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-center items-center space-x-4">
                        {sessionStatus === 'active' && (
                            <>
                                {!isRecording ? (
                                    <button
                                        onClick={startRecording}
                                        disabled={aiSpeaking}
                                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 px-8 rounded-full text-lg font-semibold flex items-center space-x-2 transition-all transform hover:scale-105"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                        </svg>
                                        <span>Start Speaking</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        className="bg-red-600 hover:bg-red-700 text-white py-4 px-8 rounded-full text-lg font-semibold flex items-center space-x-2 animate-pulse transition-all"
                                    >
                                        <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>
                                        <span>Recording...</span>
                                    </button>
                                )}

                                <button
                                    onClick={endSession}
                                    className="bg-gray-600 hover:bg-gray-700 text-white py-4 px-8 rounded-full text-lg font-semibold transition-all"
                                >
                                    End Session
                                </button>
                            </>
                        )}

                        {sessionStatus === 'ready' && (
                            <div className="text-center">
                                <p className="text-gray-600 mb-4">Session ready! Click "Start Speaking" when you hear the opening question.</p>
                            </div>
                        )}

                        {aiSpeaking && (
                            <div className="flex items-center space-x-2 text-indigo-600">
                                <div className="animate-pulse">🔊</div>
                                <span className="font-semibold">AI is speaking...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveSession;
