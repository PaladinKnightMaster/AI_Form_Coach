/**
 * Mentor Cue Integration
 * 
 * Provides integration utilities for validators to use the mentor cue system
 */

import { nextCue, createCueContext, initializeMentor, getCueText } from './mentor';
import type { ValidatorState, FormError, ValidatorConfig } from '../validators/types';
import type { PoseEstimateResult } from '../pose/engine';

let mentorInitialized = false;

/**
 * Initialize mentor system if not already done
 */
async function ensureMentorInitialized(): Promise<void> {
  if (!mentorInitialized) {
    await initializeMentor();
    mentorInitialized = true;
  }
}

/**
 * Process mentor cues for a validator state
 */
export async function processMentorCues(
  state: ValidatorState,
  frameErrors: FormError[],
  config: ValidatorConfig
): Promise<ValidatorState> {
  // Ensure mentor is initialized
  await ensureMentorInitialized();
  
  // Check if mentor cues are enabled
  if (!config.mentorCues?.enabled) {
    return state;
  }
  
  // If detailed coaching is disabled, only show critical cues (severity 4-5)
  const shouldFilterCues = !config.mentorCues?.detailedCoaching;
  
  const now = performance.now();
  
  // Filter frame errors based on detailed coaching setting
  const filteredFrameErrors = shouldFilterCues 
    ? frameErrors.filter(error => {
        const cue = getCueText(error.type);
        return cue && cue.severity >= 4; // Only critical cues (severity 4-5)
      })
    : frameErrors;
  
  // Create cue context
  const cueContext = createCueContext(
    filteredFrameErrors,
    state.phase,
    state.metrics,
    now,
    state.lastCueTime,
    state.lastCueKey
  );
  
  // Get next cue
  const cueResult = nextCue(cueContext);
  
  // Update state with mentor cue information
  const updatedState: ValidatorState = {
    ...state,
    lastCueTime: cueResult.cue ? now : state.lastCueTime,
    lastCueKey: cueResult.cue?.key || state.lastCueKey
  };
  
  // Add mentor cue if we have one
  if (cueResult.cue) {
    updatedState.mentorCue = {
      key: cueResult.cue.key,
      text: cueResult.cue.short,
      severity: cueResult.cue.severity,
      shouldSpeak: cueResult.shouldSpeak && (config.mentorCues?.voiceEnabled ?? true)
    };
    
    // Add to cues array for backward compatibility
    updatedState.cues = [cueResult.cue.short, ...state.cues.slice(0, 2)]; // Keep top 3 cues
  } else {
    // Clear mentor cue if no new cue
    updatedState.mentorCue = undefined;
  }
  
  return updatedState;
}

/**
 * Get mentor cue configuration defaults
 */
export function getDefaultMentorConfig(): ValidatorConfig['mentorCues'] {
  return {
    enabled: true,
    voiceEnabled: true,
    detailedCoaching: true,
    cooldownMs: 3000,
    phaseCooldowns: {
      down: 2000,
      up: 1000,
      hold: 3000,
      idle: 5000
    }
  };
}

/**
 * Create a mentor-aware validator wrapper
 */
export function withMentorCues<T extends ValidatorState>(
  validator: (result: PoseEstimateResult | null, timestamp: number, config?: ValidatorConfig) => T | Promise<T>
) {
  return async (
    result: PoseEstimateResult | null, 
    timestamp: number, 
    config?: ValidatorConfig
  ): Promise<T> => {
    // Run the original validator
    const state = await validator(result, timestamp, config);
    
    // Extract frame errors from the result or state
    const frameErrors = extractFrameErrors(result, state);
    
    // Process mentor cues if config is provided
    if (config) {
      const updatedState = await processMentorCues(state, frameErrors, config);
      return updatedState as T;
    }
    
    return state;
  };
}

/**
 * Extract frame errors from pose result or validator state
 */
function extractFrameErrors(result: PoseEstimateResult | null, state: ValidatorState): FormError[] {
  // Try to get errors from the current rep
  if (state.currentRep?.errorHistory) {
    return state.currentRep.errorHistory;
  }
  
  // Try to get errors from the latest metric
  if (state.metrics.length > 0) {
    const latestMetric = state.metrics[state.metrics.length - 1];
    return latestMetric.errors || [];
  }
  
  // Fallback to empty array
  return [];
}

/**
 * Get cue severity color for UI
 */
export function getCueSeverityColor(severity: number): string {
  switch (severity) {
    case 5: return 'bg-red-100 text-red-800 border-red-200'; // Critical
    case 4: return 'bg-orange-100 text-orange-800 border-orange-200'; // High
    case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Medium
    case 2: return 'bg-blue-100 text-blue-800 border-blue-200'; // Low
    case 1: return 'bg-green-100 text-green-800 border-green-200'; // Positive
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get cue severity icon
 */
export function getCueSeverityIcon(severity: number): string {
  switch (severity) {
    case 5: return '🚨'; // Critical
    case 4: return '⚠️'; // High
    case 3: return '⚡'; // Medium
    case 2: return '💡'; // Low
    case 1: return '✅'; // Positive
    default: return '💬';
  }
}
