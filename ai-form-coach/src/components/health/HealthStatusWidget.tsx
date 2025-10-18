"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import { HealthDataManager } from '@/lib/health/healthData';
import type { HealthData, HealthBaseline } from '@/lib/health/healthData';
import { useToastContext } from '@/components/ToastProvider';

interface HealthStatusWidgetProps {
  onOpenHealthDashboard: () => void;
}

export default function HealthStatusWidget({ onOpenHealthDashboard }: HealthStatusWidgetProps) {
  const [healthManager] = useState(() => new HealthDataManager());
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [baseline, setBaseline] = useState<HealthBaseline | null>(null);
  const { info: showInfo } = useToastContext();

  const loadHealthData = useCallback(async () => {
    try {
      const today = new Date();
      const data = await healthManager.fetchHealthData(today);
      setHealthData(data);
    } catch (error) {
      console.error('Error loading health data:', error);
    }
  }, [healthManager]);

  const loadBaseline = useCallback(() => {
    const baselineData = healthManager.getBaseline();
    setBaseline(baselineData);
  }, [healthManager]);

  useEffect(() => {
    loadHealthData();
    loadBaseline();
  }, [loadHealthData, loadBaseline]);

  const getReadinessScore = (): number => {
    if (!healthData || !baseline) return 0.5;
    
    const safeHealthData = {
      sleepSessions: healthData.sleepSessions || [],
      sleepDuration: healthData.sleepDuration || 0,
      heartRateSamples: healthData.heartRateSamples || [],
      restingHeartRate: healthData.restingHeartRate || 0,
      hrvSamples: healthData.hrvSamples || [],
      hrv: healthData.hrv || null,
      stepSamples: healthData.stepSamples || [],
      stepCount: healthData.stepCount || 0,
      workoutSessions: healthData.workoutSessions || [],
      trainingLoad: healthData.trainingLoad || 0,
      date: healthData.date,
      dataSources: healthData.dataSources || [],
      lastSync: healthData.lastSync
    };
    
    return healthManager.calculateReadinessScore(safeHealthData);
  };

  const getReadinessCategory = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    const score = getReadinessScore();
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  };


  const hasHealthData = healthManager.hasHealthData();

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Health Status
        </h4>
        <Button
          onClick={onOpenHealthDashboard}
          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1"
        >
          <Icon name="external-link" className="w-3 h-3 mr-1" />
          Dashboard
        </Button>
      </div>
      
      {hasHealthData && healthData ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round(getReadinessScore() * 100)}%
            </div>
            <Badge tone={getReadinessCategory() === 'excellent' ? 'success' : getReadinessCategory() === 'good' ? 'success' : 'warning'}>
              {getReadinessCategory()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Icon name="moon" className="w-3 h-3 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {(healthData.sleepDuration || 0).toFixed(1)}h
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="heart" className="w-3 h-3 text-red-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {healthData.restingHeartRate || '--'} bpm
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="activity" className="w-3 h-3 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {(healthData.stepCount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="trending-up" className="w-3 h-3 text-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {healthData.trainingLoad || 0}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            No health data connected
          </div>
          <Button
            onClick={() => {
              showInfo('Health Data', 'Navigating to health dashboard to connect your health data or perform a manual assessment');
              onOpenHealthDashboard();
            }}
            className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1"
          >
            <Icon name="link" className="w-3 h-3 mr-1" />
            Connect
          </Button>
        </div>
      )}
    </div>
  );
}
