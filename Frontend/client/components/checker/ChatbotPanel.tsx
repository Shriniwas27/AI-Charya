// src/components/checker/ChatbotPanel.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

// Define the structure of a chat message
interface Message {
  from: 'ai' | 'user';
  text: string;
}

// Define the props for the component
interface ChatbotPanelProps {
  initialMessages: Message[];
  isActive: boolean;
}

// A simple component for the AI typing indicator
const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="p-3 rounded-xl bg-blue-100 text-blue-900">
      <div className="flex items-center justify-center space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

export default function ChatbotPanel({ initialMessages, isActive }: ChatbotPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Automatically scroll to the bottom of the chat on new messages or typing indicator
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Establish WebSocket connection only when the chat panel is active
    if (isActive) {
      console.log(`Attempting to connect to WebSocket at: ${WEBSOCKET_URL}`);
      ws.current = new WebSocket(WEBSOCKET_URL);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connection established successfully.');
      };

      ws.current.onclose = (event) => {
        console.error('❌ WebSocket connection closed.', `Code: ${event.code}`, `Reason: ${event.reason}`);
        setIsTyping(false); // Ensure typing indicator is off on disconnect
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error observed:', error);
        setIsTyping(false);
      };

      ws.current.onmessage = (event) => {
        console.log("Received from backend:", event.data);
        try {
          const response = JSON.parse(event.data);

          // Logic to handle streaming responses from the AI
          if (response.type === 'stream_start') {
            setIsTyping(false); // Stop "typing" indicator once stream starts
            setMessages((prev) => [...prev, { from: 'ai', text: '' }]); // Add a new empty message from AI
          } else if (response.type === 'text') {
            // Append the new text chunk to the last AI message
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.from === 'ai') {
                lastMessage.text += response.data;
                return [...prev.slice(0, -1), lastMessage];
              }
              return prev;
            });
          } else if (response.type === 'stream_end') {
            // Can be used for any final actions once the AI is done responding
            console.log("AI response stream finished.");
          }

        } catch (error) {
          console.error("Failed to parse WebSocket message:", event.data, error);
        }
      };

      // Cleanup: close the connection when the component unmounts or isActive changes
      return () => {
        ws.current?.close();
      };
    }
  }, [isActive]); 

  const handleSendMessage = () => {
    if (inputValue.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const messageToSend = { type: 'text_input', payload: inputValue };
      
      console.log("Sending to backend:", JSON.stringify(messageToSend));
      ws.current.send(JSON.stringify(messageToSend));

      // Add user's message to the chat and show AI typing indicator
      setMessages((prev) => [...prev, { from: 'user', text: inputValue }]);
      setInputValue('');
      setIsTyping(true);
    } else {
      console.error("Could not send message. WebSocket is not open. Ready state:", ws.current?.readyState);
    }
  };

  return (
    <div className="p-4 bg-white border-2 border-blue-400 rounded-lg shadow-md flex flex-col h-[480px]">
      <h3 className="text-lg font-bold text-center mb-4 text-gray-700 flex-shrink-0">AICHARYA CHECKER</h3>
      
      <div ref={chatBodyRef} className="flex-grow space-y-4 overflow-y-auto pr-2">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl max-w-md break-words shadow-sm ${msg.from === 'ai' ? 'bg-blue-100 text-blue-900' : 'bg-gray-800 text-white'}`}>
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
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={isActive ? "Ask a question..." : "Waiting for verification..."}
          disabled={!isActive || isTyping}
          className="w-full px-4 py-2 bg-gray-100 border-2 border-transparent rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
        />
        <button 
          onClick={handleSendMessage} 
          disabled={!isActive || isTyping || !inputValue.trim()}
          className="p-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 ease-in-out flex-shrink-0"
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}