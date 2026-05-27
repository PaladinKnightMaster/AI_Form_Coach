"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button, Icon } from '@/ui/DS';
import type { ReadinessAssessment } from '@/lib/progression/engine';
import type { HealthData, HealthBaseline, HealthPermissions } from '@/lib/health/healthData';
import { HealthDataManager } from '@/lib/health/healthData';
import { useToastContext } from '@/components/ToastProvider';
import { toAPIRequest } from '@/types/readiness';

interface EnhancedReadinessAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assessment: ReadinessAssessment) => void;
  isSubmitting?: boolean;
}

export default function EnhancedReadinessAssessment({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false
}: EnhancedReadinessAssessmentProps) {
  const [healthManager] = useState(() => new HealthDataManager());
  const [healthData, setHealthData] = useState<HealthData | null>(null);
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
  const [loading, setLoading] = useState(false);
  const [showBaselineSetup, setShowBaselineSetup] = useState(false);
  const [autoReadinessScore, setAutoReadinessScore] = useState<number | null>(null);
  
  // Manual assessment state (fallback)
  const [manualAssessment, setManualAssessment] = useState<ReadinessAssessment>({
    sorenessLevel: 0,
    fatigueLevel: 0,
    sleepQuality: 5,
    stressLevel: 0,
    motivationLevel: 5,
    assessmentDate: new Date()
  });

  const { success: showSuccess, error: showError, info: showInfo } = useToastContext();

  const loadHealthData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const data = await healthManager.fetchHealthData(today);
      setHealthData(data);
      
      if (data) {
        const score = healthManager.calculateReadinessScore(data);
        setAutoReadinessScore(score);
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  }, [healthManager]);

  const loadBaseline = useCallback(() => {
    const baselineData = healthManager.getBaseline();
    
    if (!baselineData) {
      setShowBaselineSetup(true);
    }
  }, [healthManager]);

  const checkPermissions = useCallback(() => {
    const currentPermissions = healthManager.getPermissions();
    setPermissions(currentPermissions);
  }, [healthManager]);

  useEffect(() => {
    if (isOpen) {
      loadHealthData();
      loadBaseline();
      checkPermissions();
    }
  }, [isOpen, loadHealthData, loadBaseline, checkPermissions]);

  const requestHealthPermissions = async () => {
    setLoading(true);
    try {
      const newPermissions = await healthManager.requestPermissions();
      setPermissions(newPermissions);
      
      if (newPermissions.sleepAnalysis || newPermissions.sleepSessions || newPermissions.heartRate || newPermissions.steps) {
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

  const handleBaselineSubmit = (baselineData: HealthBaseline) => {
    healthManager.setBaseline(baselineData);
    setShowBaselineSetup(false);
    showSuccess('Baseline Set', 'Your health baseline has been saved');
    
    // Recalculate readiness score with new baseline
    if (healthData) {
      const score = healthManager.calculateReadinessScore(healthData);
      setAutoReadinessScore(score);
    }
  };

  const handleManualSliderChange = (field: keyof ReadinessAssessment, value: number) => {
    setManualAssessment(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Prepare the assessment data for the API using utility function
      const assessmentData = toAPIRequest(manualAssessment, healthData ? {
        sleepDuration: healthData.sleepDuration,
        restingHeartRate: healthData.restingHeartRate,
        hrv: healthData.hrv ?? undefined,
        stepCount: healthData.stepCount,
        trainingLoad: healthData.trainingLoad
      } : undefined);

      // Call the readiness API
      const response = await fetch('/api/readiness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(assessmentData)
      });

      if (!response.ok) {
        throw new Error('Failed to save readiness assessment');
      }

      const data = await response.json();
      
      // Create the final assessment (only core properties)
      const finalAssessment: ReadinessAssessment = {
        ...manualAssessment,
        assessmentDate: new Date()
      };
      
      onSubmit(finalAssessment);
      
      // Show success message with computed readiness score from API
      const readinessScore = data.readiness?.computed_readiness;
      if (readinessScore !== undefined) {
        showSuccess('Assessment Saved!', `Your readiness score: ${Math.round(readinessScore * 100)}%`);
      } else {
        showSuccess('Assessment Saved!', 'Your readiness assessment has been recorded');
      }
      onClose();
    } catch (error) {
      console.error('Error submitting readiness assessment:', error);
      showError('Submission Failed', 'Failed to submit readiness assessment');
    } finally {
      setLoading(false);
    }
  };

  const getSliderColor = (color: string, value: number) => {
    const percentage = (value / 10) * 100;
    switch (color) {
      case 'red':
        return `linear-gradient(to right, #ef4444 0%, #ef4444 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
      case 'orange':
        return `linear-gradient(to right, #f97316 0%, #f97316 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
      case 'blue':
        return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
      case 'purple':
        return `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
      case 'green':
        return `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
      default:
        return `linear-gradient(to right, #6b7280 0%, #6b7280 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Enhanced Readiness Assessment
            </h2>
            <p className="text-gray-600 mt-1">
              AI-powered readiness using your health data
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="x" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Health Data Status */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-900">
              Health Data Integration
            </h3>
            {!healthManager.hasHealthData() && (
              <Button
                onClick={requestHealthPermissions}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </div>
                ) : (
                  'Connect Health Data'
                )}
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(permissions).map(([key, hasPermission]) => (
              <div key={key} className="flex items-center gap-2">
                <Icon 
                  name={hasPermission ? "check" : "x"} 
                  className={`w-4 h-4 ${hasPermission ? 'text-green-500' : 'text-red-500'}`} 
                />
                <span className="text-sm capitalize">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Generated Readiness Score */}
        {autoReadinessScore !== null && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              AI-Generated Readiness Score
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-green-900">
                {Math.round(autoReadinessScore * 100)}%
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${autoReadinessScore * 100}%` }}
                  />
                </div>
                <div className="text-sm text-green-800 mt-1">
                  Based on your health data: Sleep, HRV, Steps, Training Load
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Data Details */}
        {healthData && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Today&apos;s Health Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthData.sleepDuration.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600">Sleep</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthData.restingHeartRate || '--'}
                </div>
                <div className="text-sm text-gray-600">Resting HR</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthData.hrv ? `${healthData.hrv}ms` : '--'}
                </div>
                <div className="text-sm text-gray-600">HRV</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthData.stepCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Steps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthData.trainingLoad}
                </div>
                <div className="text-sm text-gray-600">Training Load</div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Assessment (Fallback) */}
        {autoReadinessScore === null && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manual Assessment
            </h3>
            <div className="space-y-4">
              {[
                {
                  field: 'sorenessLevel' as const,
                  label: 'Muscle Soreness',
                  description: 'How sore are your muscles?',
                  color: 'red'
                },
                {
                  field: 'fatigueLevel' as const,
                  label: 'Fatigue Level',
                  description: 'How tired do you feel?',
                  color: 'orange'
                },
                {
                  field: 'sleepQuality' as const,
                  label: 'Sleep Quality',
                  description: 'How well did you sleep last night?',
                  color: 'blue'
                },
                {
                  field: 'stressLevel' as const,
                  label: 'Stress Level',
                  description: 'How stressed do you feel?',
                  color: 'purple'
                },
                {
                  field: 'motivationLevel' as const,
                  label: 'Motivation Level',
                  description: 'How motivated are you to work out?',
                  color: 'green'
                }
              ].map((config) => (
                <div key={config.field} className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      {config.label}
                    </label>
                    <p className="text-sm text-gray-600">
                      {config.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0</span>
                      <span className="font-medium">{manualAssessment[config.field]}/10</span>
                      <span>10</span>
                    </div>
                    
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={manualAssessment[config.field]}
                      onChange={(e) => handleManualSliderChange(config.field, parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: getSliderColor(config.color, manualAssessment[config.field])
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Baseline Setup Modal */}
        {showBaselineSetup && (
          <BaselineSetupModal
            isOpen={showBaselineSetup}
            onClose={() => setShowBaselineSetup(false)}
            onSubmit={handleBaselineSubmit}
          />
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              'Save Assessment'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Baseline Setup Modal Component
function BaselineSetupModal({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (baseline: HealthBaseline) => void;
}) {
  const [baseline, setBaseline] = useState<HealthBaseline>({
    sleepBaseline: 8,
    sleepEfficiencyBaseline: 85,
    restingHRBaseline: 60,
    maxHRBaseline: 180,
    hrvBaseline: 30,
    stepBaseline: 10000,
    activeMinutesBaseline: 30,
    weeklyTrainingLoadBaseline: 100,
    lastUpdated: new Date(),
    dataQuality: 'medium'
  });

  const handleSubmit = () => {
    // Update timestamp and data quality before submitting
    onSubmit({
      ...baseline,
      lastUpdated: new Date(),
      dataQuality: 'medium' // User-provided baseline is considered medium quality
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Set Your Health Baseline
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter your typical values to personalize readiness calculations.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Sleep Duration (hours)
            </label>
            <input
              type="number"
              min="4"
              max="12"
              step="0.5"
              value={baseline.sleepBaseline}
              onChange={(e) => setBaseline(prev => ({ ...prev, sleepBaseline: parseFloat(e.target.value) }))}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Resting Heart Rate (bpm)
            </label>
            <input
              type="number"
              min="40"
              max="100"
              value={baseline.restingHRBaseline}
              onChange={(e) => setBaseline(prev => ({ ...prev, restingHRBaseline: parseInt(e.target.value) }))}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              HRV Baseline (ms)
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={baseline.hrvBaseline || ''}
              onChange={(e) => setBaseline(prev => ({ ...prev, hrvBaseline: parseInt(e.target.value) || null }))}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Daily Steps
            </label>
            <input
              type="number"
              min="1000"
              max="50000"
              step="1000"
              value={baseline.stepBaseline}
              onChange={(e) => setBaseline(prev => ({ ...prev, stepBaseline: parseInt(e.target.value) }))}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            Save Baseline
          </Button>
        </div>
      </div>
    </div>
  );
}
