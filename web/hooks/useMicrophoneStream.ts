import { useState, useRef, useCallback, useEffect } from "react";
import { ERROR_MESSAGES } from "@/lib/constants";

interface UseMicrophoneStreamOptions {
  onAudioChunk?: (audioBuffer: ArrayBuffer, timestamp: number) => void; // UPDATED
  onError?: (err: Error) => void;
}

interface UseMicrophoneStreamReturn {
  isRecording: boolean;
  analyserNode?: AnalyserNode;
  error: Error | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useMicrophoneStream(options: UseMicrophoneStreamOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode>();

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /** FIX: tracking recording state without stale closures */
  const recordingRef = useRef(false);
  useEffect(() => {
    recordingRef.current = isRecording;
  }, [isRecording]);

  // Float32 → PCM16 converter
  const float32ToPCM16 = (float32: Float32Array) => {
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      let v = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    return pcm16;
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      await audioContextRef.current.resume();

      const audioContext = audioContextRef.current;
      // console.log("🎤 Sample Rate:", audioContext.sampleRate);

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.7;

      source.connect(analyser);
      setAnalyserNode(analyser);

      const processor = audioContext.createScriptProcessor(1024, 1, 1);
      processorRef.current = processor;

      /** Critical: connect processor so onaudioprocess fires */
      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
  if (!recordingRef.current) return;

  const input = event.inputBuffer.getChannelData(0);
  const pcm16 = float32ToPCM16(input);
  
  // console.log("🎤 About to call onAudioChunk");
  options.onAudioChunk?.(pcm16.buffer, Date.now());
  // console.log("✅ onAudioChunk called");
};

      setIsRecording(true);
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
