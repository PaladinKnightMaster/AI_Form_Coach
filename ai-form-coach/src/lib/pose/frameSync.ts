/**
 * Frame Timing & Synchronization System
 * 
 * Phase B: Frame Synchronization & Latency Optimization
 * Tracks end-to-end latency from detection to rendering
 * Manages frame timing coordination and adaptive quality
 */

// ============================================
// Frame Timing Types
// ============================================

export interface FrameTimingData {
  detectionStartTime: number;    // When pose detection started
  detectionEndTime: number;      // When pose detection completed
  renderStartTime: number;       // When rendering started
  renderEndTime: number;         // When rendering completed
  endToEndLatency: number;       // Total latency from detection to render
  detectionDuration: number;     // Detection processing time
  renderDuration: number;        // Rendering time
  timestamp: number;             // Frame timestamp
}

export interface FrameSyncMetrics {
  avgEndToEndLatency: number;    // Average total latency (target: <50ms)
  maxEndToEndLatency: number;    // Peak latency spike
  detectionAvgDuration: number;  // Average detection time
  renderAvgDuration: number;     // Average render time
  frameSkipRate: number;         // Percentage of frames skipped
  detectionToRenderRatio: number; // Detection vs render time ratio
  isAdaptiveQualityActive: boolean;
  estimatedFPS: number;          // Real FPS accounting for skips
}

export interface AdaptiveQualityConfig {
  enableAdaptiveSkipping: boolean;
  targetFPS: number;             // Target FPS (30)
  latencyBudget: number;         // Max latency (50ms)
  skipThreshold: number;         // FPS below which to skip frames
  recoveryThreshold: number;     // FPS above which to stop skipping
}

// ============================================
// Frame Timing Tracker
// ============================================

export class FrameTimingTracker {
  private timings: FrameTimingData[] = [];
  private maxTimings: number = 300; // Keep 10s of data @ 30fps
  private currentFrame: Partial<FrameTimingData> = {};
  private adaptiveConfig: AdaptiveQualityConfig;
  private skippedFrames: number = 0;
  private processedFrames: number = 0;
  private lastSkipStateChange: number = 0;

  constructor(config: Partial<AdaptiveQualityConfig> = {}) {
    this.adaptiveConfig = {
      enableAdaptiveSkipping: true,
      targetFPS: 30,
      latencyBudget: 50,
      skipThreshold: 28, // Start skipping when below 28 FPS
      recoveryThreshold: 32, // Resume when above 32 FPS
      ...config
    };
  }

  /**
   * Mark start of detection
   */
  markDetectionStart(timestamp?: number): void {
    this.currentFrame = {
      detectionStartTime: timestamp || performance.now(),
      timestamp: timestamp || performance.now()
    };
  }

  /**
   * Mark end of detection
   */
  markDetectionEnd(timestamp?: number): void {
    const endTime = timestamp || performance.now();
    if (this.currentFrame.detectionStartTime) {
      this.currentFrame.detectionEndTime = endTime;
      this.currentFrame.detectionDuration = endTime - this.currentFrame.detectionStartTime;
    }
  }

  /**
   * Mark start of rendering
   */
  markRenderStart(timestamp?: number): void {
    this.currentFrame.renderStartTime = timestamp || performance.now();
  }

  /**
   * Mark end of rendering and complete frame
   */
  markRenderEnd(timestamp?: number): void {
    const endTime = timestamp || performance.now();
    if (this.currentFrame.renderStartTime) {
      this.currentFrame.renderEndTime = endTime;
      this.currentFrame.renderDuration = endTime - this.currentFrame.renderStartTime;
    }

    // Calculate end-to-end latency
    if (this.currentFrame.detectionStartTime && this.currentFrame.renderEndTime) {
      this.currentFrame.endToEndLatency = 
        this.currentFrame.renderEndTime - this.currentFrame.detectionStartTime;
    }

    // Add to history
    if (Object.keys(this.currentFrame).length > 2) {
      this.timings.push(this.currentFrame as FrameTimingData);
      
      if (this.timings.length > this.maxTimings) {
        this.timings.shift();
      }
    }

    this.processedFrames++;
    this.currentFrame = {};
  }

  /**
   * Mark frame as skipped
   */
  markFrameSkipped(): void {
    this.skippedFrames++;
  }

  /**
   * Decide if next frame should be skipped for performance
   */
  shouldSkipNextFrame(): boolean {
    if (!this.adaptiveConfig.enableAdaptiveSkipping) return false;

    const metrics = this.getMetrics();
    const currentFPS = this.estimateCurrentFPS();

    // Skip if latency exceeds budget AND we're below threshold
    if (metrics.avgEndToEndLatency > this.adaptiveConfig.latencyBudget &&
        currentFPS < this.adaptiveConfig.skipThreshold) {
      return true;
    }

    // Resume if recovered to good performance
    if (currentFPS > this.adaptiveConfig.recoveryThreshold) {
      return false;
    }

    return false;
  }

