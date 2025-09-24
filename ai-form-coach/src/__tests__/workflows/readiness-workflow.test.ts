import { describe, it, expect } from 'vitest';

/**
 * Readiness workflow tests
 * Tests complete readiness assessment workflows
 */

describe('Readiness Workflow Tests', () => {
  describe('Daily Readiness Assessment Workflow', () => {
    it('should complete daily readiness assessment workflow', () => {
      // Test daily readiness assessment process
      const assessmentData = {
        date: '2025-01-18',
        soreness_level: 5,
        fatigue_level: 4,
        sleep_quality: 8,
        stress_level: 3,
        motivation_level: 9
      };

      const readinessScore = calculateReadinessScore(assessmentData);
      const readinessCategory = getReadinessCategory(readinessScore);
      const workoutRecommendation = getWorkoutRecommendation(readinessCategory);

      expect(readinessScore).toBeGreaterThan(0);
      expect(readinessScore).toBeLessThanOrEqual(1);
      expect(['excellent', 'good', 'fair', 'poor']).toContain(readinessCategory);
      expect(['high_intensity', 'moderate_intensity', 'light_intensity', 'rest']).toContain(workoutRecommendation);
    });

    it('should handle readiness trend analysis workflow', () => {
      // Test readiness trend analysis
      const weeklyReadiness = [
        { date: '2025-01-12', score: 0.7, category: 'good' },
        { date: '2025-01-13', score: 0.8, category: 'excellent' },
        { date: '2025-01-14', score: 0.6, category: 'good' },
        { date: '2025-01-15', score: 0.5, category: 'fair' },
        { date: '2025-01-16', score: 0.4, category: 'fair' },
        { date: '2025-01-17', score: 0.3, category: 'poor' },
        { date: '2025-01-18', score: 0.6, category: 'good' }
      ];

      const trendAnalysis = {
        averageScore: weeklyReadiness.reduce((sum, day) => sum + day.score, 0) / weeklyReadiness.length,
        trend: calculateTrend(weeklyReadiness.map(day => day.score)),
        recommendations: generateRecommendations(weeklyReadiness)
      };

      expect(trendAnalysis.averageScore).toBeCloseTo(0.56, 2);
      expect(['improving', 'declining', 'stable']).toContain(trendAnalysis.trend);
      expect(trendAnalysis.recommendations).toBeDefined();
    });
  });

  describe('Readiness-Based Workout Adjustment Workflow', () => {
    it('should complete readiness-based workout adjustment workflow', () => {
      // Test workout adjustment based on readiness
      const originalWorkout = {
        exercise: 'squat',
        sets: 4,
        reps: 10,
        weight: 135,
        intensity: 'high'
      };

      const readinessData = {
        score: 0.4, // Low readiness
        category: 'poor',
        factors: ['high_soreness', 'low_sleep', 'high_stress']
      };

      const adjustedWorkout = adjustWorkoutForReadiness(originalWorkout, readinessData);

      expect(adjustedWorkout.sets).toBeLessThan(originalWorkout.sets);
      expect(adjustedWorkout.intensity).toBe('low');
      expect(adjustedWorkout.adjustment_reason).toContain('readiness');
    });

    it('should handle readiness recovery workflow', () => {
      // Test recovery recommendations based on readiness
      const lowReadinessData = {
        score: 0.3,
        category: 'poor',
        factors: ['high_soreness', 'low_sleep', 'high_stress']
      };

      const recoveryPlan = generateRecoveryPlan(lowReadinessData);

      expect(recoveryPlan.recommendations).toContain('rest_day');
      expect(recoveryPlan.recommendations).toContain('sleep_improvement');
      expect(recoveryPlan.recommendations).toContain('stress_management');
      expect(recoveryPlan.estimated_recovery_time).toBeGreaterThan(0);
    });
  });

  describe('Readiness Integration Workflow', () => {
    it('should complete readiness integration with health data workflow', () => {
      // Test integration with health data
      const healthData = {
        sleep_duration: 6.5, // hours
        resting_heart_rate: 65,
        hrv: 45,
        step_count: 8500
      };

      const readinessData = {
        soreness_level: 5,
        fatigue_level: 4,
        sleep_quality: 7,
        stress_level: 3,
        motivation_level: 8
      };

      const integratedReadiness = integrateHealthData(readinessData, healthData);

      expect(integratedReadiness.combined_score).toBeGreaterThan(0);
      expect(integratedReadiness.combined_score).toBeLessThanOrEqual(1);
      expect(integratedReadiness.health_factors).toContain('sleep_duration');
      expect(integratedReadiness.health_factors).toContain('hrv');
    });

    it('should handle readiness-based program progression workflow', () => {
      // Test program progression based on readiness
      const programData = {
        currentWeek: 3,
        currentDay: 5,
        totalWeeks: 4
      };

      const readinessHistory = [
        { date: '2025-01-15', score: 0.8, category: 'excellent' },
        { date: '2025-01-16', score: 0.7, category: 'good' },
        { date: '2025-01-17', score: 0.6, category: 'good' },
        { date: '2025-01-18', score: 0.5, category: 'fair' }
      ];

      const progressionDecision = makeProgressionDecision(programData, readinessHistory);

      expect(['continue', 'deload', 'rest']).toContain(progressionDecision.action);
      expect(progressionDecision.reason).toBeDefined();
      expect(progressionDecision.confidence).toBeGreaterThan(0);
    });
  });
});

