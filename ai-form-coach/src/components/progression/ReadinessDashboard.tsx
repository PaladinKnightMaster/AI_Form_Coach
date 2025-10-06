"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import type { HealthData, HealthBaseline } from '@/lib/health/healthData';
import { HealthDataManager } from '@/lib/health/healthData';
import { useToastContext } from '@/components/ToastProvider';

// interface ReadinessDashboardProps {
//   exercise: 'squat' | 'pushup' | 'plank'; // TODO: Implement exercise-specific readiness
// }

export default function ReadinessDashboard() {
  const [healthManager] = useState(() => new HealthDataManager());
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [baseline, setBaseline] = useState<HealthBaseline | null>(null);
  const [readinessScores, setReadinessScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const { error: showError } = useToastContext();

  const loadHealthData = useCallback(async () => {
    setLoading(true);
    try {
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const data: HealthData[] = [];
      const scores: number[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dayData = await healthManager.fetchHealthData(date);
        if (dayData) {
          data.push(dayData);
          const score = healthManager.calculateReadinessScore(dayData);
          scores.push(score);
        }
      }

      setHealthData(data);
      setReadinessScores(scores);
    } catch (error) {
      console.error('Error loading health data:', error);
      showError('Data Load Failed', 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, healthManager, showError]);

  const loadBaseline = useCallback(() => {
    const baselineData = healthManager.getBaseline();
    setBaseline(baselineData);
  }, [healthManager]);

  useEffect(() => {
    loadHealthData();
    loadBaseline();
  }, [loadHealthData, loadBaseline]);

  const getReadinessCategory = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  };

  const getReadinessColor = (category: string) => {
    switch (category) {
      case 'excellent': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'good': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'poor': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTrendDirection = (): 'up' | 'down' | 'stable' => {
    if (readinessScores.length < 2) return 'stable';
    
    const recent = readinessScores.slice(-3);
    const older = readinessScores.slice(-6, -3);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
    
    const diff = recentAvg - olderAvg;
    if (diff > 0.05) return 'up';
    if (diff < -0.05) return 'down';
    return 'stable';
  };

  const getAverageReadiness = (): number => {
    if (readinessScores.length === 0) return 0;
    return readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length;
  };

  const getHealthMetricTrend = (metric: keyof HealthData, higherIsBetter: boolean = true): 'up' | 'down' | 'stable' => {
    if (healthData.length < 2) return 'stable';
    
    const recent = healthData.slice(-3).map(d => d[metric] as number);
    const older = healthData.slice(-6, -3).map(d => d[metric] as number);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
    
    const diff = recentAvg - olderAvg;
    const threshold = higherIsBetter ? 0.05 : -0.05;
    
    if (higherIsBetter) {
      return diff > threshold ? 'up' : diff < -threshold ? 'down' : 'stable';
    } else {
      return diff < threshold ? 'up' : diff > -threshold ? 'down' : 'stable';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading health data...</span>
        </div>
      </div>
    );
  }

  if (healthData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <Icon name="activity" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Health Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Connect your health data to see readiness trends and insights.
          </p>
          <Button
            onClick={() => healthManager.requestPermissions()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Connect Health Data
          </Button>
        </div>
      </div>
    );
  }

  const averageReadiness = getAverageReadiness();
  const trendDirection = getTrendDirection();
  const currentCategory = getReadinessCategory(averageReadiness);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Readiness Dashboard
        </h3>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <Button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`text-sm ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Overall Readiness Score */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Average Readiness ({selectedPeriod})
          </h4>
          <div className="flex items-center gap-2">
            <Icon 
              name={trendDirection === 'up' ? 'chevron-up' : trendDirection === 'down' ? 'chevron-down' : 'activity'} 
              className={`w-4 h-4 ${
                trendDirection === 'up' ? 'text-green-500' : 
                trendDirection === 'down' ? 'text-red-500' : 
                'text-gray-500'
              }`} 
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {trendDirection === 'up' ? 'Improving' : trendDirection === 'down' ? 'Declining' : 'Stable'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`text-3xl font-bold ${getReadinessColor(currentCategory)}`}>
            {Math.round(averageReadiness * 100)}%
          </div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${averageReadiness * 100}%` }}
              />
            </div>
          </div>
          <Badge tone={currentCategory === 'excellent' ? 'success' : currentCategory === 'good' ? 'success' : currentCategory === 'fair' ? 'warning' : 'error'}>
            {currentCategory}
          </Badge>
        </div>
      </div>

      {/* Health Metrics Overview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Health Metrics Overview
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Sleep',
              value: healthData.length > 0 ? `${healthData[healthData.length - 1].sleepDuration.toFixed(1)}h` : '--',
              trend: getHealthMetricTrend('sleepDuration'),
              baseline: baseline?.sleepBaseline
            },
            {
              label: 'Resting HR',
              value: healthData.length > 0 ? `${healthData[healthData.length - 1].restingHeartRate || '--'} bpm` : '--',
              trend: getHealthMetricTrend('restingHeartRate', false),
              baseline: baseline?.restingHRBaseline
            },
            {
              label: 'HRV',
              value: healthData.length > 0 ? `${healthData[healthData.length - 1].hrv || '--'} ms` : '--',
              trend: getHealthMetricTrend('hrv'),
              baseline: baseline?.hrvBaseline
            },
            {
              label: 'Steps',
              value: healthData.length > 0 ? `${healthData[healthData.length - 1].stepCount.toLocaleString()}` : '--',
              trend: getHealthMetricTrend('stepCount'),
              baseline: baseline?.stepBaseline
            }
          ].map((metric, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">{metric.label}</span>
                <Icon 
                  name={metric.trend === 'up' ? 'chevron-up' : metric.trend === 'down' ? 'chevron-down' : 'activity'} 
                  className={`w-3 h-3 ${
                    metric.trend === 'up' ? 'text-green-500' : 
                    metric.trend === 'down' ? 'text-red-500' : 
                    'text-gray-500'
                  }`} 
                />
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {metric.value}
              </div>
              {metric.baseline && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Baseline: {metric.baseline}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Readiness Trend Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Readiness Trend
        </h4>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-end justify-between h-32 gap-1">
            {readinessScores.map((score, index) => {
              const category = getReadinessCategory(score);
              const height = (score * 100).toFixed(0);
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-full rounded-t transition-all duration-300 ${
                      category === 'excellent' ? 'bg-green-500' :
                      category === 'good' ? 'bg-blue-500' :
                      category === 'fair' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {healthData[index]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          Insights
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          {averageReadiness >= 0.8 && (
            <div>• Excellent readiness! You&apos;re in great shape for intense training.</div>
          )}
          {averageReadiness >= 0.6 && averageReadiness < 0.8 && (
            <div>• Good readiness. Consider moderate intensity training.</div>
          )}
          {averageReadiness >= 0.4 && averageReadiness < 0.6 && (
            <div>• Fair readiness. Focus on recovery and lighter training.</div>
          )}
          {averageReadiness < 0.4 && (
            <div>• Low readiness. Prioritize rest and recovery.</div>
          )}
          
          {trendDirection === 'up' && (
            <div>• Your readiness is improving over time. Great job!</div>
          )}
          {trendDirection === 'down' && (
            <div>• Your readiness is declining. Consider more rest days.</div>
          )}
          
          {baseline && (
            <div>• Baseline established. Personalized recommendations active.</div>
          )}
        </div>
      </div>
    </div>
  );
}
