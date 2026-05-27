import { PlanAdjustmentService } from './planAdjustments';
import type { UserPlan } from '@/types/plans';
import type { ReadinessAssessment } from '@/lib/progression/engine';

describe('PlanAdjustmentService', () => {
  const adjustmentService = new PlanAdjustmentService();

  const mockPlan: UserPlan = {
    id: 'test-plan',
    user_id: 'test-user',
    template_id: null, // AI-generated plan
    name: 'Test Plan',
    current_week: 1,
    current_day: 1,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    plan_data: {
      name: 'Test Plan',
      description: 'A test plan',
      category: 'strength',
      goal_type: 'muscle_gain',
      equipment_required: ['dumbbells'],
      duration_weeks: 4,
      difficulty_level: 'intermediate',
      sessions_per_week: 3,
      avg_session_duration: 45,
      tags: ['test'],
      sessions: [
        {
          id: 'day-1',
          day: 1,
          name: 'Upper Body Strength',
          type: 'strength',
          duration: 45,
          difficulty: 'intermediate',
          description: 'Upper body workout',
          exercises: [
            {
              name: 'Push-ups',
              sets: 3,
              reps: 12,
              rest: 60,
              notes: 'Full range of motion'
            },
            {
              name: 'Pull-ups',
              sets: 3,
              reps: 8,
              rest: 90,
              notes: 'Assisted if needed'
            }
          ]
        }
      ]
    }
  };

  const mockTemplatePlan: UserPlan = {
    id: 'template-plan',
    user_id: 'test-user',
    template_id: 'template-123', // Template-based plan
    name: 'Template Plan',
    current_week: 1,
    current_day: 1,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    plan_data: {} // Empty plan_data for template plans
  };

  // ReadinessAssessment uses 0-10 scale fields:
  // sorenessLevel, fatigueLevel, sleepQuality, stressLevel, motivationLevel
  // readinessScore = ((10-soreness) + (10-fatigue) + sleep + (10-stress) + motivation) / 50
  // hasSoreness = sorenessLevel > 3

  describe('adjustPlanForReadiness', () => {
    it('should return no adjustment for normal readiness', () => {
      // Target: readinessScore = 0.6 (60%), hasSoreness = true (soreness > 3)
      // (10-4) + (10-5) + 7 + (10-5) + 7 = 6+5+7+5+7 = 30 → 30/50 = 0.60
      const readiness: ReadinessAssessment = {
        sorenessLevel: 4,
        fatigueLevel: 5,
        sleepQuality: 7,
        stressLevel: 5,
        motivationLevel: 7,
        assessmentDate: new Date()
      };

      const adjustment = adjustmentService.adjustPlanForReadiness(mockPlan, readiness, 1);

      expect(adjustment.type).toBe('none');
      expect(adjustment.reason).toContain('60%');
    });

    it('should reduce volume for low readiness', () => {
      // Target: readinessScore = 0.3 (30%)
      // (10-7) + (10-6) + 4 + (10-7) + 1 = 3+4+4+3+1 = 15 → 15/50 = 0.30
      const readiness: ReadinessAssessment = {
        sorenessLevel: 7,
        fatigueLevel: 6,
        sleepQuality: 4,
        stressLevel: 7,
        motivationLevel: 1,
        assessmentDate: new Date()
      };

      const adjustment = adjustmentService.adjustPlanForReadiness(mockPlan, readiness, 1);

      expect(adjustment.type).toBe('volume_reduction');
      expect(adjustment.reason).toContain('30%');
      expect(adjustment.adjustments).toContain('Reduced sets by 20% for all exercises');
    });

    it('should swap to mobility day for very low readiness', () => {
      // Target: readinessScore ≈ 0.15 (15%)
      // (10-8) + (10-9) + 1 + (10-8) + 1.5 = 2+1+1+2+1.5 = 7.5 → 7.5/50 = 0.15
      const readiness: ReadinessAssessment = {
        sorenessLevel: 8,
        fatigueLevel: 9,
        sleepQuality: 1,
        stressLevel: 8,
        motivationLevel: 1.5,
        assessmentDate: new Date()
      };

      const adjustment = adjustmentService.adjustPlanForReadiness(mockPlan, readiness, 1);

      expect(adjustment.type).toBe('mobility_day');
      expect(adjustment.reason).toContain('15%');
      expect(adjustment.adjustments).toContain('Replaced strength/cardio session with mobility day');
    });

    it('should add finisher sets for high readiness with no soreness', () => {
      // Target: readinessScore = 0.85 (85%), hasSoreness = false (soreness ≤ 3)
      // (10-1) + (10-2) + 9 + (10-2) + 8.5 = 9+8+9+8+8.5 = 42.5 → 42.5/50 = 0.85
      const readiness: ReadinessAssessment = {
        sorenessLevel: 1,
        fatigueLevel: 2,
        sleepQuality: 9,
        stressLevel: 2,
        motivationLevel: 8.5,
        assessmentDate: new Date()
      };

      const adjustment = adjustmentService.adjustPlanForReadiness(mockPlan, readiness, 1);

      expect(adjustment.type).toBe('finisher_sets');
      expect(adjustment.reason).toContain('85%');
      expect(adjustment.adjustments).toContain('Added optional finisher sets');
    });

    it('should not add finisher sets for high readiness with soreness', () => {
      // Target: readinessScore = 0.85 (85%), hasSoreness = true (soreness > 3)
      // (10-5) + (10-1) + 10 + (10-1) + 9.5 = 5+9+10+9+9.5 = 42.5 → 42.5/50 = 0.85
      const readiness: ReadinessAssessment = {
        sorenessLevel: 5,
        fatigueLevel: 1,
        sleepQuality: 10,
        stressLevel: 1,
        motivationLevel: 9.5,
        assessmentDate: new Date()
      };

      const adjustment = adjustmentService.adjustPlanForReadiness(mockPlan, readiness, 1);

      expect(adjustment.type).toBe('none');
      expect(adjustment.reason).toContain('85%');
    });

    it('should handle null readiness gracefully', () => {
      const adjustment = adjustmentService.adjustPlanForReadiness(mockPlan, null, 1);

      expect(adjustment.type).toBe('none');
      expect(adjustment.reason).toContain('No readiness assessment available');
    });

    it('should handle template-based plans correctly', () => {
      // Target: readinessScore = 0.3 (30%) — triggers volume_reduction
      // (10-7) + (10-6) + 4 + (10-7) + 1 = 3+4+4+3+1 = 15 → 15/50 = 0.30
      const readiness: ReadinessAssessment = {
        sorenessLevel: 7,
        fatigueLevel: 6,
        sleepQuality: 4,
        stressLevel: 7,
        motivationLevel: 1,
        assessmentDate: new Date()
      };

      const adjustment = adjustmentService.adjustPlanForReadiness(mockTemplatePlan, readiness, 1);

      expect(adjustment.type).toBe('volume_reduction');
      expect(adjustment.reason).toContain('template plans cannot be automatically adjusted');
      expect(adjustment.adjustments).toContain('Template-based plans cannot be automatically adjusted');
    });
  });

  describe('getAdjustmentSummary', () => {
    it('should return correct summary for mobility day', () => {
      const adjustment = {
        type: 'mobility_day' as const,
        reason: 'Readiness score 15% is very low',
        originalPlan: mockPlan,
        adjustedPlan: mockPlan,
        adjustments: []
      };

      const summary = adjustmentService.getAdjustmentSummary(adjustment);
      expect(summary).toContain('🔄 Recovery Day');
    });

    it('should return correct summary for volume reduction', () => {
      const adjustment = {
        type: 'volume_reduction' as const,
        reason: 'Readiness score 30% is low',
        originalPlan: mockPlan,
        adjustedPlan: mockPlan,
        adjustments: []
      };

      const summary = adjustmentService.getAdjustmentSummary(adjustment);
      expect(summary).toContain('📉 Volume Reduced');
    });

    it('should return correct summary for finisher sets', () => {
      const adjustment = {
        type: 'finisher_sets' as const,
        reason: 'Readiness score 85% is high',
        originalPlan: mockPlan,
        adjustedPlan: mockPlan,
        adjustments: []
      };

      const summary = adjustmentService.getAdjustmentSummary(adjustment);
      expect(summary).toContain('⚡ Finisher Sets Added');
    });
  });
});
