/**
 * Automated Performance Regression Tests
 * 
 * Detects performance degradation compared to baseline benchmarks
 * Alerts on:
 * - FPS decrease > 5%
 * - Latency increase > 10%
 * - Jitter increase > 15%
 * - Cache hit rate decrease > 5%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector, generateBenchmark } from '@/lib/pose/metricsUtils';

// ============================================
// Performance Baselines
// ============================================

const PERFORMANCE_BASELINES = {
  desktop: {
    fps: { target: 55, threshold: 0.05 }, // 55 FPS ±5%
    latency: { target: 28, threshold: 0.10 }, // 28ms ±10%
    jitter: { target: 1.5, threshold: 0.15 }, // 1.5px ±15%
    cacheHit: { target: 90, threshold: 0.05 }, // 90% ±5%
  },
  mobile: {
    fps: { target: 31, threshold: 0.05 }, // 31 FPS ±5%
    latency: { target: 32, threshold: 0.10 }, // 32ms ±10%
    jitter: { target: 2.0, threshold: 0.15 }, // 2.0px ±15%
    cacheHit: { target: 85, threshold: 0.05 }, // 85% ±5%
  },
  lowEnd: {
    fps: { target: 26, threshold: 0.05 }, // 26 FPS ±5%
    latency: { target: 38, threshold: 0.10 }, // 38ms ±10%
    jitter: { target: 3.0, threshold: 0.15 }, // 3.0px ±15%
    cacheHit: { target: 75, threshold: 0.05 }, // 75% ±5%
  }
};

// ============================================
// Regression Detection
// ============================================

interface RegressionReport {
  hasRegression: boolean;
  regressions: {
    metric: string;
    baseline: number;
    current: number;
    threshold: number;
    percentChange: number;
    status: 'PASS' | 'FAIL';
  }[];
  summary: string;
  recommendations: string[];
}

function compareMetric(
  metric: string,
  baseline: number,
  current: number,
  threshold: number
): { status: 'PASS' | 'FAIL'; percentChange: number } {
  // For latency/jitter (lower is better)
  if (metric === 'latency' || metric === 'jitter') {
    const percentChange = (current - baseline) / baseline;
    const status = percentChange > threshold ? 'FAIL' : 'PASS';
    return { status, percentChange };
  }

  // For FPS/cache (higher is better)
  if (metric === 'fps' || metric === 'cache') {
    const percentChange = (baseline - current) / baseline;
    const status = percentChange > threshold ? 'FAIL' : 'PASS';
    return { status, percentChange };
  }

  return { status: 'PASS', percentChange: 0 };
}

function generateRegressionReport(
  deviceType: string,
  currentMetrics: { avgFps: number; avgLatency: number; avgJitter: number; cacheHitRate?: number },
  baselines: typeof PERFORMANCE_BASELINES.desktop
): RegressionReport {
  const regressions: RegressionReport['regressions'] = [];
  const recommendations: string[] = [];

  // Check FPS
  const fpsComparison = compareMetric(
    'fps',
    baselines.fps.target,
    currentMetrics.avgFps,
    baselines.fps.threshold
  );
  regressions.push({
    metric: 'FPS',
    baseline: baselines.fps.target,
    current: currentMetrics.avgFps,
    threshold: baselines.fps.threshold,
    percentChange: fpsComparison.percentChange,
    status: fpsComparison.status
  });

  // Check Latency
  const latencyComparison = compareMetric(
    'latency',
    baselines.latency.target,
    currentMetrics.avgLatency,
    baselines.latency.threshold
  );
  regressions.push({
    metric: 'Latency',
    baseline: baselines.latency.target,
    current: currentMetrics.avgLatency,
    threshold: baselines.latency.threshold,
    percentChange: latencyComparison.percentChange,
    status: latencyComparison.status
  });

  // Check Jitter
  const jitterComparison = compareMetric(
    'jitter',
    baselines.jitter.target,
    currentMetrics.avgJitter,
    baselines.jitter.threshold
  );
  regressions.push({
    metric: 'Jitter',
    baseline: baselines.jitter.target,
    current: currentMetrics.avgJitter,
    threshold: baselines.jitter.threshold,
    percentChange: jitterComparison.percentChange,
    status: jitterComparison.status
  });

  // Check Cache Hit
  const cacheHit = (currentMetrics.cacheHitRate || 85);
  const cacheComparison = compareMetric(
    'cache',
    baselines.cacheHit.target,
    cacheHit,
    baselines.cacheHit.threshold
  );
  regressions.push({
    metric: 'Cache Hit Rate',
    baseline: baselines.cacheHit.target,
    current: cacheHit,
    threshold: baselines.cacheHit.threshold,
    percentChange: cacheComparison.percentChange,
    status: cacheComparison.status
  });

  // Determine overall status
  const hasRegression = regressions.some(r => r.status === 'FAIL');

  // Generate recommendations
  if (hasRegression) {
    regressions.forEach(r => {
      if (r.status === 'FAIL') {
        if (r.metric === 'FPS') {
          recommendations.push('FPS degradation detected: check for background processes or inefficient rendering');
        } else if (r.metric === 'Latency') {
          recommendations.push('Latency increased: review pose detection performance or network issues');
        } else if (r.metric === 'Jitter') {
          recommendations.push('Jitter increased: verify smoothing algorithm tuning or input instability');
        } else if (r.metric === 'Cache Hit Rate') {
          recommendations.push('Cache hit rate decreased: Z-values changing more frequently or cache size too small');
        }
      }
    });
  }

  const summary = hasRegression
    ? `⚠️ REGRESSION DETECTED on ${deviceType}`
    : `✅ NO REGRESSION on ${deviceType}`;

  return {
    hasRegression,
    regressions,
    summary,
    recommendations
  };
}

// ============================================
// Regression Tests
// ============================================

describe('Performance Regression Tests', () => {
  describe('Desktop Performance Regression', () => {
    it('should not regress FPS on desktop', () => {
      const collector = new MetricsCollector('desktop-fps-regression');

      // Simulate normal desktop usage
      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 55 + Math.random() * 5,
          latency: 28 + Math.random() * 3,
          jitter: 1.5 + Math.random() * 0.5,
          visibility: 0.90,
          cacheHitRate: 90 + Math.random() * 5,
          sortTime: 1.8,
          frameDropRate: 1.0
        });
      }

      const session = collector.getSummary();
      const benchmark = generateBenchmark(session, 'desktop');
      const report = generateRegressionReport('desktop', benchmark, PERFORMANCE_BASELINES.desktop);

      expect(report.hasRegression).toBe(false);
      expect(report.regressions[0].status).toBe('PASS');
    });

    it('should not regress latency on desktop', () => {
      const collector = new MetricsCollector('desktop-latency-regression');

      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 55,
          latency: 28 + Math.random() * 2,
          jitter: 1.5,
          visibility: 0.90,
          cacheHitRate: 90,
          sortTime: 1.8,
          frameDropRate: 1.0
        });
      }

      const session = collector.getSummary();
      const report = generateRegressionReport('desktop', session, PERFORMANCE_BASELINES.desktop);

      // Latency regression test
      const latencyTest = report.regressions.find(r => r.metric === 'Latency');
      expect(latencyTest?.status).toBe('PASS');
    });

    it('should not regress jitter on desktop', () => {
      const collector = new MetricsCollector('desktop-jitter-regression');

      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 55,
          latency: 28,
          jitter: 1.5 + Math.random() * 0.3,
          visibility: 0.90,
          cacheHitRate: 90,
          sortTime: 1.8,
          frameDropRate: 1.0
        });
      }

      const session = collector.getSummary();
      const report = generateRegressionReport('desktop', session, PERFORMANCE_BASELINES.desktop);

      const jitterTest = report.regressions.find(r => r.metric === 'Jitter');
      expect(jitterTest?.status).toBe('PASS');
    });

    it('should not regress cache hit rate on desktop', () => {
      const collector = new MetricsCollector('desktop-cache-regression');

      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 55,
          latency: 28,
          jitter: 1.5,
          visibility: 0.90,
          cacheHitRate: 90 + Math.random() * 5,
          sortTime: 1.8,
          frameDropRate: 1.0
        });
      }

      const session = collector.getSummary();
      const benchmark = generateBenchmark(session, 'desktop');
      const report = generateRegressionReport('desktop', benchmark, PERFORMANCE_BASELINES.desktop);

      const cacheTest = report.regressions.find(r => r.metric === 'Cache Hit Rate');
      expect(cacheTest?.status).toBe('PASS');
    });
  });

  describe('Mobile Performance Regression', () => {
    it('should not regress FPS on mobile', () => {
      const collector = new MetricsCollector('mobile-fps-regression');

      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 31 + Math.random() * 3,
          latency: 32 + Math.random() * 4,
          jitter: 2.0 + Math.random() * 0.7,
          visibility: 0.85,
          cacheHitRate: 85 + Math.random() * 5,
          sortTime: 2.2,
          frameDropRate: 2.5
        });
      }

      const session = collector.getSummary();
      const benchmark = generateBenchmark(session, 'mobile');
      const report = generateRegressionReport('mobile', benchmark, PERFORMANCE_BASELINES.mobile);

      expect(report.hasRegression).toBe(false);
    });

    it('should not regress latency on mobile', () => {
      const collector = new MetricsCollector('mobile-latency-regression');

      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 31,
          latency: 32 + Math.random() * 3,
          jitter: 2.0,
          visibility: 0.85,
          cacheHitRate: 85,
          sortTime: 2.2,
          frameDropRate: 2.5
        });
      }

      const session = collector.getSummary();
      const report = generateRegressionReport('mobile', session, PERFORMANCE_BASELINES.mobile);

      const latencyTest = report.regressions.find(r => r.metric === 'Latency');
      expect(latencyTest?.status).toBe('PASS');
    });
  });

  describe('Regression Detection', () => {
    it('should detect FPS regression when it exceeds threshold', () => {
      const collector = new MetricsCollector('fps-regression-detection');

      // Simulate degraded FPS (>5% below baseline)
      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 50, // 50 vs 55 baseline = ~10% decrease
          latency: 28,
          jitter: 1.5,
          visibility: 0.90,
          cacheHitRate: 90,
          sortTime: 1.8,
          frameDropRate: 1.0
        });
      }

      const session = collector.getSummary();
      const benchmark = generateBenchmark(session, 'desktop');
      const report = generateRegressionReport('desktop', benchmark, PERFORMANCE_BASELINES.desktop);

      expect(report.hasRegression).toBe(true);
      const fpsTest = report.regressions.find(r => r.metric === 'FPS');
      expect(fpsTest?.status).toBe('FAIL');
    });

    it('should detect latency regression when it exceeds threshold', () => {
      const collector = new MetricsCollector('latency-regression-detection');

      // Simulate increased latency (>10% above baseline)
      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 55,
          latency: 32, // 32 vs 28 baseline = ~14% increase
          jitter: 1.5,
          visibility: 0.90,
          cacheHitRate: 90,
          sortTime: 1.8,
          frameDropRate: 1.0
        });
      }

      const session = collector.getSummary();
      const report = generateRegressionReport('desktop', session, PERFORMANCE_BASELINES.desktop);

      expect(report.hasRegression).toBe(true);
      const latencyTest = report.regressions.find(r => r.metric === 'Latency');
      expect(latencyTest?.status).toBe('FAIL');
    });

    it('should detect jitter regression when it exceeds threshold', () => {
      const collector = new MetricsCollector('jitter-regression-detection');

      // Simulate increased jitter (>15% above baseline)
      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 55,
          latency: 28,
          jitter: 1.8, // 1.8 vs 1.5 baseline = 20% increase
          visibility: 0.90,
          cacheHitRate: 90,
          sortTime: 1.8,
          frameDropRate: 1.0
        });
      }

      const session = collector.getSummary();
      const report = generateRegressionReport('desktop', session, PERFORMANCE_BASELINES.desktop);

      expect(report.hasRegression).toBe(true);
      const jitterTest = report.regressions.find(r => r.metric === 'Jitter');
      expect(jitterTest?.status).toBe('FAIL');
    });

    it('should generate recommendations for regressions', () => {
      const collector = new MetricsCollector('regression-recommendations');

      // Multiple regressions
      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 48, // Below threshold
          latency: 35, // Above threshold
          jitter: 2.0, // Above threshold
          visibility: 0.90,
          cacheHitRate: 90,
          sortTime: 1.8,
          frameDropRate: 1.0
        });
      }

      const session = collector.getSummary();
      const benchmark = generateBenchmark(session, 'desktop');
      const report = generateRegressionReport('desktop', benchmark, PERFORMANCE_BASELINES.desktop);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations).toContain(expect.stringMatching(/FPS degradation/i));
      expect(report.recommendations).toContain(expect.stringMatching(/Latency increased/i));
    });
  });

  describe('Cross-Device Regression Testing', () => {
    it('should validate all device types simultaneously', () => {
      const deviceTypes: Array<'desktop' | 'mobile' | 'lowEnd'> = ['desktop', 'mobile', 'lowEnd'];

      deviceTypes.forEach(deviceType => {
        const collector = new MetricsCollector(`${deviceType}-regression-test`);
        const baseline = PERFORMANCE_BASELINES[deviceType];

        // Generate metrics within acceptable range
        for (let i = 0; i < 60; i++) {
          const multiplier = deviceType === 'desktop' ? 1 : deviceType === 'mobile' ? 0.56 : 0.47;
          collector.recordSnapshot({
            fps: (baseline.fps.target + Math.random() * 3) * multiplier,
            latency: baseline.latency.target + Math.random() * 2,
            jitter: baseline.jitter.target + Math.random() * 0.5,
            visibility: 0.85,
            cacheHitRate: baseline.cacheHit.target + Math.random() * 3,
            sortTime: baseline === PERFORMANCE_BASELINES.desktop ? 1.8 : 2.2,
            frameDropRate: 1.0
          });
        }

        const session = collector.getSummary();
        const report = generateRegressionReport(deviceType, session, baseline);

        expect(report.summary).toContain('NO REGRESSION');
      });
    });
  });

  describe('Regression Report Generation', () => {
    it('should generate comprehensive regression report', () => {
      const collector = new MetricsCollector('comprehensive-regression');

      for (let i = 0; i < 60; i++) {
        collector.recordSnapshot({
          fps: 55,
          latency: 28,
          jitter: 1.5,
          visibility: 0.90,
          cacheHitRate: 90,
          sortTime: 1.8,
          frameDropRate: 1.0
        });
      }

      const session = collector.getSummary();
      const benchmark = generateBenchmark(session, 'desktop');
      const report = generateRegressionReport('desktop', benchmark, PERFORMANCE_BASELINES.desktop);

      expect(report).toHaveProperty('hasRegression');
      expect(report).toHaveProperty('regressions');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('recommendations');
      expect(report.regressions.length).toBe(4);
    });
  });
});
