/**
 * Metrics Utilities for Dashboard & Analytics
 * 
 * Phase E: Metrics Dashboard & Real-Time Visualization
 * Provides utilities for collecting, analyzing, and reporting metrics
 */

// ============================================
// Metrics Collection
// ============================================

export interface MetricsSnapshot {
  timestamp: number;
  fps: number;
  latency: number;
  jitter: number;
  visibility: number;
  cacheHitRate: number;
  sortTime: number;
  frameDropRate: number;
}

export interface MetricsSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  snapshots: MetricsSnapshot[];
  avgFps: number;
  avgLatency: number;
  avgJitter: number;
  avgVisibility: number;
  minFps: number;
  maxLatency: number;
}

/**
 * Session-level metrics collector
 */
export class MetricsCollector {
  private sessionId: string;
  private startTime: number;
  private snapshots: MetricsSnapshot[] = [];
  private maxSnapshots: number = 3600; // 30 minutes at 0.5Hz

  constructor(sessionId: string = `session-${Date.now()}`) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
  }

  /**
   * Record a metrics snapshot
   */
  recordSnapshot(snapshot: Omit<MetricsSnapshot, 'timestamp'>): void {
    const fullSnapshot: MetricsSnapshot = {
      ...snapshot,
      timestamp: Date.now()
    };

    this.snapshots.push(fullSnapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }
  }

  /**
   * Get session summary
   */
  getSummary(): MetricsSession {
    if (this.snapshots.length === 0) {
      return {
        sessionId: this.sessionId,
        startTime: this.startTime,
        snapshots: [],
        avgFps: 0,
        avgLatency: 0,
        avgJitter: 0,
        avgVisibility: 0,
        minFps: 0,
        maxLatency: 0
      };
    }

    const fpsValues = this.snapshots.map(s => s.fps);
    const latencyValues = this.snapshots.map(s => s.latency);
    const jitterValues = this.snapshots.map(s => s.jitter);
    const visibilityValues = this.snapshots.map(s => s.visibility);

    const avgFps = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
    const avgLatency = latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length;
    const avgJitter = jitterValues.reduce((a, b) => a + b, 0) / jitterValues.length;
    const avgVisibility = visibilityValues.reduce((a, b) => a + b, 0) / visibilityValues.length;
    const minFps = Math.min(...fpsValues);
    const maxLatency = Math.max(...latencyValues);

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: Date.now(),
      duration: Date.now() - this.startTime,
      snapshots: this.snapshots,
      avgFps,
      avgLatency,
      avgJitter,
      avgVisibility,
      minFps,
      maxLatency
    };
  }

  /**
   * Reset session
   */
  reset(): void {
    this.snapshots = [];
    this.startTime = Date.now();
  }

  /**
   * Get snapshot count
   */
  getSnapshotCount(): number {
    return this.snapshots.length;
  }
}

// ============================================
// Metrics Analysis
// ============================================

export interface HealthStatus {
  overall: 'excellent' | 'good' | 'acceptable' | 'poor';
  fps: 'excellent' | 'good' | 'acceptable' | 'poor';
  latency: 'excellent' | 'good' | 'acceptable' | 'poor';
  jitter: 'excellent' | 'good' | 'acceptable' | 'poor';
  visibility: 'excellent' | 'good' | 'acceptable' | 'poor';
  issues: string[];
  recommendations: string[];
}

/**
 * Analyze metrics health status
 */
export function analyzeMetricsHealth(session: MetricsSession): HealthStatus {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // FPS Analysis
  let fpsStatus: 'excellent' | 'good' | 'acceptable' | 'poor' = 'excellent';
  if (session.avgFps < 25) {
    fpsStatus = 'poor';
    issues.push(`Low average FPS: ${session.avgFps.toFixed(1)}`);
    recommendations.push('Device may be underpowered; consider lowering quality settings');
  } else if (session.avgFps < 28) {
    fpsStatus = 'acceptable';
    recommendations.push('FPS is borderline; monitor for frame drops');
  } else if (session.avgFps < 30) {
    fpsStatus = 'good';
  }

  // Latency Analysis
  let latencyStatus: 'excellent' | 'good' | 'acceptable' | 'poor' = 'excellent';
  if (session.maxLatency > 100) {
    latencyStatus = 'poor';
    issues.push(`High latency detected: ${session.maxLatency.toFixed(1)}ms`);
    recommendations.push('Check for background processes consuming CPU');
  } else if (session.avgLatency > 50) {
    latencyStatus = 'acceptable';
    recommendations.push('Latency is above target; monitor system load');
  } else if (session.avgLatency > 35) {
    latencyStatus = 'good';
  }

  // Jitter Analysis
  let jitterStatus: 'excellent' | 'good' | 'acceptable' | 'poor' = 'excellent';
  if (session.avgJitter > 5) {
    jitterStatus = 'poor';
    issues.push(`High jitter detected: ${session.avgJitter.toFixed(2)}px`);
    recommendations.push('Skeleton appears unstable; check pose detection confidence');
  } else if (session.avgJitter > 3) {
    jitterStatus = 'acceptable';
    recommendations.push('Jitter is slightly elevated; this is normal in low light');
  } else if (session.avgJitter > 2) {
    jitterStatus = 'good';
  }

  // Visibility Analysis
  let visibilityStatus: 'excellent' | 'good' | 'acceptable' | 'poor' = 'excellent';
  if (session.avgVisibility < 0.5) {
    visibilityStatus = 'poor';
    issues.push(`Low pose visibility: ${(session.avgVisibility * 100).toFixed(0)}%`);
    recommendations.push('Improve lighting or get closer to camera');
  } else if (session.avgVisibility < 0.65) {
    visibilityStatus = 'acceptable';
    recommendations.push('Pose visibility is acceptable but could be improved');
  } else if (session.avgVisibility < 0.80) {
    visibilityStatus = 'good';
  }

  // Overall status
  const statuses = [fpsStatus, latencyStatus, jitterStatus, visibilityStatus];
  const hasExcellent = statuses.every(s => s === 'excellent');
  const hasPoor = statuses.some(s => s === 'poor');
  const hasAcceptable = statuses.some(s => s === 'acceptable');

  let overall: 'excellent' | 'good' | 'acceptable' | 'poor';
  if (hasPoor) {
    overall = 'poor';
  } else if (hasAcceptable) {
    overall = 'acceptable';
  } else if (hasExcellent) {
    overall = 'excellent';
  } else {
    overall = 'good';
  }

  return {
    overall,
    fps: fpsStatus,
    latency: latencyStatus,
    jitter: jitterStatus,
    visibility: visibilityStatus,
    issues,
    recommendations
  };
}

