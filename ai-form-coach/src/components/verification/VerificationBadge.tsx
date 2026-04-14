/**
 * Verification Badge Component
 * 
 * Displays session verification status with visual indicators
 * Inspired by Strava's verified activity badges
 */

"use client";

import React from 'react';
import { Icon } from '@/ui/DS';
import type { VerificationBadgeProps } from '@/types/verification';
// import { getIntegrityScoreColor, getIntegrityScoreLabel } from '@/types/verification';

export default function VerificationBadge({
  verified,
  integrity_score,
  flagged,
  size = 'md',
  showScore = false,
  showTooltip = true
}: VerificationBadgeProps) {
  // Determine status and styling
  let status: 'verified' | 'flagged' | 'pending' | 'unverified';
  let icon: 'check' | 'alert' | 'activity' | 'alert-circle';
  let colorClasses: string;
  let bgClasses: string;
  let tooltipText: string;

  if (flagged) {
    status = 'flagged';
    icon = 'alert';
    colorClasses = 'text-red-600';
    bgClasses = 'bg-red-100 border-red-300';
    tooltipText = 'Session flagged for suspicious activity';
  } else if (verified) {
    status = 'verified';
    icon = 'check';
    colorClasses = 'text-green-600';
    bgClasses = 'bg-green-100 border-green-300';
    tooltipText = `Verified session (${Math.round(integrity_score * 100)}% integrity)`;
  } else if (integrity_score >= 0.5) {
    status = 'pending';
    icon = 'activity';
    colorClasses = 'text-yellow-600';
    bgClasses = 'bg-yellow-100 border-yellow-300';
    tooltipText = 'Verification pending';
  } else {
    status = 'unverified';
    icon = 'alert-circle';
    colorClasses = 'text-gray-600';
    bgClasses = 'bg-gray-100 border-gray-300';
    tooltipText = 'Not verified';
  }

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${bgClasses} ${colorClasses} ${sizeClasses[size]}
        font-medium transition-all duration-200
        ${showTooltip ? 'cursor-help' : ''}
      `}
      title={showTooltip ? tooltipText : undefined}
    >
      <Icon name={icon} className={iconSizes[size]} />
      <span>
        {status === 'verified' && 'Verified'}
        {status === 'flagged' && 'Flagged'}
        {status === 'pending' && 'Pending'}
        {status === 'unverified' && 'Unverified'}
      </span>
      
      {showScore && integrity_score !== null && integrity_score !== undefined && (
        <span className="ml-1 opacity-75">
          ({Math.round(integrity_score * 100)}%)
        </span>
      )}
    </div>
  );
}

/**
 * Compact Verification Icon (for leaderboards, lists)
 */
export function VerificationIcon({
  verified,
  flagged,
  size = 'sm',
  showTooltip = true
}: {
  verified: boolean;
  flagged: boolean;
  size?: 'xs' | 'sm' | 'md';
  showTooltip?: boolean;
}) {
  if (!verified && !flagged) return null;

  const icon: 'alert' | 'check' = flagged ? 'alert' : 'check';
  const colorClass = flagged 
    ? 'text-red-500' 
    : 'text-green-500';
  
  const sizeClass = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  }[size];

  const tooltip = flagged ? 'Flagged' : 'Verified';

  return (
    <span title={showTooltip ? tooltip : undefined}>
      <Icon
        name={icon}
        className={`${colorClass} ${sizeClass}`}
      />
    </span>
  );
}

