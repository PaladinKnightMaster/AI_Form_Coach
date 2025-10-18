"use client";

import { useEffect, useState, useCallback } from 'react';
import { getEmbeddingService } from '@/lib/embeddings/embeddingService';
import type { SimilarSession } from '@/lib/embeddings/types';
import { Card } from '@/ui/DS';

interface SimilarSessionsProps {
  sessionId: string;
  userId: string;
  exercise: 'squat' | 'pushup' | 'plank';
  className?: string;
}

export default function SimilarSessions({ 
  sessionId, 
  userId, 
  exercise, 
  className = '' 
}: SimilarSessionsProps) {
  const [similarSessions, setSimilarSessions] = useState<SimilarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSimilarSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const embeddingService = getEmbeddingService();
      const similar = await embeddingService.findSimilarSessions(sessionId, userId, {
        limit: 5,
        minSimilarity: 0.6,
        exercise
      });
      
      setSimilarSessions(similar);
    } catch (err) {
      console.error('Failed to load similar sessions:', err);
      setError('Failed to load similar sessions');
    } finally {
      setLoading(false);
    }
  }, [sessionId, userId, exercise]);

  useEffect(() => {
    loadSimilarSessions();
  }, [loadSimilarSessions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'text-green-600 bg-green-100';
    if (similarity >= 0.8) return 'text-blue-600 bg-blue-100';
    if (similarity >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.9) return 'Very Similar';
    if (similarity >= 0.8) return 'Similar';
    if (similarity >= 0.7) return 'Somewhat Similar';
    return 'Different';
  };

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          Similar Sessions
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-3">Similar Sessions</h3>
        <div className="text-red-600 text-sm">
          {error}
        </div>
        <button 
          onClick={loadSimilarSessions}
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Try again
        </button>
      </Card>
    );
  }

  if (similarSessions.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-3">Similar Sessions</h3>
        <div className="text-gray-600 text-sm">
          No similar sessions found. This might be your first session of this type!
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Similar Sessions</h3>
      <div className="space-y-3">
        {similarSessions.map((session) => (
          <div 
            key={session.sessionId}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {session.totalReps} reps
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(session.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Quality: {Math.round(session.avgQuality)}/100</span>
                  <span>ROM: {Math.round(session.avgRom)}/100</span>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSimilarityColor(session.similarity)}`}>
                {getSimilarityLabel(session.similarity)}
              </div>
            </div>
            
            {session.insights.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-600">
                  {session.insights[0]}
                </div>
              </div>
            )}
            
            {session.keyDifferences.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {session.keyDifferences.map((diff, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {diff}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Similar sessions help you identify patterns in your form and track improvement over time.
        </div>
      </div>
    </Card>
  );
}
