/**
 * Pose Telemetry & Metrics Collection
 * 
 * Phase A: Stability & Jitter Elimination
 * Tracks and aggregates performance metrics for the pose detection system
 */

import { JitterMetrics } from './engine';

// ============================================
// Telemetry Types
// ============================================

export interface SessionMetrics {
  startTime: number;
  endTime?: number;
  frameCount: number;
  droppedFrames: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  avgLatency: number;
  avgJitter: number;
  maxJitter: number;
  avgStabilityScore: number;
  sessionDuration: number; // ms
}

export interface MetricsSnapshot {
  timestamp: number;
  metrics: JitterMetrics;
}

// ============================================
// Metrics Collector
// ============================================

export class PoseMetricsCollector {
  private snapshots: MetricsSnapshot[] = [];
  private maxSnapshots: number = 300; // Keep 5 min at 1 sample/sec
  private startTime: number = 0;
  private frameCount: number = 0;
  private droppedFrames: number = 0;

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Record a metrics snapshot (call every 1Hz for best results)
   */
  recordSnapshot(metrics: JitterMetrics): void {
    this.snapshots.push({
      timestamp: performance.now(),
      metrics: { ...metrics }
    });

    // Keep buffer bounded
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    this.frameCount++;
    this.droppedFrames += Math.round(metrics.frameDropRate);
  }

  /**
   * Get aggregate metrics for current session
   */
  getSessionMetrics(): SessionMetrics {
    const now = performance.now();
    const duration = now - this.startTime;

    if (this.snapshots.length === 0) {
      return {
        startTime: this.startTime,
        frameCount: 0,
        droppedFrames: 0,
        avgFps: 0,
        minFps: 0,
        maxFps: 0,
        avgLatency: 0,
        avgJitter: 0,
        maxJitter: 0,
        avgStabilityScore: 0,
        sessionDuration: duration
      };
    }

    const fps = this.snapshots.map(s => s.metrics.frameDropRate); // Approximate
    const latencies = this.snapshots.map(s => s.metrics.detectionLatency);
    const jitters = this.snapshots.map(s => s.metrics.avgPixelJitter);
    const stabilityScores = this.snapshots.map(s => s.metrics.stabilityScore);

    return {
      startTime: this.startTime,
      endTime: now,
      frameCount: this.frameCount,
      droppedFrames: this.droppedFrames,
      avgFps: this.calculateAverage(fps),
      minFps: Math.min(...fps),
      maxFps: Math.max(...fps),
      avgLatency: this.calculateAverage(latencies),
      avgJitter: this.calculateAverage(jitters),
      maxJitter: Math.max(...jitters),
      avgStabilityScore: this.calculateAverage(stabilityScores),
      sessionDuration: duration
    };
  }

  /**
   * Reset collector (for new session)
   */
  reset(): void {
    this.snapshots = [];
    this.startTime = performance.now();
    this.frameCount = 0;
    this.droppedFrames = 0;
  }

  /**
   * Get recent metrics (last N seconds)
   */
  getRecentMetrics(windowSeconds: number = 10): JitterMetrics | null {
    if (this.snapshots.length === 0) return null;

    const now = performance.now();
    const windowMs = windowSeconds * 1000;
    const recent = this.snapshots.filter(s => now - s.timestamp < windowMs);

    if (recent.length === 0) return null;

    // Return average of recent snapshots
    const avgJitter = recent.reduce((sum, s) => sum + s.metrics.avgPixelJitter, 0) / recent.length;
    const avgLatency = recent.reduce((sum, s) => sum + s.metrics.detectionLatency, 0) / recent.length;
    const avgDropRate = recent.reduce((sum, s) => sum + s.metrics.frameDropRate, 0) / recent.length;
    const avgStability = recent.reduce((sum, s) => sum + s.metrics.stabilityScore, 0) / recent.length;

    return {
      avgPixelJitter: avgJitter,
      maxPixelJitter: Math.max(...recent.map(s => s.metrics.maxPixelJitter)),
      stabilityScore: Math.round(avgStability),
      detectionLatency: avgLatency,
      frameDropRate: avgDropRate
    };
  }

  /**
   * Export metrics as JSON for analytics
   */
  exportMetrics(): {
    session: SessionMetrics;
    snapshots: MetricsSnapshot[];
  } {
    return {
      session: this.getSessionMetrics(),
      snapshots: [...this.snapshots]
    };
  }

  // ============================================
  // Private Helpers
  // ============================================

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
}

// ============================================
// Global Metrics Instance
// ============================================

let globalCollector: PoseMetricsCollector | null = null;

/**
 * Get or create global metrics collector
 */
export function getMetricsCollector(): PoseMetricsCollector {
  if (!globalCollector) {
    globalCollector = new PoseMetricsCollector();
  }
  return globalCollector;
}

/**
 * Reset global metrics collector
 */
export function resetMetricsCollector(): void {
  if (globalCollector) {
    globalCollector.reset();
  }
}

// ============================================
// Telemetry Helpers
// ============================================

/**
 * Log metrics to console in a readable format
 */
export function logMetricsReport(metrics: SessionMetrics): void {
  console.group('[Pose Metrics Report]');
  console.table({
    'Duration (s)': (metrics.sessionDuration / 1000).toFixed(1),
    'Frames': metrics.frameCount,
    'Dropped': metrics.droppedFrames,
    'Avg FPS': metrics.avgFps.toFixed(1),
    'Avg Latency (ms)': metrics.avgLatency.toFixed(1),
    'Avg Jitter (px)': metrics.avgJitter.toFixed(2),
    'Avg Stability': `${metrics.avgStabilityScore.toFixed(0)}%`,
    'Status': metrics.avgFps >= 30 && metrics.avgJitter < 3 ? '✅ Good' : '⚠️ Needs Work'
  });
  console.groupEnd();
}

/**
 * Check if current metrics are within acceptable ranges
 */
export function validateMetrics(metrics: JitterMetrics): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (metrics.detectionLatency > 50) {
    issues.push(`High latency: ${metrics.detectionLatency.toFixed(0)}ms (target: <50ms)`);
  }
  if (metrics.avgPixelJitter > 2) {
    issues.push(`High jitter: ${metrics.avgPixelJitter.toFixed(2)}px (target: <2px)`);
  }
  if (metrics.frameDropRate > 5) {
    issues.push(`High frame drop: ${metrics.frameDropRate.toFixed(1)}% (target: <5%)`);
  }
  if (metrics.stabilityScore < 80) {
    issues.push(`Low stability: ${metrics.stabilityScore}% (target: >80%)`);
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
