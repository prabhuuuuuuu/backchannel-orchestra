// WebSocket URLs
export const WS_AUDIO_IN_URL = process.env.NEXT_PUBLIC_WS_AUDIO_IN || 'ws://localhost:8000/audio-in';
export const WS_AUDIO_OUT_URL = process.env.NEXT_PUBLIC_WS_AUDIO_OUT || 'ws://localhost:8000/audio-out';

// API Base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

// Audio configuration
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000, // 16kHz for speech
  CHANNEL_COUNT: 1, // Mono
  BIT_DEPTH: 16,
  CHUNK_SIZE_MS: 250, // 250ms chunks
  BUFFER_SIZE: 4096,
} as const;

// MediaRecorder settings
export const MEDIA_RECORDER_CONFIG = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 16000,
} as const;

// WebSocket configuration
export const WEBSOCKET_CONFIG = {
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000, // 2 seconds
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const;

// Audio playback configuration
export const PLAYBACK_CONFIG = {
  MAX_QUEUE_SIZE: 10,
  LATENCY_TARGET_MS: 100,
  CROSSFADE_DURATION_MS: 10,
} as const;

// Backchannel types
export const BACKCHANNEL_TYPES = [
  'mm-hmm',
  'yeah',
  'right',
  'okay',
  'uh-huh',
  'i-see',
  'interesting',
  'wow',
  'really',
  'sure',
] as const;

// Session defaults
export const SESSION_DEFAULTS = {
  MAX_DURATION: 3600, // 1 hour in seconds
  STATS_UPDATE_INTERVAL: 1000, // Update stats every second
  AUTO_STOP_SILENCE_MS: 300000, // Auto-stop after 5 minutes of silence
} as const;

// Error messages
export const ERROR_MESSAGES = {
  MIC_PERMISSION_DENIED: 'Microphone access denied. Please enable microphone permissions.',
  MIC_NOT_FOUND: 'No microphone found. Please connect a microphone.',
  WEBSOCKET_CONNECTION_FAILED: 'Failed to connect to server. Please check your connection.',
  WEBSOCKET_DISCONNECTED: 'Connection lost. Attempting to reconnect...',
  AUDIO_PLAYBACK_FAILED: 'Failed to play audio. Please check your audio output.',
  UNSUPPORTED_BROWSER: 'Your browser does not support the required audio features.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  MIC_CONNECTED: 'Microphone connected successfully',
  WEBSOCKET_CONNECTED: 'Connected to server',
  SESSION_STARTED: 'Session started',
  SESSION_ENDED: 'Session ended',
} as const;