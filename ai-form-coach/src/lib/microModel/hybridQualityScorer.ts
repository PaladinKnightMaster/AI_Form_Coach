/**
 * Hybrid Quality Scorer
 * 
 * This module implements the main quality scoring pipeline that blends
 * rule-based scoring (60%) with micro model scoring (40%).
 */

import type { RepMetric } from '@/lib/validators/types';
import type { 
  MicroModelConfig, 
  QualityPrediction,
  EdgeCaseAnalysis
} from './types';
import { MicroModel } from './microModel';
import { extractQualityFeatures } from './featureExtractor';
import { calculateRepQuality } from '@/lib/validators/formAnalysis';
import { DEFAULT_MICRO_MODEL_CONFIG } from './types';

export interface SessionContext {
  totalReps: number;
  currentRepIndex: number;
  recentReps: RepMetric[];
  sessionDuration: number;
  exercise: 'squat' | 'pushup' | 'plank';
}

export interface HybridQualityResult {
  // Final blended score (0-100)
  finalScore: number;
  
  // Quality classification
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Breakdown of scores
  ruleScore: number;
  modelScore: number;
  ruleWeight: number;
  modelWeight: number;
  
  // Model prediction details
  modelPrediction?: QualityPrediction;
  
  // Edge case analysis
  edgeCaseAnalysis?: EdgeCaseAnalysis;
  
  // Processing metadata
  processingTime: number;
  modelEnabled: boolean;
  modelVersion: string;
}

export class HybridQualityScorer {
  private microModel: MicroModel;
  private config: MicroModelConfig;
  private isInitialized = false;

  constructor(config: Partial<MicroModelConfig> = {}) {
    this.config = { ...DEFAULT_MICRO_MODEL_CONFIG, ...config };
    this.microModel = new MicroModel(this.config);
  }

  /**
   * Initialize the hybrid quality scorer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.microModel.initialize();
      this.isInitialized = true;
      console.log('Hybrid quality scorer initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize hybrid quality scorer:', error);
      // Continue with rules-only mode
      this.isInitialized = true;
    }
  }

  /**
   * Calculate hybrid quality score for a rep
   */
  async calculateQuality(
    rep: RepMetric,
    sessionContext: SessionContext
  ): Promise<HybridQualityResult> {
    const startTime = performance.now();

    // Ensure scorer is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Calculate rule-based score using existing logic
    const ruleScore = this.calculateRuleScore(rep, sessionContext.exercise);
    
    let modelPrediction: QualityPrediction | undefined;
    let edgeCaseAnalysis: EdgeCaseAnalysis | undefined;
    
    // Calculate model score if enabled
    if (this.config.enabled) {
      try {
        // Extract features for the model
        const features = extractQualityFeatures(rep, sessionContext);
        
        // Get model prediction
        modelPrediction = await this.microModel.predictQuality(features, ruleScore);
        
        // Extract edge case analysis from model prediction
        edgeCaseAnalysis = this.analyzeEdgeCase(ruleScore, modelPrediction);
      } catch (error) {
        console.warn('Model prediction failed, falling back to rules:', error);
      }
    }

    // Determine final score
    const finalScore = this.determineFinalScore(ruleScore, modelPrediction);
    
    // Determine quality classification
    const quality = this.classifyQuality(finalScore);
    
    // Calculate processing time
    const processingTime = performance.now() - startTime;

    return {
      finalScore,
      quality,
      ruleScore,
      modelScore: modelPrediction?.modelScore || 0,
      ruleWeight: this.config.ruleWeight,
      modelWeight: this.config.modelWeight,
      modelPrediction,
      edgeCaseAnalysis,
      processingTime,
      modelEnabled: this.config.enabled,
      modelVersion: this.config.modelVersion
    };
  }

  /**
   * Calculate rule-based quality score using existing logic
   */
  private calculateRuleScore(
    rep: RepMetric, 
    exercise: 'squat' | 'pushup' | 'plank'
  ): number {
    // Use the existing calculateRepQuality function
    const { score } = calculateRepQuality(
      rep.errors,
      rep.duration,
      exercise,
      rep[exercise] // Pass exercise-specific metrics
    );
    
    return score;
  }

