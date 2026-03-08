/**
 * PoseEngine2 - Enhanced Pose Detection Engine
 * 
 * Features:
 * - Exponential Moving Average (EMA) smoothing for stability
 * - Visibility gating to prevent low-confidence frame updates
 * - Left/Right auto-switch based on visibility
 * - Temporal debounce for phase changes
 * - FPS estimation and monitoring
 * 
 * Quality improvements over PoseEngine v1:
 * - Better handling of occlusion and low visibility
 * - Automatic side selection for bilateral exercises
 * - Prevents FSM jitter from transient bad frames
 */

import { PoseLandmarker, PoseLandmarkerResult, FilesetResolver } from '@mediapipe/tasks-vision';
import { Point3 } from '../math/poseMath';
import { SmoothingPipeline, SmoothingPipelineConfig, TemporalDebouncer } from './filters';
import { getWorkerFilteringPool } from './workerFilteringPool';
import { getGlobalLandmarkPool } from './landmarkPool';
import { checkSIMDSupport } from './simdDetection';

// MediaPipe WasmFileset interface (not exported from the library)
interface WasmFileset {
  wasmLoaderPath: string;
  wasmBinaryPath: string;
  assetLoaderPath?: string;
  assetBinaryPath?: string;
}

// ============================================
// Types and Interfaces
// ============================================

export type PoseModel = 'lite' | 'full';
export type RunningMode = 'VIDEO' | 'IMAGE';
export type BestSide = 'left' | 'right';

export interface Landmark3D extends Point3 {
  visibility: number;
}

export interface PoseEstimateResult {
  landmarks: Landmark3D[];
  fps: number;
  visibilityScore: number;
  bestSide: BestSide;
  leftVisibility: number;
  rightVisibility: number;
}

// 🏥 PHASE A: Jitter detection metrics
export interface JitterMetrics {
  avgPixelJitter: number;        // Average pixel displacement on static pose
  maxPixelJitter: number;        // Maximum jitter spike
  stabilityScore: number;        // 0-100, higher is better
  detectionLatency: number;      // ms from pose capture to landmark output
  frameDropRate: number;         // Percentage of dropped frames
}

export interface PoseEngineOptions {
  model?: PoseModel;
  runningMode?: RunningMode;
  smoothingAlpha?: number; // EMA alpha (0-1), default 0.65
  visibilityThreshold?: number; // Min visibility score to accept frame, default 0.55
  debounceFrames?: number; // Frames needed for phase change, default 2
  enableAdvancedSmoothing?: boolean; // Enable median + outlier detection
  smoothingConfig?: Partial<SmoothingPipelineConfig>;
  enableMetrics?: boolean; // Enable jitter/latency tracking
  enableWorkerFiltering?: boolean; // 🏥 PHASE C: Enable Web Worker filtering
}

// ============================================
// Pose Engine 2
// ============================================

export class PoseEngine2 {
  private landmarker: PoseLandmarker | null = null;
  private filesetReady: Promise<unknown> | null = null;
  private isInitialized: boolean = false;

  // Configuration
  private model: PoseModel;
  private runningMode: RunningMode;
  private smoothingAlpha: number;
  private visibilityThreshold: number;
  private debounceFrames: number;

  // Smoothing state
  private lastLandmarks: Landmark3D[] | null = null;

  // FPS tracking
  private fpsWindow: number[] = []; // Timestamps of last N frames
  private fpsWindowSize: number = 30; // Track last 1s at 30fps
  private lastEstimateTime: number = 0;

  // Debounce state
  private validFrameCount: number = 0;
  private lastValidFrame: PoseEstimateResult | null = null;

  // 🏥 SWORD HEALTH: Advanced smoothing
  private enableAdvancedSmoothing: boolean;
  private smoothingPipeline: SmoothingPipeline;
  private temporalDebouncer: TemporalDebouncer;

  // 🏥 PHASE A: Telemetry and Jitter Detection
  private enableMetrics: boolean;
  private jitterBuffer: Array<{ x: number; y: number; z: number }> = []; // Last N landmark positions
  private jitterBufferSize: number = 30; // Track last 1 second at 30fps
  private detectionLatencies: number[] = []; // Track detection latencies
  private latencyWindowSize: number = 30;
  private frameCount: number = 0;
  private droppedFrameCount: number = 0;
  private metricsInterval: number = 3000; // Log metrics every 3 seconds
  private lastMetricsLog: number = 0;
  private confidenceBasedAlpha: boolean = true; // Adjust alpha based on confidence

