/**
 * 3D Pose Analysis System - Usage Example
 * 
 * Demonstrates how to use the complete 3D pose analysis system
 * for professional-grade fitness coaching like Sword Health AI
 */

import { createPose3DSystem, createExerciseConfig, type Pose3DSystemManager } from './pose3DIntegration';
import type { PoseEstimateResult } from './engine';
import type { PoseFeedback3D, Correction3D, FeedbackMessage } from './pose3DFeedback';
import type { Pose3D } from './pose3D';

// ============================================
// Example: Complete 3D Pose Analysis Setup
// ============================================

export class Pose3DExample {
  private poseSystem!: Pose3DSystemManager;
  private canvas: HTMLCanvasElement | null = null;

  /**
   * Initialize the 3D pose analysis system
   */
  async initialize(canvasElement: HTMLCanvasElement): Promise<void> {
    try {
      // Create canvas element if not provided
      this.canvas = canvasElement;
      
      // Create 3D pose system with default configuration
      this.poseSystem = createPose3DSystem({
        analysisEnabled: true,
        feedbackEnabled: true,
        visualizationEnabled: true,
        feedbackFrequency: 100, // 10 FPS
        maxCorrections: 3,
        showPositives: true,
        showProgress: true,
        showSkeleton: true,
        showOverlays: true,
        showMovement: true,
        showFeedback: true,
        exerciseType: 'squat',
        targetReps: 12,
        targetSets: 3,
        smoothingEnabled: true,
        smoothingFactor: 0.7,
        confidenceThreshold: 0.5
      });

      // Initialize the system
      await this.poseSystem.initialize(this.canvas);
      
      console.log('✅ 3D Pose Analysis System initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize 3D Pose System:', error);
      throw error;
    }
  }

  /**
   * Start a squat session
   */
  startSquatSession(): void {
    // Set exercise type
    this.poseSystem.setExerciseType('squat');
    
    // Update configuration for squats
    const squatConfig = createExerciseConfig('squat');
    this.poseSystem.updateConfig(squatConfig);
    
    // Start the system
    this.poseSystem.start();
    
    console.log('🏋️ Squat session started!');
  }

  /**
   * Start a push-up session
   */
  startPushupSession(): void {
    // Set exercise type
    this.poseSystem.setExerciseType('pushup');
    
    // Update configuration for push-ups
    const pushupConfig = createExerciseConfig('pushup');
    this.poseSystem.updateConfig(pushupConfig);
    
    // Start the system
    this.poseSystem.start();
    
    console.log('💪 Push-up session started!');
  }

  /**
   * Process pose data from MediaPipe
   */
  processPoseFrame(poseResult: PoseEstimateResult): void {
    try {
      // Process the pose through 3D analysis
      const pose3D = this.poseSystem.processPose(poseResult);
      
      if (pose3D) {
        // Get real-time feedback
        const feedback = this.poseSystem.getCurrentFeedback();
        
        if (feedback) {
          // Display feedback to user
          this.displayFeedback(feedback);
          
          // Log form score
          console.log(`📊 Form Score: ${pose3D.formScore.overall.toFixed(1)}/100`);
          
          // Log movement phase
          console.log(`🔄 Phase: ${pose3D.movement.phase}`);
        }
      }
    } catch (error) {
      console.error('Error processing pose frame:', error);
    }
  }

  /**
   * Display feedback to user
   */
  private displayFeedback(feedback: PoseFeedback3D): void {
    // Display overall feedback
    if (feedback.overall) {
      this.showMessage(feedback.overall.message, feedback.overall.priority);
    }
    
    // Display corrections
    feedback.corrections.forEach((correction: Correction3D) => {
      this.showCorrection(correction);
    });
    
    // Display positive feedback
    feedback.positives.forEach((positive: FeedbackMessage) => {
      this.showPositive(positive.message);
    });
    
    // Display exercise cues
    feedback.exercise.cues.forEach((cue: FeedbackMessage) => {
      this.showCue(cue.message);
    });
  }

