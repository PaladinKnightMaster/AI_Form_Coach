/**
 * Pose Validator Integration
 * 
 * Bridges 2D validators with 3D pose analysis for comprehensive form assessment
 * Provides unified workflow combining rep counting, form scoring, and 3D biomechanical analysis
 */

import { createValidator } from '../validators';
import type { Validator, RepMetric } from '../validators/types';
import { Pose3DAnalyzer, type Pose3D } from './pose3D';
import { RealTimeFeedbackManager, type PoseFeedback3D } from './pose3DFeedback';
import type { PoseEstimateResult } from './engine';
import type { Exercise } from '../validators/types';

// ============================================
// Integration Types
// ============================================

export interface IntegratedValidatorState {
  // 2D Validator State
  repCount: number;
  phase: 'idle' | 'down' | 'up' | 'hold';
  cues: string[];
  metrics: RepMetric[];
  
  // 3D Analysis State
  currentPose3D: Pose3D | null;
  currentFeedback3D: PoseFeedback3D | null;
  formScore3D: number;
  biomechanicsScore: number;
  stabilityScore: number;
  balanceScore: number;
  
  // Combined Metrics
  overallFormScore: number;
  sessionProgress: number;
  improvementRate: number;
}

export interface IntegratedValidatorConfig {
  // 2D Validator Config
  debounceFrames?: number;
  bestSide?: 'left' | 'right';
  squat?: { downDepth: number; upDepth: number };
  pushup?: { bottomElbow: number; topElbow: number };
  plank?: { minHipAngle: number };
  
  // 3D Analysis Config
  analysisEnabled?: boolean;
  feedbackEnabled?: boolean;
  confidenceThreshold?: number;
  smoothingFactor?: number;
  
  // Integration Config
  weight2D?: number; // Weight for 2D analysis (0-1)
  weight3D?: number; // Weight for 3D analysis (0-1)
  enableBiomechanics?: boolean;
  enableStabilityAnalysis?: boolean;
}

// ============================================
// Integrated Validator
// ============================================

export class IntegratedPoseValidator {
  private validator: Validator;
  private analyzer3D: Pose3DAnalyzer;
  private feedbackManager: RealTimeFeedbackManager;
  private config: Required<IntegratedValidatorConfig>;
  private state: IntegratedValidatorState;
  private sessionStartTime: number;
  private lastUpdateTime: number;
  private poseHistory: Pose3D[] = [];
  private feedbackHistory: PoseFeedback3D[] = [];

  constructor(exercise: Exercise, config: IntegratedValidatorConfig = {}) {
    // Initialize 2D validator
    this.validator = createValidator(exercise);
    
    // Initialize 3D components
    this.analyzer3D = new Pose3DAnalyzer();
    this.feedbackManager = new RealTimeFeedbackManager();
    
    // Set default configuration
    this.config = {
      debounceFrames: 3,
      bestSide: 'right',
      squat: { downDepth: 35, upDepth: 10 },
      pushup: { bottomElbow: 70, topElbow: 155 },
      plank: { minHipAngle: 170 },
      analysisEnabled: true,
      feedbackEnabled: true,
      confidenceThreshold: 0.5,
      smoothingFactor: 0.7,
      weight2D: 0.4, // 40% weight for 2D analysis
      weight3D: 0.6, // 60% weight for 3D analysis
      enableBiomechanics: true,
      enableStabilityAnalysis: true,
      ...config
    };
    
    // Initialize state
    this.state = {
      repCount: 0,
      phase: 'idle',
      cues: [],
      metrics: [],
      currentPose3D: null,
      currentFeedback3D: null,
      formScore3D: 0,
      biomechanicsScore: 0,
      stabilityScore: 0,
      balanceScore: 0,
      overallFormScore: 0,
      sessionProgress: 0,
      improvementRate: 0
    };
    
    this.sessionStartTime = Date.now();
    this.lastUpdateTime = Date.now();
  }

  /**
   * Process pose estimate with integrated 2D and 3D analysis
   */
  async processPose(poseResult: PoseEstimateResult, timestamp: number): Promise<IntegratedValidatorState> {
    if (!poseResult || !poseResult.landmarks) {
      return this.state;
    }

    try {
      // 1. Run 2D validator for rep counting and phase detection
      const validatorResult = this.validator(poseResult, timestamp, {
        debounceFrames: this.config.debounceFrames,
        bestSide: this.config.bestSide,
        squat: this.config.squat,
        pushup: this.config.pushup,
        plank: this.config.plank
      });
      
      // Handle async validators
      const validatorState = validatorResult instanceof Promise ? await validatorResult : validatorResult;

      // 2. Run 3D analysis for advanced form assessment
      let pose3D: Pose3D | null = null;
      let feedback3D: PoseFeedback3D | null = null;
      
      if (this.config.analysisEnabled) {
        pose3D = this.analyzer3D.analyze(poseResult);
        
        if (pose3D && this.config.feedbackEnabled) {
          feedback3D = this.feedbackManager.updateFeedback(pose3D, this.getExerciseType());
        }
      }

      // 3. Update state with 2D validator results
      this.state.repCount = validatorState.repCount;
      this.state.phase = validatorState.phase;
      this.state.cues = validatorState.cues;
      this.state.metrics = validatorState.metrics;

      // 4. Update state with 3D analysis results
      if (pose3D) {
        this.state.currentPose3D = pose3D;
        this.state.formScore3D = pose3D.formScore.overall;
        this.state.biomechanicsScore = (pose3D.biomechanics.stability.score + pose3D.biomechanics.balance.score) / 2;
        this.state.stabilityScore = pose3D.biomechanics.stability.score;
        this.state.balanceScore = pose3D.biomechanics.balance.score;
        
        // Add to history for trend analysis
        this.poseHistory.push(pose3D);
        if (this.poseHistory.length > 100) {
          this.poseHistory.shift();
        }
      }

      if (feedback3D) {
        this.state.currentFeedback3D = feedback3D;
        this.feedbackHistory.push(feedback3D);
        if (this.feedbackHistory.length > 50) {
          this.feedbackHistory.shift();
        }
      }

      // 5. Calculate combined metrics
      this.calculateCombinedMetrics();

      // 6. Update session progress
      this.updateSessionProgress();

      this.lastUpdateTime = timestamp;
      return this.state;

    } catch (error) {
      console.error('Error in integrated pose validation:', error);
      return this.state;
    }
  }

