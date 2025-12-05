'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play, Square, RotateCcw, Download, Mic, MicOff } from 'lucide-react';
import AudioVisualizer from '../components/AudioVisualizer';
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
  const [hasReloaded, setHasReloaded] = useState(false);

  /** Live transcript state */
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  /** Audio playback queue */
  const audioPlayer = useAudioPlayerQueue();

  /** Track WS connection with ref */
  const wsConnectedRef = useRef(false);

  // Auto-reload once on mount
  useEffect(() => {
    const reloaded = sessionStorage.getItem('hasReloaded');
    if (!reloaded) {
      sessionStorage.setItem('hasReloaded', 'true');
      window.location.reload();
    }
  }, []);

  /** WebSocket with stable callbacks using useRef */
  const onAudioCallback = useRef((audioBuffer: ArrayBuffer) => {
    console.log("🔊 Audio received, length:", audioBuffer.byteLength);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    audioPlayer.addAudio(base64);
  });

  const onTranscriptCallback = useRef((text: string, isFinal: boolean, sentiment?: string) => {
    console.log("🎤 Transcript:", text, "final?", isFinal, "sentiment:", sentiment);
    // Block transcripts when paused
    if (isPaused) {
      console.log("Session paused - blocking transcript");
      return;
    }
    if (!isFinal) {
      setTranscript(text);
    } else {
      setFinalTranscript((prev) => (prev + " " + text).trim());
      setTranscript("");
    }
  });

  const onFeedbackCallback = useRef((json: any) => {
    console.log("🎧 Feedback received:", json);
    // Block feedback when paused
    if (isPaused) {
      console.log("Session paused - blocking feedback");
      return;
    }
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
      // Block transcripts when paused
      if (isPaused) {
        console.log("Session paused - blocking transcript");
        return;
      }
      if (!isFinal) {
        setTranscript(text);
      } else {
        setFinalTranscript((prev) => (prev + " " + text).trim());
        setTranscript("");
      }
    };
  }, [isPaused]);

  useEffect(() => {
    onFeedbackCallback.current = (json: any) => {
      console.log("🎧 Feedback received:", json);
      // Block feedback when paused
      if (isPaused) {
        console.log("Session paused - blocking feedback");
        return;
      }
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
  }, [addBackchannel, isPaused]);

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
    setCurrentMode('coach');
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-screen bg-neutral-900 text-white font-light antialiased">
      {/* Background Effects - Lighter */}
      <div className="fixed inset-0 -z-50 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
      <div className="fixed inset-0 -z-40 bg-gradient-to-t from-black/40 via-transparent to-black/40 opacity-60" />
      
      {/* Animated Glow - More Visible */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl -z-30 animate-pulse" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/15 rounded-full blur-3xl -z-30 animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {microphone.isRecording && (
              <button className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-yellow-500/40 group-hover:scale-110 transition-all duration-300">
                  <span className="text-black font-black text-lg tracking-tighter">B</span>
                </div>
                <div className="absolute inset-0 rounded-lg bg-yellow-400 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
              </div>
              <span className="text-lg font-medium tracking-tight">Backchannel</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">Practice Session</div>
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-400 font-medium">Connected</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-red-500/10 border-b border-red-500/30 backdrop-blur-xl px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-red-400">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(undefined)} className="ml-auto text-red-400 hover:text-red-300">✕</button>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-yellow-500/10 border-b border-yellow-500/30 backdrop-blur-xl px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-400">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-sm font-medium">Connecting to server...</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shine {
          0% {
            left: -150%;
          }
          100% {
            left: 150%;
          }
        }
        .shine-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 150%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          animation: shine 3s infinite;
          transform: skewX(-20deg);
        }
      `}</style>

      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Hero Recording Panel - With Continuous Shine Effect */}
            <div className="shine-effect group relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-xl p-12 hover:border-yellow-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
              
              <div className="relative space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm font-medium backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                    </span>
                    {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Practice Session</h1>
                  <p className="text-gray-400 text-lg">Say "switch to heckler" or "switch to coach"</p>
                </div>

                {/* Mic Control */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={handleToggleMic}
                    className="relative group"
                  >
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                      microphone.isRecording 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-xl shadow-red-500/40 hover:shadow-red-500/60 scale-110' 
                        : 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-xl shadow-yellow-500/40 hover:shadow-yellow-500/60 hover:scale-110'
                    }`}>
                      {microphone.isRecording ? (
                        <MicOff className="w-10 h-10 text-white" />
                      ) : (
                        <Mic className="w-10 h-10 text-black" />
                      )}
                    </div>
                    <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-opacity ${
                      microphone.isRecording ? 'bg-red-500' : 'bg-yellow-400'
                    }`} />
                  </button>

                  {microphone.isRecording && (
                    <button
                      onClick={handlePauseToggle}
                      className="relative group"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/40 hover:shadow-yellow-500/60 flex items-center justify-center transition-all duration-300 hover:scale-110">
                        {isPaused ? <Play className="w-7 h-7 text-black" /> : <Pause className="w-7 h-7 text-black" />}
                      </div>
                    </button>
                  )}
                </div>

                {/* Status Indicators */}
                <div className="flex flex-col items-center gap-3">
                  {isPaused && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm backdrop-blur-sm">
                      Session Paused
                    </div>
                  )}
                  
                  {audioPlayer.isPlaying && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-sm backdrop-blur-sm">
                      <span className="animate-pulse">🔊</span>
                      Playing feedback ({audioPlayer.queueLength} in queue)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Transcript */}
            <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-xl p-8 hover:border-white/30 transition-all duration-300">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Live Transcript</h3>
              <p className="text-xl text-white leading-relaxed min-h-[60px]">
                {transcript || <span className="text-gray-500 italic">Listening...</span>}
              </p>
              {finalTranscript && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">History</span>
                  <p className="text-gray-400 mt-2 max-h-32 overflow-y-auto">{finalTranscript}</p>
                </div>
              )}
            </div>

            {/* Audio Visualizer */}
            <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-xl p-8 hover:border-white/30 transition-all duration-300">
              <AudioVisualizer
                isActive={microphone.isRecording && !isPaused}
                analyserNode={microphone.analyserNode}
              />
            </div>

            {/* Session Controls */}
            <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-xl p-8 hover:border-white/30 transition-all duration-300">
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-1">Session Duration</div>
                <div className="text-3xl font-bold text-white">{formatTime(sessionDuration)}</div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleEndSession}
                  disabled={!microphone.isRecording}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/20 hover:border-yellow-400/50 hover:bg-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  End
                </button>
                <button
                  onClick={handleResetSession}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/20 hover:border-yellow-400/50 hover:bg-yellow-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={handleExportData}
                  disabled={backchannels.length === 0}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold shadow-lg shadow-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Latest Backchannel */}
            {lastBackchannel && (
              <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-xl p-8 hover:border-white/30 transition-all duration-300">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Latest Feedback</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-2xl">💬</span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white capitalize">{lastBackchannel.type}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(lastBackchannel.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Panel */}
            <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-xl p-8 hover:border-white/30 transition-all duration-300">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Session Stats</h3>
              <div className="space-y-6">
                <div>
                  <div className="text-3xl font-bold text-white">{backchannels.length}</div>
                  <div className="text-sm text-gray-400 mt-1">Total Feedback</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{formatTime(sessionDuration)}</div>
                  <div className="text-sm text-gray-400 mt-1">Speaking Time</div>
                </div>
                {averageResponseTime > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-white">{averageResponseTime.toFixed(1)}s</div>
                    <div className="text-sm text-gray-400 mt-1">Avg Response Time</div>
                  </div>
                )}
                {Object.keys(backchannelsByType).length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-sm font-semibold text-gray-400 mb-3">Feedback Types</div>
                    <div className="space-y-2">
                      {Object.entries(backchannelsByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-gray-300 capitalize">{type}</span>
                          <span className="text-yellow-400 font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback History */}
            <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-xl p-8 max-h-96 overflow-y-auto hover:border-white/30 transition-all duration-300">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Feedback History</h3>
              {backchannels.length > 0 ? (
                <div className="space-y-3">
                  {backchannels.slice().reverse().map((bc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      <span className="text-xl">💬</span>
                      <span className="text-gray-300 font-medium capitalize flex-1">{bc.type}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(bc.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No feedback yet. Start speaking to receive feedback.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}