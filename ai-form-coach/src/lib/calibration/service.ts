/**
 * Calibration Service
 * 
 * Handles database operations for device calibration data.
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import type { 
  DeviceCalibration, 
  CalibrationData, 
  CalibrationResult
} from '@/types/calibration';
import { validateCalibrationData } from '@/types/calibration';

/**
 * Generate a device ID based on browser fingerprint
 */
export function generateDeviceId(): string {
  // Simple device fingerprinting based on available browser features
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 2, 2);
  const canvasFingerprint = canvas.toDataURL();
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvasFingerprint.slice(-20), // Last 20 chars of canvas fingerprint
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Get user's calibration data
 */
export async function getUserCalibration(): Promise<DeviceCalibration | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    const deviceId = generateDeviceId();
    
    const { data, error } = await supabase
      .from('device_calibration')
      .select('*')
      .eq('user_id', user.id)
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching calibration data:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserCalibration:', error);
    return null;
  }
}

/**
 * Save user's calibration data
 */
export async function saveUserCalibration(
  calibrationData: CalibrationData
): Promise<CalibrationResult> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        stepResults: {} as CalibrationResult['stepResults'],
      };
    }
    
    // Validate calibration data
    const validation = validateCalibrationData(calibrationData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        stepResults: {} as CalibrationResult['stepResults'],
      };
    }
    
    const deviceId = generateDeviceId();
    
    // Check if calibration already exists
    const { data: existing } = await supabase
      .from('device_calibration')
      .select('id')
      .eq('user_id', user.id)
      .eq('device_id', deviceId)
      .single();
    
    const calibrationRecord = {
      user_id: user.id,
      device_id: deviceId,
      squat_full_depth_angle: calibrationData.squat_full_depth_angle,
      pushup_elbow_bottom_angle: calibrationData.pushup_elbow_bottom_angle,
      bodyline_target: calibrationData.bodyline_target,
      calibration_version: 1,
      is_active: true,
    };
    
    let result;
    if (existing) {
      // Update existing calibration
      result = await supabase
        .from('device_calibration')
        .update(calibrationRecord)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new calibration
      result = await supabase
        .from('device_calibration')
        .insert(calibrationRecord)
        .select()
        .single();
    }
    
    if (result.error) {
      console.error('Error saving calibration data:', result.error);
      return {
        success: false,
        error: 'Failed to save calibration data',
        stepResults: {} as CalibrationResult['stepResults'],
      };
    }
    
    return {
      success: true,
      data: calibrationData,
      stepResults: {
        squat_full_depth_angle: {
          collectedValues: [calibrationData.squat_full_depth_angle!],
          finalValue: calibrationData.squat_full_depth_angle!,
          isValid: true,
        },
        pushup_elbow_bottom_angle: {
          collectedValues: [calibrationData.pushup_elbow_bottom_angle!],
          finalValue: calibrationData.pushup_elbow_bottom_angle!,
          isValid: true,
        },
        bodyline_target: {
          collectedValues: [calibrationData.bodyline_target!],
          finalValue: calibrationData.bodyline_target!,
          isValid: true,
        },
      },
    };
  } catch (error) {
    console.error('Error in saveUserCalibration:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      stepResults: {} as CalibrationResult['stepResults'],
    };
  }
}

/**
 * Clear user's calibration data
 */
export async function clearUserCalibration(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    const deviceId = generateDeviceId();
    
    const { error } = await supabase
      .from('device_calibration')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('device_id', deviceId);
    
    if (error) {
      console.error('Error clearing calibration data:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in clearUserCalibration:', error);
    return false;
  }
}

/**
 * Get calibration status for the current user
 */
export async function getCalibrationStatus(): Promise<{
  isCalibrated: boolean;
  completedSteps: string[];
  missingSteps: string[];
  lastCalibrated?: Date;
}> {
  const calibration = await getUserCalibration();
  
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
