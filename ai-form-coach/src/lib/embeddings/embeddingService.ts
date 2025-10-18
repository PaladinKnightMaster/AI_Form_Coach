/**
 * Embedding Service
 * 
 * This module provides the main service for managing movement embeddings,
 * including local storage, Supabase sync, and similarity search.
 */

import { createVectorIndex, VectorIndex } from './vectorIndex';
import { extractSessionFeatureVector } from './featureExtractor';
import type { 
  SessionFeatureVector, 
  SimilarSession, 
  VectorSearchOptions,
  EmbeddingResult 
} from './types';
import type { SessionSummary } from '@/lib/validators/sessionAnalysis';

export class EmbeddingService {
  private localIndex: VectorIndex;
  private isInitialized = false;
  
  constructor() {
    this.localIndex = createVectorIndex();
  }
  
  /**
   * Initialize the embedding service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load local index from localStorage
      await this.loadLocalIndex();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize embedding service:', error);
      this.isInitialized = true; // Continue without local cache
    }
  }
  
  /**
   * Generate and store embedding for a session
   */
  async generateSessionEmbedding(
    sessionId: string,
    sessionSummary: SessionSummary,
    exercise: 'squat' | 'pushup' | 'plank',
    userId: string,
    sessionMetadata: {
      totalReps: number;
      sessionDuration: number;
      createdAt: Date;
      sessionNumber: number;
    }
  ): Promise<void> {
    try {
      // Extract feature vector
      const featureVector = extractSessionFeatureVector(
        sessionSummary,
        exercise,
        sessionMetadata
      );
      
      // Convert to array for storage
      const vectorArray = this.sessionVectorToArray(featureVector);
      
      // Store in local index
      this.localIndex.add(sessionId, vectorArray, {
        sessionId,
        exercise,
        createdAt: sessionMetadata.createdAt.toISOString(),
        userId
      });
      
      // Store in Supabase
      await this.storeEmbeddingInSupabase(sessionId, {
        sessionId,
        exercise,
        createdAt: sessionMetadata.createdAt.toISOString(),
        userId
      }, vectorArray, {
        totalReps: sessionMetadata.totalReps,
        avgQuality: sessionSummary.averageQuality,
        avgRom: this.calculateAverageRom(sessionSummary),
        sessionDuration: sessionMetadata.sessionDuration
      });
      
      // Save local index
      await this.saveLocalIndex();
      
    } catch (error) {
      console.error('Failed to generate session embedding:', error);
      throw error;
    }
  }
  
  /**
   * Find similar sessions
   */
  async findSimilarSessions(
    sessionId: string,
    userId: string,
    options: VectorSearchOptions = {}
  ): Promise<SimilarSession[]> {
    try {
      // Get the target session's vector
      const targetResult = this.localIndex.search([], { limit: 1 })
        .find(result => result.metadata.sessionId === sessionId);
      
      if (!targetResult) {
        // Fallback to Supabase search
        return await this.findSimilarSessionsInSupabase(sessionId, userId, options);
      }
      
      // Search local index
      const results = this.localIndex.search(targetResult.vector, {
        ...options,
        limit: options.limit || 5
      });
      
      // Convert to SimilarSession format
      return await Promise.all(
        results.map(async (result) => {
          const insights = await this.generateInsights(result, targetResult);
          return {
            sessionId: result.metadata.sessionId,
            similarity: result.similarity || 0,
            exercise: result.metadata.exercise,
            createdAt: result.metadata.createdAt,
            totalReps: 0, // Will be filled from database
            avgQuality: 0, // Will be filled from database
            avgRom: 0, // Will be filled from database
            keyDifferences: insights.keyDifferences,
            insights: insights.insights
          };
        })
      );
      
    } catch (error) {
      console.error('Failed to find similar sessions:', error);
      return [];
    }
  }
  
