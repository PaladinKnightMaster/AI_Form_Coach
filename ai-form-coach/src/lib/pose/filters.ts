/**
 * Pose Filtering & Smoothing Pipeline
 * 
 * Implements Sword Health-style stability:
 * - Median filter for outlier suppression
 * - Kalman filter for predictive smoothing
 * - Outlier detection for impossible movements
 * - Multi-stage pipeline for rock-solid tracking
 */

import { Landmark3D } from './engine';

// ============================================
// Median Filter
// ============================================

export class MedianFilter {
  private windows: Map<number, Landmark3D[]> = new Map();
  private windowSize: number;

  constructor(windowSize: number = 5) {
    this.windowSize = windowSize;
  }

  /**
   * Apply median filter to suppress outliers
   * Uses rolling window per landmark
   */
  filter(landmarks: Landmark3D[]): Landmark3D[] {
    return landmarks.map((lm, index) => {
      // Get or create window for this landmark
      let window = this.windows.get(index);
      if (!window) {
        window = [];
        this.windows.set(index, window);
      }

      // Add current landmark to window
      window.push({ ...lm });

      // Keep window size limited
      if (window.length > this.windowSize) {
        window.shift();
      }

      // If window too small, return current
      if (window.length < 3) {
        return lm;
      }

      // Calculate median for x, y, z
      return {
        x: this.median(window.map(l => l.x)),
        y: this.median(window.map(l => l.y)),
        z: this.median(window.map(l => l.z)),
        visibility: lm.visibility // Keep current visibility
      };
    });
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  reset() {
    this.windows.clear();
  }
}

// ============================================
// Outlier Detection
// ============================================

export interface OutlierConfig {
  maxSpeed: number;        // Max movement per frame (normalized)
  maxAcceleration: number; // Max acceleration per frame
  minVisibility: number;   // Min visibility to trust landmark
}

export class OutlierDetector {
  private previousLandmarks: Landmark3D[] | null = null;
  private previousVelocities: Array<{ x: number; y: number; z: number }> | null = null;
  private config: OutlierConfig;

  constructor(config: Partial<OutlierConfig> = {}) {
    this.config = {
      maxSpeed: 0.15,           // 15% of frame per frame
      maxAcceleration: 0.08,    // 8% acceleration per frame
      minVisibility: 0.3,       // Reject landmarks below this
      ...config
    };
  }

  /**
   * Detect and replace outliers
   * Returns cleaned landmarks or previous if outlier detected
   */
  detect(current: Landmark3D[]): Landmark3D[] {
    if (!this.previousLandmarks) {
      this.previousLandmarks = current;
      return current;
    }

    const cleaned = current.map((lm, i) => {
      const prev = this.previousLandmarks![i];
      
      // Skip if visibility too low
      if (lm.visibility < this.config.minVisibility) {
        return prev; // Use previous
      }

      // Calculate velocity (movement)
      const velocity = {
        x: lm.x - prev.x,
        y: lm.y - prev.y,
        z: lm.z - prev.z
      };

      const speed = Math.sqrt(
        velocity.x * velocity.x + 
        velocity.y * velocity.y + 
        velocity.z * velocity.z
      );

      // Check if speed exceeds threshold
      if (speed > this.config.maxSpeed) {
        // console.log(`Outlier detected at landmark ${i}: speed=${speed.toFixed(3)}`);
        return prev; // Use previous landmark
      }

      // Check acceleration if we have previous velocity
      if (this.previousVelocities && this.previousVelocities[i]) {
        const prevVel = this.previousVelocities[i];
        const acceleration = Math.sqrt(
          Math.pow(velocity.x - prevVel.x, 2) +
          Math.pow(velocity.y - prevVel.y, 2) +
          Math.pow(velocity.z - prevVel.z, 2)
        );

        if (acceleration > this.config.maxAcceleration) {
          // console.log(`High acceleration at landmark ${i}: ${acceleration.toFixed(3)}`);
          return prev; // Use previous
        }
      }

      return lm; // Accept current
    });

    // Update state
    this.previousVelocities = cleaned.map((lm, i) => ({
      x: lm.x - this.previousLandmarks![i].x,
      y: lm.y - this.previousLandmarks![i].y,
      z: lm.z - this.previousLandmarks![i].z
    }));
    this.previousLandmarks = cleaned;

    return cleaned;
  }

  reset() {
    this.previousLandmarks = null;
    this.previousVelocities = null;
  }
}

// ============================================
// Kalman Filter (Advanced)
// ============================================

interface KalmanState {
  x: number;      // Position
  vx: number;     // Velocity
  covariance: number[][];
}

export class KalmanFilter {
  private states: Map<number, KalmanState> = new Map();
  private processNoise: number;
  private measurementNoise: number;

  constructor(processNoise: number = 0.01, measurementNoise: number = 0.1) {
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
  }

