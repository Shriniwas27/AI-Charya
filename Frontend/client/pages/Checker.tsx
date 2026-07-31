// src/components/checker/CheckerDashboard.tsx

import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import StudentHeader from "@/components/checker/StudentHeader";
import RecognitionPanel from "@/components/checker/CameraStream";
import TaskDetailsPanel from "@/components/checker/TaskDetailsPanel";
import ChatBot from "@/components/checker/ChatBox";
import AnalysisPanel from "@/components/checker/AnalysisPanel";

// Helper function
function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("Invalid data URL");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// Interfaces
interface Message {
  from: "ai" | "user";
  text: string;
}

export type AppStep =
  | "IDLE"
  | "FACE_SCANNING"
  | "VERIFYING"
  | "VERIFIED_SUCCESS"
  | "SHOWING_INSTRUCTION"
  | "INTERACTIVE_SESSION"
  | "FAILED"
  | "ANALYZING"
  | "DONE";

// ✨ REMOVED: The StudentDetailsPanel component is no longer needed.

export default function CheckerDashboard() {
  const location = useLocation();
  const { sessionDetails } = location.state || {};

  const [appStep, setAppStep] = useState<AppStep>("IDLE");

  // ✨ CHANGED: Student state is now initialized with placeholders, to be filled by API.
  const [student, setStudent] = useState({
    name: "...",
    roll: "...",
  });
  const [task, setTask] = useState({
    subject: sessionDetails?.subject || "",
    chapter: sessionDetails?.chapter || "",
    mode: "HomeWork Checker",
    totalScored: null,
    grade: sessionDetails?.grade || "",
  });

  const [capturedFaceImage, setCapturedFaceImage] = useState<string | null>(
    null,
  );
  const [capturedHomeworkImage, setCapturedHomeworkImage] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "ai",
      text: "Hello! Please fill in the task details and show your face to the camera to get recognized.",
    },
  ]);
  const [analysis, setAnalysis] = useState(null);
  const [captureResetKey, setCaptureResetKey] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);

  // ✨ CHANGED: Readiness check no longer includes student details.
  const isReadyToStart =
    task.subject.trim() !== "" && task.chapter.toString().trim() !== "";

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (appStep === "VERIFIED_SUCCESS") {
      timer = setTimeout(() => setAppStep("SHOWING_INSTRUCTION"), 1000);
    } else if (appStep === "SHOWING_INSTRUCTION") {
      timer = setTimeout(() => setAppStep("INTERACTIVE_SESSION"), 3000);
    }
    return () => clearTimeout(timer);
  }, [appStep]);

  useEffect(() => {
    setIsStreaming(appStep === "INTERACTIVE_SESSION");
  }, [appStep]);

  // ✨ REMOVED: handleStudentChange is no longer needed.

  const handleStartCamera = () => {
    if (!isReadyToStart) {
      alert("Please fill in the Subject and Chapter details before starting.");
      return;
    }
    setAppStep("FACE_SCANNING");
  };

  // ✨ CHANGED: This function now performs RECOGNITION and sets the student state.
  const handleFaceCapture = useCallback(
    async (imageDataUrl: string) => {
      if (!isReadyToStart) {
        console.error("Cannot recognize face, task details are missing.");
        setAppStep("FAILED");
        return;
      }
      // 1. IS THE INCOMING DATA URL VALID?
      console.log("1. Received imageDataUrl:", imageDataUrl);

      if (!imageDataUrl) {
        console.error("imageDataUrl is null or empty. Cannot proceed.");
        return;
      }

      setCapturedFaceImage(imageDataUrl);
      setAppStep("VERIFYING");

      const imageFile = dataURLtoFile(imageDataUrl, "student_face.png");

      // 2. DID THE FILE GET CREATED CORRECTLY?
      console.log("2. Created imageFile object:", imageFile);

      const formData = new FormData();
      formData.append("image", imageFile);

      formData.append("image", imageFile);

      try {
        // The API endpoint for recognition
        const response = await axios.post("https://cf02a2aac7b6.ngrok-free.app/recognize_student/", formData);

        // Check if the backend returned student data
        if (response.data && response.data.name && response.data.roll_no) {
          // Set the student state with the data from the backend
          setStudent({ name: response.data.name, roll: response.data.roll_no });
          setAppStep("VERIFIED_SUCCESS");
        } else {
          console.error(
            "Recognition failed: API response missing student data.",
          );
          setAppStep("FAILED");
        }
      } catch (error: any) {
        console.error("Recognition API call failed:", error);
        if (error.response) {
          const errorMessage =
            error.response.data?.detail || "An unknown error occurred.";
          alert(`Recognition Failed: ${errorMessage}`);
        }
        setAppStep("FAILED");
      }
    },
    [isReadyToStart],
  );

  const handleReset = useCallback(() => {
    setAnalysis(null);
    setCapturedFaceImage(null);
    setCapturedHomeworkImage(null);
    setAppStep("IDLE");
    setCaptureResetKey((prevKey) => prevKey + 1);

    // ✨ CHANGED: Reset student state to placeholders
    setStudent({
      name: "...",
      roll: "...",
    });
    setTask((prev) => ({
      ...prev,
      subject: sessionDetails?.subject || "",
      chapter: sessionDetails?.chapter || "",
      totalScored: null,
      grade: sessionDetails?.grade || "",
    }));
  }, [sessionDetails]);

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-100">
      <StudentHeader studentName={student.name} rollNumber={student.roll} />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <RecognitionPanel
            appStep={appStep}
            onStartCamera={handleStartCamera}
            isStartDisabled={!isReadyToStart}
            onFaceCapture={handleFaceCapture}
            capturedFaceImage={capturedFaceImage}
            onReset={handleReset}
            captureResetKey={captureResetKey}
            // Pass the combined details for the WebSocket connection
            sessionDetails={{ ...sessionDetails, ...task, ...student }}
          />
          {/* ✨ REMOVED: StudentDetailsPanel is no longer rendered here. */}
          <TaskDetailsPanel
            task={task}
            onTaskChange={(updatedTask) => setTask(updatedTask)}
            isEditable={appStep === "IDLE"}
          />
        </div>
        <div className="lg:col-span-3 flex flex-col gap-6">
          <ChatBot
            isActive={isStreaming}
            initialMessages={messages}
            sessionDetails={{ ...sessionDetails, ...task, ...student }}
          />
          <AnalysisPanel
            appStep={appStep}
            analysis={analysis}
            capturedHomeworkImage={capturedHomeworkImage}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}
