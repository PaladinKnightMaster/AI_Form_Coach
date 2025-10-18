/**
 * Calibration Constants and User Override System
 * 
 * This module provides exercise-specific constants that can be overridden
 * with per-user calibration data for personalized thresholds.
 */

import { 
  DEFAULT_CALIBRATION, 
  mergeCalibrationData, 
  type CalibrationData,
  type DeviceCalibration 
} from '@/types/calibration';

// Exercise-specific configuration interfaces
export interface ExerciseConfig {
  // Squat configuration
  squat: {
    minDepthAngle: number; // Minimum knee angle for valid squat depth
    idealDepthAngle: number; // Ideal knee angle for perfect form
    minAngle: number; // Minimum angle for rep counting
    idealAngle: number; // Ideal angle for form scoring
  };
  
  // Push-up configuration
  pushup: {
    minElbowAngle: number; // Minimum elbow angle for valid push-up depth
    idealElbowAngle: number; // Ideal elbow angle for perfect form
    minAngle: number; // Minimum angle for rep counting
    idealAngle: number; // Ideal angle for form scoring
  };
  
  // Plank configuration
  plank: {
    minHipAngle: number; // Minimum hip angle for valid plank
    idealHipAngle: number; // Ideal hip angle for perfect form
    minTime: number; // Minimum hold time in seconds
    idealTime: number; // Ideal hold time in seconds
  };
}

/**
 * Get exercise configuration with user calibration overrides
 */
export function getExerciseConfig(userCalibration?: CalibrationData): ExerciseConfig {
  const calibration = mergeCalibrationData(userCalibration);
  
  return {
    squat: {
      // Use calibrated squat depth angle as the ideal, with some tolerance
      minDepthAngle: Math.max(60, calibration.squat_full_depth_angle - 15),
      idealDepthAngle: calibration.squat_full_depth_angle,
      minAngle: Math.max(60, calibration.squat_full_depth_angle - 20),
      idealAngle: calibration.squat_full_depth_angle,
    },
    
    pushup: {
      // Use calibrated push-up elbow angle as the ideal, with some tolerance
      minElbowAngle: Math.max(60, calibration.pushup_elbow_bottom_angle - 15),
      idealElbowAngle: calibration.pushup_elbow_bottom_angle,
      minAngle: Math.max(60, calibration.pushup_elbow_bottom_angle - 20),
      idealAngle: calibration.pushup_elbow_bottom_angle,
    },
    
    plank: {
      // Use calibrated body line target as the ideal, with some tolerance
      minHipAngle: Math.max(160, calibration.bodyline_target - 10),
      idealHipAngle: calibration.bodyline_target,
      minTime: 3, // Minimum 3 seconds
      idealTime: 5, // Ideal 5 seconds
    },
  };
}

/**
 * Get default exercise configuration (no user calibration)
 */
export function getDefaultExerciseConfig(): ExerciseConfig {
  return getExerciseConfig();
}

/**
 * Calculate personalized thresholds based on calibration data
 */
export function calculatePersonalizedThresholds(calibration: CalibrationData) {
  const config = getExerciseConfig(calibration);
  
  return {
    // Squat thresholds
    squat: {
      fullDepthAngle: calibration.squat_full_depth_angle ?? DEFAULT_CALIBRATION.squat_full_depth_angle,
      minDepthAngle: config.squat.minDepthAngle,
      idealDepthAngle: config.squat.idealDepthAngle,
      depthTolerance: 10, // ±10 degrees tolerance
    },
    
    // Push-up thresholds
    pushup: {
      elbowBottomAngle: calibration.pushup_elbow_bottom_angle ?? DEFAULT_CALIBRATION.pushup_elbow_bottom_angle,
      minElbowAngle: config.pushup.minElbowAngle,
      idealElbowAngle: config.pushup.idealElbowAngle,
      elbowTolerance: 10, // ±10 degrees tolerance
    },
    
    // Plank thresholds
    plank: {
      bodylineTarget: calibration.bodyline_target ?? DEFAULT_CALIBRATION.bodyline_target,
      minHipAngle: config.plank.minHipAngle,
      idealHipAngle: config.plank.idealHipAngle,
      bodylineTolerance: 5, // ±5 degrees tolerance
    },
  };
}

