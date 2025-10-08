/**
 * Session Summary Component
 * 
 * Displays comprehensive session analysis including quality metrics,
 * error analysis, and improvement recommendations
 */

import React from 'react';
import type { SessionSummary as SessionSummaryType } from '@/lib/validators/sessionAnalysis';

interface SessionSummaryProps {
  sessionSummary: SessionSummaryType;
  className?: string;
}

export default function SessionSummary({ sessionSummary, className = '' }: SessionSummaryProps) {
  
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressionColor = (progression: string) => {
    switch (progression) {
      case 'improving': return 'text-green-600 bg-green-50';
      case 'stable': return 'text-blue-600 bg-blue-50';
      case 'declining': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTempo = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getMostCommonError = () => {
    const errorTypes = sessionSummary.errorTypes;
    const mostCommon = Object.entries(errorTypes).reduce((max, [type, count]) => 
      count > max.count ? { type, count } : max, 
      { type: '', count: 0 }
    );
    return mostCommon.count > 0 ? mostCommon : null;
  };

  const renderQualityDistribution = () => {
    const { excellent, good, fair, poor } = sessionSummary.qualityDistribution;
    const total = excellent + good + fair + poor;
    
    if (total === 0) return null;

    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">Quality Distribution</div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-green-600 text-sm">Excellent</span>
            <span className="text-sm">{excellent} ({((excellent / total) * 100).toFixed(0)}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-600 text-sm">Good</span>
            <span className="text-sm">{good} ({((good / total) * 100).toFixed(0)}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-yellow-600 text-sm">Fair</span>
            <span className="text-sm">{fair} ({((fair / total) * 100).toFixed(0)}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-red-600 text-sm">Poor</span>
            <span className="text-sm">{poor} ({((poor / total) * 100).toFixed(0)}%)</span>
          </div>
        </div>
      </div>
    );
  };

  const renderErrorAnalysis = () => {
    if (sessionSummary.totalErrors === 0) {
      return (
        <div className="text-center py-4">
          <div className="text-green-600 text-lg font-medium">🎉 Perfect Form!</div>
          <div className="text-sm text-gray-600">No errors detected</div>
        </div>
      );
    }

    const mostCommon = getMostCommonError();

    return (
      <div className="space-y-3">
        <div className="text-sm font-medium">Error Analysis</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Total Errors</div>
            <div className="font-medium">{sessionSummary.totalErrors}</div>
          </div>
          <div>
            <div className="text-gray-500">Error Rate</div>
            <div className="font-medium">{sessionSummary.errorRate.toFixed(1)} per rep</div>
          </div>
        </div>
        
        {mostCommon && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <div className="text-sm font-medium text-yellow-800">Most Common Error</div>
            <div className="text-yellow-700">
              {mostCommon.type.replace('_', ' ')} ({mostCommon.count} times)
            </div>
          </div>
        )}
        
        {/* Top Error Chips */}
        {Object.keys(sessionSummary.errorTypes).length > 0 && (
          <div>
            <div className="text-sm text-gray-500 mb-2">Top Errors</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sessionSummary.errorTypes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 2)
                .map(([errorType, count]) => (
                  <span 
                    key={errorType}
                    className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200"
                  >
                    {errorType.replace('_', ' ')} ({count})
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="text-sm">
          <div className="text-gray-500 mb-1">Error Severity</div>
          <div className="flex gap-2">
            <span className="text-red-600">High: {sessionSummary.errorSeverity.high}</span>
            <span className="text-yellow-600">Medium: {sessionSummary.errorSeverity.medium}</span>
            <span className="text-blue-600">Low: {sessionSummary.errorSeverity.low}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderExerciseMetrics = () => {
    const { exerciseMetrics } = sessionSummary;
    
    if (exerciseMetrics.squat) {
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium">Squat Metrics</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-gray-500">Avg Depth</div>
              <div className="font-medium">{exerciseMetrics.squat.averageDepth.toFixed(1)}°</div>
            </div>
            <div>
              <div className="text-gray-500">Torso Angle</div>
              <div className="font-medium">{exerciseMetrics.squat.averageTorsoAngle.toFixed(1)}°</div>
            </div>
            <div>
              <div className="text-gray-500">Knee Valgus</div>
              <div className="font-medium">{exerciseMetrics.squat.averageKneeValgus.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-gray-500">Consistency</div>
              <div className="font-medium">{exerciseMetrics.squat.depthConsistency.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      );
    }
    
    if (exerciseMetrics.pushup) {
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium">Push-up Metrics</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-gray-500">Elbow Angle</div>
              <div className="font-medium">{exerciseMetrics.pushup.averageElbowAngle.toFixed(1)}°</div>
            </div>
            <div>
              <div className="text-gray-500">Body Line</div>
              <div className="font-medium">{exerciseMetrics.pushup.averageBodyLine.toFixed(1)}°</div>
            </div>
            <div>
              <div className="text-gray-500">Alignment</div>
              <div className="font-medium">{exerciseMetrics.pushup.averageBodyLinePercentage.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-gray-500">Consistency</div>
              <div className="font-medium">{exerciseMetrics.pushup.bodyLineConsistency.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      );
    }
    
    if (exerciseMetrics.plank) {
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium">Plank Metrics</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-gray-500">Body Line</div>
              <div className="font-medium">{exerciseMetrics.plank.averageBodyLine.toFixed(1)}°</div>
            </div>
            <div>
              <div className="text-gray-500">Alignment</div>
              <div className="font-medium">{exerciseMetrics.plank.averageBodyLinePercentage.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-gray-500">Hip Sag</div>
              <div className="font-medium">{exerciseMetrics.plank.totalHipSagDuration}ms</div>
            </div>
            <div>
              <div className="text-gray-500">Sag Rate</div>
              <div className="font-medium">{exerciseMetrics.plank.hipSagRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Session Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{sessionSummary.totalReps}</div>
            <div className="text-sm text-gray-500">Reps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatDuration(sessionSummary.totalDuration)}</div>
            <div className="text-sm text-gray-500">Duration</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getQualityColor(sessionSummary.averageQuality)}`}>
              {sessionSummary.averageQuality.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">Avg Quality</div>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Quality Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          {renderQualityDistribution()}
        </div>

        {/* Error Analysis */}
        <div className="bg-gray-50 rounded-lg p-4">
          {renderErrorAnalysis()}
        </div>
      </div>

      {/* Exercise-specific Metrics */}
      {renderExerciseMetrics() && (
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            {renderExerciseMetrics()}
          </div>
        </div>
      )}

      {/* Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-lg font-semibold">{formatTempo(sessionSummary.averageTempo)}</div>
          <div className="text-sm text-gray-500">Avg Tempo</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">{sessionSummary.consistencyScore.toFixed(0)}%</div>
          <div className="text-sm text-gray-500">Consistency</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">{(sessionSummary.correctRate * 100).toFixed(0)}%</div>
          <div className="text-sm text-gray-500">Correct Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">{(sessionSummary.averageConfidence * 100).toFixed(0)}%</div>
          <div className="text-sm text-gray-500">Avg Confidence</div>
        </div>
        <div className="text-center">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getProgressionColor(sessionSummary.formProgression)}`}>
            {sessionSummary.formProgression}
          </div>
          <div className="text-sm text-gray-500 mt-1">Progression</div>
        </div>
      </div>

      {/* Improvement Trend */}
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-1">Improvement Trend</div>
        <div className="flex items-center justify-center gap-2">
          <div className={`text-lg ${sessionSummary.improvementTrend > 0 ? 'text-green-600' : sessionSummary.improvementTrend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {sessionSummary.improvementTrend > 0 ? '📈' : sessionSummary.improvementTrend < 0 ? '📉' : '➡️'}
          </div>
          <span className="text-sm">
            {sessionSummary.improvementTrend > 0.1 ? 'Improving' : 
             sessionSummary.improvementTrend < -0.1 ? 'Declining' : 'Stable'}
          </span>
        </div>
      </div>
    </div>
  );
}