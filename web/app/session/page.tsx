'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  /** Zustand store */
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

  /** Live transcript state */
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  /** Audio playback queue */
  const audioPlayer = useAudioPlayerQueue();

  /** Track WS connection with ref */
  const wsConnectedRef = useRef(false);

  /** WebSocket with stable callbacks using useRef */
  const onAudioCallback = useRef((audioBuffer: ArrayBuffer) => {
    console.log("🔊 Audio received, length:", audioBuffer.byteLength);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    audioPlayer.addAudio(base64);
  });

  const onTranscriptCallback = useRef((text: string, isFinal: boolean, sentiment?: string) => {
    console.log("🎤 Transcript:", text, "final?", isFinal, "sentiment:", sentiment);

    if (!isFinal) {
      setTranscript(text);
    } else {
      setFinalTranscript((prev) => (prev + " " + text).trim());
      setTranscript("");
    }
  });

  const onFeedbackCallback = useRef((json: any) => {
    console.log("🎧 Feedback received:", json);

    if (json.type === "feedback") {
      console.log("Adding backchannel:", json.text);
      addBackchannel({
        type: json.text || "feedback",
        timestamp: Date.now(),
        confidence: json.confidence || 1.0,
      });
    }

    if (json.type === "mode_change") {
      console.log("Mode change to:", json.mode);
      setCurrentMode(json.mode);
    }
  });

  const ws = useWebSocket({
  url: WS_URL,
  autoConnect: true,

  onAudio: (audioBuffer) => {
    onAudioCallback.current?.(audioBuffer);
  },
  onTranscript: (text, isFinal, sentiment) => {
    onTranscriptCallback.current?.(text, isFinal, sentiment);
  },
  onFeedback: (json) => {
    console.log("[UI] 📨 onFeedback received:", json);
    onFeedbackCallback.current?.(json);
  },

  onOpen: () => {
    console.log("✅ WebSocket connected");
    wsConnectedRef.current = true;
    setConnected(true);
  },

  onClose: () => {
    console.log("❌ WebSocket disconnected");
    wsConnectedRef.current = false;
    setConnected(false);
  },

  onError: (err) => {
    console.error("⚠️ WebSocket error:", err);
    setError(err.message);
  },
});



  /** Update callbacks when dependencies change */
  useEffect(() => {
    onAudioCallback.current = (audioBuffer: ArrayBuffer) => {
      console.log("🔊 Audio received, length:", audioBuffer.byteLength);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      audioPlayer.addAudio(base64);
    };
  }, [audioPlayer]);

  useEffect(() => {
    onTranscriptCallback.current = (text: string, isFinal: boolean, sentiment?: string) => {
      console.log("🎤 Transcript:", text, "final?", isFinal, "sentiment:", sentiment);

      if (!isFinal) {
        setTranscript(text);
      } else {
        setFinalTranscript((prev) => (prev + " " + text).trim());
        setTranscript("");
      }
    };
  }, []);

  useEffect(() => {
    onFeedbackCallback.current = (json: any) => {
      console.log("🎧 Feedback received:", json);

      if (json.type === "feedback") {
        console.log("Adding backchannel:", json.text);
        addBackchannel({
          type: json.text || "feedback",
          timestamp: Date.now(),
          confidence: json.confidence || 1.0,
        });
      }

      if (json.type === "mode_change") {
        console.log("Mode change to:", json.mode);
        setCurrentMode(json.mode);
      }
    };
  }, [addBackchannel]);

  /** Microphone */
  const microphone = useMicrophoneStream({
    onAudioChunk: (audioBuffer: ArrayBuffer) => {
      if (!isPaused && wsConnectedRef.current) {
        ws.sendAudio(audioBuffer);
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

  /** Timer */
  useEffect(() => {
    if (!microphone.isRecording || isPaused) return;

    const interval = setInterval(() => {
      updateDuration(sessionDuration + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [microphone.isRecording, isPaused, sessionDuration, updateDuration]);

  /** Controls */
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
      stream.getTracks().forEach(t => t.stop());

      await microphone.startRecording();
      resetSession();
      setTranscript("");
      setFinalTranscript("");
    } catch {
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
    setTranscript("");
    setFinalTranscript("");
    setCurrentMode('coach'); // Reset mode to default
  };

  const handleExportData = () => {
    const data = {
      duration: sessionDuration,
      backchannels,
      mode: currentMode,
      transcript: finalTranscript,
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
      <Navbar showBackButton={microphone.isRecording} />

      {/* Error Banner */}
      {error && (
        <div className="w-full bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-red-700">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(undefined)} className="ml-auto text-red-600 hover:text-red-800">✕</button>
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

          {/* Main */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Mic Panel */}
            <div className="bg-white rounded-2xl shadow-sm border p-8 flex flex-col items-center space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Practice Session</h2>
                <p className="text-gray-600">
                  Current mode: <span className="font-semibold text-indigo-600 capitalize">{currentMode}</span>
                </p>
                <p className="text-sm text-gray-500">Say "switch to heckler" or "switch to coach"</p>
              </div>

              <div className="flex items-center gap-4">
                <MicToggleButton
                  isRecording={microphone.isRecording}
                  onToggle={handleToggleMic}
                />

                {microphone.isRecording && (
                  <button
                    onClick={handlePauseToggle}
                    className="w-16 h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg transition-colors"
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

              {/* Audio player status */}
              {audioPlayer.isPlaying && (
                <div className="text-green-600 bg-green-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <span className="animate-pulse">🔊</span>
                  Playing feedback ({audioPlayer.queueLength} in queue)
                </div>
              )}
            </div>

            {/* Live Transcript Panel */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Live Transcript</h3>

              <p className="text-gray-800 text-lg min-h-[40px]">
                {transcript || <span className="text-gray-400 italic">Listening...</span>}
              </p>

              {finalTranscript && (
                <div className="text-gray-500 text-sm mt-3 max-h-32 overflow-y-auto">
                  <span className="font-semibold">History:</span> {finalTranscript}
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

              {backchannels.length > 0 ? (
                <div className="space-y-2">
                  {backchannels.slice().reverse().map((bc, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                      <span className="text-lg">💬</span>
                      <span className="text-gray-700 font-medium">{bc.type}</span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(bc.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
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