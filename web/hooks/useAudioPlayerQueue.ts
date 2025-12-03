import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  createAudioContext, 
  base64ToArrayBuffer, 
  decodeAudioData,
  playAudioBuffer 
} from '@/lib/audio';
import { AudioQueueItem } from '@/lib/types';
import { PLAYBACK_CONFIG } from '@/lib/constants';

interface UseAudioPlayerQueueReturn {
  isPlaying: boolean;
  queueLength: number;
  addAudio: (audioBase64: string) => Promise<void>;
  clearQueue: () => void;
  pause: () => void;
  resume: () => void;
}

export function useAudioPlayerQueue(): UseAudioPlayerQueueReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [queueLength, setQueueLength] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<AudioQueueItem[]>([]);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isProcessingRef = useRef(false);

  /**
   * Initialize audio context
   */
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }
    return audioContextRef.current;
  }, []);

  /**
   * Process next item in queue
   */
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      setIsPlaying(false);
      return;
    }

    isProcessingRef.current = true;
    setIsPlaying(true);

    const item = queueRef.current.shift();
    if (!item) {
      isProcessingRef.current = false;
      setIsPlaying(false);
      return;
    }

    setQueueLength(queueRef.current.length);

    try {
      const audioContext = getAudioContext();

      // Play audio buffer
      currentSourceRef.current = playAudioBuffer(
        audioContext,
        item.audioBuffer,
        () => {
          currentSourceRef.current = null;
          isProcessingRef.current = false;
          processQueue(); // Process next item
        }
      );
    } catch (error) {
      console.error('Error playing audio:', error);
      isProcessingRef.current = false;
      processQueue(); // Try next item
    }
  }, [getAudioContext]);

  /**
   * Add audio to queue
   */
  const addAudio = useCallback(async (audioBase64: string) => {
    try {
      const audioContext = getAudioContext();

      // Convert base64 to ArrayBuffer
      const arrayBuffer = base64ToArrayBuffer(audioBase64);

      // Decode audio data
      const audioBuffer = await decodeAudioData(audioContext, arrayBuffer);

      // Create queue item
      const queueItem: AudioQueueItem = {
        id: `${Date.now()}-${Math.random()}`,
        audioBuffer,
        timestamp: Date.now(),
      };

      // Add to queue
      queueRef.current.push(queueItem);
      setQueueLength(queueRef.current.length);

      // Limit queue size
      if (queueRef.current.length > PLAYBACK_CONFIG.MAX_QUEUE_SIZE) {
        queueRef.current.shift(); // Remove oldest
        setQueueLength(queueRef.current.length);
      }

      // Start processing if not already
      if (!isProcessingRef.current) {
        processQueue();
      }
    } catch (error) {
      console.error('Error adding audio to queue:', error);
    }
  }, [getAudioContext, processQueue]);

  /**
   * Clear queue
   */
  const clearQueue = useCallback(() => {
    // Stop current playback
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (err) {
        // Ignore if already stopped
      }
      currentSourceRef.current = null;
    }

    // Clear queue
    queueRef.current = [];
    setQueueLength(0);
    isProcessingRef.current = false;
    setIsPlaying(false);
  }, []);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    const audioContext = getAudioContext();
    if (audioContext.state === 'running') {
      audioContext.suspend();
    }
  }, [getAudioContext]);

  /**
   * Resume playback
   */
  const resume = useCallback(() => {
    const audioContext = getAudioContext();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }, [getAudioContext]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearQueue();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [clearQueue]);

  return {
    isPlaying,
    queueLength,
    addAudio,
    clearQueue,
    pause,
    resume,
  };
}