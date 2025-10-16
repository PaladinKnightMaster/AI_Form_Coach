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

export interface PoseEngineOptions {
  model?: PoseModel;
  runningMode?: RunningMode;
  smoothingAlpha?: number; // EMA alpha (0-1), default 0.65
  visibilityThreshold?: number; // Min visibility score to accept frame, default 0.55
  debounceFrames?: number; // Frames needed for phase change, default 2
  enableAdvancedSmoothing?: boolean; // Enable median + outlier detection
  smoothingConfig?: Partial<SmoothingPipelineConfig>;
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

  constructor(options: PoseEngineOptions = {}) {
    this.model = options.model || 'lite';
    this.runningMode = options.runningMode || 'VIDEO';
    this.smoothingAlpha = options.smoothingAlpha || 0.65; // 🏥 Increased for responsiveness
    this.visibilityThreshold = options.visibilityThreshold || 0.55;
    this.debounceFrames = options.debounceFrames || 2; // 🏥 Reduced for faster response
    this.enableAdvancedSmoothing = options.enableAdvancedSmoothing ?? true;

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
  }

  /**
   * Initialize MediaPipe Pose Landmarker
   */
  async init(options?: { model?: PoseModel; runningMode?: RunningMode }): Promise<void> {
    if (this.isInitialized && this.landmarker) {
      return; // Already initialized
    }

    if (options?.model) this.model = options.model;
    if (options?.runningMode) this.runningMode = options.runningMode;

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

    const timestamp = performance.now();

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
      return null;
    }

    // Extract landmarks
    const rawLandmarks: Landmark3D[] = result.landmarks[0].map(lm => ({
      x: lm.x,
      y: lm.y,
      z: lm.z, // MediaPipe always provides z coordinate
      visibility: lm.visibility || 0
    }));

    // Calculate visibility score
    const visibilityScore = this.calculateVisibilityScore(rawLandmarks);

    // Visibility gating: reject low-confidence frames
    if (visibilityScore < this.visibilityThreshold) {
      // Don't update smoothing state on low-visibility frames
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
      // Stage 1: EMA smoothing (existing)
      const emaSmoothed = this.applySmoothing(rawLandmarks, this.lastLandmarks, this.smoothingAlpha);
      
      // Stage 2: Advanced pipeline (median + outlier detection)
      smoothedLandmarks = this.smoothingPipeline.process(emaSmoothed);
    } else {
      // Fallback: EMA only
      smoothedLandmarks = this.applySmoothing(rawLandmarks, this.lastLandmarks, this.smoothingAlpha);
    }
    
    this.lastLandmarks = smoothedLandmarks;

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
   */
  private calculateVisibilityScore(landmarks: Landmark3D[]): number {
    if (landmarks.length === 0) return 0;
    const sum = landmarks.reduce((acc, lm) => acc + lm.visibility, 0);
    return sum / landmarks.length;
  }

  /**
   * Calculate visibility score for one side (left or right)
   * Based on hip, knee, ankle visibility
   */
  private calculateSideVisibility(landmarks: Landmark3D[], side: 'left' | 'right'): number {
    const indices = side === 'left' 
      ? [23, 25, 27] // Left hip, knee, ankle
      : [24, 26, 28]; // Right hip, knee, ankle

    const visibilities = indices.map(i => landmarks[i]?.visibility || 0);
    return visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
  }

  /**
   * Apply Exponential Moving Average (EMA) smoothing
   * 
   * Formula: smoothed = alpha * current + (1 - alpha) * previous
   * 
   * Alpha closer to 1 = less smoothing (more responsive)
   * Alpha closer to 0 = more smoothing (more stable)
   */
  private applySmoothing(
    current: Landmark3D[],
    previous: Landmark3D[] | null,
    alpha: number
  ): Landmark3D[] {
    if (!previous) {
      return current; // First frame, no smoothing
    }

    return current.map((curr, i) => {
      const prev = previous[i];
      if (!prev) return curr;

      return {
        x: alpha * curr.x + (1 - alpha) * prev.x,
        y: alpha * curr.y + (1 - alpha) * prev.y,
        z: alpha * curr.z + (1 - alpha) * prev.z,
        visibility: curr.visibility // Don't smooth visibility
      };
    });
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

