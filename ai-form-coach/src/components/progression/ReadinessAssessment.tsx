"use client";

import { useState } from 'react';
import { Button, Icon } from '@/ui/DS';
import type { ReadinessAssessment } from '@/lib/progression/engine';

interface ReadinessAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assessment: ReadinessAssessment) => void;
  isSubmitting?: boolean;
}

export default function ReadinessAssessment({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false
}: ReadinessAssessmentProps) {
  const [assessment, setAssessment] = useState<ReadinessAssessment>({
    sorenessLevel: 0,
    fatigueLevel: 0,
    sleepQuality: 5,
    stressLevel: 0,
    motivationLevel: 5,
    assessmentDate: new Date()
  });

  const handleSliderChange = (field: keyof ReadinessAssessment, value: number) => {
    setAssessment(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    onSubmit({
      ...assessment,
      assessmentDate: new Date()
    });
  };

  if (!isOpen) return null;

  const sliderConfigs = [
    {
      field: 'sorenessLevel' as const,
      label: 'Muscle Soreness',
      description: 'How sore are your muscles?',
      min: 0,
      max: 10,
      labels: ['No soreness', 'Extreme soreness'],
      color: 'red'
    },
    {
      field: 'fatigueLevel' as const,
      label: 'Fatigue Level',
      description: 'How tired do you feel?',
      min: 0,
      max: 10,
      labels: ['Fresh & energetic', 'Completely exhausted'],
      color: 'orange'
    },
    {
      field: 'sleepQuality' as const,
      label: 'Sleep Quality',
      description: 'How well did you sleep last night?',
      min: 0,
      max: 10,
      labels: ['Very poor sleep', 'Excellent sleep'],
      color: 'blue'
    },
    {
      field: 'stressLevel' as const,
      label: 'Stress Level',
      description: 'How stressed do you feel?',
      min: 0,
      max: 10,
      labels: ['Very relaxed', 'Extremely stressed'],
      color: 'purple'
    },
    {
      field: 'motivationLevel' as const,
      label: 'Motivation Level',
      description: 'How motivated are you to work out?',
      min: 0,
      max: 10,
      labels: ['Not motivated', 'Very motivated'],
      color: 'green'
    }
  ];

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Readiness Assessment
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Help us personalize your workout intensity
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Icon name="x" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Assessment Form */}
        <div className="space-y-6">
          {sliderConfigs.map((config) => (
            <div key={config.field} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {config.label}
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {config.description}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{config.labels[0]}</span>
                  <span className="font-medium">{assessment[config.field]}/10</span>
                  <span>{config.labels[1]}</span>
                </div>
                
                <div className="relative">
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    value={assessment[config.field]}
                    onChange={(e) => handleSliderChange(config.field, parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: getSliderColor(config.color, assessment[config.field])
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    {Array.from({ length: 11 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          i <= assessment[config.field] 
                            ? `bg-${config.color}-500` 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Readiness Score Preview */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Readiness Score Preview
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.max(0, Math.min(100, 
                    (1 - assessment.sorenessLevel / 10) * 30 +
                    (1 - assessment.fatigueLevel / 10) * 25 +
                    (assessment.sleepQuality / 10) * 20 +
                    (1 - assessment.stressLevel / 10) * 15 +
                    (assessment.motivationLevel / 10) * 10
                  ) * 100)}%` 
                }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(
                (1 - assessment.sorenessLevel / 10) * 30 +
                (1 - assessment.fatigueLevel / 10) * 25 +
                (assessment.sleepQuality / 10) * 20 +
                (1 - assessment.stressLevel / 10) * 15 +
                (assessment.motivationLevel / 10) * 10
              )}%
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Based on your responses, we'll adjust your workout intensity accordingly.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
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
