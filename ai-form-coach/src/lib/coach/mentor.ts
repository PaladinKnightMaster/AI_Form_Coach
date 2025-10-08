/**
 * Mentor Cue System
 * 
 * Provides intelligent, prioritized coaching cues with cooldown management
 * to reduce cue spam and keep coaching actionable.
 */

import type { FormError, RepMetric, Phase } from '../validators/types';

export interface CoachCue {
  key: string;
  severity: number; // 1-5, where 5 is critical
  short: string;
  long?: string;
}

export interface CueContext {
  frameErrors: FormError[];
  phase: Phase;
  metrics: RepMetric[];
  now: number;
  lastCueTime: number;
  lastCueKey?: string;
  errorFreeDuration: number; // milliseconds since last error
  tempoInRange: boolean;
}

export interface CueResult {
  cue?: CoachCue;
  shouldSpeak: boolean;
  reason?: string;
}

// In-memory cache for coach cues
const cueCache: Map<string, CoachCue> = new Map();

// Cooldown tracking
const cooldowns = new Map<string, number>();

// Default cooldown duration (3 seconds)
const DEFAULT_COOLDOWN = 3000;

// Phase-specific cooldowns
const PHASE_COOLDOWNS = {
  down: 2000, // 2 seconds in down phases
  up: 1000,   // 1 second in up phases
  hold: 3000, // 3 seconds in hold phases
  idle: 5000  // 5 seconds in idle
};

// Positive reinforcement settings
const POSITIVE_REINFORCEMENT = {
  errorFreeDuration: 10000, // 10 seconds error-free
  tempoInRange: true,
  cooldown: 5000 // 5 seconds cooldown for positive cues
};

/**
 * Load coach cues from database or cache
 */
export async function loadCoachCues(): Promise<void> {
  if (cueCache.size > 0) return; // Already loaded
  
  try {
    // Try to load from database
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('coach_cues')
      .select('*');
    
    if (error) {
      console.warn('Failed to load coach cues from database:', error);
      // Fallback to default cues
      loadDefaultCues();
      return;
    }
    
    // Cache the cues
    data?.forEach(cue => {
      cueCache.set(cue.key, {
        key: cue.key,
        severity: cue.severity,
        short: cue.short,
        long: cue.long
      });
    });
    
    console.log(`Loaded ${cueCache.size} coach cues from database`);
  } catch (error) {
    console.warn('Failed to load coach cues:', error);
    loadDefaultCues();
  }
}

/**
 * Load default cues as fallback
 */
function loadDefaultCues(): void {
  const defaultCues: CoachCue[] = [
    { key: 'knees_out', severity: 4, short: 'Knees out', long: 'Push your knees out to maintain proper alignment' },
    { key: 'go_deeper', severity: 3, short: 'Go deeper', long: 'Lower your body more to achieve full range of motion' },
    { key: 'chest_up', severity: 3, short: 'Chest up', long: 'Keep your chest up and maintain a proud posture' },
    { key: 'body_straight', severity: 4, short: 'Body straight', long: 'Maintain a straight body line from head to heels' },
    { key: 'pace_up', severity: 2, short: 'Faster pace', long: 'Increase your tempo slightly for better rhythm' },
    { key: 'pace_down', severity: 2, short: 'Slower pace', long: 'Slow down your tempo for better control' },
    { key: 'nice_tempo', severity: 1, short: 'Nice tempo!', long: 'Great rhythm and control - keep it up!' },
    { key: 'depth_low', severity: 4, short: 'Need more depth', long: 'You need to go deeper to complete the full range of motion' },
    { key: 'knee_valgus', severity: 5, short: 'Knees collapsing', long: 'Your knees are collapsing inward - push them out' },
    { key: 'chest_drop', severity: 4, short: 'Chest dropping', long: 'Keep your chest up and maintain proper posture' },
    { key: 'hip_sag', severity: 3, short: 'Hips sagging', long: 'Keep your hips up and maintain body alignment' },
    { key: 'bodyline_poor', severity: 3, short: 'Poor alignment', long: 'Maintain a straight body line throughout the movement' },
    { key: 'tempo_fast', severity: 2, short: 'Too fast', long: 'Slow down for better control and form' },
    { key: 'tempo_slow', severity: 2, short: 'Too slow', long: 'Pick up the pace slightly for better rhythm' }
  ];
  
  defaultCues.forEach(cue => {
    cueCache.set(cue.key, cue);
  });
  
  console.log(`Loaded ${defaultCues.length} default coach cues`);
}

/**
 * Get cue text by key
 */
export function getCueText(key: string): CoachCue | undefined {
  return cueCache.get(key);
}

/**
 * Determine the next cue to display based on current context
 */
