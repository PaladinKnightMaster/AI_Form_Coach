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

  describe('adjustPlanForReadiness', () => {
    it('should return no adjustment for normal readiness', () => {
      const readiness: ReadinessAssessment = {
        overallScore: 0.6,
        soreness: 0.2,
        fatigue: 0.3,
        sleep: 0.7,
        stress: 0.4,
        motivation: 0.8,
        assessmentDate: new Date()
      };

      const adjustment = adjustmentService.adjustPlanForReadiness(mockPlan, readiness, 1);
      
      expect(adjustment.type).toBe('none');
      expect(adjustment.reason).toContain('60%');
    });

    it('should reduce volume for low readiness', () => {
      const readiness: ReadinessAssessment = {
        overallScore: 0.3, // 30% - below 40% threshold
        soreness: 0.2,
        fatigue: 0.6,
        sleep: 0.4,
        stress: 0.7,
        motivation: 0.5,
        assessmentDate: new Date()
      };

      const adjustment = adjustmentService.adjustPlanForReadiness(mockPlan, readiness, 1);
      
      expect(adjustment.type).toBe('volume_reduction');
      expect(adjustment.reason).toContain('30%');
      expect(adjustment.adjustments).toContain('Reduced sets by 20% for all exercises');
    });

    it('should swap to mobility day for very low readiness', () => {
      const readiness: ReadinessAssessment = {
        overallScore: 0.15, // 15% - below 20% threshold
        soreness: 0.8,
        fatigue: 0.9,
        sleep: 0.2,
        stress: 0.8,
        motivation: 0.3,
        assessmentDate: new Date()
      };

      const adjustment = adjustmentService.adjustPlanForReadiness(mockPlan, readiness, 1);
      
      expect(adjustment.type).toBe('mobility_day');
      expect(adjustment.reason).toContain('15%');
      expect(adjustment.adjustments).toContain('Replaced strength/cardio session with mobility day');
    });

    it('should add finisher sets for high readiness with no soreness', () => {
      const readiness: ReadinessAssessment = {
        overallScore: 0.85, // 85% - above 70% threshold
        soreness: 0.1, // Low soreness - below 0.3 threshold
        fatigue: 0.2,
        sleep: 0.9,
        stress: 0.2,
        motivation: 0.9,
        assessmentDate: new Date()
      };

      const adjustment = adjustmentService.adjustPlanForReadiness(mockPlan, readiness, 1);
      
      expect(adjustment.type).toBe('finisher_sets');
      expect(adjustment.reason).toContain('85%');
      expect(adjustment.adjustments).toContain('Added optional finisher sets');
    });

    it('should not add finisher sets for high readiness with soreness', () => {
      const readiness: ReadinessAssessment = {
        overallScore: 0.85, // 85% - above 70% threshold
        soreness: 0.5, // High soreness - above 0.3 threshold
        fatigue: 0.2,
        sleep: 0.9,
        stress: 0.2,
        motivation: 0.9,
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
      const readiness: ReadinessAssessment = {
        overallScore: 0.3, // 30% - below 40% threshold
        soreness: 0.2,
        fatigue: 0.6,
        sleep: 0.4,
        stress: 0.7,
        motivation: 0.5,
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
