import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions {
  url: string;
  autoConnect?: boolean;

  onAudio?: (audio: ArrayBuffer) => void;
  onTranscript?: (text: string, isFinal: boolean, sentiment?: string) => void;
  onFeedback?: (json: any) => void;

  onOpen?: () => void;
  onClose?: () => void;
  onError?: (e: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const { url, autoConnect = false } = options;

  const wsRef = useRef<WebSocket | null>(null);

  // 🔁 store latest callbacks to avoid stale closures
  const callbacksRef = useRef<UseWebSocketOptions>(options);
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // already connected
    }

    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      console.log("[WS] ✅ Connected to", url);
      setIsConnected(true);
      setError(null);
      callbacksRef.current.onOpen?.();
    };

    ws.onmessage = (evt) => {
      console.log("[WS] 🔔 Raw message:", evt.data, "typeof:", typeof evt.data);

      // TEXT FRAME (JSON)
      if (typeof evt.data === "string") {
        try {
          const json = JSON.parse(evt.data);
          console.log("[WS] 📩 Parsed JSON:", json);

          if (json.type === "transcript") {
            callbacksRef.current.onTranscript?.(
              json.text ?? "",
              json.is_final ?? false,
              json.sentiment
            );
            return;
          }

          if (json.type === "feedback" || json.type === "mode_change") {
            console.log("[WS] 🎯 Routing to onFeedback");
            callbacksRef.current.onFeedback?.(json);
            return;
          }

          console.warn("[WS] ⚠️ Unknown JSON type:", json.type, json);
        } catch (err) {
          console.error("[WS] ❌ JSON parse failed:", evt.data, err);
        }
        return;
      }

      // BINARY FRAME (audio)
      if (evt.data instanceof ArrayBuffer) {
        console.log("[WS] 🎧 Binary audio (ArrayBuffer)");
        callbacksRef.current.onAudio?.(evt.data);
        return;
      }

      // Occasionally you might get Blob (depending on env)
      if (evt.data instanceof Blob) {
        console.log("[WS] 🎧 Binary audio (Blob) – converting to ArrayBuffer");
        (evt.data as Blob).arrayBuffer().then((buffer) => {
          callbacksRef.current.onAudio?.(buffer);
        });
        return;
      }

      console.warn("[WS] ⚠️ Unhandled message format:", evt.data);
    };

    ws.onerror = () => {
      const err = new Error("WebSocket error");
      console.error("[WS] ❌ Error", err);
      setError(err);
      callbacksRef.current.onError?.(err);
    };

    ws.onclose = () => {
      console.log("[WS] 🚪 Closed");
      setIsConnected(false);
      callbacksRef.current.onClose?.();
    };

    wsRef.current = ws;
  }, [url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log("[WS] 🔌 Manual disconnect");
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  const sendAudio = useCallback((audioBuffer: ArrayBuffer) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(audioBuffer);
    } else {
      console.warn("[WS] ⚠️ Tried to send audio while WS not open");
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
