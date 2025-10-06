import type { RepMetric, Exercise } from './types';
import type { Landmark3D } from '../pose/engine';
import { angleBetween } from '../math/poseMath';

export interface FormIQMetrics {
  formIQ: number; // 0-1 score representing overall form quality
  sideBalance: number; // 0-1 score, 0.5 = perfect balance, <0.5 = left dominant, >0.5 = right dominant
  rangeOfMotion: number; // 0-1 score for ROM quality
  tempo: number; // 0-1 score for movement tempo
  stability: number; // 0-1 score for movement stability
}

export interface SideBalanceData {
  leftVisibility: number;
  rightVisibility: number;
  leftROM: number;
  rightROM: number;
  balanceScore: number; // 0-1 where 0.5 is perfect balance
}

/**
 * Calculate Form IQ score from individual rep metrics
 */
export function calculateFormIQ(
  metrics: RepMetric[],
  exercise: Exercise,
  sideBalance?: SideBalanceData
): FormIQMetrics {
  if (metrics.length === 0) {
    return {
      formIQ: 0,
      sideBalance: sideBalance?.balanceScore ?? 0.5,
      rangeOfMotion: 0,
      tempo: 0,
      stability: 0
    };
  }

  // Calculate individual component scores
  const romScore = calculateROMScore(metrics, exercise);
  const tempoScore = calculateTempoScore(metrics);
  const stabilityScore = calculateStabilityScore(metrics);
  const balanceScore = sideBalance?.balanceScore ?? 0.5;

  // Weighted Form IQ calculation
  const weights = {
    rom: 0.35,        // Range of motion is most important
    tempo: 0.25,      // Consistent tempo matters
    stability: 0.25,  // Movement stability
    balance: 0.15     // Side balance (less weight for single-sided exercises)
  };

  // Convert balance score to 0-1 where 0.5 becomes 1.0 (perfect)
  const normalizedBalance = 1 - Math.abs(balanceScore - 0.5) * 2;

  const formIQ = 
    romScore * weights.rom +
    tempoScore * weights.tempo +
    stabilityScore * weights.stability +
    normalizedBalance * weights.balance;

  return {
    formIQ: Math.max(0, Math.min(1, formIQ)),
    sideBalance: balanceScore,
    rangeOfMotion: romScore,
    tempo: tempoScore,
    stability: stabilityScore
  };
}

/**
 * Calculate Range of Motion score based on exercise-specific targets
 */
function calculateROMScore(metrics: RepMetric[], exercise: Exercise): number {
  let totalScore = 0;

  for (const metric of metrics) {
    let score = 0;
    
    if (exercise === 'squat' && metric.peakDepth !== undefined) {
      const depth = metric.peakDepth;
      const minDepth = 45;
      const idealDepth = 90;
      
      if (depth >= idealDepth) {
        score = 1.0; // Perfect depth
      } else if (depth >= minDepth) {
        score = 0.5 + (depth - minDepth) / (idealDepth - minDepth) * 0.5;
      } else {
        score = depth / minDepth * 0.5;
      }
    } else if (exercise === 'pushup' && metric.peakAngle !== undefined) {
      const angle = metric.peakAngle;
      const minAngle = 90;
      const idealAngle = 70;
      
      if (angle <= idealAngle) {
        score = 1.0; // Perfect angle
      } else if (angle <= minAngle) {
        score = 0.5 + (minAngle - angle) / (minAngle - idealAngle) * 0.5;
      } else {
        score = Math.max(0, 1 - (angle - minAngle) / 90 * 0.5);
      }
    } else if (exercise === 'plank') {
      const duration = (metric.endTs - metric.startTs) / 1000;
      const minTime = 10;
      const idealTime = 60;
      
      if (duration >= idealTime) {
        score = 1.0;
      } else if (duration >= minTime) {
        score = 0.5 + (duration - minTime) / (idealTime - minTime) * 0.5;
      } else {
        score = duration / minTime * 0.5;
      }
    }
    
    totalScore += score;
  }

  return metrics.length > 0 ? totalScore / metrics.length : 0;
}

/**
 * Calculate tempo consistency score
 */
