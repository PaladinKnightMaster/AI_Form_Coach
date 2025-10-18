/**
 * Movement Embeddings Types
 * 
 * This module defines the types for creating feature vectors from rep/session data
 * to enable similarity search and personalization.
 */

export interface RepFeatureVector {
  // Basic metrics (normalized 0-1)
  duration: number;           // Rep duration normalized by exercise type
  tempo: number;             // Tempo score (fast=0, normal=0.5, slow=1)
  quality: number;           // Quality score (0-100) / 100
  rom: number;              // Range of motion score (0-100) / 100
  
  // Depth and movement metrics
  peakDepth: number;        // Peak depth normalized by exercise type
  depthConsistency: number; // How consistent depth was across rep
  
  // Error metrics
  errorRate: number;        // Number of errors / max possible errors
  errorSeverity: number;    // Weighted error severity (0-1)
  errorTypes: number[];     // One-hot encoded error types
  
  // Symmetry metrics (for bilateral exercises)
  leftRightBalance: number; // Balance between left/right sides (0-1)
  symmetryScore: number;    // Overall symmetry score (0-1)
  
  // Visibility and tracking
  visibilityScore: number;  // Pose tracking quality (0-1)
  confidence: number;       // AI confidence in measurements (0-1)
  
  // Exercise-specific features
  exerciseType: number[];   // One-hot encoded exercise type
  exerciseMetrics: number[]; // Exercise-specific normalized metrics
}

export interface SessionFeatureVector {
  // Aggregated rep metrics
  avgDuration: number;      // Average rep duration
  avgTempo: number;         // Average tempo score
  avgQuality: number;       // Average quality score
  avgRom: number;          // Average ROM score
  
  // Session-level metrics
  totalReps: number;        // Total reps (normalized by typical session size)
  sessionDuration: number;  // Total session time (normalized)
  consistencyScore: number; // Form consistency across reps
  improvementTrend: number; // Trend in quality over session
  
  // Error patterns
  totalErrorRate: number;   // Overall error rate
  errorPatterns: number[];  // Error type distribution
  errorSeverity: number;    // Average error severity
  
  // Quality distribution
  qualityDistribution: number[]; // Distribution of rep qualities
  qualityVariance: number;  // Variance in quality scores
  
  // Exercise-specific session metrics
  exerciseType: number[];   // One-hot encoded exercise type
  exerciseSessionMetrics: number[]; // Exercise-specific session metrics
  
  // Temporal features
  timeOfDay: number;        // Hour of day (0-1)
  dayOfWeek: number;        // Day of week (0-1)
  sessionNumber: number;    // Session number for this exercise (normalized)
}

export interface EmbeddingResult {
  id: string;
  vector: number[];
  metadata: {
    sessionId: string;
    exercise: 'squat' | 'pushup' | 'plank';
    createdAt: string;
    userId: string;
  };
  similarity?: number;
}

export interface SimilarSession {
  sessionId: string;
  similarity: number;
  exercise: 'squat' | 'pushup' | 'plank';
  createdAt: string;
  totalReps: number;
  avgQuality: number;
  avgRom: number;
  keyDifferences: string[];
  insights: string[];
}

export interface VectorSearchOptions {
  limit?: number;
  minSimilarity?: number;
  exercise?: 'squat' | 'pushup' | 'plank';
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface VectorIndexConfig {
  dimensions: number;
  maxElements: number;
  efConstruction: number;
  efSearch: number;
  m: number;
}

// Constants for feature vector dimensions
export const REP_FEATURE_DIMENSIONS = 25; // Total dimensions for rep vectors
export const SESSION_FEATURE_DIMENSIONS = 30; // Total dimensions for session vectors

// Error type mapping for one-hot encoding
export const ERROR_TYPES = [
  'depth_low',
  'knee_valgus', 
  'chest_drop',
  'hip_sag',
  'tempo_fast',
  'tempo_slow',
  'bodyline_poor',
  'excessive_forward_lean',
  'back_rounding',
  'knees_out',
  'go_deeper',
  'chest_up',
  'shoulders_back',
  'head_neutral',
  'breathing_control',
  'pace_up',
  'pace_down',
  'smooth_movement',
  'consistent_tempo'
];

// Exercise type mapping
export const EXERCISE_TYPES = ['squat', 'pushup', 'plank'];

// Quality levels mapping
export const QUALITY_LEVELS = ['poor', 'fair', 'good', 'excellent'];
