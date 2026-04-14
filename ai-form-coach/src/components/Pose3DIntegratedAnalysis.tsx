"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createExerciseConfig, type IntegratedValidatorState, type IntegratedPoseValidator } from '@/lib/pose/poseValidatorIntegration';
import { createPoseEngine, type PoseEngine2, type PoseEstimateResult } from '@/lib/pose/engine';
import CameraView from './CameraView';
import PoseOverlay from './PoseOverlay';
import { Button, Icon } from '@/ui/DS';
import type { Correction3D, FeedbackMessage } from '@/lib/pose/pose3DFeedback';
import type { Exercise } from '@/lib/validators/types';

// MediaPipe Pose Landmark indices
const POSE_LANDMARKS = {
  // Lower body
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  
  // Upper body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
} as const;

// Exercise-specific joint highlighting
const getHighlightJoints = (exerciseType: string): number[] => {
  switch (exerciseType) {
    case 'squat':
      return [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP];
    case 'pushup':
      return [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER];
    case 'plank':
      return [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP];
    case 'deadlift':
      return [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE];
    case 'lunge':
      return [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP];
    default:
      return [];
  }
};

interface Pose3DIntegratedAnalysisProps {
  exerciseType?: Exercise | 'deadlift' | 'lunge';
  onSessionComplete?: (sessionData: { 
    duration: number; 
    reps: number; 
    averageFormScore: number; 
    bestFormScore: number; 
    improvement: number; 
    exercise: string;
    biomechanicsScore: number;
    stabilityScore: number;
    balanceScore: number;
  }) => void;
  className?: string;
}

