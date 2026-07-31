// src/components/checker/ChatBox.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send } from 'lucide-react';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
const AI_SAMPLE_RATE = 24000; // Same as working code

type Author = 'ai' | 'user';

interface Message {
  from: Author;
  text: string;
}

interface SessionDetails {
  subject?: string;
  chapter?: string;
  name?: string;
  roll?: string;
  mode?: string;
  totalScored?: number | null;
  grade?: string;
}

interface ChatBotProps {
  isActive: boolean;
  initialMessages?: Message[];
  sessionDetails :SessionDetails;
}

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="p-3 rounded-xl bg-blue-100 text-blue-900">
      <div className="flex items-center justify-center space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

const ChatBot: React.FC<ChatBotProps> = ({
  isActive,
  initialMessages = [],
  sessionDetails,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Audio processing refs - ADDED for audio playback
  const aiAudioContext = useRef<AudioContext | null>(null);
  const aiAudioQueue = useRef<Int16Array[]>([]);
  const isAiAudioPlaying = useRef<boolean>(false);

  // Scroll to bottom when new stuff arrives
  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight });
  }, [messages, isTyping]);

  // Audio processing functions - ADDED from working code
  const handleAiAudio = (base64Data: string): void => {
    console.log('🔊 Processing AI audio data:', base64Data.length, 'chars');
    
    const rawAudio = atob(base64Data);
    const rawLength = rawAudio.length;
    const array = new Uint8Array(new ArrayBuffer(rawLength));
    
    for (let i = 0; i < rawLength; i++) {
      array[i] = rawAudio.charCodeAt(i);
    }
    
    const pcmData = new Int16Array(array.buffer);
    aiAudioQueue.current.push(pcmData);
    
    if (!isAiAudioPlaying.current) {
      playNextAiAudioChunk();
    }
  };

  const playNextAiAudioChunk = async (): Promise<void> => {
    if (aiAudioQueue.current.length === 0) {
      isAiAudioPlaying.current = false;
      return;
    }
    
    isAiAudioPlaying.current = true;
    const pcmData = aiAudioQueue.current.shift();
    
    if (!pcmData || !aiAudioContext.current) return;
    
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 32768.0; // Convert Int16 to Float32
    }

    const audioBuffer = aiAudioContext.current.createBuffer(1, float32Data.length, AI_SAMPLE_RATE);
    audioBuffer.copyToChannel(float32Data, 0);

    const source = aiAudioContext.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(aiAudioContext.current.destination);
    source.onended = playNextAiAudioChunk; // Chain the next chunk
    source.start();
    
    console.log('🔊 Playing audio chunk');
  };

  const dynamicURL = useMemo(() => {
  if (!sessionDetails?.roll || !sessionDetails?.grade || !sessionDetails?.subject || !sessionDetails?.chapter) {
    return null;
  }
  return `${WEBSOCKET_URL}/${encodeURIComponent(sessionDetails.roll)}/${encodeURIComponent(sessionDetails.grade)}/${encodeURIComponent(sessionDetails.subject)}/${encodeURIComponent(sessionDetails.chapter)}`;
}, [sessionDetails]);


  // WebSocket setup with audio handling
  useEffect(() => {
    if (!isActive || !dynamicURL) return;

    ws.current = new WebSocket(dynamicURL);
    console.log(`🔌 ChatBot connecting to ${dynamicURL}`);

    ws.current.onopen = () => {
      console.log('✅ ChatBot WebSocket open');
      
      // Initialize AI audio playback context - ADDED
      aiAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: AI_SAMPLE_RATE,
      });
    };

    ws.current.onclose = e => {
      console.log('❌ ChatBot WebSocket closed', e.reason);
      setIsTyping(false);
      
      // Clean up audio context
      if (aiAudioContext.current && aiAudioContext.current.state !== 'closed') {
        aiAudioContext.current.close();
      }
      aiAudioQueue.current = [];
      isAiAudioPlaying.current = false;
    };

    ws.current.onerror = e => {
      console.error('⚠️ ChatBot WebSocket error', e);
      setIsTyping(false);
    };

    ws.current.onmessage = evt => {
      try {
        const msg = JSON.parse(evt.data);
        console.log('📨 ChatBot received:', msg.type);

        // Handle different message types
        if (msg.type === 'stream_start') {
          setIsTyping(false);
          setMessages(prev => [...prev, { from: 'ai', text: '' }]);
        } else if (msg.type === 'text') {
          setMessages(prev => {
            const last = prev.at(-1);
            if (last && last.from === 'ai') {
              last.text += msg.data;
              return [...prev.slice(0, -1), last];
            }
            return prev;
          });
        } else if (msg.type === 'audio') {
          // ADDED: Handle audio messages
          handleAiAudio(msg.data);
        } else if (msg.type === 'stream_end') {
          console.log('AI finished response');
        }
      } catch (err) {
        console.error('JSON parse failed', evt.data, err);
      }
    };

    return () => ws.current?.close();
  }, [isActive, dynamicURL]);

  const sendText = () => {
    if (!inputValue.trim()) return;
    if (ws.current?.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not open – cannot send');
      return;
    }

    setMessages(prev => [...prev, { from: 'user', text: inputValue }]);
    setInputValue('');
    setIsTyping(true);

    ws.current.send(JSON.stringify({ type: 'text_input', payload: inputValue }));
  };

  return (
    <div className="p-4 bg-white border-2 border-blue-400 rounded-lg shadow-md flex flex-col h-[480px]">
      <h3 className="text-lg font-bold text-center mb-4 text-gray-700 flex-shrink-0">
        AI ASSISTANT
      </h3>

      <div ref={chatBodyRef} className="flex-grow space-y-4 overflow-y-auto pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl max-w-md break-words shadow-sm
                             ${msg.from === 'ai'
                               ? 'bg-blue-100 text-blue-900'
                               : 'bg-gray-800 text-white'}`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && <TypingIndicator />}

        {!isActive && messages.length === 0 && (
          <div className="text-center text-gray-500 p-4">
            Chat will become active after student verification is complete.
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t flex-shrink-0 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendText()}
          placeholder={isActive ? 'Ask a question…' : 'Waiting for verification…'}
          disabled={!isActive || isTyping}
          className="w-full px-4 py-2 bg-gray-100 border-2 border-transparent rounded-lg
                     focus:outline-none focus:border-blue-500
                     disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
        />
        <button
          onClick={sendText}
          disabled={!isActive || isTyping || !inputValue.trim()}
          className="p-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700
                     disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex-shrink-0"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
