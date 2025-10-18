"use client";

import { useMemo } from 'react';
import type { DepthSparklinePoint } from '@/lib/leaderboards/query';

interface DepthSparklineProps {
  data: DepthSparklinePoint[];
  width?: number;
  height?: number;
  className?: string;
}

export default function DepthSparkline({ 
  data, 
  width = 120, 
  height = 30, 
  className = '' 
}: DepthSparklineProps) {
  const pathData = useMemo(() => {
    if (!data || data.length === 0) return '';

    const sortedData = [...data].sort((a, b) => 
      new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );

    const minDepth = Math.min(...sortedData.map(d => d.avg_depth));
    const maxDepth = Math.max(...sortedData.map(d => d.avg_depth));
    const depthRange = maxDepth - minDepth || 1;

    const points = sortedData.map((point, index) => {
      const x = (index / (sortedData.length - 1)) * width;
      const y = height - ((point.avg_depth - minDepth) / depthRange) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center text-gray-400 text-xs ${className}`}>
        No data
      </div>
    );
  }

  const avgDepth = data.reduce((sum, point) => sum + point.avg_depth, 0) / data.length;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={width} height={height} className="border border-gray-200 rounded">
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`${pathData} L ${width},${height} L 0,${height} Z`}
          fill="url(#sparklineGradient)"
        />
      </svg>
      <div className="text-xs text-gray-600">
        Avg: {avgDepth.toFixed(1)}
      </div>
    </div>
  );
}
