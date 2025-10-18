/**
 * Adaptive Frame Dropping for Low-FPS Devices
 * 
 * Dynamically adjusts pose detection frequency based on device capability
 * Maintains smooth visual experience while reducing CPU load on low-end devices
 */

import { getDeviceCapabilities, getCurrentDepthConfig } from './depthOptimization';

// ============================================
// Frame Drop Configuration
// ============================================

export interface FrameDropConfig {
  enabled: boolean;
  minFpsThreshold: number;      // Drop frames if FPS falls below this
  targetFps: number;             // Target FPS after dropping
  frameSkipCount: number;         // Skip this many frames (1 = keep all, 2 = skip every other)
  adaptiveMode: boolean;         // Auto-adjust based on FPS
  maxConsecutiveDrops: number;   // Don't drop more than N consecutive frames
}

export interface FrameDropMetrics {
  totalFrames: number;
  droppedFrames: number;
  keptFrames: number;
  dropRate: number;
  currentFrameSkip: number;
  adaptationLevel: number;       // 0-100, higher = more aggressive dropping
}

/**
 * Adaptive frame dropping manager
 */
export class AdaptiveFrameDropping {
  private config: FrameDropConfig;
  private metrics: FrameDropMetrics = {
    totalFrames: 0,
    droppedFrames: 0,
    keptFrames: 0,
    dropRate: 0,
    currentFrameSkip: 1,
    adaptationLevel: 0
  };

  private frameCounter: number = 0;
  private fpsHistory: number[] = [];
  private lastFpsCalculation: number = Date.now();
  private currentFps: number = 60;
  private consecutiveDrops: number = 0;

