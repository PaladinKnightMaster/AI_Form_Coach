"use client";

import { useState } from 'react';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import type { UserPreferences } from '@/lib/ai/planGenerator';

interface PlanWizardProps {
  onComplete: (preferences: UserPreferences) => void;
  onCancel: () => void;
  isGenerating?: boolean;
}

export default function PlanWizard({ onComplete, onCancel, isGenerating = false }: PlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    fitness_level: 'beginner',
    goal_type: 'general_fitness',
    available_equipment: [],
    time_per_session: 30,
    sessions_per_week: 3,
    workout_duration_weeks: 4,
    injuries_or_limitations: [],
    preferred_workout_types: []
  });

  const steps = [
    {
      title: "Fitness Level",
      question: "What's your current fitness level?",
      type: "single",
      options: [
        { value: "beginner", label: "Beginner", description: "New to working out or returning after a long break" },
        { value: "intermediate", label: "Intermediate", description: "Some experience with regular exercise" },
        { value: "advanced", label: "Advanced", description: "Experienced with various workout types" }
      ]
    },
    {
      title: "Fitness Goal",
      question: "What's your primary fitness goal?",
      type: "single",
      options: [
        { value: "weight_loss", label: "Weight Loss", description: "Burn calories and lose body fat" },
        { value: "muscle_gain", label: "Muscle Gain", description: "Build lean muscle mass" },
        { value: "strength", label: "Strength", description: "Increase overall strength and power" },
        { value: "endurance", label: "Endurance", description: "Improve cardiovascular fitness" },
        { value: "general_fitness", label: "General Fitness", description: "Overall health and wellness" }
      ]
    },
    {
      title: "Available Equipment",
      question: "What equipment do you have access to? (Select all that apply)",
      type: "multiple",
      options: [
        { value: "bodyweight", label: "Bodyweight Only", description: "No equipment needed" },
        { value: "dumbbells", label: "Dumbbells", description: "Adjustable or fixed weight dumbbells" },
        { value: "resistance-bands", label: "Resistance Bands", description: "Elastic resistance bands" },
        { value: "pull-up-bar", label: "Pull-up Bar", description: "Doorway or wall-mounted bar" },
        { value: "kettlebell", label: "Kettlebell", description: "One or more kettlebells" },
        { value: "yoga-mat", label: "Yoga Mat", description: "Exercise mat for floor work" },
        { value: "barbell", label: "Barbell", description: "Olympic or standard barbell" },
        { value: "cardio-machine", label: "Cardio Machine", description: "Treadmill, bike, or rower" }
      ]
    },
    {
      title: "Time & Schedule",
      question: "How much time can you dedicate to each workout?",
      type: "single",
      options: [
        { value: 15, label: "15 minutes", description: "Quick, high-intensity sessions" },
        { value: 30, label: "30 minutes", description: "Balanced workout sessions" },
        { value: 45, label: "45 minutes", description: "Comprehensive training" },
        { value: 60, label: "60+ minutes", description: "Extended, detailed workouts" }
      ]
    },
    {
      title: "Weekly Schedule",
      question: "How many days per week can you work out?",
      type: "single",
      options: [
        { value: 2, label: "2 days", description: "Weekend warrior approach" },
        { value: 3, label: "3 days", description: "Balanced schedule" },
        { value: 4, label: "4 days", description: "Regular commitment" },
        { value: 5, label: "5 days", description: "Dedicated training" },
        { value: 6, label: "6+ days", description: "High-frequency training" }
      ]
    },
    {
      title: "Program Duration",
      question: "How long would you like this program to last?",
      type: "single",
      options: [
        { value: 4, label: "4 weeks", description: "Quick program" },
        { value: 6, label: "6 weeks", description: "Standard program" },
        { value: 8, label: "8 weeks", description: "Comprehensive program" },
        { value: 12, label: "12 weeks", description: "Long-term transformation" }
      ]
    }
  ];

  const handleOptionSelect = (value: string | number) => {
    const step = steps[currentStep];
    
    if (step.type === "single") {
      setPreferences(prev => ({
        ...prev,
        [step.title.toLowerCase().replace(' ', '_').replace('&', '')]: value
      }));
    } else if (step.type === "multiple") {
      setPreferences(prev => {
        const currentArray = prev[step.title.toLowerCase().replace(' ', '_').replace('&', '') as keyof UserPreferences] as string[] || [];
        const newArray = currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value];
        
        return {
          ...prev,
          [step.title.toLowerCase().replace(' ', '_').replace('&', '')]: newArray
        };
      });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the wizard
      onComplete(preferences as UserPreferences);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = () => {
    const step = steps[currentStep];
    const key = step.title.toLowerCase().replace(' ', '_').replace('&', '');
    const value = preferences[key as keyof UserPreferences];
    
    if (step.type === "single") {
      return value !== undefined && value !== null;
    } else if (step.type === "multiple") {
      return Array.isArray(value) && value.length > 0;
    }
    return false;
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Your AI Plan
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {currentStepData.question}
            </p>

            <div className="space-y-3">
              {currentStepData.options.map((option) => {
                const isSelected = currentStepData.type === "single"
                  ? preferences[currentStepData.title.toLowerCase().replace(' ', '_').replace('&', '') as keyof UserPreferences] === option.value
                  : (preferences[currentStepData.title.toLowerCase().replace(' ', '_').replace('&', '') as keyof UserPreferences] as string[])?.includes(option.value);

                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {option.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Icon name="check" className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50"
            >
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!isStepComplete() || isGenerating}
              className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
            >
              {currentStep === steps.length - 1 ? (
                isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </div>
                ) : (
                  'Generate Plan'
                )
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
