/**
 * 3D Pose Analysis Integration
 * 
 * Integrates all 3D pose analysis components into a unified system
 * Similar to professional fitness apps like Sword Health
 * 
 * Features:
 * - Complete 3D pose analysis pipeline
 * - Real-time feedback and visualization
 * - Exercise-specific coaching
 * - Progress tracking and insights
 */

import { Pose3DAnalyzer, type Pose3D } from './pose3D';
import { RealTimeFeedbackManager, type PoseFeedback3D, type FeedbackMessage } from './pose3DFeedback';
import { Pose3DVisualizationEngine } from './pose3DVisualization';
import type { PoseEstimateResult } from './engine';

// ============================================
// Integration Types
// ============================================

export interface Pose3DSystem {
  // Core components
  analyzer: Pose3DAnalyzer;
  feedbackManager: RealTimeFeedbackManager;
  visualization: Pose3DVisualizationEngine | null;
  
  // State
  currentPose: Pose3D | null;
  currentFeedback: PoseFeedback3D | null;
  exerciseType: string;
  sessionData: SessionData3D;
  
  // Configuration
  config: Pose3DConfig;
}

export interface SessionData3D {
  startTime: number;
  exerciseType: string;
  poses: Pose3D[];
  feedback: PoseFeedback3D[];
  metrics: SessionMetrics3D;
  progress: ProgressData3D;
}

export interface SessionMetrics3D {
  totalReps: number;
  averageFormScore: number;
  bestFormScore: number;
  worstFormScore: number;
  averageStability: number;
  averageBalance: number;
  improvementRate: number;
  sessionDuration: number;
}

export interface ProgressData3D {
  formImprovement: number;
  stabilityImprovement: number;
  balanceImprovement: number;
  rangeOfMotionImprovement: number;
  strengthProgression: number;
  overallProgress: number;
}

export interface Pose3DConfig {
  // Analysis settings
  analysisEnabled: boolean;
  feedbackEnabled: boolean;
  visualizationEnabled: boolean;
  
  // Feedback settings
  feedbackFrequency: number; // ms
  maxCorrections: number;
  showPositives: boolean;
  showProgress: boolean;
  
  // Visualization settings
  showSkeleton: boolean;
  showOverlays: boolean;
  showMovement: boolean;
  showFeedback: boolean;
  
  // Exercise settings
  exerciseType: string;
  targetReps: number;
  targetSets: number;
  
  // Performance settings
  smoothingEnabled: boolean;
  smoothingFactor: number;
  confidenceThreshold: number;
}

// ============================================
// 3D Pose System Manager
// ============================================

export class Pose3DSystemManager {
  private system: Pose3DSystem;
  private isRunning: boolean = false;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private lastUpdateTime: number = 0;

  constructor(config: Partial<Pose3DConfig> = {}) {
    // Initialize system
    this.system = {
      analyzer: new Pose3DAnalyzer(),
      feedbackManager: new RealTimeFeedbackManager(),
      visualization: null,
      currentPose: null,
      currentFeedback: null,
      exerciseType: 'unknown',
      sessionData: {
        startTime: Date.now(),
        exerciseType: 'unknown',
        poses: [],
        feedback: [],
        metrics: {
          totalReps: 0,
          averageFormScore: 0,
          bestFormScore: 0,
          worstFormScore: 100,
          averageStability: 0,
          averageBalance: 0,
          improvementRate: 0,
          sessionDuration: 0
        },
        progress: {
          formImprovement: 0,
          stabilityImprovement: 0,
          balanceImprovement: 0,
          rangeOfMotionImprovement: 0,
          strengthProgression: 0,
          overallProgress: 0
        }
      },
      config: {
        analysisEnabled: true,
        feedbackEnabled: true,
        visualizationEnabled: false,
        feedbackFrequency: 100,
        maxCorrections: 3,
        showPositives: true,
        showProgress: true,
        showSkeleton: true,
        showOverlays: true,
        showMovement: true,
        showFeedback: true,
        exerciseType: 'unknown',
        targetReps: 10,
        targetSets: 3,
        smoothingEnabled: true,
        smoothingFactor: 0.7,
        confidenceThreshold: 0.5,
        ...config
      }
    };
  }

