"use client";

import { useState, useEffect } from 'react';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import LoadingOverlay from '@/components/LoadingOverlay';
import EnhancedReadinessAssessment from '@/components/progression/EnhancedReadinessAssessment';

interface ReadinessData {
  id: string;
  user_id: string;
  date: string;
  soreness_level: number;
  fatigue_level: number;
  sleep_quality: number;
  stress_level: number;
  motivation_level: number;
  sleep_duration?: number;
  resting_heart_rate?: number;
  hrv_average?: number;
  step_count?: number;
  training_load?: number;
  computed_readiness: number;
  readiness_category: 'poor' | 'fair' | 'good' | 'excellent';
  created_at: string;
}

interface HealthBaseline {
  sleep_baseline: number;
  rhr_baseline: number;
  hrv_baseline: number;
  step_baseline: number;
  last_updated: string;
}

export default function HealthDashboard() {
  const { success: showSuccess, error: showError, info: showInfo } = useToastContext();
  const [readinessData, setReadinessData] = useState<ReadinessData[]>([]);
  const [todayReadiness, setTodayReadiness] = useState<ReadinessData | null>(null);
  const [healthBaseline, setHealthBaseline] = useState<HealthBaseline | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAssessment, setShowAssessment] = useState(false);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
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
  };

  const handleAssessmentSubmit = (assessment: { energy: number; mood: number; sleep: number; soreness: number; stress: number; notes?: string }) => {
    setTodayReadiness({
      id: 'new',
      user_id: 'current',
      date: new Date().toISOString().split('T')[0],
      soreness_level: assessment.sorenessLevel,
      fatigue_level: assessment.fatigueLevel,
      sleep_quality: assessment.sleepQuality,
      stress_level: assessment.stressLevel,
      motivation_level: assessment.motivationLevel,
      computed_readiness: assessment.computedReadiness || 0.5,
      readiness_category: assessment.readinessCategory || 'fair',
      created_at: new Date().toISOString()
    });
    setShowAssessment(false);
    fetchHealthData(); // Refresh data
  };

  const getReadinessColor = (category: string) => {
    switch (category) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'poor': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getReadinessIcon = (category: string) => {
    switch (category) {
      case 'excellent': return 'trending-up';
      case 'good': return 'check-circle';
      case 'fair': return 'alert-circle';
      case 'poor': return 'x-circle';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading health data..." />;
  }

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Health Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Monitor your readiness and health metrics for optimal training
          </p>
        </div>

        {/* Today's Readiness Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
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
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {Math.round(todayReadiness.computed_readiness * 100)}%
                </div>
                <Badge className={getReadinessColor(todayReadiness.readiness_category)}>
                  <Icon name={getReadinessIcon(todayReadiness.readiness_category)} className="w-4 h-4 mr-1" />
                  {todayReadiness.readiness_category}
                </Badge>
              </div>

              {/* Manual Assessment */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Manual Assessment</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Soreness:</span>
                    <span className="text-gray-900 dark:text-white">{todayReadiness.soreness_level}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Fatigue:</span>
                    <span className="text-gray-900 dark:text-white">{todayReadiness.fatigue_level}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sleep:</span>
                    <span className="text-gray-900 dark:text-white">{todayReadiness.sleep_quality}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Stress:</span>
                    <span className="text-gray-900 dark:text-white">{todayReadiness.stress_level}/10</span>
                  </div>
                </div>
              </div>

              {/* Health Data */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Health Data</h4>
                <div className="space-y-1 text-sm">
                  {todayReadiness.sleep_duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sleep:</span>
                      <span className="text-gray-900 dark:text-white">{todayReadiness.sleep_duration}h</span>
                    </div>
                  )}
                  {todayReadiness.resting_heart_rate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">RHR:</span>
                      <span className="text-gray-900 dark:text-white">{todayReadiness.resting_heart_rate} bpm</span>
                    </div>
                  )}
                  {todayReadiness.step_count && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Steps:</span>
                      <span className="text-gray-900 dark:text-white">{todayReadiness.step_count.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="activity" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No assessment today
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Health Baselines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {healthBaseline.sleep_baseline}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sleep Baseline</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {healthBaseline.rhr_baseline}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">RHR Baseline (bpm)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {healthBaseline.hrv_baseline}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">HRV Baseline (ms)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {healthBaseline.step_baseline.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Step Baseline</div>
              </div>
            </div>
          </div>
        )}

        {/* Readiness History */}
        {readinessData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Readiness History (Last 7 Days)
            </h2>
            <div className="space-y-3">
              {readinessData.map((day) => (
                <div key={day.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(day.date).toLocaleDateString()}
                    </div>
                    <Badge className={getReadinessColor(day.readiness_category)}>
                      {day.readiness_category}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
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