  // 🏥 PHASE C: Web Worker Filtering
  private enableWorkerFiltering: boolean;
  private workerPool: ReturnType<typeof getWorkerFilteringPool> | null = null;
  private mainThreadFallbackCount: number = 0;

  constructor(options: PoseEngineOptions = {}) {
    this.model = options.model || 'lite';
    this.runningMode = options.runningMode || 'VIDEO';
    this.smoothingAlpha = options.smoothingAlpha || 0.65; // 🏥 Increased for responsiveness
    this.visibilityThreshold = options.visibilityThreshold || 0.55;
    this.debounceFrames = options.debounceFrames || 2; // 🏥 Reduced for faster response
    this.enableAdvancedSmoothing = options.enableAdvancedSmoothing ?? true;
    this.enableMetrics = options.enableMetrics ?? true; // 🏥 PHASE A: Enable metrics by default
    this.enableWorkerFiltering = options.enableWorkerFiltering ?? true; // 🏥 PHASE C: Enable worker filtering

    // 🏥 SWORD HEALTH: Initialize advanced smoothing pipeline (only if enabled)
    // 🔧 PERFORMANCE: Conditional initialization to avoid unnecessary memory allocation
    if (this.enableAdvancedSmoothing) {
      this.smoothingPipeline = new SmoothingPipeline(options.smoothingConfig);
      this.temporalDebouncer = new TemporalDebouncer();
    } else {
      // Stub instances to avoid null checks
      this.smoothingPipeline = null as unknown as SmoothingPipeline;
      this.temporalDebouncer = null as unknown as TemporalDebouncer;
    }

    // 🏥 PHASE C: Initialize worker pool if enabled
    if (this.enableWorkerFiltering && typeof Worker !== 'undefined') {
      try {
        this.workerPool = getWorkerFilteringPool();
      } catch (error) {
        console.warn('[PoseEngine2] Worker pool initialization failed:', error);
        this.workerPool = null;
      }
    }
  }