  /**
   * Calculate combined metrics from 2D and 3D analysis
   */
  private calculateCombinedMetrics(): void {
    // Get 2D form score from latest rep metric
    const latestMetric = this.state.metrics[this.state.metrics.length - 1];
    const formScore2D = latestMetric?.formIQ || 0;

    // Get 3D form score
    const formScore3D = this.state.formScore3D;

    // Calculate weighted overall form score
    this.state.overallFormScore = 
      (formScore2D * this.config.weight2D) + 
      (formScore3D * this.config.weight3D);

    // Calculate improvement rate from pose history
    if (this.poseHistory.length >= 10) {
      const recent = this.poseHistory.slice(-10);
      const older = this.poseHistory.slice(-20, -10);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, pose) => sum + pose.formScore.overall, 0) / recent.length;
        const olderAvg = older.reduce((sum, pose) => sum + pose.formScore.overall, 0) / older.length;
        this.state.improvementRate = (recentAvg - olderAvg) / olderAvg;
      }
    }
  }

  /**
   * Update session progress metrics
   */
  private updateSessionProgress(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const sessionMinutes = sessionDuration / (1000 * 60);
    
    // Calculate progress based on reps completed, form quality, and time
    const targetReps = 10; // Default target
    const targetMinutes = 5; // Default 5-minute session
    const repProgress = Math.min(this.state.repCount / targetReps, 1);
    const formProgress = this.state.overallFormScore / 100;
    const timeProgress = Math.min(sessionMinutes / targetMinutes, 1);
    
    this.state.sessionProgress = (repProgress + formProgress + timeProgress) / 3;
  }

  /**
   * Get current exercise type
   */
  private getExerciseType(): string {
    // This would be determined by the validator type or passed as parameter
    return 'squat'; // Default, should be configurable
  }

  /**
   * Get comprehensive session summary
   */
  getSessionSummary() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const avgFormScore = this.poseHistory.length > 0 
      ? this.poseHistory.reduce((sum, pose) => sum + pose.formScore.overall, 0) / this.poseHistory.length
      : 0;

    return {
      duration: sessionDuration,
      repCount: this.state.repCount,
      averageFormScore: avgFormScore,
      bestFormScore: Math.max(...this.poseHistory.map(p => p.formScore.overall), 0),
      improvementRate: this.state.improvementRate,
      sessionProgress: this.state.sessionProgress,
      biomechanicsScore: this.state.biomechanicsScore,
      stabilityScore: this.state.stabilityScore,
      balanceScore: this.state.balanceScore,
      totalPoses: this.poseHistory.length,
      totalFeedback: this.feedbackHistory.length
    };
  }

  /**
   * Get current state
   */
  getState(): IntegratedValidatorState {
    return { ...this.state };
  }

  /**
   * Reset session
   */
  reset(): void {
    this.state = {
      repCount: 0,
      phase: 'idle',
      cues: [],
      metrics: [],
      currentPose3D: null,
      currentFeedback3D: null,
      formScore3D: 0,
      biomechanicsScore: 0,
      stabilityScore: 0,
      balanceScore: 0,
      overallFormScore: 0,
      sessionProgress: 0,
      improvementRate: 0
    };
    
    this.sessionStartTime = Date.now();
    this.poseHistory = [];
    this.feedbackHistory = [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IntegratedValidatorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// ============================================
// Factory Functions
// ============================================

export function createIntegratedValidator(
  exercise: Exercise, 
  config: IntegratedValidatorConfig = {}
): IntegratedPoseValidator {
  return new IntegratedPoseValidator(exercise, config);
}

export function createExerciseConfig(exercise: Exercise): Partial<IntegratedValidatorConfig> {
  const baseConfig = {
    analysisEnabled: true,
    feedbackEnabled: true,
    confidenceThreshold: 0.5,
    smoothingFactor: 0.7,
    weight2D: 0.4,
    weight3D: 0.6,
    enableBiomechanics: true,
    enableStabilityAnalysis: true
  };

  switch (exercise) {
    case 'squat':
      return {
        ...baseConfig,
        squat: { downDepth: 35, upDepth: 10 },
        weight3D: 0.7 // Higher weight for 3D analysis in squats
      };
    
    case 'pushup':
      return {
        ...baseConfig,
        pushup: { bottomElbow: 70, topElbow: 155 },
        weight3D: 0.6
      };
    
    case 'plank':
      return {
        ...baseConfig,
        plank: { minHipAngle: 170 },
        weight2D: 0.3, // Lower weight for 2D in planks
        weight3D: 0.7  // Higher weight for 3D stability analysis
      };
    
    default:
      return baseConfig;
  }
}