  constructor(config?: Partial<FrameDropConfig>) {
    // Detect device capability
    const deviceCapabilities = getDeviceCapabilities();
    const depthConfig = getCurrentDepthConfig();

    // Default config based on device
    const defaultConfig: FrameDropConfig = {
      enabled: deviceCapabilities.deviceType === 'low-end' || deviceCapabilities.estimatedFPS < 30,
      minFpsThreshold: deviceCapabilities.deviceType === 'low-end' ? 20 : 25,
      targetFps: deviceCapabilities.deviceType === 'low-end' ? 20 : 25,
      frameSkipCount: 1,
      adaptiveMode: true,
      maxConsecutiveDrops: deviceCapabilities.deviceType === 'low-end' ? 5 : 3
    };

    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Check if current frame should be processed
   * Returns true if frame should be kept, false if should be dropped
   */
  shouldProcessFrame(): boolean {
    this.frameCounter++;
    this.metrics.totalFrames++;

    // If dropping disabled, process all frames
    if (!this.config.enabled) {
      this.metrics.keptFrames++;
      return true;
    }

    // Check if we should drop this frame
    const shouldDrop = (this.frameCounter % this.config.frameSkipCount) !== 0;

    if (shouldDrop) {
      this.metrics.droppedFrames++;
      this.consecutiveDrops++;

      // Safety check: don't drop more than max consecutive
      if (this.consecutiveDrops >= this.config.maxConsecutiveDrops) {
        this.consecutiveDrops = 0;
        this.metrics.keptFrames++;
        return true;
      }

      return false;
    } else {
      this.metrics.keptFrames++;
      this.consecutiveDrops = 0;
      return true;
    }
  }

  /**
   * Record FPS measurement
   */
  recordFps(fps: number): void {
    this.currentFps = fps;
    this.fpsHistory.push(fps);

    // Keep only last 60 measurements (1 minute at 1Hz)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }

    // Update metrics
    this.updateMetrics();

    // Adapt frame skip based on FPS if adaptive mode enabled
    if (this.config.adaptiveMode) {
      this.adaptFrameSkip(fps);
    }
  }

  /**
   * Dynamically adjust frame skip based on FPS
   */
  private adaptFrameSkip(fps: number): void {
    if (fps >= this.config.targetFps + 5) {
      // FPS is good, reduce frame skipping
      this.config.frameSkipCount = Math.max(1, this.config.frameSkipCount - 1);
      this.metrics.adaptationLevel = Math.max(0, this.metrics.adaptationLevel - 5);
    } else if (fps < this.config.minFpsThreshold) {
      // FPS is too low, increase frame skipping
      this.config.frameSkipCount = Math.min(5, this.config.frameSkipCount + 1);
      this.metrics.adaptationLevel = Math.min(100, this.metrics.adaptationLevel + 10);
    }

    this.metrics.currentFrameSkip = this.config.frameSkipCount;
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    if (this.metrics.totalFrames > 0) {
      this.metrics.dropRate = (this.metrics.droppedFrames / this.metrics.totalFrames) * 100;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): FrameDropMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current configuration
   */
  getConfig(): FrameDropConfig {
    return { ...this.config };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      totalFrames: 0,
      droppedFrames: 0,
      keptFrames: 0,
      dropRate: 0,
      currentFrameSkip: 1,
      adaptationLevel: 0
    };
    this.frameCounter = 0;
    this.consecutiveDrops = 0;
  }

  /**
   * Enable/disable frame dropping
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Set target FPS
   */
  setTargetFps(fps: number): void {
    this.config.targetFps = fps;
    this.config.minFpsThreshold = Math.max(fps - 10, 15);
  }

  /**
   * Get frame skip ratio as percentage
   */
  getDropPercentage(): number {
    return (this.config.frameSkipCount - 1) / 5 * 100; // 0-100%
  }

  /**
   * Get estimated FPS after frame dropping
   */
  getEstimatedFpsAfterDropping(baseFps: number): number {
    if (!this.config.enabled || this.config.frameSkipCount === 1) {
      return baseFps;
    }
    return baseFps / this.config.frameSkipCount;
  }
}

// ============================================
// Global Instance
// ============================================

let globalFrameDropping: AdaptiveFrameDropping | null = null;

/**
 * Get or create global frame dropping instance
 */
export function getGlobalFrameDropping(config?: Partial<FrameDropConfig>): AdaptiveFrameDropping {
  if (!globalFrameDropping) {
    globalFrameDropping = new AdaptiveFrameDropping(config);
  }
  return globalFrameDropping;
}

/**
 * Check if frame should be processed
 */
export function shouldProcessFrame(): boolean {
  return getGlobalFrameDropping().shouldProcessFrame();
}

/**
 * Record FPS measurement
 */
export function recordFrameDropFps(fps: number): void {
  getGlobalFrameDropping().recordFps(fps);
}

/**
 * Get frame drop metrics
 */
export function getFrameDropMetrics(): FrameDropMetrics {
  return getGlobalFrameDropping().getMetrics();
}

/**
 * Get frame drop config
 */
export function getFrameDropConfig(): FrameDropConfig {
  return getGlobalFrameDropping().getConfig();
}

/**
 * Reset frame dropping
 */
export function resetFrameDropping(): void {
  if (globalFrameDropping) {
    globalFrameDropping.reset();
  }
}

// ============================================
// Frame Drop Quality Validation
// ============================================

export interface FrameDropValidation {
  isHealthy: boolean;
  dropRate: number;
  estimatedFps: number;
  issues: string[];
  recommendations: string[];
}

/**
 * Validate frame dropping health
 */
export function validateFrameDropping(
  currentFps: number,
  metrics: FrameDropMetrics
): FrameDropValidation {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const estimatedFps = currentFps / metrics.currentFrameSkip;

  let isHealthy = true;

  // Check if dropping is too aggressive
  if (metrics.dropRate > 50) {
    isHealthy = false;
    issues.push(`Aggressive frame dropping: ${metrics.dropRate.toFixed(1)}% (consider device upgrade)`);
    recommendations.push('Device may be underpowered; consider showing lower quality mode');
  } else if (metrics.dropRate > 25) {
    recommendations.push('Moderate frame dropping; monitor performance');
  }

  // Check if estimated FPS is still acceptable
  if (estimatedFps < 20) {
    isHealthy = false;
    issues.push(`Estimated FPS too low: ${estimatedFps.toFixed(1)}fps`);
    recommendations.push('Consider disabling advanced features (depth, workers)');
  } else if (estimatedFps < 25) {
    recommendations.push('FPS is borderline; try disabling optional features');
  }

  // Check adaptation level
  if (metrics.adaptationLevel > 80) {
    issues.push(`Adaptation maxed out: device heavily stressed`);
    recommendations.push('Recommend user to close other applications');
  }

  return {
    isHealthy,
    dropRate: metrics.dropRate,
    estimatedFps,
    issues,
    recommendations
  };
}

// ============================================
// Integration Helpers
// ============================================

/**
 * Log frame dropping status
 */
export function logFrameDropStatus(): void {
  const instance = getGlobalFrameDropping();
  const metrics = instance.getMetrics();
  const config = instance.getConfig();

  console.group('[Frame Dropping Status]');
  console.log(`Enabled: ${config.enabled}`);
  console.log(`Target FPS: ${config.targetFps}`);
  console.log(`Current Frame Skip: ${metrics.currentFrameSkip}x`);
  console.log(`Drop Rate: ${metrics.dropRate.toFixed(1)}%`);
  console.log(`Total Frames: ${metrics.totalFrames}`);
  console.log(`Dropped: ${metrics.droppedFrames} / Kept: ${metrics.keptFrames}`);
  console.log(`Adaptation Level: ${metrics.adaptationLevel.toFixed(0)}%`);
  console.groupEnd();
}
