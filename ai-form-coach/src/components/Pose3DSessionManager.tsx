"use client";

import React, { useState, useCallback } from 'react';
import { Button, Icon } from '@/ui/DS';
import type { SessionData3D } from '@/lib/pose/pose3DIntegration';

interface Pose3DSessionManagerProps {
  sessionData: SessionData3D | null;
  onExportSession?: (data: string) => void;
  onSaveSession?: (data: SessionData3D) => void;
  className?: string;
}

export default function Pose3DSessionManager({ 
  sessionData, 
  onExportSession,
  onSaveSession,
  className = '' 
}: Pose3DSessionManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'progress' | 'export'>('overview');
  const [isExporting, setIsExporting] = useState(false);

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const exportSessionData = useCallback(async () => {
    if (!sessionData) return;
    
    setIsExporting(true);
    try {
      const exportData = {
        session: sessionData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      onExportSession?.(jsonString);
      
      // Also trigger download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pose-session-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting session data:', error);
    } finally {
      setIsExporting(false);
    }
  }, [sessionData, onExportSession]);

  const saveSession = useCallback(() => {
    if (sessionData) {
      onSaveSession?.(sessionData);
    }
  }, [sessionData, onSaveSession]);

  if (!sessionData) {
    return (
      <div className={`pose-session-manager ${className}`}>
        <div className="text-center p-8">
          <Icon name="activity" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Session Data
          </h3>
          <p className="text-gray-500">
            Start a workout session to see detailed analytics
          </p>
        </div>
      </div>
    );
  }

  const metrics = sessionData.metrics;
  const progress = sessionData.progress;

  return (
    <div className={`pose-session-manager bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Session Analytics</h3>
            <p className="text-sm text-gray-600">
              {sessionData.exerciseType} • {formatDuration(metrics.sessionDuration)}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={saveSession}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Icon name="save" className="w-4 h-4" />
              Save
            </Button>
            
            <Button
              onClick={exportSessionData}
              variant="primary"
              size="sm"
              disabled={isExporting}
              className="flex items-center gap-1"
            >
              <Icon name={isExporting ? "activity" : "external-link"} className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: 'chart' as const },
          { id: 'metrics', label: 'Metrics', icon: 'trending-up' as const },
          { id: 'progress', label: 'Progress', icon: 'target' as const },
          { id: 'export', label: 'Export', icon: 'external-link' as const }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'metrics' | 'progress' | 'export')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon name={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalReps}</div>
                <div className="text-sm text-blue-600">Total Reps</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.averageFormScore.toFixed(1)}
                </div>
                <div className="text-sm text-green-600">Avg Form Score</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.bestFormScore.toFixed(1)}
                </div>
                <div className="text-sm text-purple-600">Best Score</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatDuration(metrics.sessionDuration)}
                </div>
                <div className="text-sm text-orange-600">Duration</div>
              </div>
            </div>

            {/* Session Timeline */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Session Timeline</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Started:</span>
                  <span>{formatTimestamp(sessionData.startTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Exercise:</span>
                  <span className="capitalize">{sessionData.exerciseType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Poses Analyzed:</span>
                  <span>{sessionData.poses.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Feedback Generated:</span>
                  <span>{sessionData.feedback.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Form Scores */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Form Scores</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Average Score:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${metrics.averageFormScore}%` }}
                      />
                    </div>
                    <span className="font-medium">{metrics.averageFormScore.toFixed(1)}/100</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Best Score:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${metrics.bestFormScore}%` }}
                      />
                    </div>
                    <span className="font-medium">{metrics.bestFormScore.toFixed(1)}/100</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Worst Score:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${metrics.worstFormScore}%` }}
                      />
                    </div>
                    <span className="font-medium">{metrics.worstFormScore.toFixed(1)}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stability & Balance */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Stability & Balance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Average Stability</div>
                  <div className="text-xl font-bold">{metrics.averageStability.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Average Balance</div>
                  <div className="text-xl font-bold">{metrics.averageBalance.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Improvement Rate */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Improvement Rate</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon 
                    name={metrics.improvementRate > 0 ? "trending-up" : "activity"} 
                    className={`w-5 h-5 ${metrics.improvementRate > 0 ? 'text-green-500' : 'text-red-500'}`} 
                  />
                  <span className="text-lg font-bold">
                    {(metrics.improvementRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {metrics.improvementRate > 0 ? 'Improving' : 'Declining'} over session
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Progress Metrics */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Progress Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Form Improvement:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.max(0, progress.formImprovement * 100)}%` }}
                      />
                    </div>
                    <span className="font-medium">{(progress.formImprovement * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Stability Improvement:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.max(0, progress.stabilityImprovement * 100)}%` }}
                      />
                    </div>
                    <span className="font-medium">{(progress.stabilityImprovement * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Balance Improvement:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${Math.max(0, progress.balanceImprovement * 100)}%` }}
                      />
                    </div>
                    <span className="font-medium">{(progress.balanceImprovement * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>ROM Improvement:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${Math.max(0, progress.rangeOfMotionImprovement * 100)}%` }}
                      />
                    </div>
                    <span className="font-medium">{(progress.rangeOfMotionImprovement * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Progress */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Overall Progress</h4>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {(progress.overallProgress * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {progress.overallProgress > 0.1 ? 'Great improvement!' : 
                     progress.overallProgress > 0 ? 'Steady progress' : 'Room for improvement'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-3">Export Session Data</h4>
              <p className="text-gray-600 mb-4">
                Export your session data for analysis, sharing, or backup purposes.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={exportSessionData}
                  variant="primary"
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Icon name={isExporting ? "activity" : "external-link"} className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Download JSON'}
                </Button>
                
                <div className="text-sm text-gray-500">
                  <p>Export includes:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Complete pose analysis data</li>
                    <li>Session metrics and progress</li>
                    <li>Feedback history</li>
                    <li>Timestamps and metadata</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
