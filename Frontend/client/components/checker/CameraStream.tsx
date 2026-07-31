// src/components/checker/CameraStream.tsx
import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import Webcam from "react-webcam";
import { Camera, CheckCircle, FileText, XCircle } from "lucide-react";
import FaceDetectionComponent from "./FaceDetectionComponent";
import { AppStep } from "@/pages/Checker";

interface SessionDetails {
  subject?: string;
  chapter?: string;
  name?: string;
  roll?: string;
  mode?: string;
  totalScored?: number | null;
  grade?: string;
}

interface CameraPanelProps {
  appStep: AppStep;
  onStartCamera: () => void;
  isStartDisabled?: boolean; // NEW: Added to handle disabled state
  onFaceCapture: (imageSrc: string) => void;
  capturedFaceImage: string | null;
  onReset: () => void;
  captureResetKey: number;
  sessionDetails?: SessionDetails; // NEW: Added session details
}

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",
};

const AI_SAMPLE_RATE = 24000;

// Direct WebSocket URL - matching working code
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

export default function CameraPanel({
  appStep,
  onStartCamera,
  isStartDisabled = false, // NEW: Handle disabled state
  onFaceCapture,
  capturedFaceImage,
  onReset,
  captureResetKey,
  sessionDetails,
}: CameraPanelProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiResponseText, setAiResponseText] = useState("");

  // Direct refs matching working code
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webSocket = useRef<WebSocket | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);

  // Audio processing refs
  const userAudioContext = useRef<AudioContext | null>(null);
  const userAudioProcessor = useRef<ScriptProcessorNode | null>(null);
  const aiAudioContext = useRef(null);
  const aiAudioQueue = useRef([]);
  const isAiAudioPlaying = useRef(false);

  const streamVideoInterval = useRef<NodeJS.Timeout | null>(null);
  const [isStreamingActive, setIsStreamingActive] = useState(false);

  const dynamicURL = useMemo(() => {
    // Only construct URL if we have all required data
    if (
      !sessionDetails?.roll ||
      !sessionDetails?.grade ||
      !sessionDetails?.subject ||
      !sessionDetails?.chapter
    ) {
      return null;
    }
    return `${WEBSOCKET_URL}/${encodeURIComponent(sessionDetails.roll)}/${encodeURIComponent(sessionDetails.name)}/${encodeURIComponent(sessionDetails.grade)}/${encodeURIComponent(sessionDetails.subject)}/${encodeURIComponent(sessionDetails.chapter)}`;
  }, [sessionDetails]);

  // Direct WebSocket implementation - matching working code exactly
  const startStreaming = useCallback(async () => {
    if (appStep !== "INTERACTIVE_SESSION" || !dynamicURL) return;

    try {
      console.log("🚀 Starting direct WebSocket streaming...");

      // Get media stream
      mediaStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (webcamRef.current?.video) {
        webcamRef.current.video.srcObject = mediaStream.current;
      }

      // Create direct WebSocket connection - EXACTLY like working code
      webSocket.current = new WebSocket(dynamicURL);

      webSocket.current.onopen = () => {
        console.log("✅ Direct WebSocket connection established.");
        setIsStreamingActive(true);
        // Initialize AI audio playback context
        aiAudioContext.current = new (window.AudioContext ||
          window.AudioContext)({
          sampleRate: AI_SAMPLE_RATE,
        });
        // Start sending media
        streamVideoInterval.current = setInterval(sendVideoFrame, 1000);
        setupUserAudioStreaming();
      };

      webSocket.current.onmessage = (event) => {
        console.log("📨 Received message from backend:", event.data);
        // Handle responses if needed
        const message = JSON.parse(event.data);
        if (message.type === "audio") {
          handleAiAudio(message.data);
        } else if (message.type === "text") {
          setAiResponseText((prev) => prev + message.data);
        }
      };

      webSocket.current.onclose = () => {
        console.log("❌ Direct WebSocket connection closed.");
        stopStreaming();
      };

      webSocket.current.onerror = (error) => {
        console.error("⚠️ Direct WebSocket Error:", error);
        stopStreaming();
      };
    } catch (error) {
      console.error("Error starting streaming:", error);
    }
  }, [appStep, dynamicURL]);

  // Direct video frame sending - EXACTLY like working code
  const sendVideoFrame = useCallback(() => {
    if (webSocket.current?.readyState === WebSocket.OPEN) {
      const canvas = canvasRef.current;
      const video = webcamRef.current?.video;

      if (!canvas || !video || video.readyState < video.HAVE_ENOUGH_DATA)
        return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const base64Data = dataUrl.split(",")[1];

      console.log("📤 Sending video frame directly - Size:", base64Data.length);

      // DIRECT send - exactly like working code
      webSocket.current.send(
        JSON.stringify({ type: "video", data: base64Data }),
      );
    } else {
      console.log("❌ WebSocket not open for video frame");
    }
  }, []);

  // Direct audio setup - EXACTLY like working code
  const setupUserAudioStreaming = useCallback(() => {
    if (!mediaStream.current) return;

    console.log("🎤 Setting up direct audio streaming...");

    userAudioContext.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)({
      sampleRate: 16000,
    });

    const source = userAudioContext.current.createMediaStreamSource(
      mediaStream.current,
    );
    userAudioProcessor.current = userAudioContext.current.createScriptProcessor(
      4096,
      1,
      1,
    );
    source.connect(userAudioProcessor.current);
    userAudioProcessor.current.connect(userAudioContext.current.destination);

    userAudioProcessor.current.onaudioprocess = (
      event: AudioProcessingEvent,
    ) => {
      if (webSocket.current?.readyState === WebSocket.OPEN) {
        const float32Data = event.inputBuffer.getChannelData(0);
        const int16Data = new Int16Array(float32Data.length);

        for (let i = 0; i < float32Data.length; i++) {
          int16Data[i] = Math.max(-1, Math.min(1, float32Data[i])) * 32767;
        }

        // EXACT format from working code
        const base64Data = btoa(
          String.fromCharCode.apply(null, new Uint8Array(int16Data.buffer)),
        );

        console.log(
          "🎵 Sending audio chunk directly - Size:",
          base64Data.length,
        );

        // DIRECT send - exactly like working code
        webSocket.current.send(
          JSON.stringify({ type: "audio", data: base64Data }),
        );
      }
    };
  }, []);

  const stopStreaming = useCallback(() => {
    console.log("⏹️ Stopping direct streaming...");

    if (streamVideoInterval.current) {
      clearInterval(streamVideoInterval.current);
    }

    if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
      webSocket.current.close();
    }

    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
    }

    if (userAudioProcessor.current) {
      userAudioProcessor.current.disconnect();
    }

    if (
      userAudioContext.current &&
      userAudioContext.current.state !== "closed"
    ) {
      userAudioContext.current.close();
    }

    setIsStreamingActive(false);
    mediaStream.current = null;
  }, []);

  const handleAiAudio = (base64Data) => {
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

  const playNextAiAudioChunk = async () => {
    if (aiAudioQueue.current.length === 0) {
      isAiAudioPlaying.current = false;
      return;
    }
    isAiAudioPlaying.current = true;
    const pcmData = aiAudioQueue.current.shift();
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 32768.0; // Convert Int16 to Float32
    }

    const audioBuffer = aiAudioContext.current.createBuffer(
      1,
      float32Data.length,
      AI_SAMPLE_RATE,
    );
    audioBuffer.copyToChannel(float32Data, 0);

    const source = aiAudioContext.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(aiAudioContext.current.destination);
    source.onended = playNextAiAudioChunk; // Chain the next chunk
    source.start();
  };

  // Auto start/stop based on app step
  useEffect(() => {
    if (appStep === "INTERACTIVE_SESSION") {
      startStreaming();
    } else {
      stopStreaming();
    }

    return () => stopStreaming();
  }, [appStep, startStreaming, stopStreaming]);

  const renderContent = () => {
    switch (appStep) {
      case "FACE_SCANNING":
        return (
          <FaceDetectionComponent
            onCapture={onFaceCapture}
            onReset={captureResetKey}
          />
        );

      case "VERIFYING":
        return (
          <div className="relative w-full aspect-video">
            {capturedFaceImage && (
              <img
                src={capturedFaceImage}
                alt="Recognizing face"
                className="w-full h-full object-cover rounded-lg filter blur-md"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center rounded-lg">
              <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-white mb-4"></div>
              <p className="text-white text-xl font-semibold">Recognizing...</p>
            </div>
          </div>
        );

      case "VERIFIED_SUCCESS":
        return (
          <div className="w-full aspect-video bg-green-100 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-green-800 text-2xl font-bold">Verified!</h2>
          </div>
        );

      case "SHOWING_INSTRUCTION":
        return (
          <div className="w-full aspect-video bg-blue-100 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <FileText className="h-16 w-16 text-blue-600 mb-4" />
            <p className="text-blue-800 text-xl font-bold">
              Please show your work to the camera.
            </p>
            <p className="text-blue-700 mt-2">
              The interactive session will begin shortly...
            </p>
          </div>
        );

      case "INTERACTIVE_SESSION":
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false} // Audio handled separately
              muted={true}
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-600 bg-opacity-70 text-white text-sm rounded-full flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isStreamingActive ? "bg-green-300 animate-pulse" : "bg-red-300"}`}
              ></div>
              <span>
                {isStreamingActive ? "Direct Stream Active" : "Stream Inactive"}
              </span>
            </div>
          </div>
        );

      case "FAILED":
        return (
          <div className="w-full aspect-video bg-red-100 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <XCircle className="h-16 w-16 text-red-600 mb-4" />
            <p className="text-red-700 text-xl font-bold mb-4">
              Verification Failed
            </p>
            <button
              onClick={onReset}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      case "IDLE":
      default:
        return (
          <div className="w-full aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <Camera className="h-16 w-16 text-gray-500 mb-4" />
            <p className="text-gray-400 mb-6">
              Click the button to start student verification.
            </p>
            <button
              onClick={onStartCamera}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Camera
            </button>
          </div>
        );
    }
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md">
      {renderContent()}
    </div>
  );
}