export default function Pose3DIntegratedAnalysis({ 
  exerciseType = 'squat', 
  onSessionComplete,
  className = '' 
}: Pose3DIntegratedAnalysisProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseEngineRef = useRef<PoseEngine2 | null>(null);
  const integratedValidatorRef = useRef<IntegratedPoseValidator | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [validatorState, setValidatorState] = useState<IntegratedValidatorState | null>(null);
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

      // Initialize integrated validator
      const { createIntegratedValidator } = await import('@/lib/pose/poseValidatorIntegration');
      integratedValidatorRef.current = createIntegratedValidator(
        exerciseType as Exercise, 
        createExerciseConfig(exerciseType as Exercise)
      );

      setIsInitialized(true);
      console.log('✅ Integrated Pose Analysis System initialized');
    } catch (err) {
      console.error('❌ Failed to initialize Integrated Pose Analysis:', err);
      setError('Failed to initialize pose analysis system');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseType]);

  // Start analysis
  const startAnalysis = useCallback(async () => {
    if (!poseEngineRef.current || !integratedValidatorRef.current || !videoRef.current) {
      return;
    }

    try {
      setIsRunning(true);

      // Start pose detection loop
      const detectPose = async () => {
        if (!isRunning || !poseEngineRef.current || !videoRef.current) {
          return;
        }

        try {
          // Get pose estimate
          const poseResult: PoseEstimateResult | null = await poseEngineRef.current.estimate(videoRef.current);
          
          if (poseResult && integratedValidatorRef.current) {
            // Process through integrated validator
            const timestamp = Date.now();
            const state = await integratedValidatorRef.current.processPose(poseResult, timestamp);
            setValidatorState(state);
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
  }, [isRunning]);

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    setIsRunning(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // End session
  const endSession = useCallback(() => {
    stopAnalysis();
    
    if (integratedValidatorRef.current && validatorState) {
      const sessionSummary = integratedValidatorRef.current.getSessionSummary();
      onSessionComplete?.({
        duration: sessionSummary.duration,
        reps: sessionSummary.repCount,
        averageFormScore: sessionSummary.averageFormScore,
        bestFormScore: sessionSummary.bestFormScore,
        improvement: sessionSummary.improvementRate,
        exercise: exerciseType,
        biomechanicsScore: sessionSummary.biomechanicsScore,
        stabilityScore: sessionSummary.stabilityScore,
        balanceScore: sessionSummary.balanceScore
      });
    }
  }, [stopAnalysis, onSessionComplete, exerciseType, validatorState]);

  // Initialize on mount
  useEffect(() => {
    initializeSystems();
    
    return () => {
      stopAnalysis();
    };
  }, [initializeSystems, stopAnalysis]);

  // Handle exercise type change
  const changeExercise = useCallback(async (newExercise: string) => {
    if (integratedValidatorRef.current) {
      const { createIntegratedValidator, createExerciseConfig } = await import('@/lib/pose/poseValidatorIntegration');
      integratedValidatorRef.current = createIntegratedValidator(
        newExercise as Exercise, 
        createExerciseConfig(newExercise as Exercise)
      );
    }
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Integrated Pose Analysis...</p>
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
          <p className="text-gray-600 mb-4">Integrated Pose Analysis System Ready</p>
          <Button onClick={initializeSystems} variant="primary">
            Initialize
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`pose-3d-integrated-analysis ${className}`}>
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
            {validatorState?.currentPose3D && (
              <PoseOverlay 
                landmarks={validatorState.currentPose3D.landmarks} 
                video={videoRef.current}
                mirror={true}
                labels={false}
                showConfidence={true}
                highlightJoints={getHighlightJoints(exerciseType)}
                corrections={validatorState.currentFeedback3D?.corrections.map(correction => ({
                  joint: correction.joint,
                  position: { x: correction.visualCue.position.x, y: correction.visualCue.position.y },
                  message: correction.correction
                })) || []}
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

        {/* Integrated Feedback Panel */}
        <div className="space-y-4">
          {/* Overall Form Score */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">Overall Form Score</h3>
            <div className="text-3xl font-bold text-blue-600">
              {validatorState?.overallFormScore.toFixed(1) || 0}/100
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${validatorState?.overallFormScore || 0}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              2D: {((validatorState?.overallFormScore || 0) * 0.4).toFixed(1)} | 
              3D: {((validatorState?.overallFormScore || 0) * 0.6).toFixed(1)}
            </div>
          </div>

          {/* Rep Count & Phase */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">Reps & Phase</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-bold text-green-600">
                {validatorState?.repCount || 0}
              </span>
              <span className="text-sm text-gray-600">Reps</span>
            </div>
            <div className="text-lg font-medium capitalize text-purple-600">
              {validatorState?.phase || 'idle'}
            </div>
          </div>

          {/* 3D Analysis Scores */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">3D Analysis</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Form Score:</span>
                <span className="font-medium">{validatorState?.formScore3D.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Biomechanics:</span>
                <span className="font-medium">{validatorState?.biomechanicsScore.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Stability:</span>
                <span className="font-medium">{validatorState?.stabilityScore.toFixed(1) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance:</span>
                <span className="font-medium">{validatorState?.balanceScore.toFixed(1) || 0}</span>
              </div>
            </div>
          </div>

          {/* Session Progress */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">Session Progress</h3>
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {(validatorState?.sessionProgress || 0) * 100}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(validatorState?.sessionProgress || 0) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Improvement: {(validatorState?.improvementRate || 0) * 100}%
            </div>
          </div>

          {/* Real-time Feedback */}
          {validatorState?.currentFeedback3D && (
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-2">Feedback</h3>
              
              {/* Corrections */}
              {validatorState.currentFeedback3D.corrections.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-red-600 mb-1">Corrections:</h4>
                  {validatorState.currentFeedback3D.corrections.map((correction: Correction3D, index: number) => (
                    <div key={index} className="text-sm text-red-600 mb-1">
                      🔧 {correction.correction}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Positive Feedback */}
              {validatorState.currentFeedback3D.positives.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-green-600 mb-1">Great Job:</h4>
                  {validatorState.currentFeedback3D.positives.map((positive: FeedbackMessage, index: number) => (
                    <div key={index} className="text-sm text-green-600 mb-1">
                      ✅ {positive.message}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 2D Cues */}
              {validatorState.cues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-600 mb-1">Cues:</h4>
                  {validatorState.cues.map((cue: string, index: number) => (
                    <div key={index} className="text-sm text-blue-600 mb-1">
                      💡 {cue}
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