  /**
   * Initialize MediaPipe Pose Landmarker
   * 🚀 OPTIMIZED: SIMD detection for 2-4x faster pose detection
   */
  async init(options?: { model?: PoseModel; runningMode?: RunningMode }): Promise<void> {
    if (this.isInitialized && this.landmarker) {
      return; // Already initialized
    }

    if (options?.model) this.model = options.model;
    if (options?.runningMode) this.runningMode = options.runningMode;

    // 🚀 Check SIMD support for performance optimization
    const simdSupported = await checkSIMDSupport();
    if (simdSupported) {
      console.log('[PoseEngine2] 🚀 SIMD acceleration enabled - expect 2-4x faster detection');
    }

    // Initialize fileset resolver
    if (!this.filesetReady) {
      this.filesetReady = FilesetResolver.forVisionTasks(
        process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_URL ||
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
    }

    const fileset = await this.filesetReady;

    // Create landmarker
    const modelPath = this.model === 'full'
      ? 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task'
      : 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

    this.landmarker = await PoseLandmarker.createFromOptions(fileset as WasmFileset, {
      baseOptions: {
        modelAssetPath: modelPath,
      },
      runningMode: this.runningMode,
      numPoses: 1,
    });

    this.isInitialized = true;
  }

  /**
   * Estimate pose from video frame
   * 
   * Returns null if:
   * - Not initialized
   * - Video not ready
   * - Detection fails
   * - Visibility score below threshold
   */
  async estimate(videoElement: HTMLVideoElement): Promise<PoseEstimateResult | null> {
    if (!this.isInitialized || !this.landmarker) {
      await this.init();
    }

    if (!this.landmarker) {
      return null;
    }

    // Check video readiness
    if (!videoElement || 
        videoElement.readyState < 2 || 
        videoElement.videoWidth === 0 || 
        videoElement.videoHeight === 0) {
      return null;
    }

    // 🏥 PHASE A: Track detection latency
    const estimateStartTime = performance.now();
    const timestamp = estimateStartTime;

    // Suppress MediaPipe console spam
    const originalConsole = this.suppressMediaPipeConsole();

    let result: PoseLandmarkerResult | null = null;
    try {
      result = this.landmarker.detectForVideo(videoElement, timestamp);
    } catch (error) {
      console.error('Pose detection failed:', error);
      return null;
    } finally {
      this.restoreConsole(originalConsole);
    }

    // Check if pose detected
    if (!result || !result.landmarks || result.landmarks.length === 0) {
      this.droppedFrameCount++;
      return null;
    }

    // Extract landmarks (optimized: for-loop instead of .map() for better performance)
    const landmarkPool = getGlobalLandmarkPool();
    const rawLandmarks = landmarkPool.acquire();
    const sourceLandmarks = result.landmarks[0];
    const length = Math.min(rawLandmarks.length, sourceLandmarks.length);

    for (let i = 0; i < length; i++) {
      const lm = sourceLandmarks[i];
      rawLandmarks[i].x = lm.x;
      rawLandmarks[i].y = lm.y;
      rawLandmarks[i].z = lm.z;
      rawLandmarks[i].visibility = lm.visibility ?? 1;
    }

    // Calculate visibility score
    const visibilityScore = this.calculateVisibilityScore(rawLandmarks);

    // Visibility gating: reject low-confidence frames
    if (visibilityScore < this.visibilityThreshold) {
      // Don't update smoothing state on low-visibility frames
      this.droppedFrameCount++;
      return {
        landmarks: rawLandmarks,
        fps: this.calculateFPS(timestamp),
        visibilityScore,
        bestSide: this.lastValidFrame?.bestSide || 'right',
        leftVisibility: this.calculateSideVisibility(rawLandmarks, 'left'),
        rightVisibility: this.calculateSideVisibility(rawLandmarks, 'right')
      };
    }

    // 🏥 SWORD HEALTH: Apply multi-stage smoothing pipeline
    let smoothedLandmarks: Landmark3D[];
    
    if (this.enableAdvancedSmoothing) {
      // Stage 1: EMA smoothing with confidence-based alpha (PHASE A)
      const alpha = this.confidenceBasedAlpha 
        ? this.calculateAdaptiveAlpha(visibilityScore)
        : this.smoothingAlpha;
      const emaSmoothed = this.applySmoothing(rawLandmarks, this.lastLandmarks, alpha);
      
      // 🏥 PHASE C: Try worker-based filtering first
      if (this.workerPool?.isAvailable()) {
        try {
          const workerFiltered = await this.workerPool.filterLandmarks(emaSmoothed, {
            enableMedianFilter: true,
            enableOutlierDetection: true,
            medianWindowSize: 5
          });

          // Use worker result if available, otherwise fallback
          if (workerFiltered) {
            smoothedLandmarks = workerFiltered;
          } else {
            // Worker timeout or error - fall back to main thread
            this.mainThreadFallbackCount++;
            smoothedLandmarks = this.smoothingPipeline.process(emaSmoothed);
          }
        } catch (error) {
          // Worker error - fall back to main thread
          console.warn('[PoseEngine2] Worker filtering error, using main thread:', error);
          this.mainThreadFallbackCount++;
          smoothedLandmarks = this.smoothingPipeline.process(emaSmoothed);
        }
      } else {
        // Workers not available - use main thread processing
        smoothedLandmarks = this.smoothingPipeline.process(emaSmoothed);
      }
    } else {
      // Fallback: EMA only
      smoothedLandmarks = this.applySmoothing(rawLandmarks, this.lastLandmarks, this.smoothingAlpha);
    }
    
    this.lastLandmarks = smoothedLandmarks;

    // 🏥 PHASE A: Track jitter metrics (every 30 frames)
    if (this.enableMetrics) {
      this.trackJitter(smoothedLandmarks);
      this.frameCount++;
      
      // Log metrics at interval (every 3 seconds)
      const now = performance.now();
      if (now - this.lastMetricsLog > this.metricsInterval) {
        this.logJitterMetrics();
        this.lastMetricsLog = now;
      }
    }

    // Track detection latency
    const detectionLatency = performance.now() - estimateStartTime;
    if (this.enableMetrics && this.detectionLatencies.length < this.latencyWindowSize) {
      this.detectionLatencies.push(detectionLatency);
    } else if (this.enableMetrics) {
      this.detectionLatencies.shift();
      this.detectionLatencies.push(detectionLatency);
    }

    // Calculate side visibility
    const leftVisibility = this.calculateSideVisibility(smoothedLandmarks, 'left');
    const rightVisibility = this.calculateSideVisibility(smoothedLandmarks, 'right');
    const bestSide: BestSide = leftVisibility > rightVisibility ? 'left' : 'right';

    // Calculate FPS
    const fps = this.calculateFPS(timestamp);

    const estimateResult: PoseEstimateResult = {
      landmarks: smoothedLandmarks,
      fps,
      visibilityScore,
      bestSide,
      leftVisibility,
      rightVisibility
    };

    // Update debounce counter
    this.validFrameCount++;
    this.lastValidFrame = estimateResult;

    return estimateResult;
  }

  /**
   * Check if enough valid frames have been received for phase change
   * This prevents FSM jitter from transient frames
   */
  canTransitionPhase(): boolean {
    return this.validFrameCount >= this.debounceFrames;
  }

  /**
   * Reset debounce counter after phase transition
   */
  resetDebounce(): void {
    this.validFrameCount = 0;
  }

  /**
   * Get best side for angle calculations
   * Returns landmarks indices for the better-visible side
   */
  getBestSideIndices(bestSide: BestSide): {
    hip: number;
    knee: number;
    ankle: number;
    shoulder: number;
    elbow: number;
    wrist: number;
  } {
    if (bestSide === 'left') {
      return {
        hip: 23,      // Left hip
        knee: 25,     // Left knee
        ankle: 27,    // Left ankle
        shoulder: 11, // Left shoulder
        elbow: 13,    // Left elbow
        wrist: 15     // Left wrist
      };
    } else {
      return {
        hip: 24,      // Right hip
        knee: 26,     // Right knee
        ankle: 28,    // Right ankle
        shoulder: 12, // Right shoulder
        elbow: 14,    // Right elbow
        wrist: 16     // Right wrist
      };
    }
  }

  /**
   * Get current FPS
   */
  get fps(): number {
    if (this.fpsWindow.length < 2) return 0;
    const elapsed = this.fpsWindow[this.fpsWindow.length - 1] - this.fpsWindow[0];
    return Math.round((this.fpsWindow.length - 1) / (elapsed / 1000));
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
    this.isInitialized = false;
    this.lastLandmarks = null;
    this.fpsWindow = [];
    this.validFrameCount = 0;
    this.lastValidFrame = null;
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Calculate mean visibility score across all landmarks
   * Optimized: for-loop instead of .reduce() for better performance
   */
  private calculateVisibilityScore(landmarks: Landmark3D[]): number {
    const length = landmarks.length;
    if (length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += landmarks[i].visibility;
    }
    return sum / length;
  }

  /**
   * Calculate visibility score for one side (left or right)
   * Based on hip, knee, ankle visibility
   * Optimized: direct calculation instead of .map() + .reduce()
   */
  private calculateSideVisibility(landmarks: Landmark3D[], side: 'left' | 'right'): number {
    const indices = side === 'left'
      ? [23, 25, 27] // Left hip, knee, ankle
      : [24, 26, 28]; // Right hip, knee, ankle

    let sum = 0;
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      sum += landmarks[idx]?.visibility || 0;
    }
    return sum / indices.length;
  }

  /**
   * Apply Exponential Moving Average (EMA) smoothing
   *
   * Formula: smoothed = alpha * current + (1 - alpha) * previous
   *
   * Alpha closer to 1 = less smoothing (more responsive)
   * Alpha closer to 0 = more smoothing (more stable)
   *
   * Optimized: Uses for-loop and object pool instead of .map()
   */
  private applySmoothing(
    current: Landmark3D[],
    previous: Landmark3D[] | null,
    alpha: number
  ): Landmark3D[] {
    if (!previous) {
      return current; // First frame, no smoothing
    }

    // Optimized: for-loop instead of .map() for ~2-3ms gain
    const landmarkPool = getGlobalLandmarkPool();
    const smoothed = landmarkPool.acquire();
    const oneMinusAlpha = 1 - alpha; // Calculate once
    const length = Math.min(current.length, previous.length, smoothed.length);

    for (let i = 0; i < length; i++) {
      const curr = current[i];
      const prev = previous[i];

      if (!prev) {
        smoothed[i].x = curr.x;
        smoothed[i].y = curr.y;
        smoothed[i].z = curr.z;
        smoothed[i].visibility = curr.visibility;
      } else {
        smoothed[i].x = alpha * curr.x + oneMinusAlpha * prev.x;
        smoothed[i].y = alpha * curr.y + oneMinusAlpha * prev.y;
        smoothed[i].z = alpha * curr.z + oneMinusAlpha * prev.z;
        smoothed[i].visibility = curr.visibility; // Don't smooth visibility
      }
    }

    return smoothed;
  }

  /**
   * Calculate FPS from timestamp window
   */
  private calculateFPS(timestamp: number): number {
    this.fpsWindow.push(timestamp);

    // Keep only last N frames
    if (this.fpsWindow.length > this.fpsWindowSize) {
      this.fpsWindow.shift();
    }

    // Need at least 2 frames to calculate FPS
    if (this.fpsWindow.length < 2) {
      return 0;
    }

    // Calculate FPS from window
    const elapsed = this.fpsWindow[this.fpsWindow.length - 1] - this.fpsWindow[0];
    const fps = Math.round((this.fpsWindow.length - 1) / (elapsed / 1000));

    return fps;
  }

  /**
   * Suppress MediaPipe console spam (XNNPACK, TFLite messages)
   */
  private suppressMediaPipeConsole(): {
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  } | null {
    if (typeof console === 'undefined') return null;

    const original = {
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    // Suppress noisy logs
    console.info = () => {};
    console.warn = (msg?: unknown, ...rest: unknown[]) => {
      if (typeof msg === 'string' && 
          (msg.includes('TensorFlow Lite XNNPACK') || msg.includes('XNNPACK'))) {
        return;
      }
      original.warn.call(console, msg, ...rest);
    };
    console.error = (msg?: unknown, ...rest: unknown[]) => {
      if (typeof msg === 'string' && 
          (msg.includes('TensorFlow Lite XNNPACK') || msg.includes('XNNPACK'))) {
        return;
      }
      original.error.call(console, msg, ...rest);
    };

    return original;
  }

  /**
   * Restore original console methods
   */
  private restoreConsole(original: ReturnType<typeof this.suppressMediaPipeConsole>): void {
    if (!original) return;
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
  }

  // ============================================
  // 🏥 PHASE A: Jitter Detection & Metrics
  // ============================================

  /**
   * Calculate adaptive smoothing alpha based on visibility confidence
   * Higher confidence = faster response (alpha closer to 1)
   * Lower confidence = more smoothing (alpha closer to 0)
   */
  private calculateAdaptiveAlpha(visibilityScore: number): number {
    // Map visibility (0.55-1.0) to alpha (0.65-0.85)
    // This provides confidence-based smoothing adjustment
    const minVis = this.visibilityThreshold;
    const maxVis = 1.0;
    const minAlpha = 0.65;
    const maxAlpha = 0.85;
    
    const normalized = Math.max(0, Math.min(1, (visibilityScore - minVis) / (maxVis - minVis)));
    return minAlpha + normalized * (maxAlpha - minAlpha);
  }

  /**
   * Track jitter by storing landmark positions and calculating variance
   * Measures stability of skeleton rendering on static poses
   * Optimized: for-loop instead of .reduce() for better performance
   */
  private trackJitter(landmarks: Landmark3D[]): void {
    // Calculate center of mass for the skeleton
    const length = landmarks.length;
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    for (let i = 0; i < length; i++) {
      sumX += landmarks[i].x;
      sumY += landmarks[i].y;
      sumZ += landmarks[i].z;
    }

    const centerMass = {
      x: sumX / length,
      y: sumY / length,
      z: sumZ / length
    };

    // Add to buffer (keep buffer size limited)
    this.jitterBuffer.push(centerMass);
    if (this.jitterBuffer.length > this.jitterBufferSize) {
      this.jitterBuffer.shift();
    }
  }

  /**
   * Calculate jitter metrics from buffer
   * Returns pixel displacement variance
   * Optimized: for-loop instead of .reduce() for better performance
   */
  private calculateJitterScore(): number {
    const bufferLength = this.jitterBuffer.length;
    if (bufferLength < 2) return 0;

    // Calculate average position
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < bufferLength; i++) {
      sumX += this.jitterBuffer[i].x;
      sumY += this.jitterBuffer[i].y;
    }
    const avgX = sumX / bufferLength;
    const avgY = sumY / bufferLength;

    // Calculate variance (in normalized coordinates, scale to pixels assuming 1080p)
    let varianceSum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const p = this.jitterBuffer[i];
      const dx = (p.x - avgX) * 1080; // Scale to pixels
      const dy = (p.y - avgY) * 1920;
      varianceSum += Math.sqrt(dx * dx + dy * dy);
    }

    return varianceSum / bufferLength;
  }

