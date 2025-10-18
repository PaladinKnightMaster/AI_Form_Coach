/**
 * Micro Model Types
 * 
 * This module defines the types for the on-device quality scorer
 * that blends rule-based scoring with a tiny learned model.
 */

export interface MicroModelConfig {
  // Feature flag for enabling/disabling the model
  enabled: boolean;
  
  // Blending weights (must sum to 1.0)
  ruleWeight: number;    // 0.6 (60%)
  modelWeight: number;   // 0.4 (40%)
  
  // Model configuration
  modelVersion: string;
  inputDimensions: number;
  hiddenDimensions: number;
  outputDimensions: number;
  
  // Performance settings
  quantizationLevel: 'int8' | 'int16' | 'float32';
  enableCaching: boolean;
  cacheSize: number;
}

export interface QualityFeatures {
  // Basic rep metrics (normalized 0-1)
  duration: number;           // Rep duration normalized by exercise type
  tempo: number;             // Tempo score (fast=0, normal=0.5, slow=1)
  rom: number;               // Range of motion score (0-1)
  
  // Error metrics
  errorCount: number;        // Number of errors (normalized)
  errorSeverity: number;     // Weighted error severity (0-1)
  criticalErrorRatio: number; // Ratio of critical errors to total errors
  
  // Exercise-specific features
  depth: number;             // Depth achieved (normalized by exercise)
  stability: number;         // Movement stability score (0-1)
  symmetry: number;          // Left-right symmetry score (0-1)
  
  // Context features
  repIndex: number;          // Position in session (normalized)
  sessionProgress: number;   // Progress through session (0-1)
  fatigueIndicator: number;  // Fatigue indicator based on recent reps
  
  // Pose quality features
  visibilityScore: number;   // Pose tracking quality (0-1)
  confidenceScore: number;   // AI confidence in measurements (0-1)
  
  // Exercise type encoding (one-hot)
  exerciseType: [number, number, number]; // [squat, pushup, plank]
}

export interface QualityPrediction {
  // Raw model output (0-1)
  modelScore: number;
  
  // Blended final score (0-100)
  finalScore: number;
  
  // Quality classification
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Confidence in prediction
  confidence: number;
  
  // Breakdown of scores
  breakdown: {
    ruleScore: number;
    modelScore: number;
    ruleWeight: number;
    modelWeight: number;
  };
  
  // Model metadata
  modelVersion: string;
  processingTime: number; // milliseconds
}

export interface MicroModelWeights {
  // Input layer weights (inputDimensions x hiddenDimensions)
  inputWeights: number[][];
  
  // Hidden layer bias
  hiddenBias: number[];
  
  // Output layer weights (hiddenDimensions x outputDimensions)
  outputWeights: number[][];
  
  // Output layer bias
  outputBias: number[];
  
  // Model metadata
  version: string;
  trainingDate: string;
  accuracy: number;
  quantizationLevel: 'int8' | 'int16' | 'float32';
}

export interface ModelCache {
  // Cache for frequently used predictions
  cache: Map<string, QualityPrediction>;
  
  // Cache statistics
  hits: number;
  misses: number;
  maxSize: number;
  
  // Cache management
  lastCleanup: number;
  cleanupInterval: number; // milliseconds
}

export interface EdgeCaseAnalysis {
  // Identify borderline cases where model vs rules disagree
  isBorderline: boolean;
  
  // Disagreement metrics
  scoreDifference: number;  // |modelScore - ruleScore|
  confidenceGap: number;    // Difference in confidence levels
  
  // Classification disagreement
  classificationDisagreement: boolean;
  
  // Suggested action
  suggestedAction: 'use_model' | 'use_rules' | 'blend' | 'flag_for_review';
  
  // Edge case metadata
  edgeCaseType: 'tempo_borderline' | 'depth_borderline' | 'error_borderline' | 'stability_borderline' | 'unknown';
}

// Constants for the micro model system
export const DEFAULT_MICRO_MODEL_CONFIG: MicroModelConfig = {
  enabled: false, // Start with model disabled
  ruleWeight: 0.6,
  modelWeight: 0.4,
  modelVersion: '1.0.0',
  inputDimensions: 15, // Number of features in QualityFeatures
  hiddenDimensions: 8,  // Small hidden layer for on-device performance
  outputDimensions: 1,  // Single output (quality score)
  quantizationLevel: 'int8',
  enableCaching: true,
  cacheSize: 100
};

// Quality thresholds for classification
export const QUALITY_THRESHOLDS = {
  excellent: 90,
  good: 75,
  fair: 60,
  poor: 0
} as const;

// Edge case detection thresholds
export const EDGE_CASE_THRESHOLDS = {
  scoreDifference: 15,      // Significant difference between model and rules
  confidenceGap: 0.3,       // Large confidence gap
  borderlineRange: 10,      // Range around quality thresholds
} as const;
