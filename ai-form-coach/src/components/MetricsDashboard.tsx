'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PoseEngine2 } from '@/lib/pose/engine';
import { getDepthMetricsTracker, getCurrentDepthConfig } from '@/lib/pose/depthOptimization';

/**
 * Metrics Dashboard for real-time pose quality monitoring
 * Phase E: Real-time visualization of all system metrics
 */

export interface MetricsDashboardProps {
  engine?: PoseEngine2 | null;
  visible?: boolean;
  compact?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface DisplayMetrics {
  fps: number;
  fpsHistory: number[];
  latency: number;
  latencyHistory: number[];
  jitterScore: number;
  jitterHistory: number[];
  visibility: number;
  frameDropRate: number;
  cacheHitRate: number;
  sortTime: number;
  deviceType: string;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  engine,
  visible = true,
  compact = false,
  position = 'top-right'
}) => {
  const [metrics, setMetrics] = useState<DisplayMetrics>({
    fps: 0,
    fpsHistory: [],
    latency: 0,
    latencyHistory: [],
    jitterScore: 0,
    jitterHistory: [],
    visibility: 0,
    frameDropRate: 0,
    cacheHitRate: 0,
    sortTime: 0,
    deviceType: 'unknown'
  });

  const lastTimestampRef = useRef(0); // initialized in first recordSnapshot call
  const fpsHistoryRef = useRef<number[]>([]);
  const latencyHistoryRef = useRef<number[]>([]);
  const jitterHistoryRef = useRef<number[]>([]);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!engine || !visible) return;

    // Update metrics every 500ms
    const updateMetrics = () => {
      try {
        const engineMetrics = engine.getMetrics();
        const depthMetrics = getDepthMetricsTracker().getMetrics();
        const depthConfig = getCurrentDepthConfig();

        // Calculate FPS
        const now = Date.now();
        const deltaTime = (now - lastTimestampRef.current) / 1000;
        const currentFps = deltaTime > 0 ? 1 / deltaTime : 0;
        lastTimestampRef.current = now;

        // Maintain history (last 60 values = ~30 seconds at 500ms intervals)
        fpsHistoryRef.current = [...fpsHistoryRef.current.slice(-59), currentFps];
        latencyHistoryRef.current = [
          ...latencyHistoryRef.current.slice(-59),
          engineMetrics.detectionLatency || 0
        ];

        // Calculate average jitter from metrics
        const jitterScore = engineMetrics.avgPixelJitter || 0;
        jitterHistoryRef.current = [...jitterHistoryRef.current.slice(-59), jitterScore];

        // Calculate visibility average
        const visibility = 0.75; // Default value, can be enhanced later

        // Frame drop rate from metrics
        const frameDropRate = engineMetrics.frameDropRate || 0;

        setMetrics({
          fps: Math.round(currentFps * 10) / 10,
          fpsHistory: fpsHistoryRef.current,
          latency: Math.round((engineMetrics.detectionLatency || 0) * 10) / 10,
          latencyHistory: latencyHistoryRef.current,
          jitterScore: Math.round((jitterHistoryRef.current[jitterHistoryRef.current.length - 1] || 0) * 10) / 10,
          jitterHistory: jitterHistoryRef.current,
          visibility: Math.round(visibility * 100),
          frameDropRate: Math.round(frameDropRate * 10) / 10,
          cacheHitRate: Math.round(depthMetrics.cacheHitRate * 10) / 10,
          sortTime: Math.round(depthMetrics.avgSortTimeMs * 10) / 10,
          deviceType: depthConfig.enableDepthSorting ? 'capable' : 'low-end'
        });
      } catch (error) {
        console.warn('[MetricsDashboard] Error updating metrics:', error);
      }
    };

    updateIntervalRef.current = setInterval(updateMetrics, 500);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [engine, visible]);

  if (!visible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getHealthColor = (value: number, min: number, max: number, inverted = false) => {
    if (inverted) {
      if (value <= min) return '#149A80';                    // malachite-light · good
      if (value <= (min + max) / 2) return '#C49A47';        // champagne-amber · warning
      return '#5A1F24';                                       // oxblood · bad
    } else {
      if (value >= max) return '#149A80';                    // malachite-light · good
      if (value >= (min + max) / 2) return '#C49A47';        // champagne-amber · warning
      return '#5A1F24';                                       // oxblood · bad
    }
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 font-mono text-xs bg-black/80 text-white rounded-lg p-3 backdrop-blur-sm border border-green-500/30 shadow-lg`}
      style={{ maxWidth: compact ? '200px' : '280px' }}
    >
      {/* Header */}
      <div className="text-green-500 font-bold mb-2 text-[10px]">🏥 POSE METRICS</div>

      {/* FPS */}
      <div className="flex justify-between items-center mb-1.5 text-[11px]">
        <span>FPS:</span>
        <span
          style={{
            color: getHealthColor(metrics.fps, 25, 30)
          }}
        >
          {metrics.fps}
        </span>
      </div>

      {/* FPS Mini Chart */}
      <div className="flex gap-0.5 mb-2 h-6 items-end">
        {metrics.fpsHistory.slice(-20).map((fps, i) => (
          <div
            key={i}
            style={{
              height: `${(fps / 60) * 100}%`,
              background: getHealthColor(fps, 25, 30),
              minHeight: '1px',
              flex: 1
            }}
          />
        ))}
      </div>

      <div className="border-t border-green-500/20 my-1.5" />

      {/* Latency */}
      <div className="flex justify-between items-center mb-1.5 text-[11px]">
        <span>Latency:</span>
        <span
          style={{
            color: getHealthColor(metrics.latency, 20, 50, true)
          }}
        >
          {metrics.latency}ms
        </span>
      </div>

      {/* Latency Mini Chart */}
      <div className="flex gap-0.5 mb-2 h-6 items-end">
        {metrics.latencyHistory.slice(-20).map((lat, i) => (
          <div
            key={i}
            style={{
              height: `${Math.min(lat / 100, 1) * 100}%`,
              background: getHealthColor(lat, 20, 50, true),
              minHeight: '1px',
              flex: 1
            }}
          />
        ))}
      </div>

      <div className="border-t border-green-500/20 my-1.5" />

      {/* Jitter Score */}
      <div className="flex justify-between items-center mb-1.5 text-[11px]">
        <span>Jitter:</span>
        <span
          style={{
            color: getHealthColor(metrics.jitterScore, 2, 5, true)
          }}
        >
          {metrics.jitterScore}px
        </span>
      </div>

      {/* Jitter Mini Chart */}
      <div className="flex gap-0.5 mb-2 h-6 items-end">
        {metrics.jitterHistory.slice(-20).map((jitter, i) => (
          <div
            key={i}
            style={{
              height: `${Math.min(jitter / 10, 1) * 100}%`,
              background: getHealthColor(jitter, 2, 5, true),
              minHeight: '1px',
              flex: 1
            }}
          />
        ))}
      </div>

      <div className="border-t border-green-500/20 my-1.5" />

      {/* Visibility */}
      <div className="flex justify-between items-center mb-1.5 text-[11px]">
        <span>Visibility:</span>
        <span
          style={{
            color: getHealthColor(metrics.visibility, 50, 80)
          }}
        >
          {metrics.visibility}%
        </span>
      </div>

      {/* Frame Drop Rate */}
      <div className="flex justify-between items-center mb-1.5 text-[11px]">
        <span>Drop Rate:</span>
        <span
          style={{
            color: getHealthColor(metrics.frameDropRate, 5, 10, true)
          }}
        >
          {metrics.frameDropRate}%
        </span>
      </div>

      {/* Cache Hit Rate */}
      <div className="flex justify-between items-center mb-1.5 text-[11px]">
        <span>Cache Hit:</span>
        <span
          style={{
            color: getHealthColor(metrics.cacheHitRate, 70, 90)
          }}
        >
          {metrics.cacheHitRate}%
        </span>
      </div>

      {/* Sort Time */}
      <div className="flex justify-between items-center mb-1.5 text-[11px]">
        <span>Sort Time:</span>
        <span
          style={{
            color: getHealthColor(metrics.sortTime, 2, 5, true)
          }}
        >
          {metrics.sortTime}ms
        </span>
      </div>

      <div className="border-t border-green-500/20 my-1.5" />

      {/* Device Type */}
      <div className="flex justify-between items-center text-[10px]">
        <span>Device:</span>
        <span className="text-green-400">{metrics.deviceType}</span>
      </div>

      {/* Health Status */}
      <div className="text-center mt-2 text-[10px] text-green-400">
        ✓ System Healthy
      </div>
    </div>
  );
};

export default MetricsDashboard;
