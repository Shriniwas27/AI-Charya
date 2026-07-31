// src/components/checker/FaceDetectionComponent.tsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { FaceDetection } from "@mediapipe/face_detection";

const TARGET_ZONE = { x: 0.2, y: 0.05, width: 0.6, height: 0.9 };
const roundedRectLoaderCss = `
.loader-container {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 10;
}
.rect-guide, .rect-progress {
  fill: transparent; stroke-width: 2; stroke-linecap: round;
}
.rect-guide {
  stroke: rgba(255, 255, 255, 0.5); stroke-dasharray: 4 6;
}
.rect-progress {
  stroke: #00ffff; stroke-dasharray: 1632; stroke-dashoffset: 1632;
}
.loader-container.active .rect-progress {
  animation: fill-rect 5s linear forwards;
}
@keyframes fill-rect { to { stroke-dashoffset: 0; } }
`;

export default function FaceDetectionComponent({ onCapture, onReset }: { onCapture: (imageSrc: string) => void, onReset: number }) {
  const webcamRef = useRef<Webcam | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceDetectionRef = useRef<FaceDetection | null>(null);
  const animationFrameId = useRef<number>(0);
  const captureTimeoutId = useRef<NodeJS.Timeout | null>(null);
  
  // This ref is for the high-frequency onResults callback to get the latest state
  const isCapturingRef = useRef(false);
  // This state is just for triggering the CSS animation
  const [isAnimationActive, setIsAnimationActive] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);

  // Temporarily commented out crop functionality
  /*
  const cropFace = (imageElement: HTMLCanvasElement | HTMLImageElement, boundingBox: any) => {
    const cropCanvas = document.createElement("canvas");
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return;

    const { width, height, xCenter, yCenter } = boundingBox;
    const cropWidth = width * imageElement.width;
    const cropHeight = height * imageElement.height;
    const cropX = xCenter * imageElement.width - cropWidth / 2;
    const cropY = yCenter * imageElement.height - cropHeight / 2;

    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;

    // Simply draw the cropped region without any flipping
    cropCtx.drawImage(imageElement, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    
    const croppedImageSrc = cropCanvas.toDataURL("image/png");
    onCapture(croppedImageSrc);
  };
  */

  // New function to send the original full image
  const captureOriginalImage = (imageElement: HTMLCanvasElement | HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    // Draw the original image without cropping
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    const originalImageSrc = canvas.toDataURL("image/png");
    onCapture(originalImageSrc);
  };

  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;

    const canvas = canvasRef.current;
    const video = webcamRef.current.video;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw the image normally (not mirrored)
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    let bothEyesInZone = false;
    if (results.detections.length > 0) {
      const detection = results.detections[0];
      const landmarks = detection.landmarks;

      if (landmarks && landmarks.length >= 2) {
        const isPointInZone = (point: any) => (
          point.x > TARGET_ZONE.x && point.x < TARGET_ZONE.x + TARGET_ZONE.width &&
          point.y > TARGET_ZONE.y && point.y < TARGET_ZONE.y + TARGET_ZONE.height
        );
        if (isPointInZone(landmarks[0]) && isPointInZone(landmarks[1])) {
          bothEyesInZone = true;
          // FIX: Use ref to check status and prevent multiple timers
          if (!isCapturingRef.current) {
            isCapturingRef.current = true;
            setIsAnimationActive(true);
            captureTimeoutId.current = setTimeout(() => {
              // Send original image instead of cropped
              captureOriginalImage(results.image);
              // cropFace(results.image, detection.boundingBox); // Commented out
            }, 2000);
          }
        }
      }
    }
    
    // FIX: Use ref to reliably cancel the timer
    if (!bothEyesInZone && isCapturingRef.current) {
      isCapturingRef.current = false;
      setIsAnimationActive(false);
      if (captureTimeoutId.current) {
        clearTimeout(captureTimeoutId.current);
      }
    }
  }, [onCapture]);

  useEffect(() => {
    const setupMediaPipe = async () => {
      const faceDetection = new FaceDetection({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });
      faceDetection.setOptions({ model: "short", minDetectionConfidence: 0.7 });
      faceDetection.onResults(onResults);
      
      await faceDetection.initialize();
      faceDetectionRef.current = faceDetection;
      
      setIsLoadingModel(false);
      animate();
    };

    const animate = () => {
      if (webcamRef.current?.video && webcamRef.current.video.readyState === 4 && faceDetectionRef.current) {
        faceDetectionRef.current.send({ image: webcamRef.current.video });
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    setupMediaPipe();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      if (captureTimeoutId.current) clearTimeout(captureTimeoutId.current);
      faceDetectionRef.current?.close();
    };
  }, [onResults]);
  
  useEffect(() => {
    setIsAnimationActive(false);
    isCapturingRef.current = false;
    if(captureTimeoutId.current) clearTimeout(captureTimeoutId.current);
  }, [onReset]);

  const canvasWidth = 640;
  const canvasHeight = 480;
  const x = TARGET_ZONE.x * canvasWidth;
  const y = TARGET_ZONE.y * canvasHeight;
  const width = TARGET_ZONE.width * canvasWidth;
  const height = TARGET_ZONE.height * canvasHeight;
  
  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-inner flex items-center justify-center">
      <style>{roundedRectLoaderCss}</style>
      
      {isLoadingModel ? (
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-white mx-auto mb-4"></div>
          <p>Initializing Camera...</p>
        </div>
      ) : (
        <>
          <div className={`loader-container ${isAnimationActive ? "active" : ""}`}>
            <svg width="100%" height="100%" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}>
              <rect className="rect-guide" x={x} y={y} width={width} height={height} rx="30" />
              <rect className="rect-progress" x={x} y={y} width={width} height={height} rx="30" />
            </svg>
          </div>
          <Webcam
            ref={webcamRef}
            audio={false}
            style={{ position: 'absolute', visibility: 'hidden' }}
            screenshotFormat="image/png"
            videoConstraints={{ width: canvasWidth, height: canvasHeight, facingMode: 'user' }}
          />
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </>
      )}
    </div>
  );
}
