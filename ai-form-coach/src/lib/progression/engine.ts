/**
 * Progressive Overload Engine
 * 
 * Implements intelligent progression rules based on:
 * - Range of motion (ROM) quality
 * - Tempo consistency
 * - Readiness assessment
 * - Soreness levels
 */

export interface SessionMetrics {
  exercise: 'squat' | 'pushup' | 'plank';
  totalReps?: number;
  totalTimeSeconds?: number;
  avgRomScore: number; // 0-1 scale
  avgTempoMs: number;
  qualityScore: number; // 0-1 scale (combination of ROM and tempo consistency)
  sessionDate: Date;
}

export interface ReadinessAssessment {
  sorenessLevel: number; // 0-10 scale (0 = no soreness, 10 = extreme soreness)
  fatigueLevel: number; // 0-10 scale (0 = fresh, 10 = exhausted)
  sleepQuality: number; // 0-10 scale (0 = poor, 10 = excellent)
  stressLevel: number; // 0-10 scale (0 = low, 10 = high)
  motivationLevel: number; // 0-10 scale (0 = low, 10 = high)
  assessmentDate: Date;
}

export interface ProgressionRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: SessionMetrics[], readiness: ReadinessAssessment | null) => boolean;
  action: (currentTarget: WorkoutTarget) => WorkoutTarget;
  priority: number; // Higher number = higher priority
}

export interface WorkoutTarget {
  exercise: 'squat' | 'pushup' | 'plank';
  targetReps?: number;
  targetTimeSeconds?: number;
  intensity: 'low' | 'moderate' | 'high';
  volume: 'low' | 'moderate' | 'high';
  notes?: string;
}

export class ProgressionEngine {
  private rules: ProgressionRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    // Rule 1: Increase volume when last 2 sessions met quality standards
    this.rules.push({
      id: 'volume_increase_quality',
      name: 'Volume Increase - Quality Met',
      description: 'Increase total reps/time by 5-10% when last 2 sessions met ROM and tempo quality',
      priority: 3,
      condition: (metrics, readiness) => {
        if (metrics.length < 2) return false;
        if (readiness && readiness.sorenessLevel > 6) return false; // Don't increase if very sore
        
        const lastTwo = metrics.slice(-2);
        const qualityThreshold = 0.7; // 70% quality threshold
        
        return lastTwo.every(session => 
          session.avgRomScore >= qualityThreshold && 
          session.qualityScore >= qualityThreshold
        );
      },
      action: (currentTarget) => {
        const increasePercent = 0.075; // 7.5% average increase
        
        if (currentTarget.targetReps) {
          return {
            ...currentTarget,
            targetReps: Math.round(currentTarget.targetReps * (1 + increasePercent)),
            notes: `Increased reps by ${Math.round(increasePercent * 100)}% due to consistent quality`
          };
        }
        
        if (currentTarget.targetTimeSeconds) {
          return {
            ...currentTarget,
            targetTimeSeconds: Math.round(currentTarget.targetTimeSeconds * (1 + increasePercent)),
            notes: `Increased time by ${Math.round(increasePercent * 100)}% due to consistent quality`
          };
        }
        
        return currentTarget;
      }
    });

    // Rule 2: Reduce volume when readiness is low
    this.rules.push({
      id: 'volume_reduction_low_readiness',
      name: 'Volume Reduction - Low Readiness',
      description: 'Reduce volume by 20-30% when readiness is low but maintain intensity',
      priority: 4, // Higher priority than volume increase
      condition: (metrics, readiness) => {
        if (!readiness) return false;
        
        const readinessScore = this.calculateReadinessScore(readiness);
        return readinessScore < 0.4; // Low readiness threshold
      },
      action: (currentTarget) => {
        const reductionPercent = 0.25; // 25% reduction
        
        if (currentTarget.targetReps) {
          return {
            ...currentTarget,
            targetReps: Math.round(currentTarget.targetReps * (1 - reductionPercent)),
            volume: 'low',
            notes: `Reduced reps by ${Math.round(reductionPercent * 100)}% due to low readiness`
          };
        }
        
        if (currentTarget.targetTimeSeconds) {
          return {
            ...currentTarget,
            targetTimeSeconds: Math.round(currentTarget.targetTimeSeconds * (1 - reductionPercent)),
            volume: 'low',
            notes: `Reduced time by ${Math.round(reductionPercent * 100)}% due to low readiness`
          };
        }
        
        return currentTarget;
      }
    });

    // Rule 3: Maintain or slightly reduce when soreness is high
    this.rules.push({
      id: 'maintain_high_soreness',
      name: 'Maintain - High Soreness',
      description: 'Maintain current volume when soreness is high (6-8) or reduce if extreme (9-10)',
      priority: 5, // Highest priority
      condition: (metrics, readiness) => {
        if (!readiness) return false;
        return readiness.sorenessLevel >= 6;
      },
      action: (currentTarget) => {
        if (readiness && readiness.sorenessLevel >= 9) {
          // Extreme soreness - reduce by 40%
          const reductionPercent = 0.4;
          
          if (currentTarget.targetReps) {
            return {
              ...currentTarget,
              targetReps: Math.round(currentTarget.targetReps * (1 - reductionPercent)),
              volume: 'low',
              notes: `Reduced reps by ${Math.round(reductionPercent * 100)}% due to extreme soreness`
            };
          }
          
          if (currentTarget.targetTimeSeconds) {
            return {
              ...currentTarget,
              targetTimeSeconds: Math.round(currentTarget.targetTimeSeconds * (1 - reductionPercent)),
              volume: 'low',
              notes: `Reduced time by ${Math.round(reductionPercent * 100)}% due to extreme soreness`
            };
          }
        } else {
          // High soreness - maintain current level
          return {
            ...currentTarget,
            notes: 'Maintained current volume due to high soreness'
          };
        }
        
        return currentTarget;
      }
    });

