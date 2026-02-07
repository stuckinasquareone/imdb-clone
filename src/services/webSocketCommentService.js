/**
 * WebSocket Comment Service
 * Manages real-time comment synchronization across clients with optimistic updates
 * Handles connection lifecycle, message routing, and error recovery
 */

class WebSocketCommentService {
  constructor() {
    this.ws = null;
    this.url = null;
    this.listeners = new Map();
    this.messageQueue = [];
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageId = 0;
    this.pendingMessages = new Map();
    this.isAutoReconnect = false;
  }

  /**
   * Initialize WebSocket connection
   * @param {string} url - WebSocket server URL
   * @param {object} options - Connection options
   */
  connect(url, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        this.url = url;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected to comment server');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.isAutoReconnect = false;

          // Flush pending messages
          this.flushMessageQueue();

          // Emit connection event
          this.emit('connect', { timestamp: Date.now() });
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.emit('error', { error, timestamp: Date.now() });
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected from comment server');
          this.connected = false;
          this.emit('disconnect', { timestamp: Date.now() });

          // Auto-reconnect if enabled
          if (options.autoReconnect !== false) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket message
   * @param {string} data - Raw message data
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      const { type, id, payload, error } = message;

      // Handle acknowledged messages (responses to sent messages)
      if (id && this.pendingMessages.has(id)) {
        const pending = this.pendingMessages.get(id);
        this.pendingMessages.delete(id);

        if (error) {
          // Server rejected the message - trigger rollback
          pending.onRejected?.(error);
          this.emit('message:rejected', { messageId: id, error, payload: pending.payload });
        } else {
          // Server confirmed the message
          pending.onConfirmed?.(payload);
          this.emit('message:confirmed', { messageId: id, payload });
        }
      }

      // Route message to appropriate listeners
      this.emit(type, { ...message, receivedAt: Date.now() });
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Send a message with tracking and acknowledgment
   * @param {string} type - Message type
   * @param {object} payload - Message payload
   * @param {object} handlers - Optional { onConfirmed, onRejected } callbacks
   */
  send(type, payload, handlers = {}) {
    const messageId = ++this.messageId;
    const message = {
      id: messageId,
      type,
      payload,
      sentAt: Date.now()
    };

    // Track pending message for acknowledgment
    this.pendingMessages.set(messageId, {
      ...message,
      onConfirmed: handlers.onConfirmed,
      onRejected: handlers.onRejected
    });

    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message if not connected
      this.messageQueue.push(message);
    }

    return messageId;
  }

  /**
   * Flush queued messages once connection is established
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Subscribe to message type
   * @param {string} type - Message type to listen for
   * @param {function} callback - Handler function
   */
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit event to all listeners
   * @param {string} type - Event type
   * @param {object} data - Event data
   */
  emit(type, data) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error in listener for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnect attempts reached');
      this.emit('reconnect:failed', { attempts: this.reconnectAttempts });
      return;
    }

    this.isAutoReconnect = true;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.emit('reconnect:scheduled', { delayMs: delay, attempt: this.reconnectAttempts });

    setTimeout(() => {
      if (!this.connected && this.url) {
        this.connect(this.url, { autoReconnect: true }).catch(error => {
          console.error('[WebSocket] Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get number of pending confirmations
   */
  getPendingMessageCount() {
    return this.pendingMessages.size;
  }
}

// Singleton instance
const webSocketCommentService = new WebSocketCommentService();

export default webSocketCommentService;
