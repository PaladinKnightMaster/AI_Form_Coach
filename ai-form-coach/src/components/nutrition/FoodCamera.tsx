"use client";

import React, { useRef, useState, useCallback } from 'react';
import { Icon } from '@/ui/DS';

interface FoodCameraProps {
  onPhotoTaken: (file: File) => void;
  onClose: () => void;
}

export default function FoodCamera({ onPhotoTaken, onClose }: FoodCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsInitializing(true);
      
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready before playing
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
            setIsInitializing(false);
          }
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setHasPermission(false);
      setError('Camera permission denied. Please allow camera access to take food photos.');
      setIsInitializing(false);
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setIsCapturing(false);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `food-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onPhotoTaken(file);
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.9);
  }, [onPhotoTaken]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Camera Permission Required</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            To analyze food with AI, please allow camera access in your browser settings.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={handleClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary flex-1"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Camera Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={handleClose}
            className="btn btn-primary w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md mx-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">🤖 AI Food Analysis</h3>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="relative">
          {isInitializing && (
            <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Initializing camera...</p>
              </div>
            </div>
          )}
          <video
            ref={videoRef}
            className={`w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg object-cover ${isInitializing ? 'hidden' : ''}`}
            playsInline
            muted
          />
          
          {/* Camera overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white rounded-lg">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
            </div>
            
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 border-2 border-white rounded-full opacity-50"></div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Position your food in the center of the frame for best AI analysis
          </p>
          
          <div className="flex gap-3">
            <button 
              onClick={handleClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button 
              onClick={capturePhoto}
              disabled={isCapturing || !stream || isInitializing}
              className="btn btn-primary flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
            >
              {isCapturing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Capturing...
                </>
              ) : (
                <>
                  <Icon name="camera" className="w-4 h-4 mr-2" />
                  🤖 Analyze Food
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