  /**
   * Get current frame timing metrics
   */
  getMetrics(): FrameSyncMetrics {
    if (this.timings.length === 0) {
      return {
        avgEndToEndLatency: 0,
        maxEndToEndLatency: 0,
        detectionAvgDuration: 0,
        renderAvgDuration: 0,
        frameSkipRate: 0,
        detectionToRenderRatio: 0,
        isAdaptiveQualityActive: false,
        estimatedFPS: 0
      };
    }

    const avgLatency = this.timings.reduce((sum, t) => sum + t.endToEndLatency, 0) / this.timings.length;
    const maxLatency = Math.max(...this.timings.map(t => t.endToEndLatency));
    const detectionAvg = this.timings.reduce((sum, t) => sum + (t.detectionDuration || 0), 0) / this.timings.length;
    const renderAvg = this.timings.reduce((sum, t) => sum + (t.renderDuration || 0), 0) / this.timings.length;
    const total = this.processedFrames + this.skippedFrames;
    const skipRate = total > 0 ? (this.skippedFrames / total) * 100 : 0;
    const ratio = detectionAvg > 0 ? renderAvg / detectionAvg : 0;

    return {
      avgEndToEndLatency: avgLatency,
      maxEndToEndLatency: maxLatency,
      detectionAvgDuration: detectionAvg,
      renderAvgDuration: renderAvg,
      frameSkipRate: skipRate,
      detectionToRenderRatio: ratio,
      isAdaptiveQualityActive: skipRate > 0,
      estimatedFPS: this.estimateCurrentFPS()
    };
  }

  /**
   * Get recent timing data (last N frames)
   */
  getRecentTimings(frameCount: number = 30): FrameTimingData[] {
    return this.timings.slice(Math.max(0, this.timings.length - frameCount));
  }

  /**
   * Reset tracking
   */
  reset(): void {
    this.timings = [];
    this.skippedFrames = 0;
    this.processedFrames = 0;
    this.currentFrame = {};
  }

  /**
   * Estimate current FPS from timing data
   */
  private estimateCurrentFPS(): number {
    if (this.timings.length < 2) return 0;

    // Use recent 30 frames for FPS calculation
    const recent = this.timings.slice(-30);
    const firstTime = recent[0].timestamp;
    const lastTime = recent[recent.length - 1].timestamp;
    const duration = (lastTime - firstTime) / 1000; // Convert to seconds

    if (duration <= 0) return 0;
    return Math.round(recent.length / duration);
  }

  /**
   * Export timing data as JSON
   */
  exportTimings(): FrameTimingData[] {
    return JSON.parse(JSON.stringify(this.timings));
  }

  /**
   * Validate frame sync health
   */
  isHealthy(): boolean {
    const metrics = this.getMetrics();
    
    // Consider healthy if:
    // 1. Average latency < 50ms
    // 2. Frame skip rate < 10%
    // 3. Detection is <30ms on average
    return (
      metrics.avgEndToEndLatency < 50 &&
      metrics.frameSkipRate < 10 &&
      metrics.detectionAvgDuration < 30
    );
  }
}

// ============================================
// Global Frame Timing Instance
// ============================================

let globalTracker: FrameTimingTracker | null = null;

/**
 * Get or create global frame timing tracker
 */
export function getFrameTimingTracker(): FrameTimingTracker {
  if (!globalTracker) {
    globalTracker = new FrameTimingTracker({
      enableAdaptiveSkipping: true,
      targetFPS: 30,
      latencyBudget: 50,
      skipThreshold: 28,
      recoveryThreshold: 32
    });
  }
  return globalTracker;
}

/**
 * Reset global tracker
 */
export function resetFrameTimingTracker(): void {
  if (globalTracker) {
    globalTracker.reset();
  }
}

// ============================================
// Synchronization Helpers
// ============================================

/**
 * Request video frame callback with fallback
 * Attempts to use requestVideoFrameCallback if available
 */
export function requestVideoFrameSync(
  callback: (timestamp: number) => void,
  videoElement?: HTMLVideoElement
): number | null {
  // Try native requestVideoFrameCallback if available
  if (videoElement && 'requestVideoFrameCallback' in videoElement) {
    try {
      const video = videoElement as unknown as {
        requestVideoFrameCallback: (callback: (timestamp: number) => void) => number;
      };
      return video.requestVideoFrameCallback(callback);
    } catch {
      // Fall back to RAF if method fails
    }
  }

  // Fallback to requestAnimationFrame
  return requestAnimationFrame(callback) as unknown as number;
}

/**
 * Cancel video frame callback with fallback
 */
export function cancelVideoFrameSync(id: number | null, videoElement?: HTMLVideoElement): void {
  if (id === null) return;

  // Try native cancelVideoFrameCallback if available
  if (videoElement && 'cancelVideoFrameCallback' in videoElement) {
    try {
      const video = videoElement as unknown as {
        cancelVideoFrameCallback: (id: number) => void;
      };
      video.cancelVideoFrameCallback(id);
      return;
    } catch {
      // Fall back to cancelAnimationFrame
    }
  }

  // Fallback to cancelAnimationFrame
  cancelAnimationFrame(id);
}

// ============================================
// Frame Drop Detection
// ============================================

export class FrameDropDetector {
  private lastFrameTime: number = 0;
  private expectedFrameTime: number = 1000 / 30; // 33.33ms @ 30fps
  private dropThreshold: number = 1.5; // 1.5x expected time = frame drop
  private droppedFrames: number = 0;
  private totalFrames: number = 0;

  /**
   * Record frame timing
   */
  recordFrame(timestamp: number): boolean {
    this.totalFrames++;

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timestamp;
      return true;
    }

    const elapsed = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Detect frame drop: if elapsed time > 1.5x expected
    if (elapsed > this.expectedFrameTime * this.dropThreshold) {
      this.droppedFrames++;
      return false; // Frame was dropped
    }

    return true; // Frame was rendered on time
  }

  /**
   * Get drop rate
   */
  getDropRate(): number {
    if (this.totalFrames === 0) return 0;
    return (this.droppedFrames / this.totalFrames) * 100;
  }

  /**
   * Reset detector
   */
  reset(): void {
    this.lastFrameTime = 0;
    this.droppedFrames = 0;
    this.totalFrames = 0;
  }
}
