/**
 * Enhanced Phase Detector
 * 
 * Main orchestrator that combines Savitzky-Golay smoothing and HMM
 * for robust phase detection with debounce guards.
 */

import type { 
  Phase, 
  Exercise, 
  PhaseDetectionResult, 
  PhaseDetectorConfig,
  PhaseDetectorStats 
} from './types';
import { HMMPhaseDetector } from './hmmPhaseDetector';
import { DEFAULT_PHASE_DETECTOR_CONFIG, EXERCISE_SPECIFIC_CONFIGS } from './types';

/**
 * Enhanced Phase Detector with smoothing and HMM
 */
export class EnhancedPhaseDetector {
  private hmmDetector: HMMPhaseDetector;
  private config: PhaseDetectorConfig;
  private stats: PhaseDetectorStats;
  private lastPhase: Phase = 'idle';
  private lastTransitionTime = 0;
  
  constructor(
    exercise: Exercise,
    config: Partial<PhaseDetectorConfig> = {}
  ) {
    // Merge default config with exercise-specific config and user config
    this.config = {
      ...DEFAULT_PHASE_DETECTOR_CONFIG,
      ...EXERCISE_SPECIFIC_CONFIGS[exercise],
      ...config,
      exercise,
    };
    
    this.hmmDetector = new HMMPhaseDetector(exercise, this.config);
    
    this.stats = {
      totalFrames: 0,
      phaseTransitions: 0,
      smoothingApplied: 0,
      hmmCorrections: 0,
      debounceBlocks: 0,
      averageProcessingTime: 0,
      confidenceDistribution: {
        high: 0,
        medium: 0,
        low: 0,
      },
    };
  }
  
  /**
   * Detect phase with enhanced smoothing and HMM
   */
  detectPhase(
    timestamp: number,
    rawValue: number,
    originalValue?: number
  ): PhaseDetectionResult {
    const startTime = performance.now();
    
    // Use original value if not provided
    const actualOriginalValue = originalValue ?? rawValue;
    
    // Detect phase using HMM
    const result = this.hmmDetector.detectPhase(
      timestamp,
      rawValue,
      actualOriginalValue
    );
    
    // Update statistics
    this.updateStats(result, startTime);
    
    // Check for phase transitions
    if (result.currentPhase !== this.lastPhase) {
      this.stats.phaseTransitions++;
      this.lastTransitionTime = timestamp;
    }
    
    this.lastPhase = result.currentPhase;
    
    return result;
  }
  
