/**
 * Micro Model Implementation
 * 
 * This module implements a tiny on-device MLP for quality scoring
 * that can be quantized and cached for performance.
 */

import type { 
  MicroModelConfig, 
  QualityFeatures, 
  QualityPrediction, 
  MicroModelWeights,
  ModelCache,
  EdgeCaseAnalysis
} from './types';
import { featuresToArray, createFeatureCacheKey } from './featureExtractor';
import { DEFAULT_MICRO_MODEL_CONFIG, QUALITY_THRESHOLDS, EDGE_CASE_THRESHOLDS } from './types';

export class MicroModel {
  private config: MicroModelConfig;
  private weights: MicroModelWeights | null = null;
  private cache: ModelCache;
  private isInitialized = false;

  constructor(config: Partial<MicroModelConfig> = {}) {
    this.config = { ...DEFAULT_MICRO_MODEL_CONFIG, ...config };
    this.cache = this.initializeCache();
  }

  /**
   * Initialize the micro model with weights
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load model weights (for now, use stubbed weights)
      this.weights = await this.loadModelWeights();
      this.isInitialized = true;
      console.log('Micro model initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize micro model:', error);
      // Continue with stubbed weights
      this.weights = this.createStubbedWeights();
      this.isInitialized = true;
    }
  }

  /**
   * Predict quality score using the micro model
   */
  async predictQuality(
    features: QualityFeatures,
    ruleScore: number
  ): Promise<QualityPrediction> {
    const startTime = performance.now();

    // Check cache first
    const cacheKey = createFeatureCacheKey(features);
    if (this.config.enableCaching && this.cache.cache.has(cacheKey)) {
      this.cache.hits++;
      const cached = this.cache.cache.get(cacheKey)!;
      return {
        ...cached,
        processingTime: performance.now() - startTime
      };
    }

    this.cache.misses++;

    // Ensure model is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Get model prediction
    const modelScore = this.config.enabled && this.weights 
      ? this.runModel(features)
      : this.stubbedModelPrediction(features);

    // Blend with rule score
    const finalScore = this.blendScores(ruleScore, modelScore);
    
    // Determine quality classification
    const quality = this.classifyQuality(finalScore);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(features, ruleScore, modelScore);
    
    // Analyze for edge cases (stored for debugging but not used in current implementation)
    this.analyzeEdgeCase(ruleScore, modelScore, confidence);

    const prediction: QualityPrediction = {
      modelScore: modelScore * 100, // Convert to 0-100 scale
      finalScore,
      quality,
      confidence,
      breakdown: {
        ruleScore,
        modelScore: modelScore * 100,
        ruleWeight: this.config.ruleWeight,
        modelWeight: this.config.modelWeight
      },
      modelVersion: this.config.modelVersion,
      processingTime: performance.now() - startTime
    };

    // Cache the result
    if (this.config.enableCaching) {
      this.cacheResult(cacheKey, prediction);
    }

    return prediction;
  }

  /**
   * Run the actual micro model (MLP forward pass)
   */
  private runModel(features: QualityFeatures): number {
    if (!this.weights) {
      return this.stubbedModelPrediction(features);
    }

    const input = featuresToArray(features);
    
    // Forward pass through the network
    const hidden = this.forwardPass(input, this.weights.inputWeights, this.weights.hiddenBias);
    const output = this.forwardPass(hidden, this.weights.outputWeights, this.weights.outputBias);
    
    // Apply sigmoid activation to get 0-1 output
    return this.sigmoid(output[0]);
  }

  /**
   * Forward pass through a layer
   */
  private forwardPass(input: number[], weights: number[][], bias: number[]): number[] {
    const output: number[] = [];
    
    for (let i = 0; i < weights[0].length; i++) {
      let sum = bias[i];
      for (let j = 0; j < input.length; j++) {
        sum += input[j] * weights[j][i];
      }
      output.push(this.relu(sum)); // ReLU activation for hidden layer
    }
    
    return output;
  }

  /**
   * ReLU activation function
   */
  private relu(x: number): number {
    return Math.max(0, x);
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Stubbed model prediction for when model is disabled or unavailable
   */
  private stubbedModelPrediction(features: QualityFeatures): number {
    // Simple heuristic-based prediction that mimics a learned model
    let score = 0.5; // Base score
    
    // Adjust based on key features
    score += features.rom * 0.2;           // ROM is important
    score += (1 - features.errorCount) * 0.2; // Fewer errors is better
    score += features.depth * 0.15;        // Depth matters
    score += features.stability * 0.15;    // Stability matters
    score += (1 - features.fatigueIndicator) * 0.1; // Less fatigue is better
    score += features.symmetry * 0.1;      // Symmetry matters
    score += features.confidenceScore * 0.1; // Confidence matters
    
    // Apply some non-linearity to mimic learned behavior
    score = Math.pow(score, 1.2);
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Blend rule score with model score
   */
  private blendScores(ruleScore: number, modelScore: number): number {
    const blended = (ruleScore * this.config.ruleWeight) + (modelScore * 100 * this.config.modelWeight);
    return Math.max(0, Math.min(100, blended));
  }

  /**
   * Classify quality based on final score
   */
  private classifyQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= QUALITY_THRESHOLDS.excellent) return 'excellent';
    if (score >= QUALITY_THRESHOLDS.good) return 'good';
    if (score >= QUALITY_THRESHOLDS.fair) return 'fair';
    return 'poor';
  }

