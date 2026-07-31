// src/hooks/useAiStream.ts

import { useState, useRef, useEffect, useCallback } from 'react';

// IMPORTANT: Replace with your actual WebSocket URL
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
const AI_SAMPLE_RATE = 24000;

export const useAiStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiResponseText, setAiResponseText] = useState('');
  
  const webSocket = useRef<WebSocket | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const userAudioContext = useRef<AudioContext | null>(null);
  const userAudioProcessor = useRef<ScriptProcessorNode | null>(null);
  const aiAudioContext = useRef<AudioContext | null>(null);
  const aiAudioQueue = useRef<Int16Array[]>([]);
  const isAiAudioPlaying = useRef(false);

  const playNextAiAudioChunk = useCallback(() => {
    if (aiAudioQueue.current.length === 0 || !aiAudioContext.current) {
      isAiAudioPlaying.current = false;
      return;
    }
    isAiAudioPlaying.current = true;
    
    const pcmData = aiAudioQueue.current.shift();
    if (!pcmData) {
      isAiAudioPlaying.current = false;
      return;
    }

    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 32768.0;
    }

    const audioBuffer = aiAudioContext.current.createBuffer(1, float32Data.length, AI_SAMPLE_RATE);
    audioBuffer.copyToChannel(float32Data, 0);

    const source = aiAudioContext.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(aiAudioContext.current.destination);
    source.onended = playNextAiAudioChunk;
    source.start();
  }, []);

  const handleAiAudio = useCallback((base64Data: string) => {
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
  }, [playNextAiAudioChunk]);
  
  const stopStreaming = useCallback(() => {
    if (!isStreaming) return;
    console.log("Stopping stream...");
    webSocket.current?.close();
    mediaStream.current?.getTracks().forEach(track => track.stop());
    userAudioProcessor.current?.disconnect();
    userAudioContext.current?.close();
    aiAudioContext.current?.close();
    
    setIsStreaming(false);
    setAiResponseText('');
    aiAudioQueue.current = [];
    isAiAudioPlaying.current = false;
  }, [isStreaming]);

  const startStreaming = useCallback(async () => {
    if (isStreaming) return;
    console.log("Starting stream...");
    setAiResponseText('');

    try {
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      webSocket.current = new WebSocket(WEBSOCKET_URL);

      webSocket.current.onopen = () => {
        console.log('WebSocket connection established.');
        setIsStreaming(true);
        
        const AudioContext = window.AudioContext;
        aiAudioContext.current = new AudioContext({ sampleRate: AI_SAMPLE_RATE });
        
        // Setup user audio streaming
        userAudioContext.current = new AudioContext({ sampleRate: 16000 });
        const source = userAudioContext.current.createMediaStreamSource(mediaStream.current!);
        userAudioProcessor.current = userAudioContext.current.createScriptProcessor(4096, 1, 1);
        source.connect(userAudioProcessor.current);
        userAudioProcessor.current.connect(userAudioContext.current.destination);
        userAudioProcessor.current.onaudioprocess = (event) => {
          if (webSocket.current?.readyState !== WebSocket.OPEN) return;
          const float32Data = event.inputBuffer.getChannelData(0);
          const int16Data = new Int16Array(float32Data.length);
          for (let i = 0; i < float32Data.length; i++) {
            int16Data[i] = Math.max(-1, Math.min(1, float32Data[i])) * 32767;
          }
          const base64Data = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(int16Data.buffer))));
          webSocket.current.send(JSON.stringify({ type: 'audio', data: base64Data }));
        };
      };

      webSocket.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'audio') {
          handleAiAudio(message.data);
        } else if (message.type === 'text') {
          setAiResponseText(prev => prev + message.data);
        }
      };
      
      webSocket.current.onclose = () => stopStreaming();
      webSocket.current.onerror = (error) => {
        console.error('WebSocket Error:', error);
        stopStreaming();
      };

    } catch (error) {
      console.error('Error accessing media devices.', error);
    }
  }, [isStreaming, handleAiAudio, stopStreaming]);
  
  const sendUserMessage = useCallback((text: string) => {
    if (webSocket.current?.readyState === WebSocket.OPEN) {
      webSocket.current.send(JSON.stringify({ type: 'text', data: text }));
    }
  }, []);

  return { isStreaming, aiResponseText, mediaStream, startStreaming, stopStreaming, sendUserMessage };
};