/**
 * Validate if a measured angle is within acceptable range for the exercise
 */
export function isAngleWithinRange(
  exercise: 'squat' | 'pushup' | 'plank',
  measuredAngle: number,
  userCalibration?: CalibrationData
): { isValid: boolean; score: number; feedback: string } {
  const config = getExerciseConfig(userCalibration);
  
  switch (exercise) {
    case 'squat': {
      const ideal = config.squat.idealDepthAngle;
      const min = config.squat.minDepthAngle;
      const tolerance = 10;
      
      if (measuredAngle < min) {
        return {
          isValid: false,
          score: 0,
          feedback: 'Not deep enough - go lower for a valid squat'
        };
      }
      
      if (measuredAngle > ideal + tolerance) {
        return {
          isValid: false,
          score: 0.3,
          feedback: 'Too shallow - aim for deeper squats'
        };
      }
      
      const distance = Math.abs(measuredAngle - ideal);
      const score = Math.max(0, 1 - (distance / tolerance));
      
      return {
        isValid: true,
        score,
        feedback: distance < 5 ? 'Perfect depth!' : 'Good depth, keep it up!'
      };
    }
    
    case 'pushup': {
      const ideal = config.pushup.idealElbowAngle;
      const min = config.pushup.minElbowAngle;
      const tolerance = 10;
      
      if (measuredAngle < min) {
        return {
          isValid: false,
          score: 0,
          feedback: 'Not deep enough - go lower for a valid push-up'
        };
      }
      
      if (measuredAngle > ideal + tolerance) {
        return {
          isValid: false,
          score: 0.3,
          feedback: 'Too shallow - aim for deeper push-ups'
        };
      }
      
      const distance = Math.abs(measuredAngle - ideal);
      const score = Math.max(0, 1 - (distance / tolerance));
      
      return {
        isValid: true,
        score,
        feedback: distance < 5 ? 'Perfect depth!' : 'Good depth, keep it up!'
      };
    }
    
    case 'plank': {
      const ideal = config.plank.idealHipAngle;
      const min = config.plank.minHipAngle;
      const tolerance = 5;
      
      if (measuredAngle < min) {
        return {
          isValid: false,
          score: 0.2,
          feedback: 'Hips too low - raise your hips for better alignment'
        };
      }
      
      if (measuredAngle > ideal + tolerance) {
        return {
          isValid: false,
          score: 0.2,
          feedback: 'Hips too high - lower your hips for better alignment'
        };
      }
      
      const distance = Math.abs(measuredAngle - ideal);
      const score = Math.max(0, 1 - (distance / tolerance));
      
      return {
        isValid: true,
        score,
        feedback: distance < 2 ? 'Perfect alignment!' : 'Good alignment, keep it up!'
      };
    }
    
    default:
      return {
        isValid: false,
        score: 0,
        feedback: 'Unknown exercise'
      };
  }
}

/**
 * Get calibration status for a user
 */
export function getCalibrationStatus(calibration?: DeviceCalibration | null): {
  isCalibrated: boolean;
  completedSteps: string[];
  missingSteps: string[];
  lastCalibrated?: Date;
} {
  if (!calibration) {
    return {
      isCalibrated: false,
      completedSteps: [],
      missingSteps: ['squat', 'pushup', 'plank'],
    };
  }
  
  const completedSteps: string[] = [];
  const missingSteps: string[] = [];
  
  if (calibration.squat_full_depth_angle !== null && calibration.squat_full_depth_angle !== undefined) {
    completedSteps.push('squat');
  } else {
    missingSteps.push('squat');
  }
  
  if (calibration.pushup_elbow_bottom_angle !== null && calibration.pushup_elbow_bottom_angle !== undefined) {
    completedSteps.push('pushup');
  } else {
    missingSteps.push('pushup');
  }
  
  if (calibration.bodyline_target !== null && calibration.bodyline_target !== undefined) {
    completedSteps.push('plank');
  } else {
    missingSteps.push('plank');
  }
  
  return {
    isCalibrated: completedSteps.length === 3,
    completedSteps,
    missingSteps,
    lastCalibrated: new Date(calibration.updated_at),
  };
}
