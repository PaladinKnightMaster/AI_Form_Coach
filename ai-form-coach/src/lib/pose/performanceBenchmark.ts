/**
 * Performance Benchmark Utility
 *
 * Tracks and compares performance metrics before/after optimizations
 * Measures: detection latency, FPS, GC pressure, frame drop rate
 */

export interface PerformanceSnapshot {
  timestamp: number;
  detectionLatencyMs: number;
  renderLatencyMs: number;
  totalLatencyMs: number;
  fps: number;
  frameDropRate: number;
  memoryUsedMB: number;
  motionMagnitude?: number;
  isStatic?: boolean;
  simdEnabled: boolean;
}

export interface BenchmarkSummary {
  avgDetectionMs: number;
  avgRenderMs: number;
  avgTotalLatency: number;
  avgFPS: number;
  avgFrameDropRate: number;
  avgMemoryMB: number;
  p95DetectionMs: number; // 95th percentile
  p99DetectionMs: number; // 99th percentile
  minFPS: number;
  maxFPS: number;
  totalSamples: number;
  duration: number; // seconds
}

export class PerformanceBenchmark {
  private snapshots: PerformanceSnapshot[] = [];
  private maxSnapshots: number = 1800; // 30 minutes at 1 sample/sec
  private startTime: number = Date.now();

  /**
   * Record a performance snapshot
   */
  record(snapshot: Omit<PerformanceSnapshot, 'timestamp'>): void {
    this.snapshots.push({
      ...snapshot,
      timestamp: Date.now()
    });

    // Keep within max size
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * Get summary statistics
   */
  getSummary(): BenchmarkSummary {
    if (this.snapshots.length === 0) {
      return {
        avgDetectionMs: 0,
        avgRenderMs: 0,
        avgTotalLatency: 0,
        avgFPS: 0,
        avgFrameDropRate: 0,
        avgMemoryMB: 0,
        p95DetectionMs: 0,
        p99DetectionMs: 0,
        minFPS: 0,
        maxFPS: 0,
        totalSamples: 0,
        duration: 0
      };
    }

    const length = this.snapshots.length;

    // Calculate averages
    let sumDetection = 0;
    let sumRender = 0;
    let sumTotal = 0;
    let sumFPS = 0;
    let sumDropRate = 0;
    let sumMemory = 0;

    for (let i = 0; i < length; i++) {
      const snap = this.snapshots[i];
      sumDetection += snap.detectionLatencyMs;
      sumRender += snap.renderLatencyMs;
      sumTotal += snap.totalLatencyMs;
      sumFPS += snap.fps;
      sumDropRate += snap.frameDropRate;
      sumMemory += snap.memoryUsedMB;
    }

    // Calculate percentiles
    const detectionSorted = this.snapshots
      .map(s => s.detectionLatencyMs)
      .sort((a, b) => a - b);
    const p95Index = Math.floor(length * 0.95);
    const p99Index = Math.floor(length * 0.99);

    // Find min/max FPS
    let minFPS = Infinity;
    let maxFPS = -Infinity;
    for (let i = 0; i < length; i++) {
      const fps = this.snapshots[i].fps;
      if (fps < minFPS) minFPS = fps;
      if (fps > maxFPS) maxFPS = fps;
    }

    const duration = (Date.now() - this.startTime) / 1000;

    return {
      avgDetectionMs: sumDetection / length,
      avgRenderMs: sumRender / length,
      avgTotalLatency: sumTotal / length,
      avgFPS: sumFPS / length,
      avgFrameDropRate: sumDropRate / length,
      avgMemoryMB: sumMemory / length,
      p95DetectionMs: detectionSorted[p95Index] || 0,
      p99DetectionMs: detectionSorted[p99Index] || 0,
      minFPS,
      maxFPS,
      totalSamples: length,
      duration
    };
  }

