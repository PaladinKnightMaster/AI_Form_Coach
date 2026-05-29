/**
 * Validator Integration for Enhanced Phase Detection
 * 
 * Provides utilities to integrate the enhanced phase detector
 * into existing validators while maintaining backward compatibility.
 */

import type { Phase, Exercise, ValidatorConfig } from '@/lib/validators/types';
import type { PhaseDetectorConfig } from './types';
import { createEnhancedPhaseDetector, normalizeAngleForPhaseDetection } from './phaseDetector';

/**
 * Enhanced phase detection integration for validators
 */
export class ValidatorPhaseDetector {
  private phaseDetector: ReturnType<typeof createEnhancedPhaseDetector> | null = null;
  private config: PhaseDetectorConfig;
  private exercise: Exercise;
  private enabled: boolean = false;
  
  constructor(exercise: Exercise, validatorConfig?: ValidatorConfig) {
    this.exercise = exercise;
    this.config = this.createConfigFromValidator(validatorConfig);
    
    // Check if enhanced phase detection is enabled in localStorage
    let enhancedPhaseDetectionEnabled = true; // Default to enabled
    try {
      const saved = localStorage.getItem('enhancedPhaseDetectionEnabled');
      if (saved !== null) {
        enhancedPhaseDetectionEnabled = saved === 'true';
      }
    } catch (error) {
      console.warn('Failed to load enhanced phase detection setting:', error);
    }
    
    this.enabled = enhancedPhaseDetectionEnabled && (this.config.smoothing.enabled || this.config.hmm.enabled);
    
    if (this.enabled) {
      this.phaseDetector = createEnhancedPhaseDetector(exercise, this.config);
    }
  }
  
  /**
   * Create phase detector config from validator config
   */
  private createConfigFromValidator(validatorConfig?: ValidatorConfig): PhaseDetectorConfig {
    const enhancedConfig = validatorConfig?.enhancedPhaseDetection;
    
    return {
      exercise: this.exercise,
      smoothing: {
        // War-room concern #1 — SG math is broken. Production bypasses the SG
        // path until the math is fixed or replaced. HMM downstream works fine
        // on raw normalized [0,1] angles. See sgDefaultDisabled.test.ts for
        // the bug-existence pinning record.
        enabled: enhancedConfig?.smoothing?.enabled ?? false,
        windowSize: enhancedConfig?.smoothing?.windowSize ?? 5,
        polynomialOrder: enhancedConfig?.smoothing?.polynomialOrder ?? 2,
      },
      hmm: {
        enabled: enhancedConfig?.hmm?.enabled ?? true,
        transitionSmoothing: enhancedConfig?.hmm?.transitionSmoothing ?? 0.1,
        observationNoise: enhancedConfig?.hmm?.observationNoise ?? 0.05,
      },
      debounce: {
        enabled: enhancedConfig?.debounce?.enabled ?? true,
        frames: enhancedConfig?.debounce?.frames ?? 3,
      },
      thresholds: this.getExerciseThresholds(),
    };
  }
  
  /**
   * Get exercise-specific thresholds
   */
  private getExerciseThresholds() {
    switch (this.exercise) {
      case 'squat':
        return {
          idle: { min: -Infinity, max: 0.1 },
          up: { min: 0.1, max: 0.6 },
          down: { min: 0.6, max: 1.0 },
          hold: { min: 0.3, max: 0.7 },
        };
      case 'pushup':
        return {
          idle: { min: -Infinity, max: 0.1 },
          up: { min: 0.1, max: 0.5 },
          down: { min: 0.5, max: 1.0 },
          hold: { min: 0.3, max: 0.7 },
        };
      case 'plank':
        return {
          idle: { min: -Infinity, max: 0.2 },
          up: { min: 0.2, max: 0.4 },
          down: { min: 0.4, max: 0.6 },
          hold: { min: 0.6, max: 1.0 },
        };
      default:
        return {
          idle: { min: -Infinity, max: 0.1 },
          up: { min: 0.1, max: 0.5 },
          down: { min: 0.5, max: 1.0 },
          hold: { min: 0.3, max: 0.7 },
        };
    }
  }
  
