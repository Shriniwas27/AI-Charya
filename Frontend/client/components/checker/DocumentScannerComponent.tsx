// src/components/checker/DocumentScannerComponent.tsx

import React, { useRef } from "react";
import Webcam from "react-webcam";
import { Camera as CameraIcon } from "lucide-react";

const docScannerCss = `
.doc-guide {
  fill: transparent;
  stroke: rgba(255, 255, 255, 0.7);
  stroke-width: 4;
  stroke-dasharray: 10 10;
}
`;

export default function DocumentScannerComponent({ onCapture }) {
  const webcamRef = useRef<Webcam | null>(null);

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
        <style>{docScannerCss}</style>
        <svg width="100%" height="100%" viewBox="0 0 640 480" className="absolute top-0 left-0 z-10">
          <rect className="doc-guide" x="40" y="40" width="560" height="400" rx="10" />
        </svg>
        <Webcam
          ref={webcamRef}
          audio={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          screenshotFormat="image/png"
          videoConstraints={{ width: 1280, height: 720 }}
          
        />
      </div>
      <button onClick={handleCapture} className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
        <CameraIcon size={20} />
        Capture Page
      </button>
    </div>
  );
}