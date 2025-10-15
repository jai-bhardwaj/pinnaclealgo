// WebSocket Service for Real-time Trading Updates
// Handles real-time events from the trading backend

interface WebSocketEvent {
  type: string;
  data: any;
}

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

type EventHandler<T = any> = (data: T) => void;

class TradingWebSocketService {
  private config: WebSocketConfig;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  // Event listeners organized by event type
  private eventHandlers = new Map<string, Set<EventHandler>>();

  // Connection state listeners
  private connectionHandlers = {
    onConnect: new Set<EventHandler>(),
    onDisconnect: new Set<EventHandler>(),
    onError: new Set<EventHandler>(),
    onReconnecting: new Set<EventHandler>(),
  };

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000, // 5 seconds
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000, // 30 seconds
      ...config,
    };
  }

  // === CONNECTION MANAGEMENT ===

  connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const onConnect = () => {
          this.off("connect", onConnect);
          resolve();
        };
        this.on("connect", onConnect);
      });
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.config.url);

        this.socket.onopen = () => {
          console.log("🔌 WebSocket connected to trading backend");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.notifyConnectionHandlers("onConnect");
          resolve();
        };

        this.socket.onclose = (event) => {
          console.log("🔌 WebSocket disconnected:", event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.notifyConnectionHandlers("onDisconnect", {
            code: event.code,
            reason: event.reason,
          });

          if (
            this.shouldReconnect &&
            this.reconnectAttempts < this.config.maxReconnectAttempts!
          ) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error("🔌 WebSocket error:", error);
          this.notifyConnectionHandlers("onError", error);
          if (this.isConnecting) {
            reject(error);
          }
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(
      `🔄 Reconnecting to WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`
    );
    this.notifyConnectionHandlers("onReconnecting", {
      attempt: this.reconnectAttempts,
      delay,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    if (!this.config.heartbeatInterval) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ type: "ping" });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // === MESSAGE HANDLING ===

  private handleMessage(data: string): void {
    try {
      const parsedData = JSON.parse(data);

      // Handle pong responses
      if (parsedData.type === "pong") {
        return;
      }

      // Type guard for WebSocket events
      const event = parsedData as WebSocketEvent;

      // Notify specific event listeners
      const handlers = this.eventHandlers.get(event.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(event.data);
          } catch (error) {
            console.error(`Error in ${event.type} handler:`, error);
          }
        });
      }

      // Notify general event listeners
      const allHandlers = this.eventHandlers.get("*");
      if (allHandlers) {
        allHandlers.forEach((handler) => {
          try {
            handler(event);
          } catch (error) {
            console.error("Error in general event handler:", error);
          }
        });
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error, data);
    }
  }

  private send(data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  // === EVENT LISTENERS ===

  on(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  off(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    }
  }

  // === CONNECTION STATE LISTENERS ===

  onConnect(handler: EventHandler): () => void {
    this.connectionHandlers.onConnect.add(handler);
    return () => this.connectionHandlers.onConnect.delete(handler);
  }

  onDisconnect(handler: EventHandler): () => void {
    this.connectionHandlers.onDisconnect.add(handler);
    return () => this.connectionHandlers.onDisconnect.delete(handler);
  }

  onError(handler: EventHandler): () => void {
    this.connectionHandlers.onError.add(handler);
    return () => this.connectionHandlers.onError.delete(handler);
  }

  onReconnecting(handler: EventHandler): () => void {
    this.connectionHandlers.onReconnecting.add(handler);
    return () => this.connectionHandlers.onReconnecting.delete(handler);
  }

  private notifyConnectionHandlers(
    type: keyof typeof this.connectionHandlers,
    data?: any
  ): void {
    this.connectionHandlers[type].forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${type} handler:`, error);
      }
    });
  }

  // === UTILITY METHODS ===

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.socket) return "CLOSED";

    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "OPEN";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }

  // === CONVENIENCE METHODS FOR TRADING EVENTS ===

  onOrderUpdate(handler: EventHandler): () => void {
    this.on("order_update", handler);
    return () => this.off("order_update", handler);
  }

  onPositionUpdate(handler: EventHandler): () => void {
    this.on("position_update", handler);
    return () => this.off("position_update", handler);
  }

  onStrategyUpdate(handler: EventHandler): () => void {
    this.on("strategy_update", handler);
    return () => this.off("strategy_update", handler);
  }

  onTradeUpdate(handler: EventHandler): () => void {
    this.on("trade_update", handler);
    return () => this.off("trade_update", handler);
  }
}

// Create singleton instance
const wsConfig: WebSocketConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws",
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
};

export const tradingWebSocket = new TradingWebSocketService(wsConfig);

// Export types and class
export type { WebSocketConfig, EventHandler };
export { TradingWebSocketService };
