"use client";

import { LoadingSpinner, Card } from '@/ui/DS';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  blur?: boolean;
}

export default function LoadingOverlay({ 
  isVisible, 
  message = "Loading...", 
  progress,
  blur = true 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${blur ? 'backdrop-blur-sm' : ''} bg-black/20`}>
      <Card className="max-w-sm w-full mx-4 p-8 text-center" padding="lg">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" className="text-green-600" />
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {message}
            </h3>
            
            {progress !== undefined && (
              <div className="w-full">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