  /**
   * Apply Kalman filter to critical joints
   * Provides predictive smoothing for ultra-stable tracking
   */
  filter(landmarks: Landmark3D[], criticalIndices: number[] = []): Landmark3D[] {
    return landmarks.map((lm, index) => {
      // Only apply to critical joints if specified
      if (criticalIndices.length > 0 && !criticalIndices.includes(index)) {
        return lm;
      }

      // Get or initialize state
      let state = this.states.get(index);
      if (!state) {
        state = {
          x: lm.x,
          vx: 0,
          covariance: [[1, 0], [0, 1]]
        };
        this.states.set(index, state);
        return lm;
      }

      // Prediction step
      const predicted = {
        x: state.x + state.vx,
        vx: state.vx
      };

      // Update covariance
      const P = state.covariance;
      const predictedCovariance = [
        [P[0][0] + P[0][1] + P[1][0] + P[1][1] + this.processNoise, P[0][1] + P[1][1]],
        [P[1][0] + P[1][1], P[1][1] + this.processNoise]
      ];

      // Kalman gain
      const S = predictedCovariance[0][0] + this.measurementNoise;
      const K = [
        predictedCovariance[0][0] / S,
        predictedCovariance[1][0] / S
      ];

      // Update step
      const innovation = lm.x - predicted.x;
      state.x = predicted.x + K[0] * innovation;
      state.vx = predicted.vx + K[1] * innovation;

      // Update covariance
      state.covariance = [
        [(1 - K[0]) * predictedCovariance[0][0], (1 - K[0]) * predictedCovariance[0][1]],
        [-K[1] * predictedCovariance[0][0] + predictedCovariance[1][0], -K[1] * predictedCovariance[0][1] + predictedCovariance[1][1]]
      ];

      // Apply same process for y and z coordinates
      // (simplified: only showing x for brevity, y and z follow same pattern)

      return {
        x: state.x,
        y: lm.y, // TODO: Apply Kalman to y
        z: lm.z, // TODO: Apply Kalman to z
        visibility: lm.visibility
      };
    });
  }

  reset() {
    this.states.clear();
  }
}

// ============================================
// Temporal Debouncing
// ============================================

export interface DebounceConfig {
  phaseTransition: number;    // Frames for phase change
  repComplete: number;         // Frames for rep completion
  errorDetection: number;      // Frames before showing error
  qualityChange: number;       // Frames for quality state change
}

export class TemporalDebouncer {
  private counters: Map<string, number> = new Map();
  private config: DebounceConfig;

  constructor(config: Partial<DebounceConfig> = {}) {
    this.config = {
      phaseTransition: 3,
      repComplete: 2,
      errorDetection: 4,
      qualityChange: 5,
      ...config
    };
  }

  /**
   * Check if event should fire based on debounce
   * Returns true if enough consecutive frames have passed
   */
  shouldFire(eventKey: string, eventType: keyof DebounceConfig, isActive: boolean): boolean {
    const threshold = this.config[eventType];
    const count = this.counters.get(eventKey) || 0;

    if (isActive) {
      // Increment counter
      this.counters.set(eventKey, count + 1);
      
      // Fire if threshold reached
      return count + 1 >= threshold;
    } else {
      // Reset counter
      this.counters.set(eventKey, 0);
      return false;
    }
  }

  /**
   * Reset specific event counter
   */
  reset(eventKey: string) {
    this.counters.set(eventKey, 0);
  }

  /**
   * Reset all counters
   */
  resetAll() {
    this.counters.clear();
  }
}

// ============================================
// Integrated Smoothing Pipeline
// ============================================

export interface SmoothingPipelineConfig {
  enableMedianFilter: boolean;
  enableOutlierDetection: boolean;
  enableKalmanFilter: boolean;
  medianWindowSize: number;
  outlierConfig: Partial<OutlierConfig>;
  kalmanCriticalJoints: number[]; // Shoulder, hip indices
}

export class SmoothingPipeline {
  private medianFilter: MedianFilter;
  private outlierDetector: OutlierDetector;
  private kalmanFilter: KalmanFilter;
  private config: SmoothingPipelineConfig;

  constructor(config: Partial<SmoothingPipelineConfig> = {}) {
    this.config = {
      enableMedianFilter: true,
      enableOutlierDetection: true,
      enableKalmanFilter: false, // Optional - advanced feature
      medianWindowSize: 5,
      outlierConfig: {},
      kalmanCriticalJoints: [11, 12, 23, 24], // Shoulders and hips
      ...config
    };

    this.medianFilter = new MedianFilter(this.config.medianWindowSize);
    this.outlierDetector = new OutlierDetector(this.config.outlierConfig);
    this.kalmanFilter = new KalmanFilter();
  }

  /**
   * Apply full smoothing pipeline
   * Order: Outlier Detection → Median Filter → Kalman Filter (optional)
   */
  process(landmarks: Landmark3D[]): Landmark3D[] {
    let smoothed = landmarks;

    // Stage 1: Outlier detection (reject impossible movements)
    if (this.config.enableOutlierDetection) {
      smoothed = this.outlierDetector.detect(smoothed);
    }

    // Stage 2: Median filter (suppress jitter)
    if (this.config.enableMedianFilter) {
      smoothed = this.medianFilter.filter(smoothed);
    }

    // Stage 3: Kalman filter (predictive smoothing for critical joints)
    if (this.config.enableKalmanFilter) {
      smoothed = this.kalmanFilter.filter(smoothed, this.config.kalmanCriticalJoints);
    }

    return smoothed;
  }

  reset() {
    this.medianFilter.reset();
    this.outlierDetector.reset();
    this.kalmanFilter.reset();
  }
}

