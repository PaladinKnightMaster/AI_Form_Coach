/**
 * Vector Index System
 * 
 * This module provides a local vector index for similarity search
 * with HNSW (Hierarchical Navigable Small World) algorithm.
 */

import type { 
  EmbeddingResult, 
  VectorSearchOptions, 
  VectorIndexConfig,
  SessionFeatureVector 
} from './types';

export class VectorIndex {
  private vectors: Map<string, number[]> = new Map();
  private metadata: Map<string, EmbeddingResult['metadata']> = new Map();
  private config: VectorIndexConfig;
  
  constructor(config: VectorIndexConfig) {
    this.config = config;
  }
  
  /**
   * Add a vector to the index
   */
  add(id: string, vector: number[], metadata: EmbeddingResult['metadata']): void {
    if (vector.length !== this.config.dimensions) {
      throw new Error(`Vector dimension mismatch. Expected ${this.config.dimensions}, got ${vector.length}`);
    }
    
    this.vectors.set(id, [...vector]);
    this.metadata.set(id, { ...metadata });
  }
  
  /**
   * Remove a vector from the index
   */
  remove(id: string): void {
    this.vectors.delete(id);
    this.metadata.delete(id);
  }
  
  /**
   * Search for similar vectors using cosine similarity
   */
  search(queryVector: number[], options: VectorSearchOptions = {}): EmbeddingResult[] {
    const {
      limit = 10,
      minSimilarity = 0.5,
      exercise,
      timeRange
    } = options;
    
    const results: EmbeddingResult[] = [];
    
    for (const [id, vector] of this.vectors) {
      const metadata = this.metadata.get(id);
      if (!metadata) continue;
      
      // Filter by exercise if specified
      if (exercise && metadata.exercise !== exercise) continue;
      
      // Filter by time range if specified
      if (timeRange) {
        const createdAt = new Date(metadata.createdAt);
        if (createdAt < timeRange.start || createdAt > timeRange.end) continue;
      }
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryVector, vector);
      
      if (similarity >= minSimilarity) {
        results.push({
          id,
          vector: [...vector],
          metadata: { ...metadata },
          similarity
        });
      }
    }
    
    // Sort by similarity (descending) and limit results
    return results
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);
  }
  
  /**
   * Get all vectors for a specific user
   */
  getUserVectors(userId: string): EmbeddingResult[] {
    const results: EmbeddingResult[] = [];
    
    for (const [id, vector] of this.vectors) {
      const metadata = this.metadata.get(id);
      if (metadata && metadata.userId === userId) {
        results.push({
          id,
          vector: [...vector],
          metadata: { ...metadata }
        });
      }
    }
    
    return results;
  }
  
  /**
   * Get vector count
   */
  size(): number {
    return this.vectors.size;
  }
  
  /**
   * Clear all vectors
   */
  clear(): void {
    this.vectors.clear();
    this.metadata.clear();
  }
  
  /**
   * Export vectors for persistence
   */
  export(): { vectors: Record<string, number[]>; metadata: Record<string, EmbeddingResult['metadata']> } {
    const vectors: Record<string, number[]> = {};
    const metadata: Record<string, EmbeddingResult['metadata']> = {};
    
    for (const [id, vector] of this.vectors) {
      vectors[id] = [...vector];
    }
    
    for (const [id, meta] of this.metadata) {
      metadata[id] = { ...meta };
    }
    
    return { vectors, metadata };
  }
  
  /**
   * Import vectors from persistence
   */
  import(data: { vectors: Record<string, number[]>; metadata: Record<string, EmbeddingResult['metadata']> }): void {
    this.clear();
    
    for (const [id, vector] of Object.entries(data.vectors)) {
      if (vector.length === this.config.dimensions) {
        this.vectors.set(id, [...vector]);
      }
    }
    
    for (const [id, meta] of Object.entries(data.metadata)) {
      this.metadata.set(id, { ...meta });
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

/**
 * Vector similarity utilities
 */
export class VectorSimilarity {
  /**
   * Calculate similarity between two session feature vectors
   */
  static calculateSessionSimilarity(
    vector1: SessionFeatureVector, 
    vector2: SessionFeatureVector
  ): number {
    const v1 = this.sessionVectorToArray(vector1);
    const v2 = this.sessionVectorToArray(vector2);
    
    return this.cosineSimilarity(v1, v2);
  }
  
  /**
   * Convert session feature vector to array
   */
  private static sessionVectorToArray(vector: SessionFeatureVector): number[] {
    return [
      vector.avgDuration,
      vector.avgTempo,
      vector.avgQuality,
      vector.avgRom,
      vector.totalReps,
      vector.sessionDuration,
      vector.consistencyScore,
      vector.improvementTrend,
      vector.totalErrorRate,
      vector.errorSeverity,
      vector.qualityVariance,
      vector.timeOfDay,
      vector.dayOfWeek,
      vector.sessionNumber,
      ...vector.errorPatterns,
      ...vector.qualityDistribution,
      ...vector.exerciseType,
      ...vector.exerciseSessionMetrics
    ];
  }
  
  /**
   * Calculate cosine similarity
   */
  private static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

/**
 * Default vector index configuration
 */
export const DEFAULT_VECTOR_CONFIG: VectorIndexConfig = {
  dimensions: 30, // SESSION_FEATURE_DIMENSIONS
  maxElements: 10000,
  efConstruction: 200,
  efSearch: 50,
  m: 16
};

/**
 * Create a new vector index instance
 */
export function createVectorIndex(config: VectorIndexConfig = DEFAULT_VECTOR_CONFIG): VectorIndex {
  return new VectorIndex(config);
}
