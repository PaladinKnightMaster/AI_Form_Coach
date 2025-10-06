"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string, format?: string) => void;
  onClose: () => void;
  title?: string;
  supportedFormats?: string[];
}

export default function BarcodeScanner({ 
  onBarcodeDetected, 
  onClose, 
  title = "Scan Barcode or QR Code",
  supportedFormats = ["QR_CODE", "EAN_13", "EAN_8", "UPC_A", "UPC_E", "CODE_128", "CODE_39", "CODE_93", "CODABAR", "ITF", "RSS_14", "RSS_EXPANDED", "PDF_417", "AZTEC", "DATA_MATRIX"]
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [detectionAttempts, setDetectionAttempts] = useState(0);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const stopScanning = useCallback(() => {
    // Clear timeout if it exists
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    
    if (readerRef.current) {
      readerRef.current.reset();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, [scanTimeout]);

  useEffect(() => {
    const initScanner = async () => {
      try {
        setError(null);
        setIsInitializing(true);
        
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        
        // Configure reader for better detection
        reader.timeBetweenDecodingAttempts = 100; // Faster detection
        
        // Set up hints for better detection
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.CODABAR,
          BarcodeFormat.ITF
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        reader.hints = hints;
        
        // Add debugging
        console.log('ZXing reader initialized with formats:', supportedFormats);
        console.log('ZXing hints configured:', hints);

        // Check for camera permission
        const devices = await reader.listVideoInputDevices();
        if (devices.length === 0) {
          setError('No camera devices found');
          setIsInitializing(false);
          return;
        }

        // Request camera access
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment', // Use back camera on mobile
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 },
              frameRate: { ideal: 30, min: 15 },
              // focusMode: 'continuous', // Auto-focus for better barcode detection
              // exposureMode: 'continuous' // Auto-exposure
            } 
          });
          setHasPermission(true);
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            
            // Wait for video to be ready before playing
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch((error) => {
                  console.log('Video play error (expected):', error.message);
                });
                setIsInitializing(false);
              } else {
                setIsInitializing(false);
              }
            };
          }

          // Start scanning
          setIsScanning(true);
          setDetectionAttempts(0); // Reset attempt counter
          
          // Set a timeout to stop scanning after 60 seconds
          const timeout = setTimeout(() => {
            console.log('⏰ Scanning timeout reached (60s)');
            setError('Scanning timeout. Please try again or use manual search.');
            stopScanning();
          }, 60000);
          setScanTimeout(timeout);

          reader.decodeFromVideoDevice(devices[0].deviceId, videoRef.current, (result, err) => {
            setDetectionAttempts(prev => prev + 1);
            
            if (result) {
              const barcode = result.getText();
              const format = result.getBarcodeFormat().toString();
              console.log('✅ Code detected successfully:', { barcode, format, attempts: detectionAttempts + 1 });
              
              // Clear timeout and stop scanning
              if (scanTimeout) {
                clearTimeout(scanTimeout);
                setScanTimeout(null);
              }
              
              onBarcodeDetected(barcode, format);
              stopScanning();
            }
            if (err) {
              // Log all errors for debugging, but only show user-friendly messages for real errors
              if (err instanceof Error && err.name === 'NotFoundException') {
                // This is normal - no code detected yet, log every 50 attempts
                if ((detectionAttempts + 1) % 50 === 0) {
                  console.log(`🔍 Detection attempt ${detectionAttempts + 1} - no code found yet...`);
                }
              } else {
                console.error('❌ Code scanning error:', err);
                console.error('Error details:', {
                  name: err.name,
                  message: err.message,
                  stack: err.stack,
                  attempts: detectionAttempts + 1
                });
              }
            }
          });

        } catch {
          setHasPermission(false);
          setError('Camera permission denied. Please allow camera access to scan codes.');
          setIsInitializing(false);
        }

      } catch (err) {
        console.error('Failed to initialize code scanner:', err);
        setError('Failed to initialize code scanner');
        setIsInitializing(false);
      }
    };

    initScanner();

    return () => {
      stopScanning();
    };
  }, [detectionAttempts, onBarcodeDetected, scanTimeout, stopScanning, supportedFormats]);

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  const testDetection = () => {
    console.log('🧪 Testing detection with sample barcode...');
    // Use a real barcode that exists in Open Food Facts for testing
    // This is a real Coca-Cola barcode
    onBarcodeDetected('5449000000996', 'EAN_13');
  };

  const restartScanner = () => {
    console.log('🔄 Restarting scanner...');
    stopScanning();
    // Reset states
    setDetectionAttempts(0);
    setError(null);
    setIsInitializing(true);
    // Close and reopen the modal to restart
    onClose();
    setTimeout(() => {
      // This will be handled by the parent component
    }, 100);
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Camera Permission Required</h3>
          <p className="text-gray-600 mb-4">
            To scan barcodes and QR codes, please allow camera access in your browser settings.
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
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Scanner Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
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
      <div className="bg-white rounded-lg p-4 max-w-md mx-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="relative">
          {isInitializing && (
            <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
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
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white rounded-lg">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Position the barcode or QR code within the frame
          </p>
          <p className="text-xs text-gray-500 mb-2">
            Supports: QR codes, EAN, UPC, Code 128, and more
          </p>
          <p className="text-xs text-gray-400 mb-2">
            💡 Tip: Ensure good lighting and hold steady
          </p>
          {isScanning && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-600">Scanning...</span>
            </div>
          )}
          
          {/* Debug Info */}
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <p className="text-gray-600 dark:text-gray-400">
              📊 Debug: {isInitializing ? 'Initializing...' : isScanning ? 'Active' : 'Stopped'} | 
              Camera: {hasPermission ? '✅' : '❌'} | 
              Formats: {supportedFormats.length} | 
              Attempts: {detectionAttempts}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleClose}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          {isScanning && !isInitializing && (
            <button 
              onClick={stopScanning}
              className="btn btn-primary flex-1"
            >
              Stop Scanning
            </button>
          )}
        </div>
        
        {/* Test Buttons */}
        <div className="mt-3 space-y-2">
          <button 
            onClick={testDetection}
            className="w-full px-4 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg border border-yellow-300 transition-colors"
          >
            🧪 Test Detection (Simulate Barcode)
          </button>
          <button 
            onClick={restartScanner}
            className="w-full px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg border border-blue-300 transition-colors"
          >
            🔄 Restart Scanner
          </button>
        </div>
        
        {/* Troubleshooting Tips */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
            🔧 Troubleshooting Tips:
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Ensure good lighting (avoid shadows)</li>
            <li>• Hold camera steady and parallel to code</li>
            <li>• Try different distances (6-12 inches)</li>
            <li>• Clean camera lens if blurry</li>
            <li>• Try both QR codes and barcodes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
