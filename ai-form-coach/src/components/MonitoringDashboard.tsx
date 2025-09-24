'use client';

import { useState, useEffect } from 'react';
import { getErrorSummary, getPerformanceSummary, getSessionId } from '@/lib/monitoring/errorTracking';

interface ErrorSummary {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  errorsByComponent: Record<string, number>;
  recentErrors: Array<{
    id: string;
    timestamp: Date;
    level: string;
    message: string;
    component?: string;
  }>;
}

interface PerformanceSummary {
  averageResponseTime: number;
  slowestRequests: Array<{
    id: string;
    timestamp: Date;
    metric: string;
    value: number;
    component?: string;
  }>;
  performanceByComponent: Record<string, number>;
}

export default function MonitoringDashboard() {
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setSessionId(getSessionId());
    updateMetrics();
    
    // Update metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    setErrorSummary(getErrorSummary());
    setPerformanceSummary(getPerformanceSummary());
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg z-50"
        title="Open Monitoring Dashboard"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Monitoring Dashboard</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Session Info */}
        <div className="text-sm text-gray-600">
          <p><strong>Session:</strong> {sessionId}</p>
        </div>

        {/* Error Summary */}
        {errorSummary && (
          <div className="border-b pb-4">
            <h4 className="font-semibold text-red-600 mb-2">Error Summary</h4>
            <div className="text-sm space-y-1">
              <p><strong>Total Errors:</strong> {errorSummary.totalErrors}</p>
              <div>
                <strong>By Level:</strong>
                <ul className="ml-4">
                  {Object.entries(errorSummary.errorsByLevel).map(([level, count]) => (
                    <li key={level} className="flex justify-between">
                      <span className="capitalize">{level}:</span>
                      <span className="font-mono">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>By Component:</strong>
                <ul className="ml-4">
                  {Object.entries(errorSummary.errorsByComponent).map(([component, count]) => (
                    <li key={component} className="flex justify-between">
                      <span>{component}:</span>
                      <span className="font-mono">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Performance Summary */}
        {performanceSummary && (
          <div className="border-b pb-4">
            <h4 className="font-semibold text-blue-600 mb-2">Performance Summary</h4>
            <div className="text-sm space-y-1">
              <p><strong>Avg Response Time:</strong> {performanceSummary.averageResponseTime.toFixed(2)}ms</p>
              <div>
                <strong>By Component:</strong>
                <ul className="ml-4">
                  {Object.entries(performanceSummary.performanceByComponent).map(([component, avgTime]) => (
                    <li key={component} className="flex justify-between">
                      <span>{component}:</span>
                      <span className="font-mono">{avgTime.toFixed(2)}ms</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recent Errors */}
        {errorSummary && errorSummary.recentErrors.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-600 mb-2">Recent Errors</h4>
            <div className="text-xs space-y-2 max-h-32 overflow-y-auto">
              {errorSummary.recentErrors.slice(0, 3).map((error) => (
                <div key={error.id} className="bg-red-50 p-2 rounded border-l-2 border-red-300">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-red-700">{error.level}</span>
                    <span className="text-gray-500">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700 mt-1 truncate">{error.message}</p>
                  {error.component && (
                    <p className="text-gray-500 text-xs">Component: {error.component}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={updateMetrics}
            className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              // Clear local data
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="flex-1 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Clear & Reload
          </button>
        </div>
      </div>
    </div>
  );
}
