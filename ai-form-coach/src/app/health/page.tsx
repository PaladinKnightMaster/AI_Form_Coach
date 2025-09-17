"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import { HealthDataManager } from '@/lib/health/healthData';
import type { HealthData, HealthBaseline, HealthPermissions } from '@/lib/health/healthData';
import EnhancedReadinessAssessment from '@/components/progression/EnhancedReadinessAssessment';
import ReadinessDashboard from '@/components/progression/ReadinessDashboard';
import HealthDataExplanation from '@/components/health/HealthDataExplanation';
import { useToastContext } from '@/components/ToastProvider';

export default function HealthPage() {
  const [healthManager] = useState(() => new HealthDataManager());
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [baseline, setBaseline] = useState<HealthBaseline | null>(null);
  const [permissions, setPermissions] = useState<HealthPermissions>({
    sleepAnalysis: false,
    sleepSessions: false,
    heartRate: false,
    heartRateVariability: false,
    restingHeartRate: false,
    steps: false,
    activeMinutes: false,
    distance: false,
    workouts: false,
    exerciseSessions: false,
    nutrition: false,
    waterIntake: false,
    bodyMass: false,
    bodyFatPercentage: false,
    height: false
  });
  const [loading, setLoading] = useState(true);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'readiness' | 'trends'>('overview');
  const { success: showSuccess, error: showError, info: showInfo } = useToastContext();

  const loadHealthData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const data = await healthManager.fetchHealthData(today);
      setHealthData(data);
    } catch (error) {
      console.error('Error loading health data:', error);
      showError('Data Load Failed', 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, [healthManager, showError]);

  const loadBaseline = useCallback(() => {
    const baselineData = healthManager.getBaseline();
    setBaseline(baselineData);
  }, [healthManager]);

  const checkPermissions = useCallback(() => {
    const currentPermissions = healthManager.getPermissions();
    setPermissions(currentPermissions);
  }, [healthManager]);

  useEffect(() => {
    loadHealthData();
    loadBaseline();
    checkPermissions();
  }, [loadHealthData, loadBaseline, checkPermissions]);

  const requestHealthPermissions = async () => {
    setLoading(true);
    try {
      const newPermissions = await healthManager.requestPermissions();
      setPermissions(newPermissions);
      
      if (newPermissions.sleepAnalysis || newPermissions.heartRate || newPermissions.steps) {
        showSuccess('Permissions Granted', 'Health data access enabled');
        await loadHealthData();
      } else {
        showInfo('Manual Input Required', 'Health data not available, using manual assessment');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      showError('Permission Error', 'Failed to request health data permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReadinessSubmit = () => {
    showSuccess('Assessment Saved', 'Your readiness assessment has been saved');
    setShowReadinessModal(false);
    // Refresh data
    loadHealthData();
  };

  const getReadinessScore = (): number => {
    if (!healthData || !baseline) return 0.5;
    
    // Ensure healthData has all required properties with defaults
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


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading health data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Health Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered readiness assessment using your health data
          </p>
        </div>

        {/* Health Data Connection Explanation */}
        <div className="mb-8">
          <HealthDataExplanation
            onConnect={requestHealthPermissions}
            onManualInput={() => setShowReadinessModal(true)}
            isConnecting={loading}
          />
        </div>

        {/* Health Data Status */}
        {healthManager.hasHealthData() && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Connected Health Data
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(permissions).map(([key, hasPermission]) => (
                <div key={key} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Icon 
                    name={hasPermission ? "check" : "x"} 
                    className={`w-5 h-5 ${hasPermission ? 'text-green-500' : 'text-red-500'}`} 
                  />
                  <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Readiness Assessment */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Today&apos;s Readiness
            </h2>
            <Button
              onClick={() => setShowReadinessModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Icon name="user" className="w-4 h-4 mr-2" />
              {healthData ? 'Update Assessment' : 'Assess Readiness'}
            </Button>
          </div>
          
          {healthData ? (
            <div className="flex items-center gap-6">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {Math.round(getReadinessScore() * 100)}%
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${getReadinessScore() * 100}%` }}
                  />
                </div>
              </div>
              <Badge tone={getReadinessCategory() === 'excellent' ? 'success' : getReadinessCategory() === 'good' ? 'success' : 'warning'}>
                {getReadinessCategory()}
              </Badge>
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="activity" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Health Data Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Use the "Connect Health Data" button above to access your device's health data, 
                or perform a manual assessment to get personalized readiness insights.
              </p>
              <Button
                onClick={() => setShowReadinessModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Icon name="user" className="w-4 h-4 mr-2" />
                Start Manual Assessment
              </Button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview', icon: 'activity' },
              { id: 'readiness', label: 'Readiness', icon: 'user' },
              { id: 'trends', label: 'Trends', icon: 'trending-up' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'readiness' | 'trends')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon name={tab.icon as 'activity' | 'user' | 'trending-up'} className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Health Metrics Cards */}
            {healthData && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon name="moon" className="w-6 h-6 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sleep</h3>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {(healthData.sleepDuration || 0).toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {healthData.sleepSessions?.length || 0} sessions
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon name="heart" className="w-6 h-6 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Heart Rate</h3>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {healthData.restingHeartRate || '--'} bpm
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {healthData.heartRateSamples?.length || 0} samples
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon name="activity" className="w-6 h-6 text-green-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Steps</h3>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {(healthData.stepCount || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {healthData.stepSamples?.length || 0} samples
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'readiness' && (
          <div className="space-y-6">
            <ReadinessDashboard exercise="squat" />
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Health Trends
            </h3>
            <div className="text-center py-8">
              <Icon name="trending-up" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Trend analysis coming soon. Connect your health data to see historical patterns.
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Readiness Assessment Modal */}
        <EnhancedReadinessAssessment
          isOpen={showReadinessModal}
          onClose={() => setShowReadinessModal(false)}
          onSubmit={handleReadinessSubmit}
          isSubmitting={false}
        />
      </div>
    </div>
  );
}
