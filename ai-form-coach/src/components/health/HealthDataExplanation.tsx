"use client";

import { useState } from 'react';
import { Button, Icon } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';

interface HealthDataExplanationProps {
  onConnect: () => void;
  onManualInput: () => void;
  isConnecting?: boolean;
}

export default function HealthDataExplanation({ 
  onConnect, 
  onManualInput, 
  isConnecting = false 
}: HealthDataExplanationProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { info: showInfo } = useToastContext();

  const handleConnect = () => {
    showInfo(
      'Health Data Connection', 
      'This will request permission to access your device\'s health data. On mobile devices, this connects to Apple Health or Health Connect. On desktop, manual input is recommended.'
    );
    onConnect();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Health Data Connection
        </h3>
        <Button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Icon name="info" className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              The "Connect Health Data" button requests permission to access your device's built-in health data, 
              not external Bluetooth devices.
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-4 pl-8">
            <div className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                📱 Mobile Devices (iOS/Android)
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• <strong>iOS:</strong> Connects to Apple Health (HealthKit)</li>
                <li>• <strong>Android:</strong> Connects to Health Connect or Google Fit</li>
                <li>• Accesses data from your phone's built-in sensors</li>
                <li>• Includes data from connected fitness apps and wearables</li>
                <li>• No Bluetooth pairing required - uses existing health data</li>
              </ul>
            </div>

            <div className="border-l-2 border-green-200 dark:border-green-800 pl-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                💻 Desktop/Web Browsers
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• <strong>Limited Web APIs:</strong> Some browsers support Web Bluetooth</li>
                <li>• <strong>Manual Input:</strong> Recommended for desktop users</li>
                <li>• <strong>Future:</strong> Could connect to Bluetooth heart rate monitors</li>
                <li>• <strong>Current:</strong> Primarily uses manual assessment</li>
              </ul>
            </div>

            <div className="border-l-2 border-yellow-200 dark:border-yellow-800 pl-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                🔗 What Data is Accessed?
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• <strong>Sleep:</strong> Duration and quality from sleep tracking</li>
                <li>• <strong>Heart Rate:</strong> Resting heart rate and HRV</li>
                <li>• <strong>Activity:</strong> Steps, active minutes, distance</li>
                <li>• <strong>Workouts:</strong> Exercise sessions and calories burned</li>
                <li>• <strong>Body:</strong> Weight, body fat percentage (if available)</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </div>
            ) : (
              <>
                <Icon name="link" className="w-4 h-4 mr-2" />
                Connect Health Data
              </>
            )}
          </Button>
          
          <Button
            onClick={onManualInput}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
          >
            <Icon name="edit" className="w-4 h-4 mr-2" />
            Manual Input
          </Button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 <strong>Tip:</strong> On mobile devices, this connects to your existing health apps. 
          On desktop, manual input provides the same functionality.
        </div>
      </div>
    </div>
  );
}
