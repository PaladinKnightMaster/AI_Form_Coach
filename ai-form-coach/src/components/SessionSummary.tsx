"use client";

import { useEffect, useState } from 'react';
import { FormIQDisplay } from './FormIQDisplay';
import { CoachingInsights } from './CoachingInsights';
import VerificationBadge from './verification/VerificationBadge';
import { CompactIntegrityScore } from './verification/IntegrityScoreDisplay';
import { VerificationService } from '@/lib/verification/verificationService';
import type { FormIQMetrics } from '@/lib/validators/formIQ';
import type { SessionAnalysis } from '@/lib/insights/coachingInsights';
import type { VerificationResponse } from '@/types/verification';

interface SessionSummaryProps {
  exercise: string;
  repCount: number;
  duration: number;
  formIQMetrics: FormIQMetrics;
  sessionAnalysis: SessionAnalysis;
  onClose: () => void;
  onNewSession: () => void;
  sessionId?: string;
  className?: string;
}

export function SessionSummary({
  exercise,
  repCount,
  duration,
  formIQMetrics,
  sessionAnalysis,
  onClose,
  onNewSession,
  sessionId,
  className = ''
}: SessionSummaryProps) {
  const [verification, setVerification] = useState<VerificationResponse | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Fetch verification if sessionId provided
  useEffect(() => {
    if (sessionId) {
      setVerificationLoading(true);
      VerificationService.checkSession(sessionId, false)
        .then(setVerification)
        .catch(err => console.error('Verification check failed:', err))
        .finally(() => setVerificationLoading(false));
    }
  }, [sessionId]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Session Complete! 🎉</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close summary"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          
          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{repCount}</div>
              <div className="text-sm opacity-90">
                {exercise === 'plank' ? 'Seconds' : 'Reps'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{formatDuration(duration)}</div>
              <div className="text-sm opacity-90">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{Math.round(sessionAnalysis.overallScore * 100)}%</div>
              <div className="text-sm opacity-90">Overall Score</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form IQ Display */}
            <FormIQDisplay 
              formIQMetrics={formIQMetrics} 
              exercise={exercise}
              className="bg-gradient-to-br from-gray-50 to-blue-50 border-blue-100"
            />

            {/* Coaching Insights */}
            <CoachingInsights 
              sessionAnalysis={sessionAnalysis}
              className="bg-gradient-to-br from-gray-50 to-purple-50 border-purple-100"
            />
          </div>

          {/* Verification Section */}
          {sessionId && verification && (
            <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-purple-50 border border-purple-100 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Session Verification</h3>
                <VerificationBadge
                  verified={verification.verified}
                  integrity_score={verification.integrity_score}
                  flagged={verification.flagged}
                  size="md"
                  showScore={false}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Integrity Score</div>
                  <CompactIntegrityScore score={verification.integrity_score} />
                </div>
                
                {verification.verified && (
                  <div className="text-sm text-gray-600">
                    ✓ This session counts towards leaderboards and challenges
                  </div>
                )}
                
                {verification.flagged && verification.flag_reasons && verification.flag_reasons.length > 0 && (
                  <div className="text-sm text-red-600">
                    ⚠️ {verification.flag_reasons[0]}
                  </div>
                )}
              </div>

              {verification.recommendations && verification.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <div className="text-xs font-medium text-gray-700 mb-2">💡 Tips to Improve:</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {verification.recommendations.slice(0, 2).map((rec, idx) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {sessionId && verificationLoading && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Verifying session integrity...</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={onNewSession}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              Start New Session
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              View History
            </button>
            <a
              href="/plans"
              className="flex-1 bg-purple-100 text-purple-700 px-6 py-3 rounded-xl font-semibold hover:bg-purple-200 transition-colors text-center"
            >
              Get AI Plan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact session summary for quick view
 */
export function CompactSessionSummary({
  formIQMetrics,
  repCount,
  exercise,
  className = ''
}: {
  formIQMetrics: FormIQMetrics;
  repCount: number;
  exercise: string;
  className?: string;
}) {
  const { grade, color } = getFormIQGrade(formIQMetrics.formIQ);

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white">Session Summary</h4>
        <div className={`text-lg font-bold ${color}`}>{grade}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-200">Reps</div>
          <div className="text-white font-semibold">{repCount}</div>
        </div>
        <div>
          <div className="text-gray-200">Form IQ</div>
          <div className="text-white font-semibold">{Math.round(formIQMetrics.formIQ * 100)}%</div>
        </div>
      </div>

      {(exercise === 'squat' || exercise === 'pushup') && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-gray-200 mb-1">Side Balance</div>
          <div className="w-full h-2 bg-gray-600 rounded-full relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-3 bg-white/50"></div>
            </div>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                Math.abs(formIQMetrics.sideBalance - 0.5) <= 0.05 
                  ? 'bg-green-500' 
                  : 'bg-yellow-500'
              }`}
              style={{ 
                width: '100%',
                transform: `translateX(${(formIQMetrics.sideBalance - 0.5) * 100}%)`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function getFormIQGrade(formIQ: number): { grade: string; color: string } {
  if (formIQ >= 0.9) return { grade: 'A+', color: 'text-green-600' };
  if (formIQ >= 0.8) return { grade: 'A', color: 'text-green-500' };
  if (formIQ >= 0.7) return { grade: 'B+', color: 'text-blue-500' };
  if (formIQ >= 0.6) return { grade: 'B', color: 'text-blue-400' };
  if (formIQ >= 0.5) return { grade: 'C+', color: 'text-yellow-500' };
  if (formIQ >= 0.4) return { grade: 'C', color: 'text-orange-500' };
  return { grade: 'D', color: 'text-red-500' };
}