export function nextCue(context: CueContext): CueResult {
  const { frameErrors, phase, now, lastCueTime } = context;
  
  // Check if we should give a positive reinforcement cue
  if (shouldGivePositiveCue(context)) {
    const positiveCue = getCueText('nice_tempo');
    if (positiveCue && !isOnCooldown('nice_tempo', now)) {
      setCooldown('nice_tempo', now, POSITIVE_REINFORCEMENT.cooldown);
      return {
        cue: positiveCue,
        shouldSpeak: true,
        reason: 'positive_reinforcement'
      };
    }
  }
  
  // Check phase-specific cooldown
  const phaseCooldown = PHASE_COOLDOWNS[phase] || DEFAULT_COOLDOWN;
  if (now - lastCueTime < phaseCooldown) {
    return {
      shouldSpeak: false,
      reason: 'phase_cooldown'
    };
  }
  
  // Find the highest priority error that's not on cooldown
  const priorityErrors = frameErrors
    .filter(error => !isOnCooldown(error.type, now))
    .sort((a, b) => getErrorSeverity(b.type) - getErrorSeverity(a.type));
  
  if (priorityErrors.length === 0) {
    return {
      shouldSpeak: false,
      reason: 'no_errors'
    };
  }
  
  // Get the highest priority error
  const topError = priorityErrors[0];
  const cue = getCueText(topError.type);
  
  if (!cue) {
    return {
      shouldSpeak: false,
      reason: 'no_cue_found'
    };
  }
  
  // Set cooldown for this cue
  setCooldown(topError.type, now, DEFAULT_COOLDOWN);
  
  return {
    cue,
    shouldSpeak: true,
    reason: 'error_based'
  };
}

/**
 * Check if we should give a positive reinforcement cue
 */
function shouldGivePositiveCue(context: CueContext): boolean {
  const { errorFreeDuration, tempoInRange, now, lastCueKey } = context;
  
  // Don't give positive cues too frequently
  if (lastCueKey === 'nice_tempo' && !isOnCooldown('nice_tempo', now)) {
    return false;
  }
  
  // Check if conditions are met for positive reinforcement
  return errorFreeDuration >= POSITIVE_REINFORCEMENT.errorFreeDuration && 
         tempoInRange;
}

/**
 * Check if a cue is on cooldown
 */
function isOnCooldown(cueKey: string, now: number): boolean {
  const cooldownEnd = cooldowns.get(cueKey);
  return cooldownEnd ? now < cooldownEnd : false;
}

/**
 * Set cooldown for a cue
 */
function setCooldown(cueKey: string, now: number, duration: number): void {
  cooldowns.set(cueKey, now + duration);
}

/**
 * Get error severity for prioritization
 */
function getErrorSeverity(errorType: string): number {
  const severityMap: Record<string, number> = {
    'knee_valgus': 5,    // Critical
    'depth_low': 4,      // High
    'chest_drop': 4,     // High
    'body_straight': 4,  // High
    'knees_out': 4,      // High
    'hip_sag': 3,        // Medium
    'bodyline_poor': 3,  // Medium
    'go_deeper': 3,      // Medium
    'chest_up': 3,       // Medium
    'tempo_fast': 2,     // Low
    'tempo_slow': 2,     // Low
    'pace_up': 2,        // Low
    'pace_down': 2       // Low
  };
  
  return severityMap[errorType] || 1;
}

/**
 * Clear all cooldowns (useful for testing or session reset)
 */
export function clearCooldowns(): void {
  cooldowns.clear();
}

/**
 * Get current cooldown status for debugging
 */
export function getCooldownStatus(now: number): Record<string, number> {
  const status: Record<string, number> = {};
  
  cooldowns.forEach((endTime, key) => {
    const remaining = Math.max(0, endTime - now);
    if (remaining > 0) {
      status[key] = remaining;
    }
  });
  
  return status;
}

/**
 * Initialize the mentor system
 */
export async function initializeMentor(): Promise<void> {
  await loadCoachCues();
  clearCooldowns();
}

/**
 * Create cue context from validator state
 */
export function createCueContext(
  frameErrors: FormError[],
  phase: Phase,
  metrics: RepMetric[],
  now: number,
  lastCueTime: number = 0,
  lastCueKey?: string
): CueContext {
  // Calculate error-free duration
  const errorFreeDuration = frameErrors.length === 0 ? 
    (now - (metrics[metrics.length - 1]?.startTs || now)) : 0;
  
  // Check if tempo is in range (0.6s - 2.5s)
  const latestMetric = metrics[metrics.length - 1];
  const tempoInRange = latestMetric ? 
    latestMetric.duration >= 600 && latestMetric.duration <= 2500 : false;
  
  return {
    frameErrors,
    phase,
    metrics,
    now,
    lastCueTime,
    lastCueKey,
    errorFreeDuration,
    tempoInRange
  };
}