  /**
   * Initialize the 3D pose system
   */
  async initialize(canvas?: HTMLCanvasElement): Promise<void> {
    try {
      // Initialize visualization if canvas provided
      if (canvas && this.system.config.visualizationEnabled) {
        this.system.visualization = new Pose3DVisualizationEngine(canvas);
      }

      // Start the system
      this.start();
      
      console.log('3D Pose System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize 3D Pose System:', error);
      throw error;
    }
  }

  /**
   * Start the 3D pose system
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.system.sessionData.startTime = Date.now();

    // Start update loop
    this.startUpdateLoop();

    console.log('3D Pose System started');
  }

  /**
   * Stop the 3D pose system
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    // Stop update loop
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Stop visualization
    if (this.system.visualization) {
      this.system.visualization.stopAnimation();
    }

    // Calculate final session metrics
    this.calculateSessionMetrics();

    console.log('3D Pose System stopped');
  }

  /**
   * Process new pose estimate
   */
  processPose(poseResult: PoseEstimateResult): Pose3D | null {
    if (!this.isRunning || !this.system.config.analysisEnabled) {
      return null;
    }

    try {
      // Analyze 3D pose
      const pose3D = this.system.analyzer.analyze(poseResult);
      
      // Update current pose
      this.system.currentPose = pose3D;
      
      // Generate feedback
      if (this.system.config.feedbackEnabled) {
        const feedback = this.system.feedbackManager.updateFeedback(
          pose3D, 
          this.system.exerciseType
        );
        
        if (feedback) {
          this.system.currentFeedback = feedback;
          this.system.sessionData.feedback.push(feedback);
        }
      }

      // Add to session data
      this.system.sessionData.poses.push(pose3D);
      
      // Limit session data size
      if (this.system.sessionData.poses.length > 1000) {
        this.system.sessionData.poses.shift();
      }
      if (this.system.sessionData.feedback.length > 100) {
        this.system.sessionData.feedback.shift();
      }

      // Update metrics
      this.updateSessionMetrics(pose3D);

      return pose3D;
    } catch (error) {
      console.error('Error processing pose:', error);
      return null;
    }
  }

  /**
   * Render visualization
   */
  render(): void {
    if (!this.system.visualization || !this.system.currentPose || !this.system.currentFeedback) {
      return;
    }

    try {
      this.system.visualization.render(this.system.currentPose, this.system.currentFeedback);
    } catch (error) {
      console.error('Error rendering visualization:', error);
    }
  }

  /**
   * Set exercise type
   */
  setExerciseType(exerciseType: string): void {
    this.system.exerciseType = exerciseType;
    this.system.sessionData.exerciseType = exerciseType;
    this.system.config.exerciseType = exerciseType;
    
    console.log(`Exercise type set to: ${exerciseType}`);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<Pose3DConfig>): void {
    this.system.config = { ...this.system.config, ...config };
    
    // Update visualization settings
    if (this.system.visualization) {
      this.system.visualization.updateRenderOptions({
        showSkeleton: this.system.config.showSkeleton,
        showOverlays: this.system.config.showOverlays,
        showMovement: this.system.config.showMovement,
        showProgress: this.system.config.showProgress,
        showFeedback: this.system.config.showFeedback
      });
    }
  }

  /**
   * Get current pose
   */
  getCurrentPose(): Pose3D | null {
    return this.system.currentPose;
  }

  /**
   * Get current feedback
   */
  getCurrentFeedback(): PoseFeedback3D | null {
    return this.system.currentFeedback;
  }

  /**
   * Get session data
   */
  getSessionData(): SessionData3D {
    return this.system.sessionData;
  }

  /**
   * Get session metrics
   */
  getSessionMetrics(): SessionMetrics3D {
    return this.system.sessionData.metrics;
  }

  /**
   * Get progress data
   */
  getProgressData(): ProgressData3D {
    return this.system.sessionData.progress;
  }

  /**
   * Get queued feedback messages
   */
  getQueuedFeedback(): FeedbackMessage[] {
    return this.system.feedbackManager.getQueuedFeedback();
  }

  /**
   * Get next queued feedback message
   */
  getNextQueuedMessage(): FeedbackMessage | null {
    return this.system.feedbackManager.getNextQueuedMessage();
  }

  /**
   * Clear all feedback
   */
  clearFeedback(): void {
    this.system.feedbackManager.clearFeedback();
  }

