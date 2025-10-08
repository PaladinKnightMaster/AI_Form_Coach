"use client";

import { useEffect, useState, useCallback } from 'react';
import { getEmbeddingService } from '@/lib/embeddings/embeddingService';
import type { SimilarSession } from '@/lib/embeddings/types';
import { Card } from '@/ui/DS';

interface CompareToBestProps {
  currentSession: {
    sessionId: string;
    totalReps: number;
    avgQuality: number;
    avgRom: number;
    createdAt: string;
  };
  userId: string;
  exercise: 'squat' | 'pushup' | 'plank';
  className?: string;
}

export default function CompareToBest({ 
  currentSession,
  userId, 
  exercise, 
  className = '' 
}: CompareToBestProps) {
  const [bestSessions, setBestSessions] = useState<SimilarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBestSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const embeddingService = getEmbeddingService();
      const best = await embeddingService.getUserBestSessions(userId, exercise);
      
      setBestSessions(best);
    } catch (err) {
      console.error('Failed to load best sessions:', err);
      setError('Failed to load best sessions');
    } finally {
      setLoading(false);
    }
  }, [userId, exercise]);

  useEffect(() => {
    loadBestSessions();
  }, [loadBestSessions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateImprovement = (current: number, best: number) => {
    if (best === 0) return 0;
    return ((current - best) / best) * 100;
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-600';
    if (improvement < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return '📈';
    if (improvement < -5) return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></span>
          Compare to Your Best
        </h3>
        <div className="space-y-3">
          {[1, 2].map((i) => (
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
        <h3 className="text-lg font-semibold mb-3">Compare to Your Best</h3>
        <div className="text-red-600 text-sm">
          {error}
        </div>
        <button 
          onClick={loadBestSessions}
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Try again
        </button>
      </Card>
    );
  }

  if (bestSessions.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-3">Compare to Your Best</h3>
        <div className="text-gray-600 text-sm">
          This appears to be your first {exercise} session! Keep it up! 🎉
        </div>
      </Card>
    );
  }

  // Find the best session for each metric
  const bestReps = bestSessions.reduce((max, session) => 
    session.totalReps > max.totalReps ? session : max, bestSessions[0]);
  const bestQuality = bestSessions.reduce((max, session) => 
    session.avgQuality > max.avgQuality ? session : max, bestSessions[0]);
  const bestRom = bestSessions.reduce((max, session) => 
    session.avgRom > max.avgRom ? session : max, bestSessions[0]);

  const repsImprovement = calculateImprovement(currentSession.totalReps, bestReps.totalReps);
  const qualityImprovement = calculateImprovement(currentSession.avgQuality, bestQuality.avgQuality);
  const romImprovement = calculateImprovement(currentSession.avgRom, bestRom.avgRom);

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Compare to Your Best</h3>
      
      <div className="space-y-4">
        {/* Reps Comparison */}
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Reps</span>
            <span className={`text-sm font-medium ${getImprovementColor(repsImprovement)}`}>
              {getImprovementIcon(repsImprovement)} {repsImprovement > 0 ? '+' : ''}{repsImprovement.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Current: {currentSession.totalReps}</span>
            <span>Best: {bestReps.totalReps} ({formatDate(bestReps.createdAt)})</span>
          </div>
          {repsImprovement > 0 && (
            <div className="mt-2 text-xs text-green-600 font-medium">
              🎉 New personal record!
            </div>
          )}
        </div>

        {/* Quality Comparison */}
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Form Quality</span>
            <span className={`text-sm font-medium ${getImprovementColor(qualityImprovement)}`}>
              {getImprovementIcon(qualityImprovement)} {qualityImprovement > 0 ? '+' : ''}{qualityImprovement.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Current: {Math.round(currentSession.avgQuality)}/100</span>
            <span>Best: {Math.round(bestQuality.avgQuality)}/100 ({formatDate(bestQuality.createdAt)})</span>
          </div>
          {qualityImprovement > 0 && (
            <div className="mt-2 text-xs text-green-600 font-medium">
              ✨ Improved form quality!
            </div>
          )}
        </div>

        {/* ROM Comparison */}
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Range of Motion</span>
            <span className={`text-sm font-medium ${getImprovementColor(romImprovement)}`}>
              {getImprovementIcon(romImprovement)} {romImprovement > 0 ? '+' : ''}{romImprovement.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Current: {Math.round(currentSession.avgRom)}/100</span>
            <span>Best: {Math.round(bestRom.avgRom)}/100 ({formatDate(bestRom.createdAt)})</span>
          </div>
          {romImprovement > 0 && (
            <div className="mt-2 text-xs text-green-600 font-medium">
              🏆 Better range of motion!
            </div>
          )}
        </div>
      </div>

      {/* Overall Assessment */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-sm">
          {repsImprovement > 0 || qualityImprovement > 0 || romImprovement > 0 ? (
            <div className="text-green-600 font-medium">
              🎯 Great session! You&apos;re showing improvement in multiple areas.
            </div>
          ) : (
            <div className="text-gray-600">
              💪 Keep working on consistency. Every session builds strength and technique.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
