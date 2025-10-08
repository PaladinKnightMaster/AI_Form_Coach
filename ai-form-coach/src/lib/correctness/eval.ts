import { RepMetric, FormError } from '../validators/types';

export interface CorrectnessResult {
  is_correct: boolean;
  confidence: number;
  errors: string[];
}

export interface RepTrace {
  repMetric: RepMetric;
  frameCount: number;
  validFrameCount: number;
  mandatoryPhases: string[];
  criticalErrors: FormError[];
  allErrors: FormError[];
}

/**
 * Evaluates the correctness of a completed rep based on form analysis
 * 
 * @param trace - The rep trace containing all analysis data
 * @returns Correctness evaluation result
 */
export function finalizeRepEval(trace: RepTrace): CorrectnessResult {
  const { repMetric, frameCount, validFrameCount, criticalErrors, allErrors } = trace;
  
  // Calculate valid frame percentage in mandatory phases
  const validFramePercentage = frameCount > 0 ? (validFrameCount / frameCount) * 100 : 0;
  
  // Check if rep meets minimum valid frame threshold (≥80%)
  const meetsValidFrameThreshold = validFramePercentage >= 80;
  
  // Check for critical errors that persisted beyond threshold
  const hasCriticalErrors = criticalErrors.some(error => 
    error.duration >= getCriticalErrorThreshold(error.type)
  );
  
  // Determine if rep is correct
  const is_correct = meetsValidFrameThreshold && !hasCriticalErrors;
  
  // Calculate confidence based on error time vs rep time
  const confidence = calculateConfidence(repMetric, allErrors);
  
  // Extract error types for display
  const errors = extractErrorTypes(allErrors);
  
  return {
    is_correct,
    confidence: Math.max(0, Math.min(1, confidence)), // Clamp to 0-1
    errors
  };
}

/**
 * Calculate confidence score based on error time vs rep time
 * confidence = 1 - (weighted error time / rep time)
 */
function calculateConfidence(repMetric: RepMetric, errors: FormError[]): number {
  if (!repMetric.duration || repMetric.duration <= 0) {
    return 0;
  }
  
  // Calculate weighted error time
  const weightedErrorTime = errors.reduce((total, error) => {
    const weight = getErrorWeight(error.type);
    return total + (error.duration * weight);
  }, 0);
  
  // Calculate confidence: 1 - (weighted error time / rep time)
  const confidence = 1 - (weightedErrorTime / repMetric.duration);
  
  return confidence;
}

/**
 * Get critical error threshold duration for different error types
 */
function getCriticalErrorThreshold(errorType: string): number {
  const thresholds: Record<string, number> = {
    // Critical errors that should fail the rep
    'depth_low': 200,        // 200ms of low depth
    'knee_valgus': 150,      // 150ms of knee valgus
    'chest_drop': 100,       // 100ms of chest drop
    'hip_sag': 300,          // 300ms of hip sag
    'bodyline_poor': 200,    // 200ms of poor body line
    
    // Non-critical errors (don't fail the rep)
    'tempo_fast': 0,         // Tempo errors don't fail the rep
    'tempo_slow': 0,         // Tempo errors don't fail the rep
  };
  
  return thresholds[errorType] || 0;
}

/**
 * Get error weight for confidence calculation
 */
function getErrorWeight(errorType: string): number {
  const weights: Record<string, number> = {
    // High impact errors
    'depth_low': 0.8,
    'knee_valgus': 0.7,
    'chest_drop': 0.6,
    'hip_sag': 0.5,
    'bodyline_poor': 0.4,
    
    // Lower impact errors
    'tempo_fast': 0.1,
    'tempo_slow': 0.1,
  };
  
  return weights[errorType] || 0.2;
}

/**
 * Extract unique error types from error list
 */
function extractErrorTypes(errors: FormError[]): string[] {
  const errorTypes = new Set<string>();
  
  errors.forEach(error => {
    if (error.duration >= getCriticalErrorThreshold(error.type)) {
      errorTypes.add(error.type);
    }
  });
  
  return Array.from(errorTypes);
}

/**
 * Create a rep trace from validator state and rep metric
 */
export function createRepTrace(
  repMetric: RepMetric,
  frameCount: number,
  validFrameCount: number,
  mandatoryPhases: string[] = ['down', 'up']
): RepTrace {
  // Separate critical and non-critical errors
  const criticalErrors: FormError[] = [];
  const allErrors: FormError[] = [];
  
  if (repMetric.errors) {
    repMetric.errors.forEach(error => {
      allErrors.push(error);
      
      // Check if this is a critical error
      const threshold = getCriticalErrorThreshold(error.type);
      if (threshold > 0 && error.duration >= threshold) {
        criticalErrors.push(error);
      }
    });
  }
  
  return {
    repMetric,
    frameCount,
    validFrameCount,
    mandatoryPhases,
    criticalErrors,
    allErrors
  };
}

/**
 * Get the top 2 most significant errors for display
 */
export function getTopErrors(errors: FormError[], limit: number = 2): FormError[] {
  return errors
    .filter(error => error.duration >= getCriticalErrorThreshold(error.type))
    .sort((a, b) => {
      // Sort by severity first, then by duration
      const severityA = getErrorSeverity(a.type);
      const severityB = getErrorSeverity(b.type);
      
      if (severityA !== severityB) {
        return severityB - severityA; // Higher severity first
      }
      
      return b.duration - a.duration; // Longer duration first
    })
    .slice(0, limit);
}

/**
 * Get error severity for sorting (higher = more severe)
 */
function getErrorSeverity(errorType: string): number {
  const severities: Record<string, number> = {
    'depth_low': 4,
    'knee_valgus': 4,
    'chest_drop': 3,
    'hip_sag': 3,
    'bodyline_poor': 2,
    'tempo_fast': 1,
    'tempo_slow': 1,
  };
  
  return severities[errorType] || 1;
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: FormError): string {
  const errorMessages: Record<string, string> = {
    'depth_low': 'Insufficient depth',
    'knee_valgus': 'Knee collapse',
    'chest_drop': 'Chest dropped',
    'hip_sag': 'Hip sagging',
    'bodyline_poor': 'Poor alignment',
    'tempo_fast': 'Too fast',
    'tempo_slow': 'Too slow',
  };
  
  return errorMessages[error.type] || error.type;
}
