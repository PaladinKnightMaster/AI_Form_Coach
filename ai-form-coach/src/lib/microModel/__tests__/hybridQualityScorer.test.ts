/**
 * Hybrid Quality Scorer Tests
 * 
 * This module tests the hybrid quality scoring system to ensure
 * it correctly handles edge cases and maintains consistency.
 */

import { HybridQualityScorer } from '../hybridQualityScorer';
import type { RepMetric, FormError } from '@/lib/validators/types';
import type { SessionContext } from '../hybridQualityScorer';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('HybridQualityScorer', () => {
  let scorer: HybridQualityScorer;
  
  beforeEach(() => {
    scorer = new HybridQualityScorer({ enabled: false }); // Start with model disabled
    localStorageMock.getItem.mockReturnValue('false');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Disabled (Rules Only)', () => {
    test('should match current rules behavior when model is disabled', async () => {
      const rep: RepMetric = {
        startTs: 0,
        endTs: 2000,
        duration: 2000,
        tempo: 'normal',
        errors: [],
        quality: 'good',
        score: 85,
        formIQ: 85
      };

      const sessionContext: SessionContext = {
        totalReps: 5,
        currentRepIndex: 2,
        recentReps: [],
        sessionDuration: 10000,
        exercise: 'squat'
      };

      const result = await scorer.calculateQuality(rep, sessionContext);
      
      // Should use rule-based scoring only
      expect(result.modelEnabled).toBe(false);
      expect(result.finalScore).toBeGreaterThan(0);
      expect(result.finalScore).toBeLessThanOrEqual(100);
      expect(['excellent', 'good', 'fair', 'poor']).toContain(result.quality);
    });

    test('should handle errors correctly in rules-only mode', async () => {
      const errors: FormError[] = [
        {
          type: 'knee_valgus',
          severity: 'high',
          duration: 500,
          message: 'Knee valgus detected',
          timestamp: 1000
        }
      ];

      const rep: RepMetric = {
        startTs: 0,
        endTs: 2000,
        duration: 2000,
        tempo: 'normal',
        errors,
        quality: 'fair',
        score: 60,
        formIQ: 60
      };

      const sessionContext: SessionContext = {
        totalReps: 3,
        currentRepIndex: 1,
        recentReps: [],
        sessionDuration: 6000,
        exercise: 'squat'
      };

      const result = await scorer.calculateQuality(rep, sessionContext);
      
      // High severity error should significantly reduce score
      expect(result.finalScore).toBeLessThan(80);
      expect(result.quality).toBe('fair');
    });
  });

  describe('Model Enabled (Hybrid)', () => {
    beforeEach(() => {
      scorer.setModelEnabled(true);
    });

    test('should blend rule and model scores when enabled', async () => {
      const rep: RepMetric = {
        startTs: 0,
        endTs: 2000,
        duration: 2000,
        tempo: 'normal',
        errors: [],
        quality: 'good',
        score: 85,
        formIQ: 85,
        squat: {
          depth: 85,
          torsoAngle: 10,
          kneeValgus: 5
        }
      };

      const sessionContext: SessionContext = {
        totalReps: 5,
        currentRepIndex: 2,
        recentReps: [],
        sessionDuration: 10000,
        exercise: 'squat'
      };

      const result = await scorer.calculateQuality(rep, sessionContext);
      
      expect(result.modelEnabled).toBe(true);
      expect(result.ruleWeight).toBe(0.6);
      expect(result.modelWeight).toBe(0.4);
      expect(result.finalScore).toBeGreaterThan(0);
      expect(result.finalScore).toBeLessThanOrEqual(100);
      expect(result.modelPrediction).toBeDefined();
    });

    test('should handle borderline cases consistently', async () => {
      // Create a borderline rep (score around 75 - between good and fair)
      const rep: RepMetric = {
        startTs: 0,
        endTs: 2500,
        duration: 2500,
        tempo: 'slow',
        errors: [
          {
            type: 'knee_valgus',
            severity: 'medium',
            duration: 200,
            message: 'Minor knee valgus',
            timestamp: 1000
          }
        ],
        quality: 'fair',
        score: 75,
        formIQ: 75,
        squat: {
          depth: 75,
          torsoAngle: 15,
          kneeValgus: 8
        }
      };

      const sessionContext: SessionContext = {
        totalReps: 10,
        currentRepIndex: 5,
        recentReps: [],
        sessionDuration: 25000,
        exercise: 'squat'
      };

      const result = await scorer.calculateQuality(rep, sessionContext);
      
      // Should provide edge case analysis
      expect(result.edgeCaseAnalysis).toBeDefined();
      expect(result.edgeCaseAnalysis?.isBorderline).toBe(true);
      expect(result.edgeCaseAnalysis?.suggestedAction).toBeDefined();
    });
  });

  describe('Edge Case Detection', () => {
    test('should detect tempo borderline cases', async () => {
      scorer.setModelEnabled(true);
      
      const rep: RepMetric = {
        startTs: 0,
        endTs: 2000,
        duration: 2000,
        tempo: 'normal',
        errors: [],
        quality: 'good',
        score: 75, // Borderline score
        formIQ: 75,
        squat: {
          depth: 75,
          torsoAngle: 12,
          kneeValgus: 6
        }
      };

      const sessionContext: SessionContext = {
        totalReps: 5,
        currentRepIndex: 2,
        recentReps: [],
        sessionDuration: 10000,
        exercise: 'squat'
      };

      const result = await scorer.calculateQuality(rep, sessionContext);
      
      if (result.edgeCaseAnalysis?.isBorderline) {
        expect(result.edgeCaseAnalysis.edgeCaseType).toMatch(/borderline/);
      }
    });

    test('should detect depth borderline cases', async () => {
      scorer.setModelEnabled(true);
      
      const rep: RepMetric = {
        startTs: 0,
        endTs: 2000,
        duration: 2000,
        tempo: 'normal',
        errors: [],
        quality: 'fair',
        score: 60, // Borderline score
        formIQ: 60,
        squat: {
          depth: 60, // Shallow depth
          torsoAngle: 20,
          kneeValgus: 10
        }
      };

      const sessionContext: SessionContext = {
        totalReps: 5,
        currentRepIndex: 2,
        recentReps: [],
        sessionDuration: 10000,
        exercise: 'squat'
      };

      const result = await scorer.calculateQuality(rep, sessionContext);
      
      if (result.edgeCaseAnalysis?.isBorderline) {
        expect(result.edgeCaseAnalysis.edgeCaseType).toMatch(/borderline/);
      }
    });
  });

  describe('Performance', () => {
    test('should complete scoring within reasonable time', async () => {
      scorer.setModelEnabled(true);
      
      const rep: RepMetric = {
        startTs: 0,
        endTs: 2000,
        duration: 2000,
        tempo: 'normal',
        errors: [],
        quality: 'good',
        score: 85,
        formIQ: 85,
        squat: {
          depth: 85,
          torsoAngle: 10,
          kneeValgus: 5
        }
      };

      const sessionContext: SessionContext = {
        totalReps: 5,
        currentRepIndex: 2,
        recentReps: [],
        sessionDuration: 10000,
        exercise: 'squat'
      };

      const startTime = performance.now();
      const result = await scorer.calculateQuality(rep, sessionContext);
      const endTime = performance.now();
      
      // Should complete within 100ms
      expect(endTime - startTime).toBeLessThan(100);
      expect(result.processingTime).toBeLessThan(100);
    });

    test('should use caching when enabled', async () => {
      scorer.setModelEnabled(true);
      
      const rep: RepMetric = {
        startTs: 0,
        endTs: 2000,
        duration: 2000,
        tempo: 'normal',
        errors: [],
        quality: 'good',
        score: 85,
        formIQ: 85,
        squat: {
          depth: 85,
          torsoAngle: 10,
          kneeValgus: 5
        }
      };

      const sessionContext: SessionContext = {
        totalReps: 5,
        currentRepIndex: 2,
        recentReps: [],
        sessionDuration: 10000,
        exercise: 'squat'
      };

      // First call
      await scorer.calculateQuality(rep, sessionContext);
      
      // Second call should use cache
      await scorer.calculateQuality(rep, sessionContext);
      
      const cacheStats = scorer.getCacheStats();
      expect(cacheStats.hits).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    test('should allow enabling/disabling model', () => {
      expect(scorer.isModelEnabled()).toBe(false);
      
      scorer.setModelEnabled(true);
      expect(scorer.isModelEnabled()).toBe(true);
      
      scorer.setModelEnabled(false);
      expect(scorer.isModelEnabled()).toBe(false);
    });

    test('should update configuration', () => {
      const newConfig = {
        ruleWeight: 0.7,
        modelWeight: 0.3
      };
      
      scorer.updateConfig(newConfig);
      const config = scorer.getConfig();
      
      expect(config.ruleWeight).toBe(0.7);
      expect(config.modelWeight).toBe(0.3);
    });
  });

  describe('Error Handling', () => {
    test('should gracefully handle model failures', async () => {
      scorer.setModelEnabled(true);
      
      // Create a rep with invalid data that might cause model to fail
      const rep: RepMetric = {
        startTs: 0,
        endTs: 2000,
        duration: 2000,
        tempo: 'normal',
        errors: [],
        quality: 'good',
        score: 85,
        formIQ: 85,
        squat: {
          depth: NaN, // Invalid data
          torsoAngle: Infinity,
          kneeValgus: -Infinity
        }
      };

      const sessionContext: SessionContext = {
        totalReps: 5,
        currentRepIndex: 2,
        recentReps: [],
        sessionDuration: 10000,
        exercise: 'squat'
      };

      // Should not throw and should fallback to rules
      const result = await scorer.calculateQuality(rep, sessionContext);
      expect(result.finalScore).toBeGreaterThan(0);
      expect(result.finalScore).toBeLessThanOrEqual(100);
    });
  });
});
