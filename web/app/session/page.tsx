'use client';

import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import MicToggleButton from '../components/MicToggleButton';
import BackchannelIndicator from '../components/BackchannelIndicator';
import StatsPanel from '../components/StatsPanel';
import AudioVisualizer from '../components/AudioVisualizer';
import SessionControls from '../components/SessionControls';

import { useSessionStore } from '@/hooks/useSessionStore';
import { useMicrophoneStream } from '@/hooks/useMicrophoneStream';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAudioPlayerQueue } from '@/hooks/useAudioPlayerQueue';

const WS_URL = 'ws://localhost:8000/ws/session';

export default function SessionPage() {
  const {
    isRecording,
    backchannels,
    sessionDuration,
    lastBackchannel,
    isConnected,
    error,
    startRecording,
    stopRecording,
    addBackchannel,
    updateDuration,
    setConnected,
    setError,
    resetSession,
    getBackchannelsByType,
    getAverageResponseTime,
  } = useSessionStore();

  const [currentMode, setCurrentMode] = useState<'coach' | 'heckler'>('coach');
  const [isPaused, setIsPaused] = useState(false);

  const audioPlayer = useAudioPlayerQueue();

  // Single WebSocket for bidirectional communication
  const ws = useWebSocket({
    url: WS_URL,
    autoConnect: true,

    onAudio: (audioBuffer: ArrayBuffer) => {
      // Convert ArrayBuffer to base64 for audio player
      const uint8Array = new Uint8Array(audioBuffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));
      audioPlayer.addAudio(base64);
    },

    onFeedback: (json: any) => {
      if (json.type === 'feedback') {
        // Add backchannel from metadata
        addBackchannel({
          type: json.text || 'feedback',
          timestamp: Date.now(),
          confidence: 1.0,
        });
      } else if (json.type === 'mode_change') {
        setCurrentMode(json.mode);
        console.log(`🎭 Mode switched to: ${json.mode}`);
      }
    },

    onOpen: () => {
      console.log('WebSocket connected');
      setConnected(true);
    },

    onClose: () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    },

    onError: (err) => {
      setError(err.message);
    },
  });

  // Microphone stream
  const microphone = useMicrophoneStream({
    onAudioChunk: (audioBuffer: ArrayBuffer, timestamp: number) => {
      if (isRecording && !isPaused && ws.isConnected) {
        ws.sendAudio(audioBuffer);
      }
    },

    onError: (err: Error) => {
      setError(err.message);
      stopRecording();
    },
  });

  const averageResponseTime = getAverageResponseTime();
  const backchannelsByType = getBackchannelsByType();

  // Session timer
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(() => {
      updateDuration(sessionDuration + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused, sessionDuration, updateDuration]);

  // Toggle microphone
  const handleToggleMic = async () => {
    if (!ws.isConnected) {
      setError('Please wait for server connection...');
      return;
    }

    // Stop session
    if (isRecording) {
      microphone.stopRecording();
      stopRecording();
      audioPlayer.clearQueue();
      setIsPaused(false);
      return;
    }

    // Start session
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());

      await microphone.startRecording();
      startRecording();
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setError('Microphone permission denied');
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleEndSession = () => {
    microphone.stopRecording();
    stopRecording();
    audioPlayer.clearQueue();
    setIsPaused(false);
  };

  const handleResetSession = () => {
    microphone.stopRecording();
    audioPlayer.clearQueue();
    resetSession();
    setIsPaused(false);
  };

  const handleExportData = () => {
    const data = {
      duration: sessionDuration,
      backchannels,
      mode: currentMode,
      stats: {
        total: backchannels.length,
        byType: backchannelsByType,
        avgResponseTime: averageResponseTime,
      },
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backchannel-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar showBackButton sessionActive={isRecording} />

      {/* Error Banner */}
      {error && (
        <div className="w-full bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
            <button
              onClick={() => setError(undefined)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="w-full bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-700">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-sm font-medium">Connecting to server...</span>
          </div>
        </div>
      )}

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Main Control Panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Microphone Control */}
            <div className="bg-white rounded-2xl shadow-sm border p-8 flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Practice Session</h2>
                <p className="text-gray-600">
                  Current mode: <span className="font-semibold capitalize text-indigo-600">{currentMode}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Say "switch to heckler" or "switch to coach" to change modes
                </p>
              </div>

              <div className="flex items-center gap-4">
                <MicToggleButton
                  isRecording={isRecording}
                  onToggle={handleToggleMic}
                  disabled={!!microphone.error}
                />

                {isRecording && (
                  <button
                    onClick={handlePauseToggle}
                    className="w-16 h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                    title={isPaused ? 'Resume Session' : 'Pause Session'}
                  >
                    {isPaused ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {isPaused && (
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Session Paused</span>
                </div>
              )}

              {microphone.error && (
                <div className="text-sm text-red-600 text-center">
                  {microphone.error.message}
                </div>
              )}
            </div>

            <AudioVisualizer
              isActive={isRecording && !isPaused}
              analyserNode={microphone.analyserNode}
            />

            <div className="mt-auto">
              <SessionControls
                sessionDuration={sessionDuration}
                isRecording={isRecording}
                onEndSession={handleEndSession}
                onResetSession={handleResetSession}
                onExportData={handleExportData}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <BackchannelIndicator lastBackchannel={lastBackchannel} />

            <StatsPanel
              totalBackchannels={backchannels.length}
              speakingTime={sessionDuration}
              averageResponseTime={averageResponseTime}
              backchannelsByType={backchannelsByType}
            />

            {/* Feedback History */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Feedback History</h3>
                {audioPlayer.isPlaying && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    Playing
                  </div>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {backchannels.length > 0 ? (
                  backchannels
                    .slice()
                    .reverse()
                    .map((bc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm"
                      >
                        <span className="text-lg">💬</span>
                        <span className="text-gray-700 font-medium">
                          {bc.type}
                        </span>
                        {bc.confidence && (
                          <span className="text-xs text-gray-400">
                            {Math.round(bc.confidence * 100)}%
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(bc.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">
                    No feedback yet. Start speaking to see responses!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}