  /**
   * Show feedback message
   */
  private showMessage(message: string, priority: string): void {
    const messageElement = document.getElementById('feedback-message');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.className = `feedback-message priority-${priority}`;
    }
  }

  /**
   * Show correction
   */
  private showCorrection(correction: Correction3D): void {
    console.log(`🔧 ${correction.correction}`);
    
    // Show visual correction on screen
    const correctionElement = document.getElementById('correction-display');
    if (correctionElement) {
      correctionElement.innerHTML = `
        <div class="correction">
          <strong>${correction.joint}:</strong> ${correction.correction}
        </div>
      `;
    }
  }

  /**
   * Show positive feedback
   */
  private showPositive(message: string): void {
    console.log(`✅ ${message}`);
    
    // Show positive feedback animation
    const positiveElement = document.getElementById('positive-feedback');
    if (positiveElement) {
      positiveElement.textContent = message;
      positiveElement.className = 'positive-feedback show';
      
      // Hide after 3 seconds
      setTimeout(() => {
        positiveElement.className = 'positive-feedback';
      }, 3000);
    }
  }

  /**
   * Show exercise cue
   */
  private showCue(message: string): void {
    console.log(`💡 ${message}`);
    
    // Show cue on screen
    const cueElement = document.getElementById('exercise-cue');
    if (cueElement) {
      cueElement.textContent = message;
    }
  }

  /**
   * Get session summary
   */
  getSessionSummary(): { duration: number; reps: number; averageFormScore: number; bestFormScore: number; improvement: number; exercise: string } {
    const sessionData = this.poseSystem.getSessionData();
    const metrics = this.poseSystem.getSessionMetrics();
    const progress = this.poseSystem.getProgressData();
    
    return {
      duration: metrics.sessionDuration,
      reps: metrics.totalReps,
      averageFormScore: metrics.averageFormScore,
      bestFormScore: metrics.bestFormScore,
      improvement: progress.overallProgress,
      exercise: sessionData.exerciseType
    };
  }

  /**
   * End session
   */
  endSession(): void {
    // Stop the system
    this.poseSystem.stop();
    
    // Get final summary
    const summary = this.getSessionSummary();
    
    console.log('📈 Session Summary:', summary);
    
    // Export session data
    const sessionData = this.poseSystem.exportSessionData();
    console.log('💾 Session Data:', sessionData);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.poseSystem) {
      this.poseSystem.dispose();
    }
  }
}

// ============================================
// Example: React Component Integration
// ============================================

export const Pose3DComponent = `
import React, { useEffect, useRef, useState } from 'react';
import { createPose3DSystem, createExerciseConfig } from '../lib/pose/pose3DIntegration';

export const Pose3DAnalysis: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseSystemRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<any>(null);
  const [formScore, setFormScore] = useState(0);
  const [exerciseType, setExerciseType] = useState('squat');

  useEffect(() => {
    const initializeSystem = async () => {
      if (canvasRef.current && !poseSystemRef.current) {
        try {
          // Create 3D pose system
          poseSystemRef.current = createPose3DSystem({
            analysisEnabled: true,
            feedbackEnabled: true,
            visualizationEnabled: true,
            exerciseType: exerciseType,
            ...createExerciseConfig(exerciseType)
          });

          // Initialize with canvas
          await poseSystemRef.current.initialize(canvasRef.current);
          
          // Start the system
          poseSystemRef.current.start();
          
          setIsInitialized(true);
          console.log('3D Pose System initialized');
        } catch (error) {
          console.error('Failed to initialize 3D Pose System:', error);
        }
      }
    };

    initializeSystem();

    return () => {
      if (poseSystemRef.current) {
        poseSystemRef.current.dispose();
      }
    };
  }, [exerciseType]);

  const processPoseFrame = (poseResult: any) => {
    if (poseSystemRef.current && isInitialized) {
      const pose3D = poseSystemRef.current.processPose(poseResult);
      
      if (pose3D) {
        setFormScore(pose3D.formScore.overall);
        
        const feedback = poseSystemRef.current.getCurrentFeedback();
        if (feedback) {
          setCurrentFeedback(feedback);
        }
      }
    }
  };

  const changeExercise = (newExercise: string) => {
    setExerciseType(newExercise);
    if (poseSystemRef.current) {
      poseSystemRef.current.setExerciseType(newExercise);
      poseSystemRef.current.updateConfig(createExerciseConfig(newExercise));
    }
  };

  return (
    <div className="pose-3d-analysis">
      <div className="controls">
        <button onClick={() => changeExercise('squat')}>Squat</button>
        <button onClick={() => changeExercise('pushup')}>Push-up</button>
        <button onClick={() => changeExercise('plank')}>Plank</button>
      </div>
      
      <div className="visualization">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600}
          style={{ border: '1px solid #ccc' }}
        />
      </div>
      
      <div className="feedback">
        <div className="form-score">
          Form Score: {formScore.toFixed(1)}/100
        </div>
        
        {currentFeedback && (
          <div className="feedback-messages">
            {currentFeedback.corrections.map((correction: any, index: number) => (
              <div key={index} className="correction">
                🔧 {correction.correction}
              </div>
            ))}
            
            {currentFeedback.positives.map((positive: any, index: number) => (
              <div key={index} className="positive">
                ✅ {positive.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
`;

// ============================================
// Example: Integration with Existing Pose Engine
// ============================================

export class Pose3DIntegrationExample {
  private poseSystem: Pose3DSystemManager;
  private poseEngine: { estimate: (video: HTMLVideoElement) => Promise<PoseEstimateResult | null> }; // Your existing PoseEngine2

