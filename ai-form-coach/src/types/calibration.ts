/**
 * Device Calibration Types
 * 
 * This module defines types for the personalized calibration system
 * that allows users to calibrate exercise-specific thresholds.
 */

export interface DeviceCalibration {
  id: string;
  user_id: string;
  device_id: string;
  created_at: string;
  updated_at: string;
  
  // Exercise-specific calibration values
  squat_full_depth_angle?: number; // Median knee angle at bottom of squat (degrees)
  pushup_elbow_bottom_angle?: number; // Median elbow angle at bottom of pushup (degrees)
  bodyline_target?: number; // Mean shoulder-hip-ankle line for plank (degrees)
  
  // Metadata
  calibration_version: number;
  is_active: boolean;
}

export interface CalibrationData {
  squat_full_depth_angle?: number;
  pushup_elbow_bottom_angle?: number;
  bodyline_target?: number;
}

export interface CalibrationStep {
  id: 'squat' | 'pushup' | 'plank';
  title: string;
  description: string;
  instructions: string[];
  duration: number; // seconds
  targetMetric: keyof CalibrationData;
  isCompleted: boolean;
  collectedData?: number[];
  finalValue?: number;
}

export interface CalibrationSession {
  id: string;
  device_id: string;
  steps: CalibrationStep[];
  currentStepIndex: number;
  isActive: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface CalibrationResult {
  success: boolean;
  data?: CalibrationData;
  error?: string;
  stepResults: {
    [K in keyof CalibrationData]: {
      collectedValues: number[];
      finalValue: number;
      isValid: boolean;
    };
  };
}

// Default calibration values (fallback when no user calibration exists)
export const DEFAULT_CALIBRATION: Required<CalibrationData> = {
  squat_full_depth_angle: 90, // 90 degrees knee angle at bottom
  pushup_elbow_bottom_angle: 90, // 90 degrees elbow angle at bottom
  bodyline_target: 180, // Straight line (180 degrees)
};

// Calibration step definitions
export const CALIBRATION_STEPS: Omit<CalibrationStep, 'isCompleted' | 'collectedData' | 'finalValue'>[] = [
  {
    id: 'squat',
    title: 'Squat Calibration',
    description: 'We\'ll measure your natural squat depth',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Perform 2 slow, controlled squats',
      'Go as deep as feels comfortable',
      'Hold the bottom position briefly',
      'We\'ll measure your knee angle at the lowest point'
    ],
    duration: 20,
    targetMetric: 'squat_full_depth_angle'
  },
  {
    id: 'pushup',
    title: 'Push-up Calibration',
    description: 'We\'ll measure your natural push-up depth',
    instructions: [
      'Start in a plank position',
      'Perform 2 slow, controlled push-ups',
      'Lower yourself as far as feels comfortable',
      'Hold the bottom position briefly',
      'We\'ll measure your elbow angle at the lowest point'
    ],
    duration: 20,
    targetMetric: 'pushup_elbow_bottom_angle'
  },
  {
    id: 'plank',
    title: 'Plank Calibration',
    description: 'We\'ll measure your natural body alignment',
    instructions: [
      'Start in a plank position',
      'Hold the position for 5 seconds',
      'Keep your body as straight as possible',
      'We\'ll measure your shoulder-hip-ankle alignment',
      'This helps us detect when you\'re properly aligned'
    ],
    duration: 10,
    targetMetric: 'bodyline_target'
  }
];

// Validation ranges for calibration data
export const CALIBRATION_RANGES = {
  squat_full_depth_angle: { min: 60, max: 120 }, // 60-120 degrees
  pushup_elbow_bottom_angle: { min: 60, max: 120 }, // 60-120 degrees
  bodyline_target: { min: 160, max: 200 }, // 160-200 degrees (allows some flexibility)
} as const;

// Helper function to validate calibration data
export function validateCalibrationData(data: CalibrationData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (data.squat_full_depth_angle !== undefined) {
    const { min, max } = CALIBRATION_RANGES.squat_full_depth_angle;
    if (data.squat_full_depth_angle < min || data.squat_full_depth_angle > max) {
      errors.push(`Squat depth angle must be between ${min} and ${max} degrees`);
    }
  }
  
  if (data.pushup_elbow_bottom_angle !== undefined) {
    const { min, max } = CALIBRATION_RANGES.pushup_elbow_bottom_angle;
    if (data.pushup_elbow_bottom_angle < min || data.pushup_elbow_bottom_angle > max) {
      errors.push(`Push-up elbow angle must be between ${min} and ${max} degrees`);
    }
  }
  
  if (data.bodyline_target !== undefined) {
    const { min, max } = CALIBRATION_RANGES.bodyline_target;
    if (data.bodyline_target < min || data.bodyline_target > max) {
      errors.push(`Body line target must be between ${min} and ${max} degrees`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to merge calibration data with defaults
export function mergeCalibrationData(userData?: CalibrationData): Required<CalibrationData> {
  return {
    squat_full_depth_angle: userData?.squat_full_depth_angle ?? DEFAULT_CALIBRATION.squat_full_depth_angle,
    pushup_elbow_bottom_angle: userData?.pushup_elbow_bottom_angle ?? DEFAULT_CALIBRATION.pushup_elbow_bottom_angle,
    bodyline_target: userData?.bodyline_target ?? DEFAULT_CALIBRATION.bodyline_target,
  };
}
