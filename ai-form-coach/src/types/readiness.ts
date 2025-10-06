/**
 * Readiness Type Definitions
 * 
 * This file centralizes all readiness-related types to ensure consistency
 * across the application and avoid duplication.
 */

import type { ReadinessAssessment, ReadinessData } from '@/lib/progression/engine';

/**
 * Database record format (snake_case matching PostgreSQL schema)
 * This is the exact format returned by the readiness_day table API
 */
export interface ReadinessDataDB {
  id: string;
  user_id: string;
  date: string;
  
  // Manual assessment inputs (0-10 scale)
  soreness_level: number;
  fatigue_level: number;
  sleep_quality: number;
  stress_level: number;
  motivation_level: number;
  
  // Health data inputs (optional)
  sleep_duration?: number;          // hours
  resting_heart_rate?: number;      // bpm
  hrv_average?: number;             // ms
  step_count?: number;
  training_load?: number;
  
  // Computed fields (calculated by database functions)
  computed_readiness: number;       // 0-1 scale
  readiness_category: 'poor' | 'fair' | 'good' | 'excellent';
  
  // Metadata
  data_sources?: string[];
  last_updated?: string;
  created_at: string;
}

/**
 * API request format for creating/updating readiness
 */
export interface ReadinessAPIRequest {
  date: string;
  soreness_level: number;
  fatigue_level: number;
  sleep_quality: number;
  stress_level: number;
  motivation_level: number;
  sleep_duration?: number;
  resting_heart_rate?: number;
  hrv_average?: number;
  step_count?: number;
  training_load?: number;
  data_sources?: string[];
}

/**
 * API response format
 */
export interface ReadinessAPIResponse {
  success: boolean;
  readiness: ReadinessDataDB;
}

/**
 * Utility function to convert camelCase ReadinessAssessment to snake_case API format
 */
export function toAPIRequest(
  assessment: ReadinessAssessment,
  healthData?: {
    sleepDuration?: number;
    restingHeartRate?: number;
    hrv?: number;
    stepCount?: number;
    trainingLoad?: number;
  }
): ReadinessAPIRequest {
  return {
    date: assessment.assessmentDate.toISOString().split('T')[0],
    soreness_level: assessment.sorenessLevel,
    fatigue_level: assessment.fatigueLevel,
    sleep_quality: assessment.sleepQuality,
    stress_level: assessment.stressLevel,
    motivation_level: assessment.motivationLevel,
    ...(healthData && {
      sleep_duration: healthData.sleepDuration,
      resting_heart_rate: healthData.restingHeartRate,
      hrv_average: healthData.hrv,
      step_count: healthData.stepCount,
      training_load: healthData.trainingLoad
    })
  };
}

/**
 * Utility function to convert snake_case DB format to camelCase ReadinessAssessment
 */
export function fromDBRecord(record: ReadinessDataDB): ReadinessAssessment {
  return {
    sorenessLevel: record.soreness_level,
    fatigueLevel: record.fatigue_level,
    sleepQuality: record.sleep_quality,
    stressLevel: record.stress_level,
    motivationLevel: record.motivation_level,
    assessmentDate: new Date(record.date)
  };
}

/**
 * Utility function to convert snake_case DB format to camelCase ReadinessData
 */
export function fromDBRecordFull(record: ReadinessDataDB): ReadinessData {
  return {
    ...fromDBRecord(record),
    id: record.id,
    userId: record.user_id,
    date: record.date,
    sleepDuration: record.sleep_duration,
    restingHeartRate: record.resting_heart_rate,
    hrvAverage: record.hrv_average,
    stepCount: record.step_count,
    trainingLoad: record.training_load,
    computedReadiness: record.computed_readiness,
    readinessCategory: record.readiness_category,
    dataSources: record.data_sources,
    lastUpdated: record.last_updated ? new Date(record.last_updated) : undefined,
    createdAt: new Date(record.created_at)
  };
}

// Re-export the main types for convenience
export type { ReadinessAssessment, ReadinessData } from '@/lib/progression/engine';

