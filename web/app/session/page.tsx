'use client';

import { useEffect, useRef, useState } from 'react';
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
  /** Zustand store (ONLY for stats/UI metadata, NOT recording) */
  const {
    backchannels,
    sessionDuration,
    lastBackchannel,
    isConnected,
    error,
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

  /** Audio playback queue */
  const audioPlayer = useAudioPlayerQueue();

  /** Track WS connection with ref to avoid stale state */
  const wsConnectedRef = useRef(false);

  /** WebSocket hook */
  const ws = useWebSocket({
    url: WS_URL,
    autoConnect: true,

    onAudio: (audioBuffer: ArrayBuffer) => {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      audioPlayer.addAudio(base64);
    },

    onFeedback: (json) => {
      if (json.type === 'feedback') {
        addBackchannel({
          type: json.text || 'feedback',
          timestamp: Date.now(),
          confidence: 1.0,
        });
      }

      if (json.type === 'mode_change') {
        setCurrentMode(json.mode);
      }
    },

    onOpen: () => {
      wsConnectedRef.current = true;
      setConnected(true);
    },

    onClose: () => {
      wsConnectedRef.current = false;
      setConnected(false);
    },

    onError: (err) => setError(err.message),
  });

  /** Microphone hook — the REAL recording state */
  const microphone = useMicrophoneStream({
  onAudioChunk: (audioBuffer: ArrayBuffer) => {
    console.log("📦 SessionPage received chunk:", audioBuffer.byteLength, "bytes");
    console.log("🎙️ isRecording:", microphone.isRecording);
    console.log("⏸️ isPaused:", isPaused);
    console.log("🔌 wsConnected:", wsConnectedRef.current);
    
    if (!isPaused && wsConnectedRef.current) {
      console.log("✅ Calling ws.sendAudio()");
      ws.sendAudio(audioBuffer);
    } else {
      console.log("❌ NOT sending - conditions not met");
    }
  },
  onError: (err) => {
    setError(err.message);
    microphone.stopRecording();
  },
});

  /** Derived stats */
  const averageResponseTime = getAverageResponseTime();
  const backchannelsByType = getBackchannelsByType();

  /** Session Timer */
  useEffect(() => {
    if (!microphone.isRecording || isPaused) return;

    const interval = setInterval(() => {
      updateDuration(sessionDuration + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [microphone.isRecording, isPaused, sessionDuration, updateDuration]);

  /** Microphone toggle */
  const handleToggleMic = async () => {
    if (!wsConnectedRef.current) {
      setError('Please wait for server connection...');
      return;
    }

    if (microphone.isRecording) {
      microphone.stopRecording();
      audioPlayer.clearQueue();
      setIsPaused(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // only request permission

      await microphone.startRecording();
      resetSession();
    } catch (err) {
      setError('Microphone permission denied');
    }
  };

  const handlePauseToggle = () => setIsPaused((p) => !p);

  const handleEndSession = () => {
    microphone.stopRecording();
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
      <Navbar showBackButton sessionActive={microphone.isRecording} />

      {/* Error Banner */}
      {error && (
        <div className="w-full bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-red-700">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(undefined)} className="ml-auto text-red-600 hover:text-red-800">
              ✕
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

            {/* Microphone Panel */}
            <div className="bg-white rounded-2xl shadow-sm border p-8 flex flex-col items-center justify-center space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Practice Session</h2>
                <p className="text-gray-600">
                  Current mode: <span className="font-semibold capitalize text-indigo-600">{currentMode}</span>
                </p>
                <p className="text-sm text-gray-500">Say “switch to heckler” or “switch to coach”</p>
              </div>

              <div className="flex items-center gap-4">
                <MicToggleButton
                  isRecording={microphone.isRecording}
                  onToggle={handleToggleMic}
                  disabled={!!microphone.error}
                />

                {microphone.isRecording && (
                  <button
                    onClick={handlePauseToggle}
                    className="w-16 h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg"
                  >
                    {isPaused ? '▶' : '⏸'}
                  </button>
                )}
              </div>

              {isPaused && (
                <div className="text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg text-sm">
                  Session Paused
                </div>
              )}

              {microphone.error && (
                <div className="text-sm text-red-600 text-center">
                  {microphone.error.message}
                </div>
              )}
            </div>

            {/* Visualizer */}
            <AudioVisualizer
              isActive={microphone.isRecording && !isPaused}
              analyserNode={microphone.analyserNode}
            />

            <SessionControls
              sessionDuration={sessionDuration}
              isRecording={microphone.isRecording}
              onEndSession={handleEndSession}
              onResetSession={handleResetSession}
              onExportData={handleExportData}
            />
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
            <div className="bg-white rounded-2xl shadow-sm border p-6 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Feedback History</h3>

              {backchannels.length ? (
                backchannels.slice().reverse().map((bc, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                    <span className="text-lg">💬</span>
                    <span className="text-gray-700 font-medium">{bc.type}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(bc.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No feedback yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