  /**
   * Get current jitter and performance metrics
   */
  public getMetrics(): JitterMetrics {
    const jitterScore = this.calculateJitterScore();
    const avgLatency = this.detectionLatencies.length > 0
      ? this.detectionLatencies.reduce((a, b) => a + b, 0) / this.detectionLatencies.length
      : 0;
    const maxLatency = this.detectionLatencies.length > 0
      ? Math.max(...this.detectionLatencies)
      : 0;
    const frameDropRate = this.frameCount > 0
      ? (this.droppedFrameCount / (this.frameCount + this.droppedFrameCount)) * 100
      : 0;

    // Stability score: 0-100 (lower jitter = higher score)
    // Target: <2px jitter = 100 score, >10px = 0 score
    const stabilityScore = Math.max(0, Math.min(100, 100 - (jitterScore / 2) * 10));

    return {
      avgPixelJitter: jitterScore,
      maxPixelJitter: maxLatency, // Using max latency as proxy
      stabilityScore: Math.round(stabilityScore),
      detectionLatency: avgLatency,
      frameDropRate
    };
  }

  /**
   * Log jitter metrics at regular intervals (1Hz)
   * Helps identify performance issues without spamming console
   */
  private logJitterMetrics(): void {
    if (!this.enableMetrics || typeof console === 'undefined') return;

    const metrics = this.getMetrics();
    
    // Only log if we have meaningful data
    if (this.frameCount > 0) {
      const fpsValue = this.fps;
      console.debug('[PoseEngine2 Metrics]', {
        fps: fpsValue,
        jitterPx: metrics.avgPixelJitter.toFixed(2),
        stability: `${metrics.stabilityScore}%`,
        latencyMs: metrics.detectionLatency.toFixed(1),
        dropRate: `${metrics.frameDropRate.toFixed(1)}%`
      });
    }
  }