function calculateTempoScore(metrics: RepMetric[]): number {
  if (metrics.length < 2) return 1.0; // Single rep gets perfect tempo score

  const durations = metrics.map(m => (m.endTs - m.startTs) / 1000);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  
  // Calculate coefficient of variation (lower is better)
  const variance = durations.reduce((acc, d) => acc + Math.pow(d - avgDuration, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  const cv = avgDuration > 0 ? stdDev / avgDuration : 0;

  // Convert CV to 0-1 score (lower CV = higher score)
  return Math.max(0, 1 - cv * 2);
}

/**
 * Calculate movement stability score based on ROM flags
 */
function calculateStabilityScore(metrics: RepMetric[]): number {
  if (metrics.length === 0) return 0;

  let totalFlags = 0;
	const totalReps = metrics.length;

  for (const metric of metrics) {
    totalFlags += metric.romFlags?.length ?? 0;
  }

  // Fewer ROM flags = higher stability score
  const flagsPerRep = totalFlags / totalReps;
  return Math.max(0, 1 - flagsPerRep * 0.25); // Each flag reduces score by 0.25
}

/**
 * Calculate side balance for bilateral exercises (squats, pushups)
 */
export function calculateSideBalance(
  landmarks: Landmark3D[],
  exercise: Exercise
): SideBalanceData | null {
  if (exercise === 'plank') return null; // Plank doesn't need side balance

  let leftVisibility = 0;
  let rightVisibility = 0;
  let leftROM = 0;
  let rightROM = 0;

  if (exercise === 'squat') {
    // Squat side balance using hip-knee-ankle
    const L = { HIP: 23, KNEE: 25, ANKLE: 27 };
    const R = { HIP: 24, KNEE: 26, ANKLE: 28 };

    leftVisibility = (landmarks[L.HIP]?.visibility ?? 0) + 
                    (landmarks[L.KNEE]?.visibility ?? 0) + 
                    (landmarks[L.ANKLE]?.visibility ?? 0);
    
    rightVisibility = (landmarks[R.HIP]?.visibility ?? 0) + 
                     (landmarks[R.KNEE]?.visibility ?? 0) + 
                     (landmarks[R.ANKLE]?.visibility ?? 0);

    // Calculate ROM for each side
    if (landmarks[L.HIP] && landmarks[L.KNEE] && landmarks[L.ANKLE]) {
      leftROM = 180 - angleBetween(landmarks[L.HIP], landmarks[L.KNEE], landmarks[L.ANKLE]);
    }
    if (landmarks[R.HIP] && landmarks[R.KNEE] && landmarks[R.ANKLE]) {
      rightROM = 180 - angleBetween(landmarks[R.HIP], landmarks[R.KNEE], landmarks[R.ANKLE]);
    }
  } else if (exercise === 'pushup') {
    // Pushup side balance using shoulder-elbow-wrist
    const L = { SHOULDER: 11, ELBOW: 13, WRIST: 15 };
    const R = { SHOULDER: 12, ELBOW: 14, WRIST: 16 };

    leftVisibility = (landmarks[L.SHOULDER]?.visibility ?? 0) + 
                    (landmarks[L.ELBOW]?.visibility ?? 0) + 
                    (landmarks[L.WRIST]?.visibility ?? 0);
    
    rightVisibility = (landmarks[R.SHOULDER]?.visibility ?? 0) + 
                     (landmarks[R.ELBOW]?.visibility ?? 0) + 
                     (landmarks[R.WRIST]?.visibility ?? 0);

    // Calculate ROM for each side (elbow flexion)
    if (landmarks[L.SHOULDER] && landmarks[L.ELBOW] && landmarks[L.WRIST]) {
      leftROM = 180 - angleBetween(landmarks[L.SHOULDER], landmarks[L.ELBOW], landmarks[L.WRIST]);
    }
    if (landmarks[R.SHOULDER] && landmarks[R.ELBOW] && landmarks[R.WRIST]) {
      rightROM = 180 - angleBetween(landmarks[R.SHOULDER], landmarks[R.ELBOW], landmarks[R.WRIST]);
    }
  }

  // Calculate balance score
  const visibilityBalance = leftVisibility + rightVisibility > 0 
    ? rightVisibility / (leftVisibility + rightVisibility) 
    : 0.5;

  const romBalance = leftROM + rightROM > 0 
    ? rightROM / (leftROM + rightROM) 
    : 0.5;

  // Weighted average of visibility and ROM balance
  const balanceScore = (visibilityBalance * 0.3 + romBalance * 0.7);

  return {
    leftVisibility,
    rightVisibility,
    leftROM,
    rightROM,
    balanceScore
  };
}

/**
 * Get Form IQ grade and description
 */
export function getFormIQGrade(formIQ: number): { grade: string; description: string; color: string } {
  if (formIQ >= 0.9) {
    return { 
      grade: 'A+', 
      description: 'Exceptional form! You\'re moving with perfect technique.', 
      color: 'text-green-600' 
    };
  } else if (formIQ >= 0.8) {
    return { 
      grade: 'A', 
      description: 'Excellent form! Minor tweaks could make it perfect.', 
      color: 'text-green-500' 
    };
  } else if (formIQ >= 0.7) {
    return { 
      grade: 'B+', 
      description: 'Good form! Focus on consistency and depth.', 
      color: 'text-blue-500' 
    };
  } else if (formIQ >= 0.6) {
    return { 
      grade: 'B', 
      description: 'Decent form. Work on range of motion and stability.', 
      color: 'text-blue-400' 
    };
  } else if (formIQ >= 0.5) {
    return { 
      grade: 'C+', 
      description: 'Fair form. Focus on proper technique over speed.', 
      color: 'text-yellow-500' 
    };
  } else if (formIQ >= 0.4) {
    return { 
      grade: 'C', 
      description: 'Needs improvement. Slow down and focus on form.', 
      color: 'text-orange-500' 
    };
  } else {
    return { 
      grade: 'D', 
      description: 'Poor form detected. Consider reviewing technique.', 
      color: 'text-red-500' 
    };
  }
}

/**
 * Get side balance feedback
 */
export function getSideBalanceFeedback(sideBalance: number): { description: string; color: string } {
  const imbalance = Math.abs(sideBalance - 0.5);
  
  if (imbalance <= 0.05) {
    return { 
      description: 'Perfect balance! Both sides working equally.', 
      color: 'text-green-600' 
    };
  } else if (imbalance <= 0.1) {
    return { 
      description: 'Good balance with minor asymmetry.', 
      color: 'text-green-500' 
    };
  } else if (imbalance <= 0.2) {
    return { 
      description: 'Noticeable imbalance. Focus on weaker side.', 
      color: 'text-yellow-500' 
    };
  } else {
    const dominantSide = sideBalance > 0.5 ? 'right' : 'left';
    return { 
      description: `Significant ${dominantSide} side dominance detected.`, 
      color: 'text-orange-500' 
    };
  }
}
