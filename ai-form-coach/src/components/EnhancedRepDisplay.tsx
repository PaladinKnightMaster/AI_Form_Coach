/**
 * Enhanced Rep Display Component
 * 
 * Displays enhanced rep metrics including quality, errors, and exercise-specific data
 */

import React from 'react';
import type { RepMetric, FormError } from '@/lib/validators/types';

interface EnhancedRepDisplayProps {
  repMetric: RepMetric;
  index: number;
  showDetails?: boolean;
  className?: string;
}

export default function EnhancedRepDisplay({ 
  repMetric, 
  index, 
  showDetails = false,
  className = '' 
}: EnhancedRepDisplayProps) {
  
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTempoColor = (tempo: string) => {
    switch (tempo) {
      case 'fast': return 'text-orange-600';
      case 'slow': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getErrorSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const renderError = (error: FormError, errorIndex: number) => (
    <div key={errorIndex} className={`px-2 py-1 rounded text-xs ${getErrorSeverityColor(error.severity)}`}>
      <span className="font-medium">{error.type.replace('_', ' ')}</span>
      <span className="ml-1">({error.duration}ms)</span>
    </div>
  );

  const renderExerciseMetrics = () => {
    if (repMetric.squat) {
      return (
        <div className="text-xs text-gray-600">
          <div>Depth: {repMetric.squat.depth.toFixed(1)}°</div>
          <div>Torso: {repMetric.squat.torsoAngle.toFixed(1)}°</div>
          <div>Valgus: {repMetric.squat.kneeValgus.toFixed(1)}%</div>
        </div>
      );
    }
    
    if (repMetric.pushup) {
      return (
        <div className="text-xs text-gray-600">
          <div>Elbow: {repMetric.pushup.elbowAngle.toFixed(1)}°</div>
          <div>Body Line: {repMetric.pushup.bodyLine.toFixed(1)}°</div>
          <div>Alignment: {repMetric.pushup.bodyLinePercentage.toFixed(0)}%</div>
        </div>
      );
    }
    
    if (repMetric.plank) {
      return (
        <div className="text-xs text-gray-600">
          <div>Body Line: {repMetric.plank.bodyLine.toFixed(1)}°</div>
          <div>Alignment: {repMetric.plank.bodyLinePercentage.toFixed(0)}%</div>
          <div>Hip Sag: {repMetric.plank.hipSagDuration}ms</div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`border rounded-lg p-3 ${getQualityColor(repMetric.quality)} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Rep #{index + 1}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityColor(repMetric.quality)}`}>
            {repMetric.quality}
          </span>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">{repMetric.score.toFixed(0)}</div>
          <div className="text-xs text-gray-500">/100</div>
        </div>
      </div>

      {/* Basic Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-2 text-sm">
        <div>
          <div className="text-gray-500 text-xs">Duration</div>
          <div className="font-medium">{formatDuration(repMetric.duration)}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Tempo</div>
          <div className={`font-medium ${getTempoColor(repMetric.tempo)}`}>
            {repMetric.tempo}
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Errors</div>
          <div className="font-medium">{repMetric.errors.length}</div>
        </div>
      </div>

      {/* Exercise-specific Metrics */}
      {renderExerciseMetrics() && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          {renderExerciseMetrics()}
        </div>
      )}

      {/* Errors */}
      {repMetric.errors.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Errors:</div>
          <div className="flex flex-wrap gap-1">
            {repMetric.errors.map(renderError)}
          </div>
        </div>
      )}

      {/* Detailed View */}
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
          <div>Start: {new Date(repMetric.startTs).toLocaleTimeString()}</div>
          <div>End: {new Date(repMetric.endTs).toLocaleTimeString()}</div>
          {repMetric.formIQ && <div>Form IQ: {repMetric.formIQ.toFixed(1)}</div>}
          {repMetric.sideBalance && <div>Side Balance: {repMetric.sideBalance.toFixed(1)}</div>}
        </div>
      )}
    </div>
  );
}

// Compact version for lists
export function CompactRepDisplay({ repMetric, index }: { repMetric: RepMetric; index: number }) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between p-2 border rounded">
      <div className="flex items-center gap-2">
        <span className="font-medium">#{index + 1}</span>
        <span className={`px-2 py-1 rounded text-xs ${getQualityColor(repMetric.quality)}`}>
          {repMetric.quality}
        </span>
        <span className="text-sm text-gray-600">
          {(repMetric.duration / 1000).toFixed(1)}s
        </span>
        {repMetric.errors.length > 0 && (
          <span className="text-xs text-red-600">
            {repMetric.errors.length} error{repMetric.errors.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="font-bold">{repMetric.score.toFixed(0)}</div>
    </div>
  );
}
