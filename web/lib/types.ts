// Backchannel event types
export interface BackchannelEvent {
  type: string;
  timestamp: number;
  confidence?: number;
}

// WebSocket message types
export interface IncomingAudioMessage {
  type: 'AUDIO';
  audioBase64: string;
  timestamp: number;
}

export interface BackchannelMessage {
  type: 'BACKCHANNEL';
  backchannel: string;
  timestamp: number;
  confidence?: number;
}

export interface StatusMessage {
  type: 'STATUS';
  status: 'connected' | 'disconnected' | 'error';
  message?: string;
}

export type WebSocketMessage = IncomingAudioMessage | BackchannelMessage | StatusMessage;

// Outgoing audio chunk
export interface OutgoingAudioChunk {
  type: 'AUDIO';
  audioBase64: string;
  timestamp: number;
  sampleRate: number;
}

// Session statistics
export interface SessionStats {
  totalBackchannels: number;
  backchannelsByType: Record<string, number>;
  sessionDuration: number;
  averageResponseTime: number;
  speakingTime: number;
}

// Session store state
export interface SessionState {
  isRecording: boolean;
  backchannels: BackchannelEvent[];
  sessionDuration: number;
  lastBackchannel?: BackchannelEvent;
  backchannelCount: number;
  isConnected: boolean;
  error?: string;
}

// Audio configuration
export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

// WebSocket configuration
export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
}

// Audio player queue item
export interface AudioQueueItem {
  id: string;
  audioBuffer: AudioBuffer;
  timestamp: number;
  priority?: number;
}