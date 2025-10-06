"use client";

import { useState, useEffect } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import type { SessionMetrics, ReadinessAssessment, WorkoutTarget } from '@/lib/progression/engine';
import { ProgressionEngine } from '@/lib/progression/engine';
import ReadinessAssessmentModal from './ReadinessAssessment';

interface ProgressionDashboardProps {
  exercise: 'squat' | 'pushup' | 'plank';
  currentTarget: WorkoutTarget;
  sessionHistory: SessionMetrics[];
  onTargetUpdate: (newTarget: WorkoutTarget) => void;
}

export default function ProgressionDashboard({
  exercise,
  currentTarget,
  sessionHistory,
  onTargetUpdate
}: ProgressionDashboardProps) {
  const [engine] = useState(() => new ProgressionEngine());
  const [latestReadiness, setLatestReadiness] = useState<ReadinessAssessment | null>(null);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextTarget, setNextTarget] = useState<WorkoutTarget | null>(null);
  const [applicableRules, setApplicableRules] = useState<string[]>([]);

  // Calculate next target and applicable rules
  useEffect(() => {
    const target = engine.generateNextTarget(exercise, sessionHistory, latestReadiness, currentTarget);
    const rules = engine.getApplicableRules(sessionHistory, latestReadiness);
    
    setNextTarget(target);
    setApplicableRules(rules.map(rule => rule.name));
  }, [exercise, currentTarget, sessionHistory, latestReadiness, engine]);

  const handleReadinessSubmit = async (assessment: ReadinessAssessment) => {
    setIsSubmitting(true);
    try {
      // Here you would typically save to your backend
      // For now, we'll just update the local state
      setLatestReadiness(assessment);
      setShowReadinessModal(false);
    } catch (error) {
      console.error('Error saving readiness assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyProgression = () => {
    if (nextTarget) {
      onTargetUpdate(nextTarget);
    }
  };

  const getReadinessScore = () => {
    if (!latestReadiness) return null;
    return engine.getReadinessScore(latestReadiness);
  };

  const getReadinessCategory = () => {
    const score = getReadinessScore();
    if (score === null) return null;
    return engine.getReadinessCategory(score);
  };

  const getReadinessColor = (category: string | null) => {
    switch (category) {
      case 'excellent': return 'success';
      case 'good': return 'success';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'neutral';
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'error';
      default: return 'neutral';
    }
  };

  const getVolumeColor = (volume: string) => {
    switch (volume) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'error';
      default: return 'neutral';
    }
  };

  const formatTarget = (target: WorkoutTarget) => {
    if (target.targetReps) {
      return `${target.targetReps} reps`;
    }
    if (target.targetTimeSeconds) {
      const minutes = Math.floor(target.targetTimeSeconds / 60);
      const seconds = target.targetTimeSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return 'Custom';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Progressive Overload
        </h3>
        <Button
          onClick={() => setShowReadinessModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
        >
          <Icon name="user" className="w-4 h-4 mr-2" />
          Assess Readiness
        </Button>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Current Target */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Current Target
          </h4>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTarget(currentTarget)}
            </div>
            <div className="flex gap-2">
              <Badge tone={getIntensityColor(currentTarget.intensity)}>
                {currentTarget.intensity} intensity
              </Badge>
              <Badge tone={getVolumeColor(currentTarget.volume)}>
                {currentTarget.volume} volume
              </Badge>
            </div>
          </div>
        </div>

        {/* Readiness Score */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Readiness Score
          </h4>
          <div className="space-y-2">
            {latestReadiness ? (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(getReadinessScore()! * 100)}%
                </div>
                <Badge tone={getReadinessColor(getReadinessCategory())}>
                  {getReadinessCategory()}
                </Badge>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Last assessed: {latestReadiness.assessmentDate.toLocaleDateString()}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400">
                  --
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  No assessment yet
                </div>
              </>
            )}
          </div>
        </div>

        {/* Session History */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Recent Sessions
          </h4>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {sessionHistory.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {sessionHistory.length > 0 
                ? `Last: ${sessionHistory[sessionHistory.length - 1].sessionDate.toLocaleDateString()}`
                : 'No sessions yet'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Next Target Recommendation */}
      {nextTarget && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Recommended Next Target
            </h4>
            <Button
              onClick={handleApplyProgression}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
            >
              Apply
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                {formatTarget(nextTarget)}
              </div>
              <div className="flex gap-2 mb-2">
                <Badge tone={getIntensityColor(nextTarget.intensity)}>
                  {nextTarget.intensity} intensity
                </Badge>
                <Badge tone={getVolumeColor(nextTarget.volume)}>
                  {nextTarget.volume} volume
                </Badge>
              </div>
            </div>
            
            {nextTarget.notes && (
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <Icon name="alert-circle" className="w-4 h-4 inline mr-1" />
                {nextTarget.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applicable Rules */}
      {applicableRules.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-3">
            Active Progression Rules
          </h4>
          <div className="space-y-2">
            {applicableRules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                <Icon name="check" className="w-4 h-4" />
                {rule}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Session Quality */}
      {sessionHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Recent Session Quality
          </h4>
          <div className="space-y-2">
            {sessionHistory.slice(-3).map((session, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.sessionDate.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {session.totalReps ? `${session.totalReps} reps` : `${session.totalTimeSeconds}s`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge tone={session.avgRomScore >= 0.7 ? 'success' : 'warning'}>
                    ROM: {Math.round(session.avgRomScore * 100)}%
                  </Badge>
                  <Badge tone={session.qualityScore >= 0.7 ? 'success' : 'warning'}>
                    Quality: {Math.round(session.qualityScore * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Readiness Assessment Modal */}
      <ReadinessAssessmentModal
        isOpen={showReadinessModal}
        onClose={() => setShowReadinessModal(false)}
        onSubmit={handleReadinessSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