  /**
   * Get user's best sessions for comparison
   */
  async getUserBestSessions(
    userId: string,
    exercise: 'squat' | 'pushup' | 'plank'
  ): Promise<SimilarSession[]> {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase.rpc('get_user_best_session', {
        p_user_id: userId,
        p_exercise: exercise
      });
      
      if (error) {
        console.error('Failed to get user best sessions:', error);
        return [];
      }
      
      return (data || []).map((session: {
        session_id: string;
        exercise: string;
        created_at: string;
        total_reps: number;
        avg_quality: number;
        avg_rom: number;
        is_best_reps: boolean;
        is_best_quality: boolean;
        is_best_rom: boolean;
      }) => ({
        sessionId: session.session_id,
        similarity: 1.0, // Best sessions have max similarity
        exercise: session.exercise,
        createdAt: session.created_at,
        totalReps: session.total_reps,
        avgQuality: session.avg_quality,
        avgRom: session.avg_rom,
        keyDifferences: this.generateBestSessionDifferences(session),
        insights: this.generateBestSessionInsights(session)
      }));
      
    } catch (error) {
      console.error('Failed to get user best sessions:', error);
      return [];
    }
  }
  
  /**
   * Store embedding in Supabase
   */
  private async storeEmbeddingInSupabase(
    sessionId: string,
    metadata: EmbeddingResult['metadata'],
    vector: number[],
    sessionData: {
      totalReps: number;
      avgQuality: number;
      avgRom: number;
      sessionDuration: number;
    }
  ): Promise<void> {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('session_embeddings')
        .upsert({
          session_id: sessionId,
          user_id: metadata.userId,
          exercise: metadata.exercise,
          feature_vector: vector,
          vector_dimensions: vector.length,
          vector_version: '1.0',
          total_reps: sessionData.totalReps,
          avg_quality: sessionData.avgQuality,
          avg_rom: sessionData.avgRom,
          session_duration: sessionData.sessionDuration
        });
      
      if (error) {
        console.error('Failed to store embedding in Supabase:', error);
      }
    } catch (error) {
      console.error('Failed to store embedding in Supabase:', error);
    }
  }
  
  /**
   * Find similar sessions in Supabase (fallback)
   */
  private async findSimilarSessionsInSupabase(
    sessionId: string,
    userId: string,
    options: VectorSearchOptions
  ): Promise<SimilarSession[]> {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase.rpc('find_similar_sessions', {
        p_session_id: sessionId,
        p_user_id: userId,
        p_limit: options.limit || 5,
        p_min_similarity: options.minSimilarity || 0.7,
        p_exercise: options.exercise || null
      });
      
      if (error) {
        console.error('Failed to find similar sessions in Supabase:', error);
        return [];
      }
      
      return (data || []).map((session: {
        similar_session_id: string;
        similarity: number;
        exercise: string;
        created_at: string;
        total_reps: number;
        avg_quality: number;
        avg_rom: number;
      }) => ({
        sessionId: session.similar_session_id,
        similarity: session.similarity,
        exercise: session.exercise,
        createdAt: session.created_at,
        totalReps: session.total_reps,
        avgQuality: session.avg_quality,
        avgRom: session.avg_rom,
        keyDifferences: [],
        insights: []
      }));
      
    } catch (error) {
      console.error('Failed to find similar sessions in Supabase:', error);
      return [];
    }
  }
  
  /**
   * Convert session feature vector to array
   */
  private sessionVectorToArray(vector: SessionFeatureVector): number[] {
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
   * Calculate average ROM from session summary
   */
  private calculateAverageRom(sessionSummary: SessionSummary): number {
    if (sessionSummary.exerciseMetrics.squat) {
      return sessionSummary.exerciseMetrics.squat.averageDepth;
    } else if (sessionSummary.exerciseMetrics.pushup) {
      return sessionSummary.exerciseMetrics.pushup.averageElbowAngle;
    } else if (sessionSummary.exerciseMetrics.plank) {
      return sessionSummary.exerciseMetrics.plank.averageBodyLinePercentage;
    }
    return 0;
  }
  
  /**
   * Generate insights for similar sessions
   */
  private async generateInsights(
    similarResult: EmbeddingResult,
    targetResult: EmbeddingResult
  ): Promise<{ keyDifferences: string[]; insights: string[] }> {
    const keyDifferences: string[] = [];
    const insights: string[] = [];
    
    // Compare basic metrics
    if (similarResult.metadata.exercise === targetResult.metadata.exercise) {
      insights.push(`Similar ${similarResult.metadata.exercise} session from ${new Date(similarResult.metadata.createdAt).toLocaleDateString()}`);
    }
    
    // Add more sophisticated comparison logic here
    if (similarResult.similarity && similarResult.similarity > 0.9) {
      insights.push('Very similar movement patterns detected');
    } else if (similarResult.similarity && similarResult.similarity > 0.8) {
      insights.push('Similar form and technique patterns');
    }
    
    return { keyDifferences, insights };
  }
  
  /**
   * Generate differences for best sessions
   */
  private generateBestSessionDifferences(session: {
    is_best_reps?: boolean;
    is_best_quality?: boolean;
    is_best_rom?: boolean;
  }): string[] {
    const differences: string[] = [];
    
    if (session.is_best_reps) {
      differences.push('Personal record for reps');
    }
    if (session.is_best_quality) {
      differences.push('Best form quality');
    }
    if (session.is_best_rom) {
      differences.push('Best range of motion');
    }
    
    return differences;
  }
  
  /**
   * Generate insights for best sessions
   */
  private generateBestSessionInsights(session: {
    exercise: string;
    total_reps: number;
    avg_quality: number;
    avg_rom: number;
  }): string[] {
    const insights: string[] = [];
    
    insights.push(`Your best ${session.exercise} session with ${session.total_reps} reps`);
    insights.push(`Quality score: ${Math.round(session.avg_quality)}/100`);
    insights.push(`ROM score: ${Math.round(session.avg_rom)}/100`);
    
    return insights;
  }
  
  /**
   * Load local index from localStorage
   */
  private async loadLocalIndex(): Promise<void> {
    try {
      const stored = localStorage.getItem('movement_embeddings_index');
      if (stored) {
        const data = JSON.parse(stored);
        this.localIndex.import(data);
      }
    } catch (error) {
      console.warn('Failed to load local index:', error);
    }
  }
  
  /**
   * Save local index to localStorage
   */
  private async saveLocalIndex(): Promise<void> {
    try {
      const data = this.localIndex.export();
      localStorage.setItem('movement_embeddings_index', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save local index:', error);
    }
  }
}

// Singleton instance
let embeddingService: EmbeddingService | null = null;

/**
 * Get the global embedding service instance
 */
export function getEmbeddingService(): EmbeddingService {
  if (!embeddingService) {
    embeddingService = new EmbeddingService();
  }
  return embeddingService;
}

/**
 * Initialize the embedding service
 */
export async function initializeEmbeddingService(): Promise<void> {
  const service = getEmbeddingService();
  await service.initialize();
}
