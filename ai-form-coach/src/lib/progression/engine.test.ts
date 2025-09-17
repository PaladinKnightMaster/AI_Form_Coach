/**
 * Test Suite for Progressive Overload Engine
 * 
 * Tests all progression rules, edge cases, and readiness calculations
 */

import { ProgressionEngine, type SessionMetrics, type ReadinessAssessment, type WorkoutTarget } from './engine';

describe('ProgressionEngine', () => {
  let engine: ProgressionEngine;

  beforeEach(() => {
    engine = new ProgressionEngine();
  });

  describe('Volume Increase - Quality Met Rule', () => {
    it('should increase reps by 7.5% when last 2 sessions meet quality standards', () => {
      const sessionHistory: SessionMetrics[] = [
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.8,
          avgTempoMs: 2000,
          qualityScore: 0.8,
          sessionDate: new Date('2024-01-01')
        },
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.75,
          avgTempoMs: 2100,
          qualityScore: 0.75,
          sessionDate: new Date('2024-01-02')
        }
      ];

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, null, currentTarget);

      expect(result.targetReps).toBe(22); // 20 * 1.075 = 21.5, rounded to 22
      expect(result.notes).toContain('Increased reps by 8% due to consistent quality');
    });

    it('should increase time by 7.5% for plank exercises', () => {
      const sessionHistory: SessionMetrics[] = [
        {
          exercise: 'plank',
          totalTimeSeconds: 60,
          avgRomScore: 0.8,
          avgTempoMs: 0,
          qualityScore: 0.8,
          sessionDate: new Date('2024-01-01')
        },
        {
          exercise: 'plank',
          totalTimeSeconds: 60,
          avgRomScore: 0.75,
          avgTempoMs: 0,
          qualityScore: 0.75,
          sessionDate: new Date('2024-01-02')
        }
      ];

      const currentTarget: WorkoutTarget = {
        exercise: 'plank',
        targetTimeSeconds: 60,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('plank', sessionHistory, null, currentTarget);

      expect(result.targetTimeSeconds).toBe(65); // 60 * 1.075 = 64.5, rounded to 65
      expect(result.notes).toContain('Increased time by 8% due to consistent quality');
    });

    it('should not increase volume when soreness is high', () => {
      const sessionHistory: SessionMetrics[] = [
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.8,
          avgTempoMs: 2000,
          qualityScore: 0.8,
          sessionDate: new Date('2024-01-01')
        },
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.75,
          avgTempoMs: 2100,
          qualityScore: 0.75,
          sessionDate: new Date('2024-01-02')
        }
      ];

      const readiness: ReadinessAssessment = {
        sorenessLevel: 7, // High soreness
        fatigueLevel: 3,
        sleepQuality: 7,
        stressLevel: 4,
        motivationLevel: 6,
        assessmentDate: new Date('2024-01-03')
      };

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, readiness, currentTarget);

      expect(result.targetReps).toBe(20); // Should maintain current level
      expect(result.notes).toContain('Maintained current volume due to high soreness');
    });

    it('should not increase volume when quality threshold not met', () => {
      const sessionHistory: SessionMetrics[] = [
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.6, // Below 0.7 threshold
          avgTempoMs: 2000,
          qualityScore: 0.6,
          sessionDate: new Date('2024-01-01')
        },
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.65, // Below 0.7 threshold
          avgTempoMs: 2100,
          qualityScore: 0.65,
          sessionDate: new Date('2024-01-02')
        }
      ];

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, null, currentTarget);

      expect(result.targetReps).toBe(20); // Should maintain current level
      expect(result.notes).toContain('No progression rules applied');
    });
  });

  describe('Volume Reduction - Low Readiness Rule', () => {
    it('should reduce volume by 25% when readiness is low', () => {
      const sessionHistory: SessionMetrics[] = [
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.8,
          avgTempoMs: 2000,
          qualityScore: 0.8,
          sessionDate: new Date('2024-01-01')
        }
      ];

      const readiness: ReadinessAssessment = {
        sorenessLevel: 8, // High soreness
        fatigueLevel: 7,  // High fatigue
        sleepQuality: 3,  // Poor sleep
        stressLevel: 8,   // High stress
        motivationLevel: 4, // Low motivation
        assessmentDate: new Date('2024-01-02')
      };

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, readiness, currentTarget);

      expect(result.targetReps).toBe(15); // 20 * 0.75 = 15
      expect(result.volume).toBe('low');
      expect(result.notes).toContain('Reduced reps by 25% due to low readiness');
    });

    it('should reduce time by 25% for plank exercises when readiness is low', () => {
      const sessionHistory: SessionMetrics[] = [];

      const readiness: ReadinessAssessment = {
        sorenessLevel: 7,
        fatigueLevel: 6,
        sleepQuality: 4,
        stressLevel: 7,
        motivationLevel: 5,
        assessmentDate: new Date('2024-01-02')
      };

      const currentTarget: WorkoutTarget = {
        exercise: 'plank',
        targetTimeSeconds: 60,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('plank', sessionHistory, readiness, currentTarget);

      expect(result.targetTimeSeconds).toBe(45); // 60 * 0.75 = 45
      expect(result.volume).toBe('low');
      expect(result.notes).toContain('Reduced time by 25% due to low readiness');
    });
  });

  describe('Maintain - High Soreness Rule', () => {
    it('should maintain volume when soreness is high (6-8)', () => {
      const sessionHistory: SessionMetrics[] = [];

      const readiness: ReadinessAssessment = {
        sorenessLevel: 7, // High soreness
        fatigueLevel: 3,
        sleepQuality: 7,
        stressLevel: 4,
        motivationLevel: 6,
        assessmentDate: new Date('2024-01-02')
      };

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, readiness, currentTarget);

      expect(result.targetReps).toBe(20); // Should maintain
      expect(result.notes).toContain('Maintained current volume due to high soreness');
    });

    it('should reduce volume by 40% when soreness is extreme (9-10)', () => {
      const sessionHistory: SessionMetrics[] = [];

      const readiness: ReadinessAssessment = {
        sorenessLevel: 9, // Extreme soreness
        fatigueLevel: 3,
        sleepQuality: 7,
        stressLevel: 4,
        motivationLevel: 6,
        assessmentDate: new Date('2024-01-02')
      };

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, readiness, currentTarget);

      expect(result.targetReps).toBe(12); // 20 * 0.6 = 12
      expect(result.volume).toBe('low');
      expect(result.notes).toContain('Reduced reps by 40% due to extreme soreness');
    });
  });

  describe('Intensity Increase - Quality Met Rule', () => {
    it('should increase intensity when last 3 sessions show excellent quality', () => {
      const sessionHistory: SessionMetrics[] = [
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.9, // Excellent quality
          avgTempoMs: 2000,
          qualityScore: 0.9,
          sessionDate: new Date('2024-01-01')
        },
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.88, // Excellent quality
          avgTempoMs: 2100,
          qualityScore: 0.88,
          sessionDate: new Date('2024-01-02')
        },
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.87, // Excellent quality
          avgTempoMs: 2050,
          qualityScore: 0.87,
          sessionDate: new Date('2024-01-03')
        }
      ];

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, null, currentTarget);

      expect(result.intensity).toBe('high');
      expect(result.notes).toContain('Increased intensity due to excellent quality consistency');
    });

    it('should not increase intensity when soreness is present', () => {
      const sessionHistory: SessionMetrics[] = [
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.9,
          avgTempoMs: 2000,
          qualityScore: 0.9,
          sessionDate: new Date('2024-01-01')
        },
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.88,
          avgTempoMs: 2100,
          qualityScore: 0.88,
          sessionDate: new Date('2024-01-02')
        },
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.87,
          avgTempoMs: 2050,
          qualityScore: 0.87,
          sessionDate: new Date('2024-01-03')
        }
      ];

      const readiness: ReadinessAssessment = {
        sorenessLevel: 6, // High soreness prevents intensity increase
        fatigueLevel: 3,
        sleepQuality: 7,
        stressLevel: 4,
        motivationLevel: 6,
        assessmentDate: new Date('2024-01-04')
      };

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, readiness, currentTarget);

      expect(result.intensity).toBe('moderate'); // Should maintain
      expect(result.notes).toContain('Maintained current volume due to high soreness');
    });
  });

  describe('Deload Week Rule', () => {
    it('should trigger deload week after 4+ weeks of progression', () => {
      // Create 10 sessions (5 weeks) of progression
      const sessionHistory: SessionMetrics[] = Array.from({ length: 10 }, (_, i) => ({
        exercise: 'squat' as const,
        totalReps: 20 + i, // Progressive increase
        avgRomScore: 0.8,
        avgTempoMs: 2000,
        qualityScore: 0.8,
        sessionDate: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`)
      }));

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 30,
        intensity: 'high',
        volume: 'high'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, null, currentTarget);

      expect(result.targetReps).toBe(15); // 30 * 0.5 = 15
      expect(result.volume).toBe('low');
      expect(result.intensity).toBe('low');
      expect(result.notes).toContain('Deload week - 50% volume reduction for recovery');
    });
  });

  describe('Readiness Score Calculation', () => {
    it('should calculate high readiness score correctly', () => {
      const readiness: ReadinessAssessment = {
        sorenessLevel: 2, // Low soreness
        fatigueLevel: 1,  // Low fatigue
        sleepQuality: 9,  // Excellent sleep
        stressLevel: 2,   // Low stress
        motivationLevel: 8, // High motivation
        assessmentDate: new Date('2024-01-02')
      };

      const score = engine.getReadinessScore(readiness);
      expect(score).toBeGreaterThan(0.8);
      expect(engine.getReadinessCategory(score)).toBe('excellent');
    });

    it('should calculate low readiness score correctly', () => {
      const readiness: ReadinessAssessment = {
        sorenessLevel: 8, // High soreness
        fatigueLevel: 7,  // High fatigue
        sleepQuality: 3,  // Poor sleep
        stressLevel: 8,   // High stress
        motivationLevel: 4, // Low motivation
        assessmentDate: new Date('2024-01-02')
      };

      const score = engine.getReadinessScore(readiness);
      expect(score).toBeLessThan(0.4);
      expect(engine.getReadinessCategory(score)).toBe('poor');
    });

    it('should calculate moderate readiness score correctly', () => {
      const readiness: ReadinessAssessment = {
        sorenessLevel: 4, // Moderate soreness
        fatigueLevel: 4,  // Moderate fatigue
        sleepQuality: 6,  // Good sleep
        stressLevel: 5,   // Moderate stress
        motivationLevel: 6, // Moderate motivation
        assessmentDate: new Date('2024-01-02')
      };

      const score = engine.getReadinessScore(readiness);
      expect(score).toBeGreaterThan(0.4);
      expect(score).toBeLessThan(0.8);
      expect(engine.getReadinessCategory(score)).toBe('good');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty session history', () => {
      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', [], null, currentTarget);

      expect(result.targetReps).toBe(20); // Should maintain
      expect(result.notes).toContain('No progression rules applied');
    });

    it('should handle null readiness assessment', () => {
      const sessionHistory: SessionMetrics[] = [
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.8,
          avgTempoMs: 2000,
          qualityScore: 0.8,
          sessionDate: new Date('2024-01-01')
        },
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.75,
          avgTempoMs: 2100,
          qualityScore: 0.75,
          sessionDate: new Date('2024-01-02')
        }
      ];

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, null, currentTarget);

      expect(result.targetReps).toBe(22); // Should still increase due to quality
      expect(result.notes).toContain('Increased reps by 8% due to consistent quality');
    });

    it('should prioritize higher priority rules', () => {
      const sessionHistory: SessionMetrics[] = [
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.8,
          avgTempoMs: 2000,
          qualityScore: 0.8,
          sessionDate: new Date('2024-01-01')
        },
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.75,
          avgTempoMs: 2100,
          qualityScore: 0.75,
          sessionDate: new Date('2024-01-02')
        }
      ];

      const readiness: ReadinessAssessment = {
        sorenessLevel: 7, // High soreness (priority 5)
        fatigueLevel: 3,
        sleepQuality: 7,
        stressLevel: 4,
        motivationLevel: 6,
        assessmentDate: new Date('2024-01-03')
      };

      const currentTarget: WorkoutTarget = {
        exercise: 'squat',
        targetReps: 20,
        intensity: 'moderate',
        volume: 'moderate'
      };

      const result = engine.generateNextTarget('squat', sessionHistory, readiness, currentTarget);

      // Should apply high soreness rule (priority 5) instead of volume increase (priority 3)
      expect(result.targetReps).toBe(20); // Should maintain due to high soreness
      expect(result.notes).toContain('Maintained current volume due to high soreness');
    });
  });

  describe('Applicable Rules', () => {
    it('should return all applicable rules for debugging', () => {
      const sessionHistory: SessionMetrics[] = [
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.8,
          avgTempoMs: 2000,
          qualityScore: 0.8,
          sessionDate: new Date('2024-01-01')
        },
        {
          exercise: 'squat',
          totalReps: 20,
          avgRomScore: 0.75,
          avgTempoMs: 2100,
          qualityScore: 0.75,
          sessionDate: new Date('2024-01-02')
        }
      ];

      const readiness: ReadinessAssessment = {
        sorenessLevel: 7,
        fatigueLevel: 3,
        sleepQuality: 7,
        stressLevel: 4,
        motivationLevel: 6,
        assessmentDate: new Date('2024-01-03')
      };

      const applicableRules = engine.getApplicableRules(sessionHistory, readiness);

      expect(applicableRules.length).toBeGreaterThan(0);
      expect(applicableRules.some(rule => rule.id === 'volume_increase_quality')).toBe(true);
      expect(applicableRules.some(rule => rule.id === 'maintain_high_soreness')).toBe(true);
    });
  });
});
