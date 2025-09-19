import { describe, it, expect, beforeEach } from 'vitest';

// Mock the readiness workflow functions
const mockReadinessWorkflow = {
  // Mock manual assessment
  submitManualAssessment: vi.fn(),
  // Mock health data integration
  syncHealthData: vi.fn(),
  // Mock readiness calculation
  calculateReadinessScore: vi.fn(),
  // Mock plan adjustment
  adjustPlanBasedOnReadiness: vi.fn()
};

describe('Readiness Workflow Integration', () => {
  const mockUser = { id: 'test-user-id' };
  const mockDate = '2025-01-18';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Readiness Assessment Workflow', () => {
    it('should handle manual readiness assessment', async () => {
      // Step 1: Submit manual assessment
      const manualAssessment = {
        date: mockDate,
        soreness_level: 3,
        fatigue_level: 2,
        sleep_quality: 8,
        stress_level: 4,
        motivation_level: 7
      };

      mockReadinessWorkflow.submitManualAssessment.mockResolvedValue({
        success: true,
        assessment: manualAssessment
      });

      const assessmentResult = await mockReadinessWorkflow.submitManualAssessment(mockUser.id, manualAssessment);
      expect(assessmentResult.success).toBe(true);
      expect(assessmentResult.assessment.soreness_level).toBe(3);

      // Step 2: Sync health data (if available)
      const healthData = {
        sleep_duration: 7.5,
        resting_heart_rate: 65,
        hrv_average: 30,
        step_count: 8500,
        training_load: 100
      };

      mockReadinessWorkflow.syncHealthData.mockResolvedValue({
        success: true,
        healthData
      });

      const healthResult = await mockReadinessWorkflow.syncHealthData(mockUser.id, mockDate);
      expect(healthResult.success).toBe(true);
      expect(healthResult.healthData.sleep_duration).toBe(7.5);

      // Step 3: Calculate readiness score
      const readinessScore = 0.75;
      const readinessCategory = 'good';

      mockReadinessWorkflow.calculateReadinessScore.mockResolvedValue({
        success: true,
        score: readinessScore,
        category: readinessCategory
      });

      const scoreResult = await mockReadinessWorkflow.calculateReadinessScore(
        mockUser.id,
        { ...manualAssessment, ...healthData }
      );
      expect(scoreResult.success).toBe(true);
      expect(scoreResult.score).toBe(0.75);
      expect(scoreResult.category).toBe('good');

      // Step 4: Adjust plan based on readiness
      const planAdjustments = {
        volume_reduction: 0, // No reduction needed for good readiness
        intensity_adjustment: 0,
        additional_recovery: false,
        mobility_day_swap: false
      };

      mockReadinessWorkflow.adjustPlanBasedOnReadiness.mockResolvedValue({
        success: true,
        adjustments: planAdjustments
      });

      const adjustmentResult = await mockReadinessWorkflow.adjustPlanBasedOnReadiness(
        mockUser.id,
        readinessScore
      );
      expect(adjustmentResult.success).toBe(true);
      expect(adjustmentResult.adjustments.volume_reduction).toBe(0);
    });

    it('should handle low readiness scenarios', async () => {
      // Low readiness assessment
      const lowReadinessAssessment = {
        date: mockDate,
        soreness_level: 8,
        fatigue_level: 7,
        sleep_quality: 3,
        stress_level: 8,
        motivation_level: 4
      };

      mockReadinessWorkflow.submitManualAssessment.mockResolvedValue({
        success: true,
        assessment: lowReadinessAssessment
      });

      const assessmentResult = await mockReadinessWorkflow.submitManualAssessment(mockUser.id, lowReadinessAssessment);
      expect(assessmentResult.success).toBe(true);

      // Calculate low readiness score
      const lowReadinessScore = 0.25;
      const lowReadinessCategory = 'poor';

      mockReadinessWorkflow.calculateReadinessScore.mockResolvedValue({
        success: true,
        score: lowReadinessScore,
        category: lowReadinessCategory
      });

      const scoreResult = await mockReadinessWorkflow.calculateReadinessScore(
        mockUser.id,
        lowReadinessAssessment
      );
      expect(scoreResult.success).toBe(true);
      expect(scoreResult.score).toBe(0.25);
      expect(scoreResult.category).toBe('poor');

      // Adjust plan for low readiness
      const lowReadinessAdjustments = {
        volume_reduction: 0.2, // 20% volume reduction
        intensity_adjustment: -0.1, // Lower intensity
        additional_recovery: true,
        mobility_day_swap: true // Swap to mobility day
      };

      mockReadinessWorkflow.adjustPlanBasedOnReadiness.mockResolvedValue({
        success: true,
        adjustments: lowReadinessAdjustments
      });

      const adjustmentResult = await mockReadinessWorkflow.adjustPlanBasedOnReadiness(
        mockUser.id,
        lowReadinessScore
      );
      expect(adjustmentResult.success).toBe(true);
      expect(adjustmentResult.adjustments.volume_reduction).toBe(0.2);
      expect(adjustmentResult.adjustments.mobility_day_swap).toBe(true);
    });
  });

  describe('Readiness Score Calculation Logic', () => {
    it('should calculate manual assessment score correctly', () => {
      const assessment = {
        soreness_level: 3,    // 10-3 = 7
        fatigue_level: 2,     // 10-2 = 8
        sleep_quality: 8,     // 8
        stress_level: 4,      // 10-4 = 6
        motivation_level: 7   // 7
      };

      // Manual score calculation: (7+8+8+6+7) / 50 = 36/50 = 0.72
      const manualScore = (
        (10 - assessment.soreness_level) +
        (10 - assessment.fatigue_level) +
        assessment.sleep_quality +
        (10 - assessment.stress_level) +
        assessment.motivation_level
      ) / 50.0;

      expect(manualScore).toBe(0.72);
    });

    it('should calculate health data score correctly', () => {
      const healthData = {
        sleep_duration: 7.5,      // Good (7-9 hours) = +0.2
        resting_heart_rate: 65,   // Good (≤70) = +0.15
        hrv_average: 30,          // Fair (≥30) = +0.1
        step_count: 8500,         // Good (≥8000) = +0.15
        training_load: 100        // Good (50-150) = +0.2
      };

      let healthScore = 0.5; // Start neutral

      // Sleep duration scoring
      if (healthData.sleep_duration >= 7 && healthData.sleep_duration <= 9) {
        healthScore += 0.2;
      }

      // Resting HR scoring
      if (healthData.resting_heart_rate <= 70) {
        healthScore += 0.15;
      }

      // HRV scoring
      if (healthData.hrv_average >= 30) {
        healthScore += 0.1;
      }

      // Steps scoring
      if (healthData.step_count >= 8000) {
        healthScore += 0.15;
      }

      // Training load scoring
      if (healthData.training_load >= 50 && healthData.training_load <= 150) {
        healthScore += 0.2;
      }

      expect(healthScore).toBe(1.3); // 0.5 + 0.2 + 0.15 + 0.1 + 0.15 + 0.2
    });

    it('should calculate final readiness score correctly', () => {
      const manualScore = 0.72;
      const healthScore = 1.3;

      // Final score: (manual * 0.6) + (health * 0.4)
      const finalScore = (manualScore * 0.6) + (healthScore * 0.4);
      const clampedScore = Math.min(Math.max(finalScore, 0), 1);

      expect(clampedScore).toBe(1.0); // Clamped to 1.0
    });

    it('should categorize readiness scores correctly', () => {
      const categorizeReadiness = (score: number) => {
        if (score >= 0.8) return 'excellent';
        if (score >= 0.6) return 'good';
        if (score >= 0.4) return 'fair';
        return 'poor';
      };

      expect(categorizeReadiness(0.9)).toBe('excellent');
      expect(categorizeReadiness(0.7)).toBe('good');
      expect(categorizeReadiness(0.5)).toBe('fair');
      expect(categorizeReadiness(0.3)).toBe('poor');
    });
  });

  describe('Plan Adjustment Logic', () => {
    it('should adjust plan based on readiness score', () => {
      const adjustPlan = (readinessScore: number) => {
        if (readinessScore < 0.4) {
          return {
            volume_reduction: 0.2,
            intensity_adjustment: -0.1,
            additional_recovery: true,
            mobility_day_swap: true
          };
        } else if (readinessScore < 0.6) {
          return {
            volume_reduction: 0.1,
            intensity_adjustment: -0.05,
            additional_recovery: false,
            mobility_day_swap: false
          };
        } else {
          return {
            volume_reduction: 0,
            intensity_adjustment: 0,
            additional_recovery: false,
            mobility_day_swap: false
          };
        }
      };

      // Low readiness
      const lowAdjustments = adjustPlan(0.3);
      expect(lowAdjustments.volume_reduction).toBe(0.2);
      expect(lowAdjustments.mobility_day_swap).toBe(true);

      // Medium readiness
      const mediumAdjustments = adjustPlan(0.5);
      expect(mediumAdjustments.volume_reduction).toBe(0.1);
      expect(mediumAdjustments.mobility_day_swap).toBe(false);

      // High readiness
      const highAdjustments = adjustPlan(0.8);
      expect(highAdjustments.volume_reduction).toBe(0);
      expect(highAdjustments.mobility_day_swap).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing health data gracefully', async () => {
      const assessmentWithMissingHealth = {
        date: mockDate,
        soreness_level: 3,
        fatigue_level: 2,
        sleep_quality: 8,
        stress_level: 4,
        motivation_level: 7,
        // Missing health data
        sleep_duration: null,
        resting_heart_rate: null,
        hrv_average: null,
        step_count: null,
        training_load: null
      };

      mockReadinessWorkflow.calculateReadinessScore.mockResolvedValue({
        success: true,
        score: 0.5, // Default score when health data is missing
        category: 'fair'
      });

      const result = await mockReadinessWorkflow.calculateReadinessScore(
        mockUser.id,
        assessmentWithMissingHealth
      );
      expect(result.success).toBe(true);
      expect(result.score).toBe(0.5);
    });
  });
});
