"use client";

import { useState, useEffect } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import { ProgressionEngine, type SessionMetrics, type ReadinessAssessment, type WorkoutTarget } from '@/lib/progression/engine';
import EnhancedReadinessAssessment from './EnhancedReadinessAssessment';
import { useToastContext } from '@/components/ToastProvider';

interface ProgressionIntegrationProps {
  exercise: 'squat' | 'pushup' | 'plank';
  onTargetUpdate: (target: WorkoutTarget) => void;
  onReadinessUpdate: (readiness: ReadinessAssessment | null) => void;
}

export default function ProgressionIntegration({
  exercise,
  onTargetUpdate,
  onReadinessUpdate
}: ProgressionIntegrationProps) {
  const [engine] = useState(() => new ProgressionEngine());
  const [sessionHistory, setSessionHistory] = useState<SessionMetrics[]>([]);
  const [latestReadiness, setLatestReadiness] = useState<ReadinessAssessment | null>(null);
  const [currentTarget, setCurrentTarget] = useState<WorkoutTarget | null>(null);
  const [nextTarget, setNextTarget] = useState<WorkoutTarget | null>(null);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { success: showSuccess, error: showError } = useToastContext();

  // Load progression data
  useEffect(() => {
    loadProgressionData();
  }, [exercise]);

  const loadProgressionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/progression?exercise=${exercise}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSessionHistory(data.sessionHistory || []);
        setLatestReadiness(data.readinessAssessment);
        setCurrentTarget(data.currentTarget);
        
        // Calculate next target
        if (data.currentTarget) {
          const next = engine.generateNextTarget(exercise, data.sessionHistory || [], data.readinessAssessment, data.currentTarget);
          setNextTarget(next);
        }
      }
    } catch (error) {
      console.error('Error loading progression data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadinessSubmit = async (assessment: ReadinessAssessment) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'readiness_assessment',
          data: assessment
        })
      });

      if (response.ok) {
        setLatestReadiness(assessment);
        onReadinessUpdate(assessment);
        setShowReadinessModal(false);
        showSuccess('Readiness Saved', 'Your assessment has been saved');
        
        // Recalculate next target with new readiness
        if (currentTarget) {
          const next = engine.generateNextTarget(exercise, sessionHistory, assessment, currentTarget);
          setNextTarget(next);
        }
      } else {
        showError('Save Failed', 'Failed to save readiness assessment');
      }
    } catch (error) {
      console.error('Error saving readiness assessment:', error);
      showError('Save Failed', 'Failed to save readiness assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyProgression = async () => {
    if (!nextTarget) return;

    try {
      const response = await fetch('/api/progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'workout_target',
          data: nextTarget
        })
      });

      if (response.ok) {
        setCurrentTarget(nextTarget);
        onTargetUpdate(nextTarget);
        showSuccess('Target Updated', 'Your workout target has been updated');
      } else {
        showError('Update Failed', 'Failed to update workout target');
      }
    } catch (error) {
      console.error('Error updating target:', error);
      showError('Update Failed', 'Failed to update workout target');
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

  const shouldShowProgression = () => {
    return currentTarget || nextTarget || sessionHistory.length > 0;
  };

  if (loading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading progression data...
        </div>
      </div>
    );
  }

  if (!shouldShowProgression()) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Current Target Display */}
      {currentTarget && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-green-900 dark:text-green-200">
              Current Target
            </h4>
            <Badge tone="success">
              {currentTarget.intensity} intensity
            </Badge>
          </div>
          <div className="text-lg font-semibold text-green-900 dark:text-green-200">
            {formatTarget(currentTarget)}
          </div>
          {currentTarget.notes && (
            <div className="text-sm text-green-800 dark:text-green-300 mt-1">
              {currentTarget.notes}
            </div>
          )}
        </div>
      )}

      {/* Readiness Assessment */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Readiness Assessment
          </h4>
          <Button
            onClick={() => setShowReadinessModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
          >
            <Icon name="user" className="w-4 h-4 mr-2" />
            {latestReadiness ? 'Update' : 'Assess'}
          </Button>
        </div>
        
        {latestReadiness ? (
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(getReadinessScore()! * 100)}%
            </div>
            <Badge tone={getReadinessColor(getReadinessCategory())}>
              {getReadinessCategory()}
            </Badge>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {latestReadiness.assessmentDate.toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            No readiness assessment yet. Click &ldquo;Assess&rdquo; to get personalized recommendations.
          </div>
        )}
      </div>

      {/* Next Target Recommendation */}
      {nextTarget && nextTarget !== currentTarget && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
              Recommended Next Target
            </h4>
            <Button
              onClick={handleApplyProgression}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
            >
              Apply
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">
              {formatTarget(nextTarget)}
            </div>
            <div className="flex gap-2">
              <Badge tone={nextTarget.intensity === 'high' ? 'error' : nextTarget.intensity === 'moderate' ? 'warning' : 'success'}>
                {nextTarget.intensity} intensity
              </Badge>
              <Badge tone={nextTarget.volume === 'high' ? 'error' : nextTarget.volume === 'moderate' ? 'warning' : 'success'}>
                {nextTarget.volume} volume
              </Badge>
            </div>
            {nextTarget.notes && (
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                <Icon name="info" className="w-4 h-4 inline mr-1" />
                {nextTarget.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session History Summary */}
      {sessionHistory.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Recent Performance
          </h4>
          <div className="space-y-2">
            {sessionHistory.slice(-2).map((session, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="text-gray-600 dark:text-gray-400">
                  {session.sessionDate.toLocaleDateString()}
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

      {/* Enhanced Readiness Assessment Modal */}
      <EnhancedReadinessAssessment
        isOpen={showReadinessModal}
        onClose={() => setShowReadinessModal(false)}
        onSubmit={handleReadinessSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
