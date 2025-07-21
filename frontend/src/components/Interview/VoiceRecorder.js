import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Volume2 } from 'lucide-react';

const VoiceRecorder = ({ 
  onRecordingComplete, 
  onPlayAudio, 
  audioData, 
  isRecording: externalRecording = false,
  disabled = false 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    setIsRecording(externalRecording);
  }, [externalRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        if (onRecordingComplete) {
          onRecordingComplete(blob, recordingTime);
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const playAudio = () => {
    if (audioData) {
      // Play TTS audio from server
      const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
      audio.play();
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      if (onPlayAudio) {
        onPlayAudio();
      }
    } else if (audioBlob) {
      // Play recorded audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Recording Controls */}
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-full transition-colors duration-200 shadow-lg"
          >
            <Mic size={24} />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center w-16 h-16 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors duration-200 shadow-lg animate-pulse"
          >
            <MicOff size={24} />
          </button>
        )}

        {/* Play Audio Button */}
        {(audioData || audioBlob) && (
          <button
            onClick={playAudio}
            disabled={isPlaying}
            className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-full transition-colors duration-200"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        )}

        {/* TTS Audio Indicator */}
        {audioData && (
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <Volume2 size={20} />
            <span className="text-sm font-medium">Audio Available</span>
          </div>
        )}
      </div>

      {/* Recording Status */}
      <div className="text-center">
        {isRecording && (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Recording...</span>
            </div>
            <div className="text-lg font-mono text-gray-700 dark:text-gray-300">
              {formatTime(recordingTime)}
            </div>
          </div>
        )}
        
        {!isRecording && recordingTime > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Recorded: {formatTime(recordingTime)}
          </div>
        )}
        
        {!isRecording && recordingTime === 0 && !disabled && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Click the microphone to start recording
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
        {isRecording 
          ? "Speak clearly and click stop when finished"
          : "Make sure you're in a quiet environment for best results"
        }
      </div>
    </div>
  );
};

export default VoiceRecorder;