// src/components/checker/CameraPanel.tsx

import FaceDetectionComponent from "./FaceDetectionComponent";
import { Camera, CheckCircle, FileText, XCircle } from "lucide-react";
import Webcam from "react-webcam";
import { AppStep } from "@/pages/Checker"


// Define the component's props interface
interface CameraPanelProps {
  appStep: AppStep;
  onStartCamera: () => void;
  onFaceCapture: (imageSrc: string) => void;
  capturedFaceImage: string | null;
  onReset: () => void;
  captureResetKey: number;
}

export default function CameraPanel({
  appStep,
  onStartCamera,
  onFaceCapture,
  capturedFaceImage,
  onReset,
  captureResetKey
}: CameraPanelProps) {
  
  const renderContent = () => {
    switch (appStep) {
      case 'FACE_SCANNING':
        return <FaceDetectionComponent onCapture={onFaceCapture} onReset={captureResetKey} />;
      
      case 'VERIFYING':
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

      case 'VERIFIED_SUCCESS':
        return (
          <div className="w-full aspect-video bg-green-100 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-green-800 text-2xl font-bold">Verified!</h2>
          </div>
        );

      case 'SHOWING_INSTRUCTION':
        return (
          <div className="w-full aspect-video bg-blue-100 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <FileText className="h-16 w-16 text-blue-600 mb-4" />
            <p className="text-blue-800 text-xl font-bold">Please show your work to the camera.</p>
            <p className="text-blue-700 mt-2">The interactive session will begin shortly...</p>
          </div>
        );
      
      case 'INTERACTIVE_SESSION':
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <Webcam
              audio={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black bg-opacity-50 text-white text-sm rounded-full">
              Live Session
            </div>
          </div>
        );
        
      case 'FAILED':
        return (
          <div className="w-full aspect-video bg-red-100 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <XCircle className="h-16 w-16 text-red-600 mb-4" />
            <p className="text-red-700 text-xl font-bold mb-4">Verification Failed</p>
            <p className="text-red-600 mb-6">Could not recognize the student. Please try again.</p>
            <button 
              onClick={onReset} 
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      case 'IDLE':
      default:
        return (
          <div className="w-full aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <Camera className="h-16 w-16 text-gray-500 mb-4" />
            <p className="text-gray-400 mb-6">Click the button to start student verification.</p>
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
    <div className="p-4 bg-white border-2 border-pink-300 rounded-lg shadow-md flex-shrink-0">
      {renderContent()}
    </div>
  );
}