/**
 * Integrity Score Display Component
 * 
 * Shows detailed integrity score with breakdown of checks
 */

"use client";

import React, { useState } from 'react';
import { Icon } from '@/ui/DS';
import type { IntegrityScoreDisplayProps, IntegrityCheckResult } from '@/types/verification';
import { getIntegrityScoreColor, getIntegrityScoreLabel } from '@/types/verification';

export default function IntegrityScoreDisplay({
  score,
  showLabel = true,
  showBreakdown = false,
  checks = []
}: IntegrityScoreDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const scorePercent = Math.round(score * 100);
  const color = getIntegrityScoreColor(score);
  const label = getIntegrityScoreLabel(score);

  // Color mapping
  const colorClasses: Record<string, { bg: string; text: string; ring: string; fill: string }> = {
    green: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      ring: 'ring-green-500',
      fill: 'text-green-500'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      ring: 'ring-yellow-500',
      fill: 'text-yellow-500'
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      ring: 'ring-orange-500',
      fill: 'text-orange-500'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      ring: 'ring-red-500',
      fill: 'text-red-500'
    }
  };

  const colors = colorClasses[color] || colorClasses.green;

  return (
    <div className="space-y-3">
      {/* Score Display */}
      <div className={`${colors.bg} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${colors.text}`}>
            Integrity Score
          </span>
          {showBreakdown && checks.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`${colors.text} hover:opacity-80 transition-opacity`}
            >
              <Icon 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                className="w-4 h-4"
              />
            </button>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${colors.text}`}>
            {scorePercent}%
          </span>
          {showLabel && (
            <span className={`text-sm ${colors.text} opacity-75`}>
              ({label})
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.fill} transition-all duration-500`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && isExpanded && checks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Check Details
          </h4>
          {checks.map((check, index) => (
            <CheckResultCard key={index} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Check Result Card
 */
function CheckResultCard({ check }: { check: IntegrityCheckResult }) {
  const checkScore = Math.round(check.score * 100);
  
  // Icon and color based on pass/fail
  const icon: 'check' | 'alert-circle' = check.passed ? 'check' : 'alert-circle';
  const iconColor = check.passed 
    ? 'text-green-500'
    : check.severity === 'error' 
      ? 'text-red-500'
      : 'text-yellow-500';

  // Friendly check names
  const checkNames: Record<string, string> = {
    rom_consistency_check: 'ROM Consistency',
    tempo_realism_check: 'Tempo Realism',
    progression_check: 'Natural Progression',
    outlier_detection: 'Outlier Detection'
  };

  const checkName = checkNames[check.check_type] || check.check_type;

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex items-start gap-3">
        <Icon name={icon} className={`${iconColor} w-5 h-5 mt-0.5 flex-shrink-0`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-900">
              {checkName}
            </span>
            <span className={`text-xs font-medium ${
              checkScore >= 70 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {checkScore}%
            </span>
          </div>
          
          <p className="text-xs text-gray-600">
            {check.message}
          </p>

          {/* Severity indicator */}
          {!check.passed && (
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                check.severity === 'error' 
                  ? 'bg-red-100 text-red-700'
                  : check.severity === 'warning'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {check.severity.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Integrity Score (for lists/cards)
 */
export function CompactIntegrityScore({ score }: { score: number }) {
  const scorePercent = Math.round(score * 100);
  const color = getIntegrityScoreColor(score);

  const colorClasses: Record<string, string> = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  };

  return (
    <span className={`text-sm font-semibold ${colorClasses[color] || colorClasses.green}`}>
      {scorePercent}%
    </span>
  );
}

