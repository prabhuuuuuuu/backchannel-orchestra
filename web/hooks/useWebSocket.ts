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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer"; // IMPORTANT

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      options.onOpen?.();
    };

    ws.onmessage = (evt) => {
      if (typeof evt.data === "string") {
        // JSON feedback
        try {
          const json = JSON.parse(evt.data);
          options.onFeedback?.(json);
        } catch (err) {
          console.error("WS JSON parse error:", err);
        }
      } else {
        // Binary audio
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
  }, [url, options]);

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
  const sendAudio = useCallback((audioBuffer: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioBuffer); // RAW BINARY
    }
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendAudio,
  };
}