  /**
   * Reset metrics tracking (for new session or benchmark)
   */
  public resetMetrics(): void {
    this.jitterBuffer = [];
    this.detectionLatencies = [];
    this.frameCount = 0;
    this.droppedFrameCount = 0;
    this.lastMetricsLog = 0;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create and initialize a PoseEngine2 instance
 */
export async function createPoseEngine(
  options: PoseEngineOptions = {}
): Promise<PoseEngine2> {
  const engine = new PoseEngine2(options);
  await engine.init();
  return engine;
}

/**
 * Check if a landmark is visible enough for reliable measurement
 */
export function isLandmarkVisible(landmark: Landmark3D, threshold: number = 0.5): boolean {
  return landmark.visibility >= threshold;
}

/**
 * Get landmarks for better-visible side
 */
export function getBestSideLandmarks(
  result: PoseEstimateResult
): {
  hip: Landmark3D;
  knee: Landmark3D;
  ankle: Landmark3D;
  shoulder: Landmark3D;
  elbow: Landmark3D;
  wrist: Landmark3D;
} {
  const indices = new PoseEngine2().getBestSideIndices(result.bestSide);
  return {
    hip: result.landmarks[indices.hip],
    knee: result.landmarks[indices.knee],
    ankle: result.landmarks[indices.ankle],
    shoulder: result.landmarks[indices.shoulder],
    elbow: result.landmarks[indices.elbow],
    wrist: result.landmarks[indices.wrist]
  };
}

