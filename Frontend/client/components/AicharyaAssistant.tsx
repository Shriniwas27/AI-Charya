import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Send, X, Mic, MicOff, Loader, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

// Put your backend API URL here:
const API_URL = "https://e23423032121.ngrok-free.app/general_chatbot/";

type ChatMessage = {
  type: "user" | "assistant";
  content?: string;
  audioUrl?: string;
};

const assistantVariants: Variants = {
  open: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } },
  closed: { scale: 0, opacity: 0, y: 20, transition: { duration: 0.2 } },
};

export default function AicharyaAssistant() {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      type: "assistant",
      content: "Hello! I'm your AI assistant. I can help you with questions about curriculum, lectures, student analysis, and more!",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Streaming/tts
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [streamedAssistantContent, setStreamedAssistantContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Typing/streaming
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wordsRef = useRef<string[]>([]);
  const currentWordIndex = useRef(0);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const chatBottom = useRef<HTMLDivElement>(null);

  // Scroll to bottom on chat update
  useEffect(() => {
    chatBottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isOpen, streamedAssistantContent]);

  // Streaming logic, with error check
  function simulateStreamingAssistantResponse(fullText: string) {
    if (!fullText || typeof fullText !== "string") {
      setError(
        "Sorry, assistant failed to respond. Try again! (No valid reply received from server.)"
      );
      setIsStreaming(false);
      setIsAwaitingResponse(false);
      setIsSending(false);
      return;
    }
    wordsRef.current = fullText.split(" ");
    currentWordIndex.current = 0;
    setStreamedAssistantContent("");
    setIsStreaming(true);
    setIsPaused(false);
    nextWord();
  }

  function nextWord() {
    if (isPaused || currentWordIndex.current >= wordsRef.current.length) return;
    setStreamedAssistantContent((prev) =>
      prev + (prev ? " " : "") + wordsRef.current[currentWordIndex.current]
    );
    speakWord(wordsRef.current[currentWordIndex.current]);
    currentWordIndex.current += 1;
    if (currentWordIndex.current < wordsRef.current.length) {
      streamingTimeoutRef.current = setTimeout(nextWord, 60);
    } else {
      setIsStreaming(false);
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          { type: "assistant", content: wordsRef.current.join(" ") }
        ]);
        setStreamedAssistantContent("");
        setIsAwaitingResponse(false);
        setIsSending(false);
      }, 350);
    }
  }

  function speakWord(word: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(word + " ");
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  function handlePause() {
    setIsPaused(true);
    if (streamingTimeoutRef.current) clearTimeout(streamingTimeoutRef.current);
    window.speechSynthesis.pause();
  }
  function handleResume() {
    setIsPaused(false);
    window.speechSynthesis.resume();
    nextWord();
  }
  useEffect(() => {
    if (!isPaused && isStreaming) nextWord();
    // eslint-disable-next-line
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) clearTimeout(streamingTimeoutRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  // === Text send via HTTP POST, now robustly handled ===
  async function handleSendMessage() {
    if (isAwaitingResponse || isSending || !newMessage.trim()) return;
    setIsSending(true);
    setError(null);
    const msg = newMessage.trim();
    setChatMessages((prev) => [...prev, { type: "user", content: msg }]);
    setNewMessage("");
    setIsAwaitingResponse(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Server did not return JSON. Possibly an error page instead of an actual reply.");
      }

      // Defensively check for reply
      if (!data.reply || typeof data.reply !== "string") {
        throw new Error("No 'reply' key in answer. Full response: " + JSON.stringify(data));
      }
      simulateStreamingAssistantResponse(data.reply);
    } catch (e: any) {
      setError("Failed to contact assistant. " + (e?.message || ""));
      setIsAwaitingResponse(false);
      setIsSending(false);
    }
  }
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSendMessage();
  }

  // === Audio recording ===
  const handleRecord = async () => {
    try {
      if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const localAudioUrl = URL.createObjectURL(audioBlob);
          setChatMessages((prev) => [...prev, { type: "user", audioUrl: localAudioUrl }]);
          setIsSending(true);
          setIsAwaitingResponse(true);
          setError(null);

          try {
            const form = new FormData();
            form.append("audio", audioBlob, "audio.webm");
            const res = await fetch(API_URL, {
              method: "POST",
              body: form,
            });
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

            let data;
            try {
              data = await res.json();
            } catch (e) {
              throw new Error("Server did not return JSON. Possibly an error page instead of an actual reply.");
            }

            if (!data.reply || typeof data.reply !== "string") {
              throw new Error("No 'reply' key in answer. Full response: " + JSON.stringify(data));
            }
            simulateStreamingAssistantResponse(data.reply);
          } catch (err: any) {
            setError("Failed to contact assistant. " + (err?.message || ""));
            setIsAwaitingResponse(false);
            setIsSending(false);
          }
        };
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      }
    } catch (e) {
      setError("Microphone access denied or unavailable.");
    }
  };

  // === UI render ===
  return (
    <>
      {/* Floating button (open/close) */}
      <motion.div className="fixed bottom-6 right-6 z-50" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 rounded-full shadow-lg text-white flex items-center justify-center p-1 bg-white border-2 border-material-blue hover:bg-material-gray-50"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.img src="../../aicharya.png" alt="AI Assistant" className="w-12 h-12 rounded-full" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} />
        </motion.button>
      </motion.div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={assistantVariants}
            className="fixed top-0 right-0 z-50 h-screen w-1/3 bg-white rounded-l-lg shadow-xl border border-material-gray-200 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-material-gray-200 bg-gradient-to-r from-material-blue-50 to-material-green-50 rounded-tr-lg">
              <div className="flex items-center gap-2">
                <img src="https://cdn.builder.io/api/v1/image/assets%2F51a4707e6cb3452bb5e8ffef0fab69d7%2F4e7bfb36cd894a0d96cca31a023e813b?format=webp&width=800"
                  alt="AI Assistant" className="w-6 h-6 rounded-full"/>
                <span className="font-medium"
                  style={{
                    background: "linear-gradient(45deg, #4285f4 0%, #fbbc05 50%, #34a853 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}>AI-Charya Assistant</span>
              </div>
              <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm" className="p-1 h-8 w-8 hover:bg-material-gray-100">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex transition-all duration-300 ease-in-out",
                    message.type === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-lg shadow-sm",
                    message.type === "user"
                      ? "bg-material-blue text-white"
                      : "bg-gradient-to-r from-material-blue-50 to-material-green-50 text-material-gray-900 border border-material-gray-200"
                  )}>
                    <div className="flex items-start gap-2">
                      {message.audioUrl ? (
                        <audio controls src={message.audioUrl} className="h-7 w-48" />
                      ) : message.type === "assistant" ? (
                        <img src="https://cdn.builder.io/api/v1/image/assets%2F51a4707e6cb3452bb5e8ffef0fab69d7%2F4e7bfb36cd894a0d96cca31a023e813b?format=webp&width=800" alt="AI" className="w-4 h-4 rounded-full mt-0.5"/>
                      ) : (
                        <User className="h-4 w-4 mt-0.5" />
                      )}
                      {message.content && <p className="text-sm">{message.content}</p>}
                    </div>
                  </div>
                </div>
              ))}
              {streamedAssistantContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg shadow-sm bg-gradient-to-r from-material-blue-50 to-material-green-50 text-material-gray-900 border border-material-gray-200 flex items-center gap-2">
                    <img src="https://cdn.builder.io/api/v1/image/assets%2F51a4707e6cb3452bb5e8ffef0fab69d7%2F4e7bfb36cd894a0d96cca31a023e813b?format=webp&width=800" alt="AI" className="w-4 h-4 rounded-full mt-0.5"/>
                    <span className="text-sm">{streamedAssistantContent} <span className="animate-blink inline-block w-2 h-2 bg-material-blue rounded-full ml-1" /></span>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={isPaused ? "Resume" : "Pause"}
                      onClick={isPaused ? handleResume : handlePause}
                      className="ml-2 h-6 w-6"
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              {isAwaitingResponse && !streamedAssistantContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg shadow-sm bg-gradient-to-r from-material-blue-50 to-material-green-50 text-material-gray-900 border border-material-gray-200 flex items-center gap-2">
                    <img src="https://cdn.builder.io/api/v1/image/assets%2F51a4707e6cb3452bb5e8ffef0fab69d7%2F4e7bfb36cd894a0d96cca31a023e813b?format=webp&width=800" alt="AI" className="w-4 h-4 rounded-full mt-0.5"/>
                    <span className="text-sm opacity-60"><Loader className="animate-spin inline h-4 w-4 mr-1" /> Assistant is responding…</span>
                  </div>
                </div>
              )}
              <div ref={chatBottom} />
            </div>
            <div className="border-t border-material-gray-200 p-4 bg-material-gray-50 rounded-br-lg shrink-0">
              {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
              <div className="flex gap-2 items-center">
                <Button
                  onClick={handleRecord}
                  type="button"
                  size="sm"
                  variant={isRecording ? "outline" : "ghost"}
                  className={isRecording ? "animate-pulse" : ""}
                  disabled={isSending || isAwaitingResponse}
                >
                  {isRecording ? <><MicOff className="h-4 w-4 mr-1" />Stop</> : <><Mic className="h-4 w-4 mr-1" />Rec</>}
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSending || isRecording}
                  placeholder={isAwaitingResponse
                    ? "Wait for assistant response..."
                    : isSending
                      ? "Sending..."
                      : "Ask me anything..."}
                  onKeyDown={handleInputKeyDown}
                  className="flex-1 border-material-gray-300 focus:border-material-blue focus:ring-material-blue"
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  className="bg-material-blue hover:bg-material-blue-600 text-white shadow-sm"
                  disabled={
                    isSending ||
                    !newMessage.trim() ||
                    isAwaitingResponse ||
                    isRecording
                  }
                >
                  <Send className="h-4 w-4" />
                </Button>
                {isRecording && (
                  <Loader className="animate-spin ml-1 h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Blinking cursor animation */}
      <style>
        {`
        .animate-blink { animation: blink 1.2s infinite; }
        @keyframes blink { 0%, 100% { opacity: 0.8; } 50% { opacity: 0; } }
        `}
      </style>
    </>
  );
}