  /**
   * Compare with another benchmark
   */
  compare(before: BenchmarkSummary, after: BenchmarkSummary): {
    detectionImprovement: number;
    fpsImprovement: number;
    latencyReduction: number;
    memoryReduction: number;
  } {
    return {
      detectionImprovement: ((before.avgDetectionMs - after.avgDetectionMs) / before.avgDetectionMs) * 100,
      fpsImprovement: ((after.avgFPS - before.avgFPS) / before.avgFPS) * 100,
      latencyReduction: ((before.avgTotalLatency - after.avgTotalLatency) / before.avgTotalLatency) * 100,
      memoryReduction: ((before.avgMemoryMB - after.avgMemoryMB) / before.avgMemoryMB) * 100
    };
  }

  /**
   * Get recent snapshots
   */
  getRecentSnapshots(count: number = 30): PerformanceSnapshot[] {
    return this.snapshots.slice(-count);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.snapshots = [];
    this.startTime = Date.now();
  }

  /**
   * Export as JSON
   */
  export(): {
    snapshots: PerformanceSnapshot[];
    summary: BenchmarkSummary;
  } {
    return {
      snapshots: this.snapshots,
      summary: this.getSummary()
    };
  }

  /**
   * Get memory usage (if available)
   */
  static getMemoryUsage(): number {
    if ('memory' in performance && performance.memory) {
      const mem = (performance.memory as unknown as { usedJSHeapSize: number });
      return mem.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0;
  }
}

// Global benchmark instance
let globalBenchmark: PerformanceBenchmark | null = null;

/**
 * Get or create global benchmark
 */
export function getGlobalBenchmark(): PerformanceBenchmark {
  if (!globalBenchmark) {
    globalBenchmark = new PerformanceBenchmark();
  }
  return globalBenchmark;
}

/**
 * Record a performance snapshot
 */
export function recordPerformanceSnapshot(
  detectionMs: number,
  renderMs: number,
  fps: number,
  frameDropRate: number,
  simdEnabled: boolean,
  motion?: { magnitude: number; isStatic: boolean }
): void {
  const benchmark = getGlobalBenchmark();
  benchmark.record({
    detectionLatencyMs: detectionMs,
    renderLatencyMs: renderMs,
    totalLatencyMs: detectionMs + renderMs,
    fps,
    frameDropRate,
    memoryUsedMB: PerformanceBenchmark.getMemoryUsage(),
    motionMagnitude: motion?.magnitude,
    isStatic: motion?.isStatic,
    simdEnabled
  });
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): BenchmarkSummary {
  return getGlobalBenchmark().getSummary();
}

/**
 * Log performance report to console
 */
export function logPerformanceReport(): void {
  const summary = getPerformanceSummary();

  console.group('📊 Performance Benchmark Report');
  console.log(`Duration: ${summary.duration.toFixed(1)}s (${summary.totalSamples} samples)`);
  console.log('');
  console.log('🎯 Detection Performance:');
  console.log(`  Avg: ${summary.avgDetectionMs.toFixed(2)}ms`);
  console.log(`  P95: ${summary.p95DetectionMs.toFixed(2)}ms`);
  console.log(`  P99: ${summary.p99DetectionMs.toFixed(2)}ms`);
  console.log('');
  console.log('🖼️  Rendering Performance:');
  console.log(`  Avg: ${summary.avgRenderMs.toFixed(2)}ms`);
  console.log('');
  console.log('⚡ Total Latency:');
  console.log(`  Avg: ${summary.avgTotalLatency.toFixed(2)}ms`);
  console.log('');
  console.log('📈 FPS:');
  console.log(`  Avg: ${summary.avgFPS.toFixed(1)} fps`);
  console.log(`  Min: ${summary.minFPS.toFixed(1)} fps`);
  console.log(`  Max: ${summary.maxFPS.toFixed(1)} fps`);
  console.log('');
  console.log('⏭️  Frame Drop Rate:');
  console.log(`  Avg: ${summary.avgFrameDropRate.toFixed(1)}%`);
  console.log('');
  console.log('💾 Memory Usage:');
  console.log(`  Avg: ${summary.avgMemoryMB.toFixed(1)} MB`);
  console.groupEnd();
}

/**
 * Reset global benchmark
 */
export function resetPerformanceBenchmark(): void {
  if (globalBenchmark) {
    globalBenchmark.clear();
  }
}