  /**
   * Update detector statistics
   */
  private updateStats(result: PhaseDetectionResult, startTime: number): void {
    this.stats.totalFrames++;
    
    // Update processing time
    const processingTime = performance.now() - startTime;
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalFrames - 1) + processingTime) / 
      this.stats.totalFrames;
    
    // Update confidence distribution
    if (result.confidence > 0.8) {
      this.stats.confidenceDistribution.high++;
    } else if (result.confidence > 0.5) {
      this.stats.confidenceDistribution.medium++;
    } else {
      this.stats.confidenceDistribution.low++;
    }
    
    // Count smoothing applications
    if (this.config.smoothing.enabled) {
      this.stats.smoothingApplied++;
    }
    
    // Count HMM corrections (when HMM result differs from threshold-based)
    if (this.config.hmm.enabled) {
      const thresholdPhase = this.detectPhaseByThresholds(result.smoothedValue);
      if (thresholdPhase !== result.currentPhase) {
        this.stats.hmmCorrections++;
      }
    }
    
    // Count debounce blocks
    if (this.config.debounce.enabled && result.currentPhase !== this.lastPhase) {
      this.stats.debounceBlocks++;
    }
  }
  
  /**
   * Fallback threshold-based phase detection
   */
  private detectPhaseByThresholds(value: number): Phase {
    const thresholds = this.config.thresholds;
    
    if (value <= thresholds.idle.max) return 'idle';
    if (value <= thresholds.up.max) return 'up';
    if (value <= thresholds.down.max) return 'down';
    return 'hold';
  }
  
  /**
   * Get current phase
   */
  getCurrentPhase(): Phase {
    return this.hmmDetector.getCurrentState();
  }
  
  /**
   * Get phase history
   */
  getPhaseHistory() {
    return this.hmmDetector.getStateHistory();
  }
  
  /**
   * Get transition history
   */
  getTransitionHistory() {
    return this.hmmDetector.getTransitionHistory();
  }
  
  /**
   * Get detector statistics
   */
  getStats(): PhaseDetectorStats {
    return { ...this.stats };
  }
  
  /**
   * Get configuration
   */
  getConfig(): PhaseDetectorConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PhaseDetectorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.hmmDetector.updateConfig(this.config);
  }
  
  /**
   * Reset detector state
   */
  reset(): void {
    this.hmmDetector.reset();
    this.lastPhase = 'idle';
    this.lastTransitionTime = 0;
    
    // Reset statistics
    this.stats = {
      totalFrames: 0,
      phaseTransitions: 0,
      smoothingApplied: 0,
      hmmCorrections: 0,
      debounceBlocks: 0,
      averageProcessingTime: 0,
      confidenceDistribution: {
        high: 0,
        medium: 0,
        low: 0,
      },
    };
  }
  
  /**
   * Check if a phase transition is valid (not too frequent)
   */
  isValidTransition(timestamp: number, minInterval: number = 100): boolean {
    return timestamp - this.lastTransitionTime >= minInterval;
  }
  
  /**
   * Get phase confidence score
   */
  getPhaseConfidence(): number {
    const history = this.getPhaseHistory();
    if (history.length === 0) return 0.5;
    
    // Calculate average confidence over recent history
    const recentHistory = history.slice(-10); // Last 10 entries
    const avgConfidence = recentHistory.reduce((sum, entry) => sum + entry.probability, 0) / recentHistory.length;
    
    return avgConfidence;
  }
  
  /**
   * Check if the detector is stable (low transition rate)
   */
  isStable(): boolean {
    const recentTransitions = this.getTransitionHistory().filter(
      transition => Date.now() - transition.timestamp < 5000 // Last 5 seconds
    );
    
    return recentTransitions.length < 3; // Less than 3 transitions in 5 seconds
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    averageProcessingTime: number;
    smoothingEfficiency: number;
    hmmAccuracy: number;
    stabilityScore: number;
  } {
    const smoothingEfficiency = this.stats.totalFrames > 0 
      ? this.stats.smoothingApplied / this.stats.totalFrames 
      : 0;
    
    const hmmAccuracy = this.stats.totalFrames > 0 
      ? this.stats.hmmCorrections / this.stats.totalFrames 
      : 0;
    
    const stabilityScore = this.isStable() ? 1.0 : 0.5;
    
    return {
      averageProcessingTime: this.stats.averageProcessingTime,
      smoothingEfficiency,
      hmmAccuracy,
      stabilityScore,
    };
  }
}

/**
 * Factory function to create enhanced phase detector
 */
export function createEnhancedPhaseDetector(
  exercise: Exercise,
  config: Partial<PhaseDetectorConfig> = {}
): EnhancedPhaseDetector {
  return new EnhancedPhaseDetector(exercise, config);
}

/**
 * Utility function to normalize angle values for phase detection
 */
export function normalizeAngleForPhaseDetection(
  angle: number,
  exercise: Exercise
): number {
  // Normalize angle to 0-1 range based on exercise type
  switch (exercise) {
    case 'squat':
      // Knee angle: 0° (straight) to 90° (deep squat)
      return Math.max(0, Math.min(1, angle / 90));
    
    case 'pushup':
      // Elbow angle: 0° (straight) to 90° (deep pushup)
      return Math.max(0, Math.min(1, angle / 90));
    
    case 'plank':
      // Body line angle: 0° (perfect) to 30° (poor form)
      return Math.max(0, Math.min(1, angle / 30));
    
    default:
      return Math.max(0, Math.min(1, angle / 90));
  }
}

/**
 * Utility function to extract phase detection value from pose data
 */
export function extractPhaseDetectionValue(
  poseData: Record<string, unknown>,
  exercise: Exercise
): number {
  switch (exercise) {
    case 'squat':
      // Use knee angle for squat phase detection
      return (poseData.kneeAngle as number) || 0;
    
    case 'pushup':
      // Use elbow angle for pushup phase detection
      return (poseData.elbowAngle as number) || 0;
    
    case 'plank':
      // Use body line angle for plank phase detection
      return (poseData.bodyLineAngle as number) || 0;
    
    default:
      return 0;
  }
}
