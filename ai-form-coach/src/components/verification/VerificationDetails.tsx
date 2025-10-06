/**
 * Verification Details Component
 * 
 * Shows comprehensive verification information for a session
 */

"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Icon, Button } from '@/ui/DS';
import VerificationBadge from './VerificationBadge';
import IntegrityScoreDisplay from './IntegrityScoreDisplay';
import type { SessionVerificationSummary, IntegrityCheckResult } from '@/types/verification';

interface VerificationDetailsProps {
  session_id: string;
  onReportIssue?: () => void;
}

export default function VerificationDetails({
  session_id,
  onReportIssue
}: VerificationDetailsProps) {
  const [summary, setSummary] = useState<SessionVerificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerificationSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/verification/session-summary?session_id=${session_id}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch verification summary');
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching verification summary:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [session_id]);

  useEffect(() => {
    fetchVerificationSummary();
  }, [fetchVerificationSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <Icon name="alert-circle" className="w-5 h-5" />
          <span>{error || 'Failed to load verification details'}</span>
        </div>
      </div>
    );
  }

  // Map verification records to integrity check results format
  const checks: IntegrityCheckResult[] = summary.details.map(detail => ({
    check_type: detail.verification_type,
    passed: detail.passed,
    score: detail.score,
    message: detail.notes || '',
    details: detail.details,
    severity: (detail.passed ? 'info' : 'warning') as 'info' | 'warning' | 'error'
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Session Verification
          </h3>
          <VerificationBadge
            verified={summary.verified}
            integrity_score={summary.integrity_score}
            flagged={summary.flagged}
            size="lg"
            showScore={true}
          />
        </div>

        {onReportIssue && (
          <Button
            variant="ghost"
            onClick={onReportIssue}
            className="flex items-center gap-2"
          >
            <Icon name="alert" className="w-4 h-4" />
            Report Issue
          </Button>
        )}
      </div>

      {/* Integrity Score */}
      <IntegrityScoreDisplay
        score={summary.integrity_score}
        showLabel={true}
        showBreakdown={true}
        checks={checks}
      />

      {/* Flag Reasons (if flagged) */}
      {summary.flagged && summary.flag_reasons.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Icon name="alert" className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                Session Flagged
              </h4>
              <ul className="space-y-1">
                {summary.flag_reasons.map((reason, index) => (
                  <li key={index} className="text-sm text-red-700 dark:text-red-300">
                    • {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Checks Run"
          value={summary.verification_checks_run}
          icon="activity"
        />
        <StatCard
          label="Passed"
          value={summary.checks_passed}
          icon="check"
          valueColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Failed"
          value={summary.checks_failed}
          icon="x"
          valueColor="text-red-600 dark:text-red-400"
        />
      </div>

      {/* What This Means */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Icon name="alert-circle" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              What does this mean?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {summary.verified && (
                <>
                  Your session has been verified as legitimate. It will count towards 
                  leaderboards and challenges.
                </>
              )}
              {summary.flagged && (
                <>
                  Your session has been flagged for review. This may be due to unusually 
                  fast tempo, inconsistent form, or unrealistic performance jumps. You can 
                  report an issue if you believe this is incorrect.
                </>
              )}
              {!summary.verified && !summary.flagged && (
                <>
                  Your session is pending verification. Our integrity checks are still 
                  processing your performance data.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  valueColor = 'text-gray-900 dark:text-white'
}: {
  label: string;
  value: number;
  icon: 'activity' | 'check' | 'x';
  valueColor?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-1">
        <Icon name={icon} className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}

