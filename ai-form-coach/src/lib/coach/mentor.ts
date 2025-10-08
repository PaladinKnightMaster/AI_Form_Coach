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

// Enhanced cooldown tracking with per-cue cooldowns
const cooldowns = new Map<string, number>();

// Default cooldown duration (3 seconds)
const DEFAULT_COOLDOWN = 3000;

// Per-cue cooldown overrides (in milliseconds)
const CUE_COOLDOWNS: Record<string, number> = {
  // Critical cues - shorter cooldown for safety
  'knee_valgus': 2000,
  'back_rounding': 2000,
  'excessive_forward_lean': 2000,
  
  // High priority cues - standard cooldown
  'knees_out': 3000,
  'depth_low': 3000,
  'chest_drop': 3000,
  'body_straight': 3000,
  'core_engaged': 3000,
  'weight_heels': 3000,
  
  // Medium priority cues - slightly longer cooldown
  'go_deeper': 4000,
  'chest_up': 4000,
  'hip_sag': 4000,
  'bodyline_poor': 4000,
  'shoulders_back': 4000,
  'head_neutral': 4000,
  'breathing_control': 4000,
  
  // Low priority cues - longer cooldown to avoid spam
  'tempo_fast': 5000,
  'tempo_slow': 5000,
  'pace_up': 5000,
  'pace_down': 5000,
  'smooth_movement': 5000,
  'consistent_tempo': 5000,
  
  // Positive cues - longer cooldown to keep them special
  'nice_tempo': 8000,
  'perfect_form': 8000,
  'great_depth': 8000,
  'solid_control': 8000,
  'keep_going': 8000,
  'excellent_alignment': 8000,
  'strong_core': 8000,
  'smooth_rhythm': 8000
};

// Phase-specific cooldowns (minimum time between any cues in this phase)
const PHASE_COOLDOWNS = {
  down: 2000, // 2 seconds in down phases - limit spam during critical movement
  up: 1000,   // 1 second in up phases - allow more feedback during ascent
  hold: 3000, // 3 seconds in hold phases - reduce noise during static holds
  idle: 5000  // 5 seconds in idle - minimal feedback when not moving
};