  /**
   * Reset session
   */
  resetSession(): void {
    this.system.sessionData = {
      startTime: Date.now(),
      exerciseType: this.system.exerciseType,
      poses: [],
      feedback: [],
      metrics: {
        totalReps: 0,
        averageFormScore: 0,
        bestFormScore: 0,
        worstFormScore: 100,
        averageStability: 0,
        averageBalance: 0,
        improvementRate: 0,
        sessionDuration: 0
      },
      progress: {
        formImprovement: 0,
        stabilityImprovement: 0,
        balanceImprovement: 0,
        rangeOfMotionImprovement: 0,
        strengthProgression: 0,
        overallProgress: 0
      }
    };
    
    console.log('Session reset');
  }

  /**
   * Get session summary
   */
  getSessionSummary(): { duration: number; reps: number; averageFormScore: number; bestFormScore: number; improvement: number; exercise: string } {
    const sessionData = this.getSessionData();
    const metrics = this.getSessionMetrics();
    const progress = this.getProgressData();
    
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
   * Export session data
   */
  exportSessionData(): string {
    return JSON.stringify(this.system.sessionData, null, 2);
  }

  /**
   * Start update loop
   */
  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      this.update();
    }, this.system.config.feedbackFrequency);
  }

  /**
   * Update system
   */
  private update(): void {
    const now = Date.now();
    
    // Throttle updates
    if (now - this.lastUpdateTime < this.system.config.feedbackFrequency) {
      return;
    }
    
    this.lastUpdateTime = now;
    
    // Update session duration
    this.system.sessionData.metrics.sessionDuration = now - this.system.sessionData.startTime;
    
    // Render visualization
    if (this.system.config.visualizationEnabled) {
      this.render();
    }
  }

  /**
   * Update session metrics
   */
  private updateSessionMetrics(pose3D: Pose3D): void {
    const metrics = this.system.sessionData.metrics;
    const poses = this.system.sessionData.poses;
    
    // Update form scores
    const formScore = pose3D.formScore.overall;
    metrics.averageFormScore = poses.reduce((sum, p) => sum + p.formScore.overall, 0) / poses.length;
    metrics.bestFormScore = Math.max(metrics.bestFormScore, formScore);
    metrics.worstFormScore = Math.min(metrics.worstFormScore, formScore);
    
    // Update stability and balance
    metrics.averageStability = poses.reduce((sum, p) => sum + p.biomechanics.stability.score, 0) / poses.length;
    metrics.averageBalance = poses.reduce((sum, p) => sum + p.biomechanics.balance.score, 0) / poses.length;
    
    // Update rep count (simplified)
    if (pose3D.movement.phase === 'top' && poses.length > 1) {
      const lastPose = poses[poses.length - 2];
      if (lastPose.movement.phase === 'bottom') {
        metrics.totalReps++;
      }
    }
    
    // Calculate improvement rate
    if (poses.length > 10) {
      const recentPoses = poses.slice(-10);
      const olderPoses = poses.slice(-20, -10);
      
      if (olderPoses.length > 0) {
        const recentAvg = recentPoses.reduce((sum, p) => sum + p.formScore.overall, 0) / recentPoses.length;
        const olderAvg = olderPoses.reduce((sum, p) => sum + p.formScore.overall, 0) / olderPoses.length;
        metrics.improvementRate = (recentAvg - olderAvg) / olderAvg;
      }
    }
  }

  /**
   * Calculate final session metrics
   */
  private calculateSessionMetrics(): void {
    const metrics = this.system.sessionData.metrics;
    const poses = this.system.sessionData.poses;
    
    if (poses.length === 0) return;
    
    // Final calculations
    metrics.averageFormScore = poses.reduce((sum, p) => sum + p.formScore.overall, 0) / poses.length;
    metrics.averageStability = poses.reduce((sum, p) => sum + p.biomechanics.stability.score, 0) / poses.length;
    metrics.averageBalance = poses.reduce((sum, p) => sum + p.biomechanics.balance.score, 0) / poses.length;
    
    // Calculate progress
    this.calculateProgress();
  }

  /**
   * Calculate progress data
   */
  private calculateProgress(): void {
    const progress = this.system.sessionData.progress;
    const poses = this.system.sessionData.poses;
    
    if (poses.length < 2) return;
    
    const firstHalf = poses.slice(0, Math.floor(poses.length / 2));
    const secondHalf = poses.slice(Math.floor(poses.length / 2));
    
    // Calculate improvements
    progress.formImprovement = this.calculateImprovement(firstHalf, secondHalf, 'formScore.overall');
    progress.stabilityImprovement = this.calculateImprovement(firstHalf, secondHalf, 'biomechanics.stability.score');
    progress.balanceImprovement = this.calculateImprovement(firstHalf, secondHalf, 'biomechanics.balance.score');
    progress.rangeOfMotionImprovement = this.calculateImprovement(firstHalf, secondHalf, 'formScore.breakdown.rangeOfMotion');
    
    // Overall progress
    progress.overallProgress = (
      progress.formImprovement +
      progress.stabilityImprovement +
      progress.balanceImprovement +
      progress.rangeOfMotionImprovement
    ) / 4;
  }

  /**
   * Calculate improvement between two pose sets
   */
  private calculateImprovement(firstHalf: Pose3D[], secondHalf: Pose3D[], path: string): number {
    if (firstHalf.length === 0 || secondHalf.length === 0) return 0;
    
    const getValue = (pose: Pose3D, path: string): number => {
      const parts = path.split('.');
      let value: unknown = pose;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          return 0;
        }
      }
      return typeof value === 'number' ? value : 0;
    };
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + getValue(p, path), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + getValue(p, path), 0) / secondHalf.length;
    
    return firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stop();
    
    if (this.system.visualization) {
      this.system.visualization.dispose();
    }
    
    console.log('3D Pose System disposed');
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create a new 3D pose system
 */
