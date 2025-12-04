// web/hooks/useMicrophoneStream.ts
import { useState, useRef, useCallback, useEffect } from "react";
import { ERROR_MESSAGES } from "@/lib/constants";

interface UseMicrophoneStreamOptions {
  onAudioChunk?: (audioBuffer: ArrayBuffer, timestamp: number) => void;
  onError?: (err: Error) => void;
}

interface UseMicrophoneStreamReturn {
  isRecording: boolean;
  analyserNode?: AnalyserNode;
  error: Error | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useMicrophoneStream(options: UseMicrophoneStreamOptions = {}): UseMicrophoneStreamReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode>();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingRef = useRef(false);

  useEffect(() => {
    recordingRef.current = isRecording;
  }, [isRecording]);

  // Float32 → PCM16 converter
  const float32ToPCM16 = (float32: Float32Array): Int16Array => {
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      let v = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    return pcm16;
  };

  // 🔥 NEW: Downsample from 48kHz to 16kHz
  const downsampleTo16kHz = (buffer: Float32Array, originalRate: number): Float32Array => {
    if (originalRate === 16000) return buffer;
    
    const targetRate = 16000;
    const sampleRateRatio = originalRate / targetRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    
    let offsetResult = 0;
    let offsetBuffer = 0;
    
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      
      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    
    return result;
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // 🔥 Request 16kHz audio from browser (may be ignored, but try)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      streamRef.current = stream;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      await audioContextRef.current.resume();
      const audioContext = audioContextRef.current;
      
      console.log("🎤 Browser Sample Rate:", audioContext.sampleRate, "Hz");

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Analyser for visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      setAnalyserNode(analyser);

      // Use larger buffer size for better resampling quality
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
        if (!recordingRef.current) return;

        const input = event.inputBuffer.getChannelData(0); // Float32Array at 48kHz
        
        // 🔥 Downsample to 16kHz BEFORE converting to PCM16
        const downsampled = downsampleTo16kHz(input, audioContext.sampleRate);
        
        // Convert to PCM16
        const pcm16 = float32ToPCM16(downsampled);
        
        // Send to backend
        options.onAudioChunk?.(pcm16.buffer, Date.now());
      };

      setIsRecording(true);
      console.log("✅ Recording started with 16kHz resampling");

    } catch (err) {
      const e = err as Error;
      const micErr =
        e.name === "NotAllowedError" || e.name === "PermissionDeniedError"
          ? new Error(ERROR_MESSAGES.MIC_PERMISSION_DENIED)
          : e;
      setError(micErr);
      options.onError?.(micErr);
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setAnalyserNode(undefined);
    console.log("🛑 Recording stopped");
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, [stopRecording]);

  return {
    isRecording,
    error,
    analyserNode,
    startRecording,
    stopRecording,
  };
}