    // Rule 4: Increase intensity when volume is consistently high quality
    this.rules.push({
      id: 'intensity_increase_quality',
      name: 'Intensity Increase - Quality Met',
      description: 'Increase intensity when last 3 sessions showed excellent quality',
      priority: 2,
      condition: (metrics, readiness) => {
        if (metrics.length < 3) return false;
        if (readiness && readiness.sorenessLevel > 5) return false;
        
        const lastThree = metrics.slice(-3);
        const excellentThreshold = 0.85; // 85% quality threshold
        
        return lastThree.every(session => 
          session.avgRomScore >= excellentThreshold && 
          session.qualityScore >= excellentThreshold
        );
      },
      action: (currentTarget) => {
        return {
          ...currentTarget,
          intensity: currentTarget.intensity === 'low' ? 'moderate' : 
                    currentTarget.intensity === 'moderate' ? 'high' : 'high',
          notes: 'Increased intensity due to excellent quality consistency'
        };
      }
    });

    // Rule 5: Deload week after 4-6 weeks of progression
    this.rules.push({
      id: 'deload_week',
      name: 'Deload Week',
      description: 'Reduce volume by 50% every 4-6 weeks for recovery',
      priority: 1,
      condition: (metrics, readiness) => {
        if (metrics.length < 8) return false; // Need at least 8 sessions (4 weeks)
        
        const weeksSinceLastDeload = this.getWeeksSinceLastDeload(metrics);
        return weeksSinceLastDeload >= 4;
      },
      action: (currentTarget) => {
        const deloadPercent = 0.5; // 50% reduction
        
        if (currentTarget.targetReps) {
          return {
            ...currentTarget,
            targetReps: Math.round(currentTarget.targetReps * (1 - deloadPercent)),
            volume: 'low',
            intensity: 'low',
            notes: 'Deload week - 50% volume reduction for recovery'
          };
        }
        
        if (currentTarget.targetTimeSeconds) {
          return {
            ...currentTarget,
            targetTimeSeconds: Math.round(currentTarget.targetTimeSeconds * (1 - deloadPercent)),
            volume: 'low',
            intensity: 'low',
            notes: 'Deload week - 50% volume reduction for recovery'
          };
        }
        
        return currentTarget;
      }
    });
  }

  /**
   * Calculate overall readiness score from assessment
   */
  private calculateReadinessScore(readiness: ReadinessAssessment): number {
    // Weighted scoring (0-1 scale)
    const weights = {
      soreness: 0.3,    // Lower soreness = higher readiness
      fatigue: 0.25,    // Lower fatigue = higher readiness
      sleep: 0.2,       // Higher sleep quality = higher readiness
      stress: 0.15,     // Lower stress = higher readiness
      motivation: 0.1   // Higher motivation = higher readiness
    };

    const sorenessScore = 1 - (readiness.sorenessLevel / 10);
    const fatigueScore = 1 - (readiness.fatigueLevel / 10);
    const sleepScore = readiness.sleepQuality / 10;
    const stressScore = 1 - (readiness.stressLevel / 10);
    const motivationScore = readiness.motivationLevel / 10;

    return (
      sorenessScore * weights.soreness +
      fatigueScore * weights.fatigue +
      sleepScore * weights.sleep +
      stressScore * weights.stress +
      motivationScore * weights.motivation
    );
  }

  /**
   * Get weeks since last deload (simplified - assumes deload if volume dropped significantly)
   */
  private getWeeksSinceLastDeload(metrics: SessionMetrics[]): number {
    // Look for significant volume drops in the last 8 sessions
    for (let i = Math.max(0, metrics.length - 8); i < metrics.length - 1; i++) {
      const current = metrics[i];
      const next = metrics[i + 1];
      
      if (current.targetReps && next.targetReps) {
        const dropPercent = (current.targetReps - next.targetReps) / current.targetReps;
        if (dropPercent > 0.3) { // 30% drop indicates deload
          return Math.floor((metrics.length - i - 1) / 2); // Approximate weeks
        }
      }
    }
    
    return Math.floor(metrics.length / 2); // Default to weeks since start
  }

  /**
   * Generate next workout target based on session history and readiness
   */
  public generateNextTarget(
    exercise: 'squat' | 'pushup' | 'plank',
    sessionHistory: SessionMetrics[],
    readiness: ReadinessAssessment | null,
    currentTarget: WorkoutTarget
  ): WorkoutTarget {
    // Sort rules by priority (highest first)
    const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority);
    
    // Find the first rule that applies
    for (const rule of sortedRules) {
      if (rule.condition(sessionHistory, readiness)) {
        return rule.action(currentTarget);
      }
    }
    
    // If no rules apply, maintain current target
    return {
      ...currentTarget,
      notes: 'No progression rules applied - maintaining current target'
    };
  }

  /**
   * Get all applicable rules for current state (for debugging/UI)
   */
  public getApplicableRules(
    sessionHistory: SessionMetrics[],
    readiness: ReadinessAssessment | null
  ): ProgressionRule[] {
    return this.rules.filter(rule => rule.condition(sessionHistory, readiness));
  }

  /**
   * Get readiness score for display
   */
  public getReadinessScore(readiness: ReadinessAssessment): number {
    return this.calculateReadinessScore(readiness);
  }

  /**
   * Get readiness category for display
   */
  public getReadinessCategory(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  }
}