  /**
   * Calculate confidence in the prediction
   */
  private calculateConfidence(
    features: QualityFeatures, 
    ruleScore: number, 
    modelScore: number
  ): number {
    // Base confidence on feature quality and agreement between rule and model
    let confidence = 0.5;
    
    // Higher confidence for better feature quality
    confidence += features.visibilityScore * 0.2;
    confidence += features.confidenceScore * 0.2;
    
    // Higher confidence when rule and model agree
    const scoreDifference = Math.abs(ruleScore - (modelScore * 100));
    const agreement = Math.max(0, 1 - (scoreDifference / 50)); // Normalize difference
    confidence += agreement * 0.3;
    
    // Lower confidence for edge cases
    if (this.isBorderlineScore(ruleScore) || this.isBorderlineScore(modelScore * 100)) {
      confidence *= 0.8;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Analyze if this is an edge case
   */
  private analyzeEdgeCase(
    ruleScore: number, 
    modelScore: number, 
    confidence: number
  ): EdgeCaseAnalysis {
    const scoreDifference = Math.abs(ruleScore - (modelScore * 100));
    const isBorderline = this.isBorderlineScore(ruleScore) || this.isBorderlineScore(modelScore * 100);
    
    const ruleQuality = this.classifyQuality(ruleScore);
    const modelQuality = this.classifyQuality(modelScore * 100);
    const classificationDisagreement = ruleQuality !== modelQuality;
    
    let suggestedAction: EdgeCaseAnalysis['suggestedAction'] = 'blend';
    if (scoreDifference > EDGE_CASE_THRESHOLDS.scoreDifference) {
      suggestedAction = confidence > 0.7 ? 'use_model' : 'use_rules';
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
      confidenceGap: Math.abs(confidence - 0.5),
      classificationDisagreement,
      suggestedAction,
      edgeCaseType
    };
  }

  /**
   * Check if a score is in a borderline range
   */
  private isBorderlineScore(score: number): boolean {
    const thresholds = Object.values(QUALITY_THRESHOLDS);
    return thresholds.some(threshold => 
      Math.abs(score - threshold) <= EDGE_CASE_THRESHOLDS.borderlineRange
    );
  }

  /**
   * Load model weights (stubbed for now)
   */
  private async loadModelWeights(): Promise<MicroModelWeights> {
    // In a real implementation, this would load from a file or API
    // For now, return stubbed weights
    return this.createStubbedWeights();
  }

  /**
   * Create stubbed weights for testing
   */
  private createStubbedWeights(): MicroModelWeights {
    const inputDim = this.config.inputDimensions;
    const hiddenDim = this.config.hiddenDimensions;
    const outputDim = this.config.outputDimensions;
    
    return {
      inputWeights: Array(inputDim).fill(null).map(() => 
        Array(hiddenDim).fill(0).map(() => (Math.random() - 0.5) * 0.1)
      ),
      hiddenBias: Array(hiddenDim).fill(0).map(() => (Math.random() - 0.5) * 0.1),
      outputWeights: Array(hiddenDim).fill(null).map(() => 
        Array(outputDim).fill(0).map(() => (Math.random() - 0.5) * 0.1)
      ),
      outputBias: Array(outputDim).fill(0).map(() => (Math.random() - 0.5) * 0.1),
      version: this.config.modelVersion,
      trainingDate: new Date().toISOString(),
      accuracy: 0.85, // Stubbed accuracy
      quantizationLevel: this.config.quantizationLevel
    };
  }

  /**
   * Initialize cache
   */
  private initializeCache(): ModelCache {
    return {
      cache: new Map(),
      hits: 0,
      misses: 0,
      maxSize: this.config.cacheSize,
      lastCleanup: Date.now(),
      cleanupInterval: 300000 // 5 minutes
    };
  }

  /**
   * Cache a prediction result
   */
  private cacheResult(key: string, prediction: QualityPrediction): void {
    // Clean cache if needed
    if (this.cache.cache.size >= this.cache.maxSize) {
      this.cleanupCache();
    }
    
    this.cache.cache.set(key, prediction);
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    if (now - this.cache.lastCleanup < this.cache.cleanupInterval) {
      return;
    }
    
    // Remove oldest entries (simple LRU)
    const entries = Array.from(this.cache.cache.entries());
    const toRemove = Math.floor(entries.length * 0.2); // Remove 20%
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.cache.delete(entries[i][0]);
    }
    
    this.cache.lastCleanup = now;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this.cache.hits + this.cache.misses;
    return {
      hits: this.cache.hits,
      misses: this.cache.misses,
      hitRate: total > 0 ? this.cache.hits / total : 0,
      size: this.cache.cache.size
    };
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig: Partial<MicroModelConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if model is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable or disable the model
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}
