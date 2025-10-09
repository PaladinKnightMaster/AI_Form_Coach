"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  getCurrentUserGhostSeries, 
  getLiveDelta, 
  type GhostSeries, 
  type LiveDataPoint, 
  type LiveDelta,
  type Exercise 
} from '@/lib/ghost/ghostSeries';

interface PacingBarProps {
  exercise: Exercise;
  currentReps: number;
  sessionStartTime: number;
  isRunning: boolean;
  reducedMotion?: boolean;
  className?: string;
}

export default function PacingBar({
  exercise,
  currentReps,
  sessionStartTime,
  isRunning,
  reducedMotion = false,
  className = ''
}: PacingBarProps) {
  const [ghostSeries, setGhostSeries] = useState<GhostSeries | null>(null);
  const [liveDelta, setLiveDelta] = useState<LiveDelta | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Load ghost series on mount
  useEffect(() => {
    const loadGhostSeries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const ghost = await getCurrentUserGhostSeries(exercise, 'month');
        setGhostSeries(ghost);
        
        if (!ghost) {
          setError('No previous session data available');
        }
      } catch (err) {
        console.error('Error loading ghost series:', err);
        setError('Failed to load ghost data');
      } finally {
        setLoading(false);
      }
    };

    loadGhostSeries();
  }, [exercise]);

  // Update live delta when reps change (throttled for performance)
  useEffect(() => {
    if (!ghostSeries || !isRunning || sessionStartTime === 0) {
      return;
    }

    const now = performance.now();
    const sessionTime = now - sessionStartTime;

    // Don't update if session time is negative (before session started)
    if (sessionTime < 0) {
      return;
    }

    // Throttle updates to every 500ms to prevent FPS drops
    if (now - lastUpdateRef.current < 500) {
      return;
    }
    lastUpdateRef.current = now;

    const liveDataPoint: LiveDataPoint = {
      timestamp: sessionTime,
      cumulativeCorrectReps: currentReps,
      totalReps: currentReps
    };

    const delta = getLiveDelta([liveDataPoint], ghostSeries, sessionTime);
    setLiveDelta(delta);
  }, [ghostSeries, currentReps, sessionStartTime, isRunning]);

  const formatDelta = useCallback((delta: LiveDelta) => {
    const absDelta = Math.abs(delta.delta);
    const sign = delta.isAhead ? '+' : '−';
    
    if (absDelta === 0) {
      return 'On pace';
    } else if (absDelta === 1) {
      return `${sign}1 rep ${delta.isAhead ? 'ahead' : 'behind'}`;
    } else {
      return `${sign}${absDelta} reps ${delta.isAhead ? 'ahead' : 'behind'}`;
    }
  }, []);

  const getDeltaColor = useCallback((delta: LiveDelta) => {
    if (Math.abs(delta.delta) <= 1) {
      return 'text-green-600 dark:text-green-400';
    } else if (delta.isAhead) {
      return 'text-blue-600 dark:text-blue-400';
    } else {
      return 'text-orange-600 dark:text-orange-400';
    }
  }, []);

  const getProgressPercentage = useCallback(() => {
    if (!ghostSeries) {
      return 0;
    }

    // Calculate progress based on time elapsed vs total ghost duration
    const now = performance.now();
    const sessionTime = now - sessionStartTime;
    const progress = Math.min(sessionTime / ghostSeries.totalDuration, 1);
    
    return progress * 100;
  }, [ghostSeries, sessionStartTime]);

  if (loading) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-3 ${className}`}>
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading ghost data...</span>
        </div>
      </div>
    );
  }

  if (error || !ghostSeries) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-3 ${className}`}>
        <div className="flex items-center justify-center py-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {error || 'No ghost data available'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="text-lg">👻</div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              PR Ghost
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              vs {new Date(ghostSeries.sessionDate).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {liveDelta && (
            <div className={`text-sm font-medium ${getDeltaColor(liveDelta)}`}>
              {formatDelta(liveDelta)}
            </div>
          )}
          <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700">
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Session Progress</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  reducedMotion ? '' : 'transition-all duration-500 ease-out'
                }`}
                style={{ 
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: liveDelta?.isAhead ? '#3b82f6' : '#f59e0b'
                }}
              />
            </div>
          </div>

          {/* Comparison Stats */}
          {liveDelta && (
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400">You</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {liveDelta.you} reps
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400">Ghost</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {liveDelta.ghost} reps
                </div>
              </div>
            </div>
          )}

          {/* Ghost Session Info */}
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div>Best session: {ghostSeries.totalCorrectReps} correct reps</div>
            <div>Quality: {Math.round(ghostSeries.qualityScore)}% • Integrity: {Math.round(ghostSeries.integrityScore * 100)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
