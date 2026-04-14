"use client";

import React, { useState, useCallback } from 'react';
import { Button, Icon } from '@/ui/DS';
import Pose3DIntegratedAnalysis from './Pose3DIntegratedAnalysis';
import Pose3DCoach from './Pose3DCoach';
import Pose3DSessionManager from './Pose3DSessionManager';
import type { SessionData3D } from '@/lib/pose/pose3DIntegration';

interface Pose3DWorkoutProps {
  className?: string;
}

export default function Pose3DWorkout({ className = '' }: Pose3DWorkoutProps) {
  const [currentView, setCurrentView] = useState<'analysis' | 'coach' | 'session'>('analysis');
  const [sessionData, setSessionData] = useState<SessionData3D | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const handleSessionComplete = useCallback((sessionData: { duration: number; reps: number; averageFormScore: number; bestFormScore: number; improvement: number; exercise: string; biomechanicsScore: number; stabilityScore: number; balanceScore: number }) => {
    // Create a mock SessionData3D from the simplified data
    const mockSessionData: SessionData3D = {
      startTime: Date.now() - sessionData.duration,
      exerciseType: sessionData.exercise,
      poses: [],
      feedback: [],
      metrics: {
        totalReps: sessionData.reps,
        averageFormScore: sessionData.averageFormScore,
        bestFormScore: sessionData.bestFormScore,
        worstFormScore: 0,
        averageStability: 0,
        averageBalance: 0,
        improvementRate: sessionData.improvement,
        sessionDuration: sessionData.duration
      },
      progress: {
        formImprovement: sessionData.improvement,
        stabilityImprovement: sessionData.stabilityScore,
        balanceImprovement: sessionData.balanceScore,
        rangeOfMotionImprovement: sessionData.biomechanicsScore,
        strengthProgression: 0,
        overallProgress: sessionData.improvement
      }
    };
    setSessionData(mockSessionData);
    setIsSessionActive(false);
    setCurrentView('session');
  }, []);

  const handleStartSession = useCallback(() => {
    setIsSessionActive(true);
    setCurrentView('analysis');
  }, []);

  const handleStopSession = useCallback(() => {
    setIsSessionActive(false);
  }, []);

  const handleExportSession = useCallback((data: string) => {
    console.log('Session exported:', data);
    // You could also send this to your backend
  }, []);

  const handleSaveSession = useCallback((data: SessionData3D) => {
    console.log('Session saved:', data);
    // You could save this to your database
  }, []);

  return (
    <div className={`pose-3d-workout ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              3D Pose Analysis Workout
            </h1>
            <p className="text-gray-600 mt-1">
              Professional-grade form analysis and real-time coaching
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {isSessionActive ? 'Session Active' : 'Session Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'analysis', label: 'Analysis', icon: 'camera' as const },
            { id: 'coach', label: 'Coach', icon: 'message' as const },
            { id: 'session', label: 'Session', icon: 'chart' as const }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as 'analysis' | 'coach' | 'session')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon name={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {currentView === 'analysis' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">3D Pose Analysis</h2>
              <div className="flex gap-2">
                {!isSessionActive && (
                  <Button
                    onClick={handleStartSession}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <Icon name="play" className="w-4 h-4" />
                    Start Workout
                  </Button>
                )}
                
                {isSessionActive && (
                  <Button
                    onClick={handleStopSession}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Icon name="stop" className="w-4 h-4" />
                    End Workout
                  </Button>
                )}
              </div>
            </div>
            
            <Pose3DIntegratedAnalysis
              onSessionComplete={handleSessionComplete}
              className="min-h-[600px]"
            />
          </div>
        )}

        {currentView === 'coach' && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Real-time Coaching</h2>
              <p className="text-gray-600 mt-1">
                Get instant feedback and coaching cues during your workout
              </p>
            </div>
            
            <Pose3DCoach
              feedback={null} // This would come from the analysis component
              isActive={isSessionActive}
              onStart={handleStartSession}
              onStop={handleStopSession}
              className="min-h-[400px]"
            />
          </div>
        )}

        {currentView === 'session' && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Session Analytics</h2>
              <p className="text-gray-600 mt-1">
                Review your workout performance and track your progress
              </p>
            </div>
            
            <Pose3DSessionManager
              sessionData={sessionData}
              onExportSession={handleExportSession}
              onSaveSession={handleSaveSession}
              className="min-h-[500px]"
            />
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      {sessionData && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {sessionData.metrics.totalReps}
                </div>
                <div className="text-xs text-gray-600">Reps</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {sessionData.metrics.averageFormScore.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600">Avg Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {Math.floor(sessionData.metrics.sessionDuration / 1000)}s
                </div>
                <div className="text-xs text-gray-600">Duration</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {sessionData.exerciseType}
                </div>
                <div className="text-xs text-gray-600">Exercise</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentView('analysis')}
                variant="outline"
                size="sm"
              >
                New Workout
              </Button>
              
              <Button
                onClick={() => setCurrentView('session')}
                variant="primary"
                size="sm"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
