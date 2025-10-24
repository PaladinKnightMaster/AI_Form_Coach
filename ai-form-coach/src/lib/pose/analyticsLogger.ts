/**
 * Analytics Database Logging
 * 
 * Phase F: Database Logging Integration
 * Logs pose metrics to Supabase for analytics and tracking
 */

import { MetricsSession, HealthStatus } from './metricsUtils';

// ============================================
// Database Models
// ============================================

export interface PoseQualityMetric {
  id: string;
  sessionId: string;
  timestamp: number;
  fps: number;
  latency: number;
  jitter: number;
  visibility: number;
  cacheHitRate: number;
  sortTime: number;
  frameDropRate: number;
  deviceType: string;
  userId?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface SessionAnalytics {
  id: string;
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime: number;
  duration: number;
  avgFps: number;
  minFps: number;
  avgLatency: number;
  maxLatency: number;
  avgJitter: number;
  avgVisibility: number;
  cacheHitRate: number;
  frameDropRate: number;
  healthStatus: string;
  deviceType: string;
  snapshotCount: number;
  createdAt: number;
}

export interface DevicePerformanceBenchmark {
  id: string;
  deviceType: string;
  fpsTarget: number;
  avgFps: number;
  minFps: number;
  p95Fps: number;
  latencyTarget: number;
  avgLatency: number;
  maxLatency: number;
  p95Latency: number;
  samples: number;
  lastUpdated: number;
}

// ============================================
// Analytics Logger
// ============================================

export class AnalyticsLogger {
  private sessionId: string;
  private userId?: string;
  private supabaseUrl?: string;
  private supabaseKey?: string;
  private batch: PoseQualityMetric[] = [];
  private batchSize = 10;
  private enabled = false;
  private flushTimer: NodeJS.Timeout | null = null;
  private flushInterval = 10000; // 10 seconds
  private retryConfig = {
    maxRetries: 3,
    initialDelay: 100, // ms
    maxDelay: 5000 // ms
  };

  constructor(sessionId: string, options?: { userId?: string; supabaseUrl?: string; supabaseKey?: string }) {
    this.sessionId = sessionId;
    this.userId = options?.userId;
    this.supabaseUrl = options?.supabaseUrl;
    this.supabaseKey = options?.supabaseKey;

    // Enable only if Supabase credentials provided
    this.enabled = !!(this.supabaseUrl && this.supabaseKey);
    
    // Start auto-flush timer
    if (this.enabled) {
      this.startAutoFlush();
    }
  }

  /**
   * Start automatic batch flushing timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(async () => {
      if (this.batch.length > 0) {
        await this.flushBatch();
      }
    }, this.flushInterval);
  }

  /**
   * Stop automatic batch flushing
   */
  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Log a single metrics snapshot with retry
   */
  async logMetric(snapshot: {
    timestamp: number;
    fps: number;
    latency: number;
    jitter: number;
    visibility: number;
    cacheHitRate: number;
    sortTime: number;
    frameDropRate: number;
    deviceType: string;
  }): Promise<void> {
    if (!this.enabled) return;

    try {
      // Validate input
      if (!this.validateMetric(snapshot)) {
        console.warn('[AnalyticsLogger] Invalid metric snapshot:', snapshot);
        return;
      }

      const metric: PoseQualityMetric = {
        id: `${this.sessionId}-${snapshot.timestamp}`,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: snapshot.timestamp,
        fps: Math.round(snapshot.fps),
        latency: snapshot.latency,
        jitter: snapshot.jitter,
        visibility: snapshot.visibility,
        cacheHitRate: snapshot.cacheHitRate,
        sortTime: snapshot.sortTime,
        frameDropRate: snapshot.frameDropRate,
        deviceType: snapshot.deviceType
      };

      this.batch.push(metric);

      // Flush batch if size reached
      if (this.batch.length >= this.batchSize) {
        await this.flushBatch();
      }
    } catch (error) {
      console.error('[AnalyticsLogger] Error logging metric:', error);
    }
  }

