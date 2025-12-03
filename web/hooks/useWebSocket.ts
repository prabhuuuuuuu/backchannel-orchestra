import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions {
  url: string;
  autoConnect?: boolean;
  onAudio?: (audio: ArrayBuffer) => void;      // ← binary audio from backend
  onFeedback?: (json: any) => void;            // ← JSON metadata from backend
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (e: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const { url, autoConnect } = options;

  const wsRef = useRef<WebSocket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(() => {
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  ws.onopen = () => {
    setIsConnected(true);
    setError(null);
    options.onOpen?.();
  };

  ws.onmessage = (evt) => {
    if (typeof evt.data === "string") {
      try {
        options.onFeedback?.(JSON.parse(evt.data));
      } catch {}
    } else {
      options.onAudio?.(evt.data);
    }
  };

  ws.onerror = () => {
    const err = new Error("WebSocket error");
    setError(err);
    options.onError?.(err);
  };

  ws.onclose = () => {
    setIsConnected(false);
    options.onClose?.();
  };

  wsRef.current = ws;
}, [url]);   // 🔥 REMOVE "options"


  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
  }, [autoConnect]);

  /** SEND RAW PCM BYTES */
  const sendAudio = useCallback(
  (audioBuffer: ArrayBuffer) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log("Sending chunk:", audioBuffer.byteLength, "bytes");
      const view = new Int16Array(audioBuffer);
      console.log("Chunk preview:", view.slice(0, 10));
      ws.send(audioBuffer);
    }
  },
  []  // allowed since we read .current each call
);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendAudio,
  };
}
