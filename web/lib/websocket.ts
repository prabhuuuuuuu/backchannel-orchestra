import { WEBSOCKET_CONFIG } from "./constants";

export type MessageHandler = (data: ArrayBuffer | any) => void;
export type ErrorHandler = (err: Event) => void;
export type CloseHandler = (event: CloseEvent) => void;
export type OpenHandler = (event: Event) => void;

interface WebSocketManagerOptions {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onOpen?: OpenHandler;
  onMessage?: MessageHandler;
  onError?: ErrorHandler;
  onClose?: CloseHandler;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;

  private reconnectAttempts: number;
  private reconnectDelay: number;

  private currentReconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualClose = false;

  private onOpenHandler?: OpenHandler;
  private onMessageHandler?: MessageHandler;
  private onErrorHandler?: ErrorHandler;
  private onCloseHandler?: CloseHandler;

  constructor(options: WebSocketManagerOptions) {
    this.url = options.url;

    this.reconnectAttempts =
      options.reconnectAttempts ?? WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS;

    this.reconnectDelay =
      options.reconnectDelay ?? WEBSOCKET_CONFIG.RECONNECT_DELAY;

    this.onOpenHandler = options.onOpen;
    this.onMessageHandler = options.onMessage;
    this.onErrorHandler = options.onError;
    this.onCloseHandler = options.onClose;
  }

  connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = "arraybuffer"; // 🔥 critical for audio

      this.ws.onopen = (event) => {
        console.log("WS connected:", this.url);
        this.currentReconnectAttempt = 0;
        this.onOpenHandler?.(event);
      };

      this.ws.onmessage = (event) => {
        const { data } = event;

        // 🔥 AUTO-DETECT BINARY VS JSON
        if (typeof data === "string") {
          try {
            const json = JSON.parse(data);
            this.onMessageHandler?.(json);
          } catch (err) {
            console.error("Bad JSON:", err);
          }
        } else {
          // binary audio (ArrayBuffer)
          this.onMessageHandler?.(data);
        }
      };

      this.ws.onerror = (err) => {
        console.error("WS error:", err);
        this.onErrorHandler?.(err);
      };

      this.ws.onclose = (event) => {
        console.warn("WS closed:", event.code, event.reason);
        this.ws = null;
        this.onCloseHandler?.(event);

        if (!this.isManualClose) this.scheduleReconnect();
      };
    } catch (err) {
      console.error("WS creation failed:", err);
      this.scheduleReconnect();
    }
  }

  send(data: ArrayBuffer) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data); // RAW BINARY ONLY
    }
  }

  close(): void {
    this.isManualClose = true;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect() {
    if (this.currentReconnectAttempt >= this.reconnectAttempts) {
      console.error("WS max reconnect attempts reached.");
      return;
    }

    this.currentReconnectAttempt++;
    const delay = this.reconnectDelay * this.currentReconnectAttempt;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

export function createWebSocket(
  options: WebSocketManagerOptions
): WebSocketManager {
  return new WebSocketManager(options);
}
