"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPose3DSystem, createExerciseConfig, type Pose3DSystemManager } from '@/lib/pose/pose3DIntegration';
import { createPoseEngine, type PoseEngine2, type PoseEstimateResult } from '@/lib/pose/engine';
import CameraView from './CameraView';
import PoseOverlay from './PoseOverlay';
import { Button, Icon } from '@/ui/DS';
import type { Pose3D } from '@/lib/pose/pose3D';
import type { PoseFeedback3D, Correction3D, FeedbackMessage } from '@/lib/pose/pose3DFeedback';

interface Pose3DAnalysisProps {
  exerciseType?: 'squat' | 'pushup' | 'plank' | 'deadlift' | 'lunge';
  onSessionComplete?: (sessionData: { duration: number; reps: number; averageFormScore: number; bestFormScore: number; improvement: number; exercise: string }) => void;
  className?: string;
}

export default function Pose3DAnalysis({ 
  exerciseType = 'squat', 
  onSessionComplete,
  className = '' 
}: Pose3DAnalysisProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseSystemRef = useRef<Pose3DSystemManager | null>(null);
  const poseEngineRef = useRef<PoseEngine2 | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPose, setCurrentPose] = useState<Pose3D | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<PoseFeedback3D | null>(null);
  const [formScore, setFormScore] = useState(0);
  const [movementPhase, setMovementPhase] = useState<string>('setup');
  const [sessionMetrics, setSessionMetrics] = useState<{ duration: number; reps: number; averageFormScore: number; bestFormScore: number; improvement: number; exercise: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize systems
  const initializeSystems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize pose engine
      poseEngineRef.current = await createPoseEngine({
        model: 'lite',
        smoothingAlpha: 0.7,
        visibilityThreshold: 0.5
      });

      // Initialize 3D pose system
      poseSystemRef.current = createPose3DSystem({
        analysisEnabled: true,
        feedbackEnabled: true,
        visualizationEnabled: true,
        exerciseType,
        feedbackFrequency: 100, // 10 FPS
        maxCorrections: 3,
        showPositives: true,
        showProgress: true,
        showSkeleton: true,
        showOverlays: true,
        showMovement: true,
        showFeedback: true,
        ...createExerciseConfig(exerciseType)
      });

      // Initialize with canvas
      if (canvasRef.current) {
        await poseSystemRef.current.initialize(canvasRef.current);
      }

      setIsInitialized(true);
      console.log('✅ 3D Pose Analysis System initialized');
    } catch (err) {
      console.error('❌ Failed to initialize 3D Pose Analysis:', err);
      setError('Failed to initialize pose analysis system');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseType]);

  // Start analysis
  const startAnalysis = useCallback(async () => {
    if (!poseSystemRef.current || !poseEngineRef.current || !videoRef.current) {
      return;
    }

    try {
      setIsRunning(true);
      poseSystemRef.current.start();

      // Start pose detection loop
      const detectPose = async () => {
        if (!isRunning || !poseEngineRef.current || !videoRef.current) {
          return;
        }

        try {
          // Get pose estimate
          const poseResult: PoseEstimateResult | null = await poseEngineRef.current.estimate(videoRef.current);
          
          if (poseResult && poseSystemRef.current) {
            // Process through 3D analysis
            const pose3D = poseSystemRef.current.processPose(poseResult);
            
            if (pose3D) {
              setCurrentPose(pose3D);
              setFormScore(pose3D.formScore.overall);
              setMovementPhase(pose3D.movement.phase);
              
              // Get feedback
              const feedback = poseSystemRef.current.getCurrentFeedback();
              if (feedback) {
                setCurrentFeedback(feedback);
              }
              
              // Update session metrics
              const metrics = poseSystemRef.current.getSessionMetrics();
              setSessionMetrics({
                duration: metrics.sessionDuration,
                reps: metrics.totalReps,
                averageFormScore: metrics.averageFormScore,
                bestFormScore: metrics.bestFormScore,
                improvement: metrics.improvementRate,
                exercise: exerciseType
              });
            }
          }
        } catch (err) {
          console.error('Error in pose detection loop:', err);
        }

        // Continue loop
        animationFrameRef.current = requestAnimationFrame(detectPose);
      };

      detectPose();
    } catch (err) {
      console.error('Error starting analysis:', err);
      setError('Failed to start pose analysis');
    }
  }, [isRunning, exerciseType]);

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    setIsRunning(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (poseSystemRef.current) {
      poseSystemRef.current.stop();
    }
  }, []);

  // End session
  const endSession = useCallback(() => {
    stopAnalysis();
    
    if (poseSystemRef.current) {
      const sessionData = poseSystemRef.current.getSessionData();
      onSessionComplete?.({
        duration: sessionData.metrics.sessionDuration,
        reps: sessionData.metrics.totalReps,
        averageFormScore: sessionData.metrics.averageFormScore,
        bestFormScore: sessionData.metrics.bestFormScore,
        improvement: sessionData.metrics.improvementRate,
        exercise: sessionData.exerciseType
      });
    }
  }, [stopAnalysis, onSessionComplete]);

  // Initialize on mount
  useEffect(() => {
    initializeSystems();
    
    return () => {
      stopAnalysis();
      if (poseSystemRef.current) {
        poseSystemRef.current.dispose();
      }
    };
  }, [initializeSystems, stopAnalysis]);

  // Handle exercise type change
  const changeExercise = useCallback((newExercise: string) => {
    if (poseSystemRef.current) {
      poseSystemRef.current.setExerciseType(newExercise);
      poseSystemRef.current.updateConfig(createExerciseConfig(newExercise));
    }
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing 3D Pose Analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Icon name="alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={initializeSystems} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Icon name="camera" className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">3D Pose Analysis System Ready</p>
          <Button onClick={initializeSystems} variant="primary">
            Initialize
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`pose-3d-analysis ${className}`}>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          onClick={isRunning ? stopAnalysis : startAnalysis}
          variant={isRunning ? "secondary" : "primary"}
          className="flex items-center gap-2"
        >
          <Icon name={isRunning ? "pause" : "play"} className="w-4 h-4" />
          {isRunning ? 'Stop Analysis' : 'Start Analysis'}
        </Button>
        
        <Button
          onClick={endSession}
          variant="outline"
          disabled={!isRunning}
        >
          End Session
        </Button>

        {/* Exercise Selection */}
        <div className="flex gap-1 ml-auto">
          {['squat', 'pushup', 'plank', 'deadlift', 'lunge'].map((exercise) => (
            <Button
              key={exercise}
              onClick={() => changeExercise(exercise)}
              variant={exerciseType === exercise ? "primary" : "outline"}
              size="sm"
              className="capitalize"
            >
              {exercise}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Analysis Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Camera and Pose Overlay */}
        <div className="lg:col-span-2 relative">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <CameraView ref={videoRef} className="w-full h-96" />
            {currentPose && (
              <PoseOverlay 
                landmarks={currentPose.landmarks} 
                video={videoRef.current}
                mirror={true}
                labels={false}
              />
            )}
            
            {/* 3D Visualization Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
            />
          </div>
        </div>

        {/* Feedback Panel */}
        <div className="space-y-4">
          {/* Form Score */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">Form Score</h3>
            <div className="text-3xl font-bold text-blue-600">
              {formScore.toFixed(1)}/100
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${formScore}%` }}
              />
            </div>
          </div>

          {/* Movement Phase */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">Movement Phase</h3>
            <div className="text-xl font-medium capitalize text-green-600">
              {movementPhase}
            </div>
          </div>

          {/* Session Metrics */}
          {sessionMetrics && (
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-2">Session Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Reps:</span>
                  <span className="font-medium">{sessionMetrics.reps}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Score:</span>
                  <span className="font-medium">{sessionMetrics.averageFormScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Best Score:</span>
                  <span className="font-medium">{sessionMetrics.bestFormScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">
                    {Math.floor(sessionMetrics.duration / 1000)}s
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Feedback */}
          {currentFeedback && (
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-2">Feedback</h3>
              
              {/* Corrections */}
              {currentFeedback.corrections.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-red-600 mb-1">Corrections:</h4>
                  {currentFeedback.corrections.map((correction: Correction3D, index: number) => (
                    <div key={index} className="text-sm text-red-600 mb-1">
                      🔧 {correction.correction}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Positive Feedback */}
              {currentFeedback.positives.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-green-600 mb-1">Great Job:</h4>
                  {currentFeedback.positives.map((positive: FeedbackMessage, index: number) => (
                    <div key={index} className="text-sm text-green-600 mb-1">
                      ✅ {positive.message}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Exercise Cues */}
              {currentFeedback.exercise.cues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-600 mb-1">Cues:</h4>
                  {currentFeedback.exercise.cues.map((cue: FeedbackMessage, index: number) => (
                    <div key={index} className="text-sm text-blue-600 mb-1">
                      💡 {cue.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Exercise Instructions */}
      <div className="mt-4 bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Exercise Instructions</h3>
        <div className="text-sm text-gray-700">
          {exerciseType === 'squat' && (
            <p>Stand with feet shoulder-width apart. Lower down by bending your knees and hips, keeping your chest up and knees over your toes. Drive through your heels to return to standing.</p>
          )}
          {exerciseType === 'pushup' && (
            <p>Start in plank position with hands slightly wider than shoulders. Lower your chest to the ground, keeping your body straight. Push back up to starting position.</p>
          )}
          {exerciseType === 'plank' && (
            <p>Start in push-up position. Hold your body in a straight line from head to heels. Engage your core and keep your hips level.</p>
          )}
          {exerciseType === 'deadlift' && (
            <p>Stand with feet hip-width apart, bar over mid-foot. Hinge at hips while keeping back straight. Drive hips forward to stand up tall.</p>
          )}
          {exerciseType === 'lunge' && (
            <p>Step forward with one leg, lowering your hips until both knees are bent at 90 degrees. Push back to starting position.</p>
          )}
        </div>
      </div>
    </div>
  );
}