  /**
   * Detect phase using enhanced detection or fallback to simple threshold
   */
  detectPhase(
    timestamp: number,
    rawAngle: number,
    originalAngle?: number
  ): {
    phase: Phase;
    confidence: number;
    smoothedValue: number;
    originalValue: number;
    processingTime: number;
    enhanced: boolean;
  } {
    if (!this.enabled || !this.phaseDetector) {
      // Fallback to simple threshold-based detection
      const normalizedAngle = normalizeAngleForPhaseDetection(rawAngle, this.exercise);
      const phase = this.detectPhaseByThreshold(normalizedAngle);
      
      return {
        phase,
        confidence: 0.8,
        smoothedValue: normalizedAngle,
        originalValue: originalAngle ?? rawAngle,
        processingTime: 0,
        enhanced: false,
      };
    }
    
    // Use enhanced phase detection
    const normalizedAngle = normalizeAngleForPhaseDetection(rawAngle, this.exercise);
    const result = this.phaseDetector.detectPhase(timestamp, normalizedAngle, originalAngle);
    
    return {
      phase: result.currentPhase,
      confidence: result.confidence,
      smoothedValue: result.smoothedValue,
      originalValue: result.originalValue,
      processingTime: result.processingTime,
      enhanced: true,
    };
  }
  
  /**
   * Simple threshold-based phase detection (fallback)
   */
  private detectPhaseByThreshold(normalizedValue: number): Phase {
    const thresholds = this.config.thresholds;
    
    if (normalizedValue <= thresholds.idle.max) return 'idle';
    if (normalizedValue <= thresholds.up.max) return 'up';
    if (normalizedValue <= thresholds.down.max) return 'down';
    return 'hold';
  }
  
  /**
   * Update configuration
   */
  updateConfig(validatorConfig?: ValidatorConfig): void {
    this.config = this.createConfigFromValidator(validatorConfig);
    this.enabled = this.config.smoothing.enabled || this.config.hmm.enabled;
    
    if (this.enabled) {
      if (this.phaseDetector) {
        this.phaseDetector.updateConfig(this.config);
      } else {
        this.phaseDetector = createEnhancedPhaseDetector(this.exercise, this.config);
      }
    }
  }
  
  /**
   * Reset the phase detector
   */
  reset(): void {
    if (this.phaseDetector) {
      this.phaseDetector.reset();
    }
  }
  
  /**
   * Get current phase
   */
  getCurrentPhase(): Phase {
    if (this.phaseDetector) {
      return this.phaseDetector.getCurrentPhase();
    }
    return 'idle';
  }
  
  /**
   * Get phase history
   */
  getPhaseHistory() {
    if (this.phaseDetector) {
      return this.phaseDetector.getPhaseHistory();
    }
    return [];
  }
  
  /**
   * Get detector statistics
   */
  getStats() {
    if (this.phaseDetector) {
      return this.phaseDetector.getStats();
    }
    return null;
  }
  
  /**
   * Check if enhanced detection is enabled
   */
  isEnhanced(): boolean {
    return this.enabled;
  }
  
  /**
   * Get configuration
   */
  getConfig(): PhaseDetectorConfig {
    return { ...this.config };
  }
}

/**
 * Utility function to extract angle for phase detection from pose data
 */
export function extractPhaseDetectionAngle(
  poseData: Record<string, unknown>,
  exercise: Exercise
): number {
  switch (exercise) {
    case 'squat':
      // Use knee angle for squat phase detection
      return (poseData.kneeAngle as number) || (poseData.k as number) || 0;
    
    case 'pushup':
      // Use elbow angle for pushup phase detection
      return (poseData.elbowAngle as number) || (poseData.e as number) || 0;
    
    case 'plank':
      // Use body line angle for plank phase detection
      return (poseData.bodyLineAngle as number) || (poseData.bodyLine as number) || 0;
    
    default:
      return 0;
  }
}

/**
 * Utility function to create default enhanced phase detection config
 */
export function createDefaultEnhancedPhaseConfig(): ValidatorConfig['enhancedPhaseDetection'] {
  return {
    enabled: true,
    smoothing: {
      // War-room concern #1 — broken math, production bypassed until fixed.
      enabled: false,
      windowSize: 5,
      polynomialOrder: 2,
    },
    hmm: {
      enabled: true,
      transitionSmoothing: 0.1,
      observationNoise: 0.05,
    },
    debounce: {
      enabled: true,
      frames: 3,
    },
  };
}

/**
 * Utility function to check if enhanced phase detection should be used
 */
export function shouldUseEnhancedPhaseDetection(
  validatorConfig?: ValidatorConfig
): boolean {
  return validatorConfig?.enhancedPhaseDetection?.enabled ?? true;
}
