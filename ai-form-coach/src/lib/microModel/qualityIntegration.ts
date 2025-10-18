/**
 * Quality Integration
 * 
 * This module integrates the hybrid quality scorer into the existing
 * validation system, providing a drop-in replacement for calculateRepQuality.
 */

import type { RepMetric, FormError } from '@/lib/validators/types';
import type { SessionContext } from './hybridQualityScorer';
import { getHybridQualityScorer } from './hybridQualityScorer';
import { calculateRepQuality } from '@/lib/validators/formAnalysis';

/**
 * Enhanced quality calculation that uses hybrid scoring when enabled
 */
export async function calculateHybridRepQuality(
  errors: FormError[],
  duration: number,
  exercise: 'squat' | 'pushup' | 'plank',
  exerciseMetrics?: RepMetric['squat'] | RepMetric['pushup'] | RepMetric['plank'],
  sessionContext?: SessionContext
): Promise<{ score: number; quality: 'excellent' | 'good' | 'fair' | 'poor' }> {
  // Get the hybrid quality scorer
  const scorer = getHybridQualityScorer();
  
  // Check if micro model is enabled
  if (!scorer.isModelEnabled() || !sessionContext) {
    // Fallback to traditional rule-based scoring
    return calculateRepQuality(errors, duration, exercise, exerciseMetrics);
  }

  try {
    // Create a mock RepMetric for the hybrid scorer
    const mockRep: RepMetric = {
      startTs: 0,
      endTs: duration,
      duration,
      tempo: 'normal', // Will be calculated properly in the scorer
      errors,
      quality: 'fair', // Placeholder
      score: 0, // Will be calculated
      ...(exercise === 'squat' && exerciseMetrics && 'depth' in exerciseMetrics && { squat: exerciseMetrics as RepMetric['squat'] }),
      ...(exercise === 'pushup' && exerciseMetrics && 'elbowAngle' in exerciseMetrics && { pushup: exerciseMetrics as RepMetric['pushup'] }),
      ...(exercise === 'plank' && exerciseMetrics && 'bodyLine' in exerciseMetrics && { plank: exerciseMetrics as RepMetric['plank'] })
    };

    // Calculate hybrid quality
    const result = await scorer.calculateQuality(mockRep, sessionContext);
    
    return {
      score: result.finalScore,
      quality: result.quality
    };
  } catch (error) {
    console.warn('Hybrid quality calculation failed, falling back to rules:', error);
    // Fallback to traditional rule-based scoring
    return calculateRepQuality(errors, duration, exercise, exerciseMetrics);
  }
}

/**
 * Synchronous version for backward compatibility
 * Uses traditional rule-based scoring only
 */
export function calculateRepQualitySync(
  errors: FormError[],
  duration: number,
  exercise: 'squat' | 'pushup' | 'plank',
  exerciseMetrics?: RepMetric['squat'] | RepMetric['pushup'] | RepMetric['plank']
): { score: number; quality: 'excellent' | 'good' | 'fair' | 'poor' } {
  return calculateRepQuality(errors, duration, exercise, exerciseMetrics);
}

/**
 * Check if micro model is enabled from localStorage
 */
export function isMicroModelEnabled(): boolean {
  try {
    return localStorage.getItem('microModelEnabled') === 'true';
  } catch {
    return false;
  }
}

/**
 * Get micro model configuration from localStorage
 */
export function getMicroModelConfig(): { enabled: boolean } {
  return {
    enabled: isMicroModelEnabled()
  };
}

/**
 * Initialize the hybrid quality scorer with user settings
 */
export async function initializeQualityScorer(): Promise<void> {
  try {
    const config = getMicroModelConfig();
    const scorer = getHybridQualityScorer();
    scorer.setModelEnabled(config.enabled);
    await scorer.initialize();
  } catch (error) {
    console.warn('Failed to initialize quality scorer:', error);
  }
}