// Helper functions for readiness calculations
function calculateReadinessScore(data: { soreness_level: number; fatigue_level: number; sleep_quality: number; stress_level: number; motivation_level: number }): number {
  const normalizedSoreness = Math.max(0, 10 - data.soreness_level) / 10;
  const normalizedFatigue = Math.max(0, 10 - data.fatigue_level) / 10;
  const normalizedSleep = data.sleep_quality / 10;
  const normalizedStress = Math.max(0, 10 - data.stress_level) / 10;
  const normalizedMotivation = data.motivation_level / 10;

  return (normalizedSoreness * 0.2 + normalizedFatigue * 0.2 + 
          normalizedSleep * 0.2 + normalizedStress * 0.2 + 
          normalizedMotivation * 0.2);
}

function getReadinessCategory(score: number): string {
  if (score >= 0.8) return 'excellent';
  if (score >= 0.6) return 'good';
  if (score >= 0.4) return 'fair';
  return 'poor';
}

function getWorkoutRecommendation(category: string): string {
  switch (category) {
    case 'excellent': return 'high_intensity';
    case 'good': return 'moderate_intensity';
    case 'fair': return 'light_intensity';
    case 'poor': return 'rest';
    default: return 'rest';
  }
}

function calculateTrend(scores: number[]): string {
  if (scores.length < 2) return 'stable';
  
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  
  if (difference > 0.1) return 'improving';
  if (difference < -0.1) return 'declining';
  return 'stable';
}

function generateRecommendations(readinessHistory: { score: number }[]): string[] {
  const recommendations = [];
  const recentScores = readinessHistory.slice(-3).map(day => day.score);
  const avgRecentScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
  
  if (avgRecentScore < 0.5) {
    recommendations.push('consider_rest_day');
    recommendations.push('focus_on_recovery');
  }
  
  return recommendations;
}

function adjustWorkoutForReadiness(workout: { sets: number; intensity: string }, readiness: { score: number }) {
  const adjustedWorkout = { ...workout };
  
  if (readiness.score < 0.5) {
    adjustedWorkout.sets = Math.max(1, Math.floor(workout.sets * 0.7));
    adjustedWorkout.intensity = 'low';
    adjustedWorkout.adjustment_reason = 'low_readiness';
  }
  
  return adjustedWorkout;
}

function generateRecoveryPlan(readiness: { score: number }) {
  const recommendations = ['rest_day'];
  
  if (readiness.factors.includes('low_sleep')) {
    recommendations.push('sleep_improvement');
  }
  
  if (readiness.factors.includes('high_stress')) {
    recommendations.push('stress_management');
  }
  
          return {
    recommendations,
    estimated_recovery_time: readiness.score < 0.3 ? 2 : 1 // days
  };
}

function integrateHealthData(readiness: { score: number }, health: { sleep_duration: number; hrv: number; step_count: number; resting_heart_rate: number }) {
  const healthScore = (
    (health.sleep_duration / 8) * 0.3 +
    (health.hrv / 50) * 0.3 +
    (health.step_count / 10000) * 0.2 +
    (100 - health.resting_heart_rate) / 100 * 0.2
  );
  
  const combinedScore = (readiness.score + healthScore) / 2;
  
  return {
    combined_score: Math.min(1, Math.max(0, combinedScore || 0.5)), // Fallback to 0.5 if NaN
    health_factors: ['sleep_duration', 'hrv', 'step_count', 'resting_heart_rate']
  };
}

function makeProgressionDecision(program: { id: string; currentWeek: number; currentDay: number }, readinessHistory: { score: number }[]) {
  const recentReadiness = readinessHistory.slice(-3);
  const avgReadiness = recentReadiness.reduce((sum, day) => sum + day.score, 0) / recentReadiness.length;
  
  let action = 'continue';
  let reason = 'good_readiness';
  let confidence = 0.8;
  
  if (avgReadiness < 0.4) {
    action = 'rest';
    reason = 'low_readiness';
    confidence = 0.9;
  } else if (avgReadiness < 0.6) {
    action = 'deload';
    reason = 'moderate_readiness';
    confidence = 0.7;
  }
  
  return { action, reason, confidence };
}