export function createPose3DSystem(config: Partial<Pose3DConfig> = {}): Pose3DSystemManager {
  return new Pose3DSystemManager(config);
}

/**
 * Create default configuration for specific exercise
 */
export function createExerciseConfig(exerciseType: string): Partial<Pose3DConfig> {
  const configs: Record<string, Partial<Pose3DConfig>> = {
    squat: {
      exerciseType: 'squat',
      targetReps: 12,
      targetSets: 3,
      maxCorrections: 2,
      showMovement: true
    },
    pushup: {
      exerciseType: 'pushup',
      targetReps: 10,
      targetSets: 3,
      maxCorrections: 3,
      showMovement: true
    },
    plank: {
      exerciseType: 'plank',
      targetReps: 1,
      targetSets: 3,
      maxCorrections: 2,
      showMovement: false
    },
    deadlift: {
      exerciseType: 'deadlift',
      targetReps: 8,
      targetSets: 4,
      maxCorrections: 3,
      showMovement: true
    },
    lunge: {
      exerciseType: 'lunge',
      targetReps: 10,
      targetSets: 3,
      maxCorrections: 2,
      showMovement: true
    }
  };
  
  return configs[exerciseType.toLowerCase()] || {};
}

/**
 * Get exercise-specific feedback templates
 */
export function getExerciseFeedbackTemplates(exerciseType: string): Record<string, string[]> {
  const templates: Record<string, Record<string, string[]>> = {
    squat: {
      setup: [
        "Stand with feet shoulder-width apart",
        "Engage your core and keep your chest up",
        "Look straight ahead"
      ],
      eccentric: [
        "Lower down slowly and controlled",
        "Keep your knees over your toes",
        "Maintain a straight back"
      ],
      bottom: [
        "Great depth! Drive through your heels",
        "Keep your chest up",
        "Push your knees out"
      ],
      concentric: [
        "Drive through your heels to stand up",
        "Squeeze your glutes at the top",
        "Keep your core engaged"
      ]
    },
    pushup: {
      setup: [
        "Start in plank position",
        "Keep your body straight from head to heels",
        "Hands slightly wider than shoulders"
      ],
      eccentric: [
        "Lower your chest to the ground",
        "Keep your elbows close to your body",
        "Maintain straight body alignment"
      ],
      bottom: [
        "Great depth! Now push back up",
        "Keep your core tight",
        "Don't let your hips sag"
      ],
      concentric: [
        "Push through your palms",
        "Engage your chest and triceps",
        "Keep your body straight"
      ]
    }
  };
  
  return templates[exerciseType.toLowerCase()] || {};
}
