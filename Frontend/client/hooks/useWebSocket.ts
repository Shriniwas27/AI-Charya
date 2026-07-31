// src/hooks/useWebSocket.ts
import { useRef, useCallback } from 'react';
import { WebSocketMessage } from '../types';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

if (!WEBSOCKET_URL) {
  console.error('❌ VITE_WEBSOCKET_URL environment variable is not set!');
  throw new Error('WebSocket URL is required');
}

console.log('🔗 WebSocket URL configured:', WEBSOCKET_URL);

export const useWebSocket = (
  onMessage: (message: WebSocketMessage) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void
) => {
  const webSocket = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (webSocket.current?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    console.log('🔌 Attempting to connect to:', WEBSOCKET_URL);
    webSocket.current = new WebSocket(WEBSOCKET_URL);

    webSocket.current.onopen = () => {
      console.log('✅ WebSocket connection established.');
      onOpen?.();
    };

    webSocket.current.onmessage = (event: MessageEvent) => {
      console.log('📨 Received message:', event.data);
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 Parsed message:', message.type);
        onMessage(message);
      } catch (error) {
        console.error('❌ Failed to parse message:', error, event.data);
      }
    };

    webSocket.current.onclose = (event: CloseEvent) => {
      console.log('❌ WebSocket closed:', event.code, event.reason);
      onClose?.();
    };

    webSocket.current.onerror = (error: Event) => {
      console.error('⚠️ WebSocket Error:', error);
      onError?.(error);
    };
  }, [onMessage, onOpen, onClose, onError]);

  const disconnect = useCallback(() => {
    if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
      console.log('🔌 Disconnecting WebSocket');
      webSocket.current.close();
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    console.log('📤 Attempting to send:', message.type, 'Size:', message.data?.length);
    
    if (webSocket.current?.readyState === WebSocket.OPEN) {
      try {
        webSocket.current.send(JSON.stringify(message));
        console.log('✅ Message sent successfully:', message.type);
      } catch (error) {
        console.error('❌ Error sending message:', error);
      }
    } else {
      console.error('❌ WebSocket not open. State:', webSocket.current?.readyState);
      console.error('WebSocket states: CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3');
    }
  }, []);

  return {
    webSocket,
    connect,
    disconnect,
    sendMessage
  };
};