// ============================================
// Performance Benchmarking
// ============================================

export interface BenchmarkResult {
  device: string;
  avgFps: number;
  avgLatency: number;
  avgJitter: number;
  percentile95Fps: number;
  percentile95Latency: number;
  frameDropRate: number;
}

/**
 * Generate benchmark from session metrics
 */
export function generateBenchmark(session: MetricsSession, device: string = 'unknown'): BenchmarkResult {
  if (session.snapshots.length === 0) {
    return {
      device,
      avgFps: 0,
      avgLatency: 0,
      avgJitter: 0,
      percentile95Fps: 0,
      percentile95Latency: 0,
      frameDropRate: 0
    };
  }

  const fpsValues = session.snapshots.map(s => s.fps).sort((a, b) => a - b);
  const latencyValues = session.snapshots.map(s => s.latency).sort((a, b) => a - b);

  const p95FpsIndex = Math.floor(fpsValues.length * 0.05);
  const p95LatencyIndex = Math.floor(latencyValues.length * 0.95);

  const dropRates = session.snapshots.map(s => s.frameDropRate);
  const avgDropRate = dropRates.reduce((a, b) => a + b, 0) / dropRates.length;

  return {
    device,
    avgFps: session.avgFps,
    avgLatency: session.avgLatency,
    avgJitter: session.avgJitter,
    percentile95Fps: fpsValues[p95FpsIndex] || 0,
    percentile95Latency: latencyValues[p95LatencyIndex] || 0,
    frameDropRate: avgDropRate
  };
}

// ============================================
// Global Metrics Collector Instance
// ============================================

let globalCollector: MetricsCollector | null = null;

/**
 * Get or create global metrics collector
 */
export function getGlobalMetricsCollector(): MetricsCollector {
  if (!globalCollector) {
    globalCollector = new MetricsCollector();
  }
  return globalCollector;
}

/**
 * Get current session summary
 */
export function getCurrentSessionMetrics(): MetricsSession {
  return getGlobalMetricsCollector().getSummary();
}

/**
 * Record metrics to global collector
 */
export function recordMetricsSnapshot(snapshot: Omit<MetricsSnapshot, 'timestamp'>): void {
  getGlobalMetricsCollector().recordSnapshot(snapshot);
}

/**
 * Reset global collector
 */
export function resetMetricsCollector(): void {
  if (globalCollector) {
    globalCollector.reset();
  }
}

// ============================================
// Metrics Export & Reporting
// ============================================

/**
 * Export metrics as JSON
 */
export function exportMetricsJSON(session: MetricsSession): string {
  return JSON.stringify(session, null, 2);
}

/**
 * Export metrics as CSV
 */
export function exportMetricsCSV(session: MetricsSession): string {
  const headers = ['Timestamp', 'FPS', 'Latency(ms)', 'Jitter(px)', 'Visibility', 'CacheHit(%)', 'SortTime(ms)', 'DropRate(%)'];
  const rows = session.snapshots.map(s => [
    new Date(s.timestamp).toISOString(),
    s.fps.toFixed(1),
    s.latency.toFixed(1),
    s.jitter.toFixed(2),
    (s.visibility * 100).toFixed(0),
    s.cacheHitRate.toFixed(1),
    s.sortTime.toFixed(2),
    s.frameDropRate.toFixed(1)
  ]);

  return [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');
}

/**
 * Log metrics summary to console
 */
export function logMetricsSummary(session: MetricsSession): void {
  const health = analyzeMetricsHealth(session);

  console.group('[Metrics Summary]');
  console.log(`Session ID: ${session.sessionId}`);
  console.log(`Duration: ${((session.duration || 0) / 1000).toFixed(1)}s`);
  console.log('');
  console.log(`Average FPS: ${session.avgFps.toFixed(1)} (min: ${session.minFps.toFixed(1)})`);
  console.log(`Average Latency: ${session.avgLatency.toFixed(1)}ms (max: ${session.maxLatency.toFixed(1)})`);
  console.log(`Average Jitter: ${session.avgJitter.toFixed(2)}px`);
  console.log(`Average Visibility: ${(session.avgVisibility * 100).toFixed(0)}%`);
  console.log('');
  console.log(`Overall Health: ${health.overall.toUpperCase()}`);

  if (health.issues.length > 0) {
    console.warn('Issues:', health.issues);
  }
  if (health.recommendations.length > 0) {
    console.info('Recommendations:', health.recommendations);
  }

  console.groupEnd();
}
