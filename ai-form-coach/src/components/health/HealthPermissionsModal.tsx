"use client";

import { useState, useEffect } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import type { HealthPermissions } from '@/lib/health/healthData';

interface HealthPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdate: (permissions: HealthPermissions) => void;
  currentPermissions: HealthPermissions;
}

interface PermissionCategory {
  id: keyof HealthPermissions;
  name: string;
  description: string;
  icon: string;
  required: boolean;
  platform: 'ios' | 'android' | 'web' | 'all';
  developerLink?: string;
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'sleepAnalysis',
    name: 'Sleep Analysis',
    description: 'Track sleep duration and quality for readiness assessment',
    icon: 'moon',
    required: false,
    platform: 'all',
    developerLink: 'https://developer.apple.com/documentation/healthkit/hkcategorytypeidentifier/1615713-sleepanalysis'
  },
  {
    id: 'sleepSessions',
    name: 'Sleep Sessions',
    description: 'Detailed sleep session data including stages',
    icon: 'moon',
    required: false,
    platform: 'android',
    developerLink: 'https://developer.android.com/guide/health-and-fitness/health-connect/data-types/sleep-sessions'
  },
  {
    id: 'heartRate',
    name: 'Heart Rate',
    description: 'Monitor heart rate for recovery assessment',
    icon: 'heart',
    required: false,
    platform: 'all',
    developerLink: 'https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/1615235-heartrate'
  },
  {
    id: 'heartRateVariability',
    name: 'Heart Rate Variability',
    description: 'HRV data for autonomic nervous system recovery',
    icon: 'activity',
    required: false,
    platform: 'all',
    developerLink: 'https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/1615555-heartratevariabilitysdnn'
  },
  {
    id: 'restingHeartRate',
    name: 'Resting Heart Rate',
    description: 'Baseline heart rate for fitness tracking',
    icon: 'heart',
    required: false,
    platform: 'all',
    developerLink: 'https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/1615555-heartratevariabilitysdnn'
  },
  {
    id: 'steps',
    name: 'Step Count',
    description: 'Daily step count for activity tracking',
    icon: 'trending-up',
    required: false,
    platform: 'all',
    developerLink: 'https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/1615555-heartratevariabilitysdnn'
  },
  {
    id: 'activeMinutes',
    name: 'Active Minutes',
    description: 'Time spent in moderate to vigorous activity',
    icon: 'clock',
    required: false,
    platform: 'android',
    developerLink: 'https://developer.android.com/guide/health-and-fitness/health-connect/data-types/active-minutes'
  },
  {
    id: 'distance',
    name: 'Distance',
    description: 'Distance traveled for activity tracking',
    icon: 'map-pin',
    required: false,
    platform: 'all',
    developerLink: 'https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/1615555-heartratevariabilitysdnn'
  },
  {
    id: 'workouts',
    name: 'Workouts',
    description: 'Exercise session data for training load calculation',
    icon: 'dumbbell',
    required: false,
    platform: 'all',
    developerLink: 'https://developer.apple.com/documentation/healthkit/hkworkouttypeidentifier'
  },
  {
    id: 'exerciseSessions',
    name: 'Exercise Sessions',
    description: 'Detailed exercise session information',
    icon: 'dumbbell',
    required: false,
    platform: 'android',
    developerLink: 'https://developer.android.com/guide/health-and-fitness/health-connect/data-types/exercise-sessions'
  },
  {
    id: 'bodyMass',
    name: 'Body Mass',
    description: 'Weight tracking for fitness progress',
    icon: 'scale',
    required: false,
    platform: 'all',
    developerLink: 'https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/1615555-heartratevariabilitysdnn'
  },
  {
    id: 'bodyFatPercentage',
    name: 'Body Fat Percentage',
    description: 'Body composition tracking',
    icon: 'scale',
    required: false,
    platform: 'all',
    developerLink: 'https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/1615555-heartratevariabilitysdnn'
  }
];

export default function HealthPermissionsModal({
  isOpen,
  onClose,
  onPermissionsUpdate,
  currentPermissions
}: HealthPermissionsModalProps) {
  const { success: showSuccess, error: showError } = useToastContext();
  const [permissions, setPermissions] = useState<HealthPermissions>(currentPermissions);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPermissions(currentPermissions);
  }, [currentPermissions, setPermissions]);

  const handlePermissionToggle = (permissionId: keyof HealthPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      onPermissionsUpdate(permissions);
      showSuccess('Permissions Updated', 'Your health data permissions have been saved');
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
      showError('Save Failed', 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ios': return '📱';
      case 'android': return '🤖';
      case 'web': return '🌐';
      default: return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'ios': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'android': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'web': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Health Data Permissions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Choose which health data you want to share for personalized insights
              </p>
            </div>
            <Button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            >
              <Icon name="x" className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Privacy Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Icon name="lock" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Your Privacy is Protected
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  All health data is processed locally when possible. We only store aggregated metrics 
                  to provide you with personalized insights. You can change these permissions anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Learn More About Health Data Access
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a
                href="https://developer.apple.com/health/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-2xl">📱</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Apple HealthKit</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Official developer documentation</div>
                </div>
                <Icon name="external-link" className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
              <a
                href="https://developer.android.com/guide/health-and-fitness/health-connect"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Google Health Connect</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Official developer documentation</div>
                </div>
                <Icon name="external-link" className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            </div>
          </div>

          {/* Permission Categories */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Health Data Types
            </h3>
            {PERMISSION_CATEGORIES.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <Icon name={category.icon as 'heart' | 'activity' | 'moon' | 'trending-up'} className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h4>
                      <Badge className={getPlatformColor(category.platform)}>
                        {getPlatformIcon(category.platform)} {category.platform}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {category.description}
                    </p>
                    {category.developerLink && (
                      <a
                        href={category.developerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View official documentation →
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions[category.id]}
                      onChange={() => handlePermissionToggle(category.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                'Save Permissions'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