  /**
   * Determine final score based on model availability and configuration
   */
  private determineFinalScore(
    ruleScore: number, 
    modelPrediction?: QualityPrediction
  ): number {
    if (!modelPrediction || !this.config.enabled) {
      // Fallback to rules-only
      return ruleScore;
    }

    // Use the blended score from the model prediction
    return modelPrediction.finalScore;
  }

  /**
   * Classify quality based on final score
   */
  private classifyQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Analyze edge cases for debugging and improvement
   */
  private analyzeEdgeCase(
    ruleScore: number, 
    modelPrediction?: QualityPrediction
  ): EdgeCaseAnalysis | undefined {
    if (!modelPrediction) return undefined;

    const scoreDifference = Math.abs(ruleScore - modelPrediction.modelScore);
    const isBorderline = this.isBorderlineScore(ruleScore) || this.isBorderlineScore(modelPrediction.modelScore);
    
    const ruleQuality = this.classifyQuality(ruleScore);
    const modelQuality = this.classifyQuality(modelPrediction.modelScore);
    const classificationDisagreement = ruleQuality !== modelQuality;
    
    let suggestedAction: EdgeCaseAnalysis['suggestedAction'] = 'blend';
    if (scoreDifference > 15) {
      suggestedAction = modelPrediction.confidence > 0.7 ? 'use_model' : 'use_rules';
    }
    
    let edgeCaseType: EdgeCaseAnalysis['edgeCaseType'] = 'unknown';
    if (isBorderline) {
      if (Math.abs(ruleScore - 75) < 10) edgeCaseType = 'tempo_borderline';
      else if (Math.abs(ruleScore - 60) < 10) edgeCaseType = 'depth_borderline';
      else if (Math.abs(ruleScore - 45) < 10) edgeCaseType = 'error_borderline';
      else edgeCaseType = 'stability_borderline';
    }
    
    return {
      isBorderline,
      scoreDifference,
      confidenceGap: Math.abs(modelPrediction.confidence - 0.5),
      classificationDisagreement,
      suggestedAction,
      edgeCaseType
    };
  }

  /**
   * Check if a score is in a borderline range
   */
  private isBorderlineScore(score: number): boolean {
    const thresholds = [90, 75, 60, 0];
    return thresholds.some(threshold => Math.abs(score - threshold) <= 10);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MicroModelConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.microModel.updateConfig(this.config);
  }

  /**
   * Enable or disable the model
   */
  setModelEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.microModel.setEnabled(enabled);
  }

  /**
   * Check if model is enabled
   */
  isModelEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): MicroModelConfig {
    return { ...this.config };
  }

  /**
   * Get model cache statistics
   */
  getCacheStats(): { hits: number; misses: number; hitRate: number; size: number } {
    return this.microModel.getCacheStats();
  }

  /**
   * Clear model cache
   */
  clearCache(): void {
    // The cache is managed internally by the micro model
    // This could be extended to expose cache clearing if needed
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    averageProcessingTime: number;
    cacheHitRate: number;
    modelEnabled: boolean;
    totalPredictions: number;
  } {
    const cacheStats = this.getCacheStats();
    return {
      averageProcessingTime: 0, // Could be tracked over time
      cacheHitRate: cacheStats.hitRate,
      modelEnabled: this.config.enabled,
      totalPredictions: cacheStats.hits + cacheStats.misses
    };
  }
}

// Singleton instance for global use
let hybridQualityScorer: HybridQualityScorer | null = null;

/**
 * Get the global hybrid quality scorer instance
 */
export function getHybridQualityScorer(): HybridQualityScorer {
  if (!hybridQualityScorer) {
    hybridQualityScorer = new HybridQualityScorer();
  }
  return hybridQualityScorer;
}

/**
 * Initialize the global hybrid quality scorer
 */
export async function initializeHybridQualityScorer(config?: Partial<MicroModelConfig>): Promise<void> {
  const scorer = getHybridQualityScorer();
  if (config) {
    scorer.updateConfig(config);
  }
  await scorer.initialize();
}
