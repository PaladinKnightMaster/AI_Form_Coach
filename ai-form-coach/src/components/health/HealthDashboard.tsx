"use client";

import { useState, useEffect, useCallback } from 'react';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import LoadingOverlay from '@/components/LoadingOverlay';
import EnhancedReadinessAssessment from '@/components/progression/EnhancedReadinessAssessment';
import type { ReadinessAssessment, ReadinessDataDB } from '@/types/readiness';

interface HealthBaseline {
  sleep_baseline: number;
  rhr_baseline: number;
  hrv_baseline: number;
  step_baseline: number;
  last_updated: string;
}

export default function HealthDashboard() {
  const { error: showError } = useToastContext();
  const [readinessData, setReadinessData] = useState<ReadinessDataDB[]>([]);
  const [todayReadiness, setTodayReadiness] = useState<ReadinessDataDB | null>(null);
  const [healthBaseline, setHealthBaseline] = useState<HealthBaseline | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssessment, setShowAssessment] = useState(false);

  const fetchHealthData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch today's readiness data
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/readiness?date=${today}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodayReadiness(data.readiness);
      }

      // Fetch recent readiness history (last 7 days)
      const historyResponse = await fetch('/api/readiness?days=7', {
        credentials: 'include',
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setReadinessData(historyData.readiness || []);
      }

      // Fetch health baseline
      const baselineResponse = await fetch('/api/health/baseline', {
        credentials: 'include',
      });
      
      if (baselineResponse.ok) {
        const baselineData = await baselineResponse.json();
        setHealthBaseline(baselineData.baseline);
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      showError('Load Failed', 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  const handleAssessmentSubmit = (assessment: ReadinessAssessment) => {
    // Calculate computed readiness from the assessment scores
    const computedReadiness = (
      (10 - assessment.sorenessLevel) +
      (10 - assessment.fatigueLevel) +
      assessment.sleepQuality +
      (10 - assessment.stressLevel) +
      assessment.motivationLevel
    ) / 50;
    
    // Determine category based on computed readiness
    const readinessCategory = 
      computedReadiness >= 0.8 ? 'excellent' :
      computedReadiness >= 0.6 ? 'good' :
      computedReadiness >= 0.4 ? 'fair' : 'poor';
    
    setTodayReadiness({
      id: 'new',
      user_id: 'current',
      date: new Date().toISOString().split('T')[0],
      soreness_level: assessment.sorenessLevel,
      fatigue_level: assessment.fatigueLevel,
      sleep_quality: assessment.sleepQuality,
      stress_level: assessment.stressLevel,
      motivation_level: assessment.motivationLevel,
      computed_readiness: computedReadiness,
      readiness_category: readinessCategory,
      created_at: new Date().toISOString()
    });
    setShowAssessment(false);
    fetchHealthData(); // Refresh data
  };

  const getReadinessColor = (category: string) => {
    switch (category) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReadinessIcon = (category: string) => {
    switch (category) {
      case 'excellent': return 'chart';
      case 'good': return 'check';
      case 'fair': return 'alert-circle';
      case 'poor': return 'x';
      default: return 'alert';
    }
  };

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading health data..." />;
  }

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Health Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Monitor your readiness and health metrics for optimal training
          </p>
        </div>

        {/* Today's Readiness Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Today&apos;s Readiness
            </h2>
            <Button
              onClick={() => setShowAssessment(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Icon name="plus" className="w-4 h-4 mr-2" />
              {todayReadiness ? 'Update Assessment' : 'Take Assessment'}
            </Button>
          </div>

          {todayReadiness ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Readiness Score */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {Math.round(todayReadiness.computed_readiness * 100)}%
                </div>
                <Badge className={getReadinessColor(todayReadiness.readiness_category)}>
                  <Icon name={getReadinessIcon(todayReadiness.readiness_category)} className="w-4 h-4 mr-1" />
                  {todayReadiness.readiness_category}
                </Badge>
              </div>

              {/* Manual Assessment */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Manual Assessment</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Soreness:</span>
                    <span className="text-gray-900">{todayReadiness.soreness_level}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fatigue:</span>
                    <span className="text-gray-900">{todayReadiness.fatigue_level}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sleep:</span>
                    <span className="text-gray-900">{todayReadiness.sleep_quality}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stress:</span>
                    <span className="text-gray-900">{todayReadiness.stress_level}/10</span>
                  </div>
                </div>
              </div>

              {/* Health Data */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Health Data</h4>
                <div className="space-y-1 text-sm">
                  {todayReadiness.sleep_duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sleep:</span>
                      <span className="text-gray-900">{todayReadiness.sleep_duration}h</span>
                    </div>
                  )}
                  {todayReadiness.resting_heart_rate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">RHR:</span>
                      <span className="text-gray-900">{todayReadiness.resting_heart_rate} bpm</span>
                    </div>
                  )}
                  {todayReadiness.step_count && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Steps:</span>
                      <span className="text-gray-900">{todayReadiness.step_count.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="activity" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No assessment today
              </h3>
              <p className="text-gray-600 mb-4">
                Take your daily readiness assessment to get personalized workout recommendations
              </p>
              <Button
                onClick={() => setShowAssessment(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Take Assessment
              </Button>
            </div>
          )}
        </div>

        {/* Health Baseline */}
        {healthBaseline && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Health Baselines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthBaseline.sleep_baseline}h
                </div>
                <div className="text-sm text-gray-600">Sleep Baseline</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthBaseline.rhr_baseline}
                </div>
                <div className="text-sm text-gray-600">RHR Baseline (bpm)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthBaseline.hrv_baseline}
                </div>
                <div className="text-sm text-gray-600">HRV Baseline (ms)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthBaseline.step_baseline.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Step Baseline</div>
              </div>
            </div>
          </div>
        )}

        {/* Readiness History */}
        {readinessData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Readiness History (Last 7 Days)
            </h2>
            <div className="space-y-3">
              {readinessData.map((day) => (
                <div key={day.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString()}
                    </div>
                    <Badge className={getReadinessColor(day.readiness_category)}>
                      {day.readiness_category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{Math.round(day.computed_readiness * 100)}%</span>
                    <div className="flex space-x-2">
                      <span>S:{day.soreness_level}</span>
                      <span>F:{day.fatigue_level}</span>
                      <span>Sl:{day.sleep_quality}</span>
                      <span>St:{day.stress_level}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Readiness Assessment Modal */}
      <EnhancedReadinessAssessment
        isOpen={showAssessment}
        onClose={() => setShowAssessment(false)}
        onSubmit={handleAssessmentSubmit}
        isSubmitting={false}
      />
    </Container>
  );
}
