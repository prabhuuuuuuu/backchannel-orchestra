import { AUDIO_CONFIG } from './constants';

/**
 * Create and configure an AudioContext
 */
export function createAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  
  if (!AudioContextClass) {
    throw new Error('AudioContext is not supported in this browser');
  }
  
  return new AudioContextClass({
    sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
    latencyHint: 'interactive',
  });
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

/**
 * Decode audio data from ArrayBuffer to AudioBuffer
 */
export async function decodeAudioData(
  audioContext: AudioContext,
  arrayBuffer: ArrayBuffer
): Promise<AudioBuffer> {
  try {
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error('Error decoding audio data:', error);
    throw new Error('Failed to decode audio data');
  }
}

/**
 * Play an AudioBuffer
 */
export function playAudioBuffer(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  onEnded?: () => void
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  
  if (onEnded) {
    source.onended = onEnded;
  }
  
  source.start(0);
  return source;
}

/**
 * Create an AnalyserNode for audio visualization
 */
export function createAnalyser(audioContext: AudioContext): AnalyserNode {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  return analyser;
}

/**
 * Get microphone stream with constraints
 */
export async function getMicrophoneStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
        channelCount: AUDIO_CONFIG.CHANNEL_COUNT,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    
    return stream;
  } catch (error) {
    console.error('Error accessing microphone:', error);
    throw error;
  }
}

/**
 * Convert Blob to ArrayBuffer
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Resample audio buffer to target sample rate
 */
export function resampleAudioBuffer(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  targetSampleRate: number
): AudioBuffer {
  if (audioBuffer.sampleRate === targetSampleRate) {
    return audioBuffer;
  }
  
  const ratio = targetSampleRate / audioBuffer.sampleRate;
  const newLength = Math.round(audioBuffer.length * ratio);
  const newBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    newLength,
    targetSampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = newBuffer.getChannelData(channel);
    
    for (let i = 0; i < newLength; i++) {
      const position = i / ratio;
      const index = Math.floor(position);
      const fraction = position - index;
      
      if (index + 1 < inputData.length) {
        outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
      } else {
        outputData[i] = inputData[index];
      }
    }
  }
  
  return newBuffer;
}

/**
 * Calculate audio level (RMS) from audio buffer
 */
export function calculateAudioLevel(audioBuffer: AudioBuffer): number {
  const channelData = audioBuffer.getChannelData(0);
  let sum = 0;
  
  for (let i = 0; i < channelData.length; i++) {
    sum += channelData[i] * channelData[i];
  }
  
  const rms = Math.sqrt(sum / channelData.length);
  return rms;
}

/**
 * Check if browser supports required audio features
 */
export function checkAudioSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!navigator.mediaDevices?.getUserMedia) {
    missing.push('getUserMedia');
  }
  
  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    missing.push('AudioContext');
  }
  
  if (!window.MediaRecorder) {
    missing.push('MediaRecorder');
  }
  
  return {
    supported: missing.length === 0,
    missing,
  };
}