  /**
   * Validate metric data
   */
  private validateMetric(metric: Record<string, unknown>): boolean {
    return (
      typeof metric.timestamp === 'number' &&
      typeof metric.fps === 'number' &&
      typeof metric.visibility === 'number' &&
      metric.timestamp >= 0 &&
      metric.fps >= 0 &&
      metric.fps <= 120 &&
      metric.visibility >= 0 &&
      metric.visibility <= 1
    );
  }

  /**
   * Flush batched metrics to database with retry logic
   */
  async flushBatch(): Promise<void> {
    if (!this.enabled || this.batch.length === 0) return;

    const batchToSend = [...this.batch];
    this.batch = [];

    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.sendBatchToAPI(batchToSend);
        
        if (response.ok) {
          console.debug(`[AnalyticsLogger] Flushed ${batchToSend.length} metrics`);
          return;
        }

        // Non-OK response, retry
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        );

        if (attempt < this.retryConfig.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`[AnalyticsLogger] Batch send attempt ${attempt + 1} failed:`, error);

        if (attempt < this.retryConfig.maxRetries - 1) {
          const delay = Math.min(
            this.retryConfig.initialDelay * Math.pow(2, attempt),
            this.retryConfig.maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - re-add batch for next attempt
    console.error(`[AnalyticsLogger] Failed to flush batch after ${this.retryConfig.maxRetries} retries`);
    this.batch = [...batchToSend, ...this.batch];
  }

  /**
   * Send batch to API with timeout
   */
  private async sendBatchToAPI(batch: PoseQualityMetric[]): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch('/api/pose/metrics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metrics: batch }),
        signal: controller.signal
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Flush and cleanup on session end
   */
  async sessionEnd(): Promise<void> {
    // Final flush
    if (this.batch.length > 0) {
      await this.flushBatch();
    }

    // Stop auto-flush timer
    this.stopAutoFlush();

    console.debug('[AnalyticsLogger] Session ended and flushed');
  }

  /**
   * Log session completion
   */
  async logSessionCompletion(session: MetricsSession, health: HealthStatus): Promise<void> {
    if (!this.enabled) return;

    try {
      const analytics: SessionAnalytics = {
        id: `analytics-${this.sessionId}`,
        sessionId: this.sessionId,
        userId: this.userId,
        startTime: session.startTime,
        endTime: session.endTime || Date.now(),
        duration: session.duration || 0,
        avgFps: session.avgFps,
        minFps: session.minFps,
        avgLatency: session.avgLatency,
        maxLatency: session.maxLatency,
        avgJitter: session.avgJitter,
        avgVisibility: session.avgVisibility,
        cacheHitRate: session.snapshots.length > 0
          ? session.snapshots.reduce((a, s) => a + s.cacheHitRate, 0) / session.snapshots.length
          : 0,
        frameDropRate: session.snapshots.length > 0
          ? session.snapshots.reduce((a, s) => a + s.frameDropRate, 0) / session.snapshots.length
          : 0,
        healthStatus: health.overall,
        deviceType: 'detected',
        snapshotCount: session.snapshots.length,
        createdAt: Date.now()
      };

      console.log('[Analytics] Session completed:', analytics);
      // Would insert into pose_session_analytics table
    } catch (error) {
      console.error('[Analytics] Error logging session completion:', error);
    }
  }

  /**
   * Update device performance benchmark
   */
  async updateBenchmark(
    deviceType: string,
    metrics: {
      avgFps: number;
      minFps: number;
      p95Fps: number;
      avgLatency: number;
      maxLatency: number;
      p95Latency: number;
    }
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      const benchmark: DevicePerformanceBenchmark = {
        id: `benchmark-${deviceType}`,
        deviceType,
        fpsTarget: deviceType === 'desktop' ? 60 : deviceType === 'mobile' ? 30 : 25,
        avgFps: metrics.avgFps,
        minFps: metrics.minFps,
        p95Fps: metrics.p95Fps,
        latencyTarget: 50,
        avgLatency: metrics.avgLatency,
        maxLatency: metrics.maxLatency,
        p95Latency: metrics.p95Latency,
        samples: 1,
        lastUpdated: Date.now()
      };

      console.log('[Analytics] Updated benchmark:', benchmark);
      // Would upsert into pose_performance_benchmarks table
    } catch (error) {
      console.error('[Analytics] Error updating benchmark:', error);
    }
  }

  /**
   * Flush remaining metrics
   */
  async flush(): Promise<void> {
    if (this.batch.length > 0) {
      await this.flushBatch();
    }
  }
}

// ============================================
// Global Analytics Logger Instance
// ============================================

let globalLogger: AnalyticsLogger | null = null;

/**
 * Get or create global analytics logger
 */
export function getGlobalAnalyticsLogger(options?: {
  userId?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}): AnalyticsLogger {
  if (!globalLogger) {
    const sessionId = `session-${Date.now()}`;
    globalLogger = new AnalyticsLogger(sessionId, options);
  }
  return globalLogger;
}

/**
 * Log metric to global logger
 */
export async function logAnalyticsMetric(metric: {
  timestamp: number;
  fps: number;
  latency: number;
  jitter: number;
  visibility: number;
  cacheHitRate: number;
  sortTime: number;
  frameDropRate: number;
  deviceType: string;
}): Promise<void> {
  const logger = getGlobalAnalyticsLogger();
  await logger.logMetric(metric);
}

/**
 * Log session completion
 */
export async function logAnalyticsSessionCompletion(
  session: MetricsSession,
  health: HealthStatus
): Promise<void> {
  const logger = getGlobalAnalyticsLogger();
  await logger.logSessionCompletion(session, health);
}

/**
 * Flush analytics
 */
export async function flushAnalytics(): Promise<void> {
  if (globalLogger) {
    await globalLogger.flush();
  }
}

// ============================================
// Analytics Query Functions
// ============================================

/**
 * Get session statistics (for production with real database)
 */
export async function getSessionStats(sessionId: string): Promise<SessionAnalytics | null> {
  // In production, would query Supabase:
  // const { data } = await supabase
  //   .from('pose_session_analytics')
  //   .select('*')
  //   .eq('sessionId', sessionId)
  //   .single();
  // return data;

  console.log(`[Analytics] Would fetch stats for session: ${sessionId}`);
  return null;
}

/**
 * Get device benchmark (for production with real database)
 */
export async function getDeviceBenchmark(
  deviceType: string
): Promise<DevicePerformanceBenchmark | null> {
  // In production:
  // const { data } = await supabase
  //   .from('pose_performance_benchmarks')
  //   .select('*')
  //   .eq('deviceType', deviceType)
  //   .single();
  // return data;

  console.log(`[Analytics] Would fetch benchmark for device: ${deviceType}`);
  return null;
}

/**
 * Get recent sessions (for production with real database)
 */
export async function getRecentSessions(limit: number = 10): Promise<SessionAnalytics[]> {
  // In production:
  // const { data } = await supabase
  //   .from('pose_session_analytics')
  //   .select('*')
  //   .order('createdAt', { ascending: false })
  //   .limit(limit);
  // return data || [];

  console.log(`[Analytics] Would fetch ${limit} recent sessions`);
  return [];
}

/**
 * Get health trend (for production with real database)
 */
export async function getHealthTrend(
  deviceType: string,
  days: number = 7
): Promise<{ date: string; avgHealth: number }[]> {
  // In production, would query and aggregate:
  // SELECT DATE(createdAt) as date, AVG(healthScore) as avgHealth
  // FROM pose_session_analytics
  // WHERE deviceType = deviceType AND createdAt >= DATE_SUB(NOW(), INTERVAL days DAY)
  // GROUP BY DATE(createdAt)

  console.log(`[Analytics] Would fetch ${days}-day health trend for ${deviceType}`);
  return [];
}