// Enhanced positive reinforcement settings
const POSITIVE_REINFORCEMENT = {
  errorFreeDuration: 10000, // 10 seconds error-free
  tempoInRange: true,
  cooldown: 8000, // 8 seconds cooldown for positive cues
  minRepsForPositive: 2, // Need at least 2 good reps before positive feedback
  positiveCueVariations: [
    'nice_tempo',
    'perfect_form', 
    'great_depth',
    'solid_control',
    'excellent_alignment',
    'strong_core',
    'smooth_rhythm'
  ]
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
 * Load default cues as fallback (Mentor Cues 2.0)
 */
function loadDefaultCues(): void {
  const defaultCues: CoachCue[] = [
    // Critical cues (severity 5) - Safety issues
    { key: 'knee_valgus', severity: 5, short: 'Knees collapsing', long: 'Your knees are collapsing inward - push them out to prevent injury' },
    { key: 'back_rounding', severity: 5, short: 'Back rounding', long: 'Keep your back straight - rounding can cause injury' },
    { key: 'excessive_forward_lean', severity: 5, short: 'Too far forward', long: 'Bring your chest up - you are leaning too far forward' },
    
    // High priority cues (severity 4) - Form corrections
    { key: 'knees_out', severity: 4, short: 'Knees out', long: 'Push your knees out to maintain proper alignment' },
    { key: 'depth_low', severity: 4, short: 'Need more depth', long: 'Go deeper to complete the full range of motion' },
    { key: 'chest_drop', severity: 4, short: 'Chest dropping', long: 'Keep your chest up and maintain proper posture' },
    { key: 'body_straight', severity: 4, short: 'Body straight', long: 'Maintain a straight body line from head to heels' },
    { key: 'core_engaged', severity: 4, short: 'Engage core', long: 'Tighten your core muscles for better stability' },
    { key: 'weight_heels', severity: 4, short: 'Weight on heels', long: 'Keep your weight on your heels, not your toes' },
    
    // Medium priority cues (severity 3) - Technique improvements
    { key: 'go_deeper', severity: 3, short: 'Go deeper', long: 'Lower your body more to achieve full range of motion' },
    { key: 'chest_up', severity: 3, short: 'Chest up', long: 'Keep your chest up and maintain a proud posture' },
    { key: 'hip_sag', severity: 3, short: 'Hips sagging', long: 'Keep your hips up and maintain body alignment' },
    { key: 'bodyline_poor', severity: 3, short: 'Poor alignment', long: 'Maintain a straight body line throughout the movement' },
    { key: 'shoulders_back', severity: 3, short: 'Shoulders back', long: 'Pull your shoulders back and down' },
    { key: 'head_neutral', severity: 3, short: 'Head neutral', long: 'Keep your head in a neutral position' },
    { key: 'breathing_control', severity: 3, short: 'Control breathing', long: 'Breathe in on the way down, out on the way up' },
    
    // Low priority cues (severity 2) - Tempo and rhythm
    { key: 'tempo_fast', severity: 2, short: 'Too fast', long: 'Slow down for better control and form' },
    { key: 'tempo_slow', severity: 2, short: 'Too slow', long: 'Pick up the pace slightly for better rhythm' },
    { key: 'pace_up', severity: 2, short: 'Faster pace', long: 'Increase your tempo slightly for better rhythm' },
    { key: 'pace_down', severity: 2, short: 'Slower pace', long: 'Slow down your tempo for better control' },
    { key: 'smooth_movement', severity: 2, short: 'Smooth movement', long: 'Make your movement more fluid and controlled' },
    { key: 'consistent_tempo', severity: 2, short: 'Consistent tempo', long: 'Keep the same pace throughout your reps' },
    
    // Positive reinforcement cues (severity 1) - Encouragement
    { key: 'nice_tempo', severity: 1, short: 'Nice tempo!', long: 'Great rhythm and control - keep it up!' },
    { key: 'perfect_form', severity: 1, short: 'Perfect form!', long: 'Excellent technique - you are doing great!' },
    { key: 'great_depth', severity: 1, short: 'Great depth!', long: 'Perfect range of motion - well done!' },
    { key: 'solid_control', severity: 1, short: 'Solid control!', long: 'Your movement control is excellent!' },
    { key: 'keep_going', severity: 1, short: 'Keep going!', long: 'You are doing great - maintain this form!' },
    { key: 'excellent_alignment', severity: 1, short: 'Excellent alignment!', long: 'Your body alignment is perfect!' },
    { key: 'strong_core', severity: 1, short: 'Strong core!', long: 'Great core engagement - keep it tight!' },
    { key: 'smooth_rhythm', severity: 1, short: 'Smooth rhythm!', long: 'Your tempo and rhythm are perfect!' }
  ];
  
  defaultCues.forEach(cue => {
    cueCache.set(cue.key, cue);
  });
  
  console.log(`Loaded ${defaultCues.length} default coach cues (Mentor Cues 2.0)`);
}

/**
 * Get cue text by key
 */
export function getCueText(key: string): CoachCue | undefined {
  return cueCache.get(key);
}

/**
 * Determine the next cue to display based on current context (Mentor Cues 2.0)
 */
export function nextCue(context: CueContext): CueResult {
  const { frameErrors, phase, now, lastCueTime } = context;
  
  // Check if we should give a positive reinforcement cue
  if (shouldGivePositiveCue(context)) {
    const positiveCue = getRandomPositiveCue();
    if (positiveCue && !isOnCooldown(positiveCue.key, now)) {
      setCooldown(positiveCue.key, now, getCueCooldown(positiveCue.key));
      return {
        cue: positiveCue,
        shouldSpeak: true,
        reason: 'positive_reinforcement'
      };
    }
  }
  
  // Check phase-specific cooldown (limit to one cue per 2s during "down" phases)
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
  
  // Set cooldown for this cue using per-cue cooldown
  setCooldown(topError.type, now, getCueCooldown(topError.type));
  
  return {
    cue,
    shouldSpeak: true,
    reason: 'error_based'
  };
}

/**
 * Check if we should give a positive reinforcement cue (Enhanced)
 */
function shouldGivePositiveCue(context: CueContext): boolean {
  const { errorFreeDuration, tempoInRange, now, lastCueKey, metrics } = context;
  
  // Don't give positive cues if we just gave one
  if (lastCueKey && POSITIVE_REINFORCEMENT.positiveCueVariations.includes(lastCueKey) && 
      !isOnCooldown(lastCueKey, now)) {
    return false;
  }
  
  // Need at least minimum reps for positive feedback
  if (metrics.length < POSITIVE_REINFORCEMENT.minRepsForPositive) {
    return false;
  }
  
  // Check if conditions are met for positive reinforcement
  return errorFreeDuration >= POSITIVE_REINFORCEMENT.errorFreeDuration && 
         tempoInRange;
}

/**
 * Get a random positive cue for variety
 */
function getRandomPositiveCue(): CoachCue | undefined {
  const availableCues = POSITIVE_REINFORCEMENT.positiveCueVariations
    .map(key => getCueText(key))
    .filter((cue): cue is CoachCue => cue !== undefined);
  
  if (availableCues.length === 0) {
    return getCueText('nice_tempo'); // Fallback
  }
  
  const randomIndex = Math.floor(Math.random() * availableCues.length);
  return availableCues[randomIndex];
}

/**
 * Get cooldown duration for a specific cue
 */
function getCueCooldown(cueKey: string): number {
  return CUE_COOLDOWNS[cueKey] || DEFAULT_COOLDOWN;
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
 * Get error severity for prioritization (Enhanced for Mentor Cues 2.0)
 */
function getErrorSeverity(errorType: string): number {
  const severityMap: Record<string, number> = {
    // Critical cues (severity 5) - Safety issues
    'knee_valgus': 5,
    'back_rounding': 5,
    'excessive_forward_lean': 5,
    
    // High priority cues (severity 4) - Form corrections
    'knees_out': 4,
    'depth_low': 4,
    'chest_drop': 4,
    'body_straight': 4,
    'core_engaged': 4,
    'weight_heels': 4,
    
    // Medium priority cues (severity 3) - Technique improvements
    'go_deeper': 3,
    'chest_up': 3,
    'hip_sag': 3,
    'bodyline_poor': 3,
    'shoulders_back': 3,
    'head_neutral': 3,
    'breathing_control': 3,
    
    // Low priority cues (severity 2) - Tempo and rhythm
    'tempo_fast': 2,
    'tempo_slow': 2,
    'pace_up': 2,
    'pace_down': 2,
    'smooth_movement': 2,
    'consistent_tempo': 2
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