  constructor(poseEngine: { estimate: (video: HTMLVideoElement) => Promise<PoseEstimateResult | null> }) {
    this.poseEngine = poseEngine;
    this.poseSystem = createPose3DSystem();
  }

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    await this.poseSystem.initialize(canvas);
    this.poseSystem.start();
  }

  async processFrame(videoElement: HTMLVideoElement): Promise<void> {
    try {
      // Get pose estimate from existing engine
      const poseResult = await this.poseEngine.estimate(videoElement);
      
      if (poseResult) {
        // Process through 3D analysis
        const pose3D = this.poseSystem.processPose(poseResult);
        
        if (pose3D) {
          // Get feedback
          const feedback = this.poseSystem.getCurrentFeedback();
          
          // Update UI with results
          if (feedback) {
            this.updateUI(pose3D, feedback);
          }
        }
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    }
  }

  private updateUI(pose3D: Pose3D, feedback: PoseFeedback3D): void {
    // Update form score display
    const scoreElement = document.getElementById('form-score');
    if (scoreElement) {
      scoreElement.textContent = `Form: ${pose3D.formScore.overall.toFixed(1)}/100`;
    }

    // Update movement phase
    const phaseElement = document.getElementById('movement-phase');
    if (phaseElement) {
      phaseElement.textContent = `Phase: ${pose3D.movement.phase}`;
    }

    // Update feedback
    if (feedback) {
      this.displayFeedback(feedback);
    }
  }

  private displayFeedback(feedback: PoseFeedback3D): void {
    // Display corrections
    const correctionsElement = document.getElementById('corrections');
    if (correctionsElement && feedback.corrections.length > 0) {
      correctionsElement.innerHTML = feedback.corrections
        .map((c: Correction3D) => `<div class="correction">🔧 ${c.correction}</div>`)
        .join('');
    }

    // Display positives
    const positivesElement = document.getElementById('positives');
    if (positivesElement && feedback.positives.length > 0) {
      positivesElement.innerHTML = feedback.positives
        .map((p: FeedbackMessage) => `<div class="positive">✅ ${p.message}</div>`)
        .join('');
    }
  }

  getSessionData(): ReturnType<Pose3DSystemManager['getSessionData']> {
    return this.poseSystem.getSessionData();
  }

  dispose(): void {
    this.poseSystem.dispose();
  }
}

// ============================================
// Example: Advanced Usage with Custom Configuration
// ============================================

export const AdvancedPose3DExample = {
  /**
   * Create a high-performance configuration for real-time analysis
   */
  createHighPerformanceConfig: () => ({
    analysisEnabled: true,
    feedbackEnabled: true,
    visualizationEnabled: true,
    feedbackFrequency: 50, // 20 FPS for high performance
    maxCorrections: 2, // Limit corrections for performance
    showPositives: false, // Disable positives for performance
    showProgress: false,
    showSkeleton: true,
    showOverlays: true,
    showMovement: false, // Disable movement tracking for performance
    showFeedback: true,
    smoothingEnabled: true,
    smoothingFactor: 0.8, // Higher smoothing for stability
    confidenceThreshold: 0.6 // Higher threshold for reliability
  }),

  /**
   * Create a detailed analysis configuration for post-workout review
   */
  createDetailedAnalysisConfig: () => ({
    analysisEnabled: true,
    feedbackEnabled: true,
    visualizationEnabled: true,
    feedbackFrequency: 200, // 5 FPS for detailed analysis
    maxCorrections: 5, // Show all corrections
    showPositives: true,
    showProgress: true,
    showSkeleton: true,
    showOverlays: true,
    showMovement: true,
    showFeedback: true,
    smoothingEnabled: false, // No smoothing for detailed analysis
    smoothingFactor: 0.5,
    confidenceThreshold: 0.3 // Lower threshold for comprehensive analysis
  }),

  /**
   * Create a beginner-friendly configuration
   */
  createBeginnerConfig: () => ({
    analysisEnabled: true,
    feedbackEnabled: true,
    visualizationEnabled: true,
    feedbackFrequency: 300, // 3.3 FPS for beginners
    maxCorrections: 1, // One correction at a time
    showPositives: true,
    showProgress: true,
    showSkeleton: true,
    showOverlays: true,
    showMovement: true,
    showFeedback: true,
    smoothingEnabled: true,
    smoothingFactor: 0.9, // High smoothing for stability
    confidenceThreshold: 0.7 // High threshold for reliability
  })
};

// ============================================
// Example: Performance Monitoring
// ============================================

export class Pose3DPerformanceMonitor {
  private performanceMetrics: {
    frameCount: number;
    totalProcessingTime: number;
    averageProcessingTime: number;
    fps: number;
    lastFrameTime: number;
  } = {
    frameCount: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    fps: 0,
    lastFrameTime: 0
  };

  startMonitoring(): void {
    this.performanceMetrics.lastFrameTime = performance.now();
  }

  recordFrame(): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.performanceMetrics.lastFrameTime;
    
    this.performanceMetrics.frameCount++;
    this.performanceMetrics.totalProcessingTime += frameTime;
    this.performanceMetrics.averageProcessingTime = 
      this.performanceMetrics.totalProcessingTime / this.performanceMetrics.frameCount;
    this.performanceMetrics.fps = 1000 / frameTime;
    this.performanceMetrics.lastFrameTime = currentTime;
  }

  getMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  logMetrics(): void {
    console.log('📊 Performance Metrics:', {
      'Average Processing Time': `${this.performanceMetrics.averageProcessingTime.toFixed(2)}ms`,
      'Current FPS': `${this.performanceMetrics.fps.toFixed(1)}`,
      'Total Frames': this.performanceMetrics.frameCount
    });
  }
}
