export interface WebSocketMessage {
  type: 'audio' | 'text' | 'video';
  data: string;
}

export interface StreamingState {
  isStreaming: boolean;
  aiResponseText: string;
}

export interface WebSocketHookReturn {
  webSocket: React.MutableRefObject<WebSocket | null>;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
}

export interface AudioContextRefs {
  userAudioContext: React.MutableRefObject<AudioContext | null>;
  userAudioProcessor: React.MutableRefObject<ScriptProcessorNode | null>;
  aiAudioContext: React.MutableRefObject<AudioContext | null>;
  aiAudioQueue: React.MutableRefObject<Int16Array[]>;
  isAiAudioPlaying: React.MutableRefObject<boolean>;
}