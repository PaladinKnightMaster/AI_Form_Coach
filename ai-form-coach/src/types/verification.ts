/**
 * Session Verification System Types
 * 
 * Implements Strava-like integrity checking and session verification
 */

// ==========================================
// Core Verification Types
// ==========================================

export type VerificationType =
  | 'auto_integrity_check'
  | 'rom_consistency_check'
  | 'tempo_realism_check'
  | 'progression_check'
  | 'outlier_detection'
  | 'manual_review'
  | 'admin_override'
  | 'community_report';

export interface SessionVerificationRecord {
  id: string;
  session_id: string;
  verification_type: VerificationType;
  verified_by: string; // 'system' or user_id
  passed: boolean;
  score: number; // 0-1
  details: Record<string, any>; // Check-specific details
  notes?: string;
  created_at: string;
}

export interface VerifiedSession {
  id: string;
  user_id: string;
  exercise: 'squat' | 'pushup' | 'plank';
  total_reps: number;
  total_time_seconds: number;
  avg_rom_score: number;
  avg_tempo_ms: number;
  verified: boolean;
  integrity_score: number; // 0-1
  flagged: boolean;
  flag_reason?: string;
  verified_at?: string;
  verified_by?: string;
  started_at: string;
  ended_at: string;
}

export interface SessionVerificationSummary {
  session_id: string;
  verified: boolean;
  integrity_score: number;
  flagged: boolean;
  flag_reasons: string[];
  verification_checks_run: number;
  checks_passed: number;
  checks_failed: number;
  details: SessionVerificationRecord[];
}

// ==========================================
// Integrity Check Configuration
// ==========================================

export interface IntegrityCheckConfig {
  id: string;
  check_name: string;
  enabled: boolean;
  weight: number; // 0-1, weight in overall score
  thresholds: Record<string, any>;
  description: string;
  updated_at: string;
  updated_by?: string;
}

export interface ROMConsistencyThresholds {
  min_avg_rom_score: number; // Minimum average ROM score (e.g., 0.3)
  max_rom_std_deviation: number; // Maximum standard deviation (e.g., 0.4)
  min_reps_for_check: number; // Minimum reps needed to run check
}

export interface TempoRealismThresholds {
  min_tempo_ms: number; // Minimum realistic tempo in milliseconds
  max_tempo_ms: number; // Maximum realistic tempo in milliseconds
  max_tempo_variance: number; // Maximum variance coefficient
}

export interface ProgressionNaturalnessThresholds {
  max_rep_increase_percent: number; // Max % increase in reps between sessions
  max_time_increase_percent: number; // Max % increase in time between sessions
  min_sessions_for_check: number; // Minimum sessions in history needed
}

export interface OutlierDetectionThresholds {
  z_score_threshold: number; // Z-score threshold for outlier (e.g., 3.0)
  min_sessions_for_baseline: number; // Minimum sessions for baseline
}

// ==========================================
// Integrity Check Results
// ==========================================

export interface IntegrityCheckResult {
  check_type: VerificationType;
  passed: boolean;
  score: number; // 0-1
  message: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
}

export interface ROMConsistencyCheck extends IntegrityCheckResult {
  check_type: 'rom_consistency_check';
  details: {
    avg_rom_score: number;
    rom_std_deviation: number;
    min_rom_score: number;
    max_rom_score: number;
    rep_count: number;
    threshold_min_avg: number;
    threshold_max_std_dev: number;
  };
}

export interface TempoRealismCheck extends IntegrityCheckResult {
  check_type: 'tempo_realism_check';
  details: {
    avg_tempo_ms: number;
    min_tempo_ms: number;
    max_tempo_ms: number;
    tempo_variance: number;
    threshold_min_tempo: number;
    threshold_max_tempo: number;
    threshold_max_variance: number;
  };
}

export interface ProgressionCheck extends IntegrityCheckResult {
  check_type: 'progression_check';
  details: {
    current_performance: number;
    previous_performance: number;
    increase_percent: number;
    threshold_max_increase: number;
    sessions_analyzed: number;
  };
}

export interface OutlierDetectionCheck extends IntegrityCheckResult {
  check_type: 'outlier_detection';
  details: {
    current_value: number;
    baseline_mean: number;
    baseline_std_dev: number;
    z_score: number;
    threshold_z_score: number;
    is_outlier: boolean;
  };
}

export type SpecificIntegrityCheck = 
  | ROMConsistencyCheck
  | TempoRealismCheck
  | ProgressionCheck
  | OutlierDetectionCheck;

// ==========================================
// Verification Service Types
// ==========================================

export interface VerificationRequest {
  session_id: string;
  user_id: string;
  force_recheck?: boolean; // Force re-running all checks
}

export interface VerificationResponse {
  session_id: string;
  integrity_score: number;
  verified: boolean;
  flagged: boolean;
  flag_reasons: string[];
  checks: IntegrityCheckResult[];
  recommendations: string[];
  timestamp: string;
}

export interface BatchVerificationRequest {
  session_ids: string[];
  user_id: string;
}

export interface BatchVerificationResponse {
  results: VerificationResponse[];
  summary: {
    total_sessions: number;
    verified_count: number;
    flagged_count: number;
    average_integrity_score: number;
  };
}

// ==========================================
// Manual Review Types
// ==========================================

export interface ManualReviewRequest {
  session_id: string;
  reviewer_id: string;
  decision: 'approve' | 'reject' | 'needs_more_info';
  notes: string;
  override_flags?: boolean;
}

export interface ManualReviewResponse {
  session_id: string;
  review_status: 'approved' | 'rejected' | 'pending';
  reviewed_by: string;
  reviewed_at: string;
  notes: string;
}

// ==========================================
// Community Report Types
// ==========================================

export interface CommunityReportRequest {
  session_id: string;
  reporter_id: string;
  reason: 'impossible_performance' | 'suspicious_timing' | 'rom_issues' | 'other';
  description: string;
}

export interface CommunityReportResponse {
  report_id: string;
  session_id: string;
  status: 'submitted' | 'under_review' | 'resolved';
  created_at: string;
}

// ==========================================
// Leaderboard Integration Types
// ==========================================

export interface VerifiedLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  score: number;
  metric: string;
  verified: boolean; // Only verified sessions included
  integrity_score: number;
  session_count: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  is_current_user: boolean;
}

export interface LeaderboardFilters {
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  exercise: 'squat' | 'pushup' | 'plank';
  verified_only: boolean; // Filter to only verified sessions
  min_integrity_score?: number; // Minimum integrity score threshold
}

// ==========================================
// Admin Dashboard Types
// ==========================================

export interface VerificationStats {
  total_sessions: number;
  verified_sessions: number;
  flagged_sessions: number;
  pending_review: number;
  average_integrity_score: number;
  verification_rate: number; // Percentage of verified sessions
  flag_rate: number; // Percentage of flagged sessions
  checks_by_type: Record<VerificationType, {
    total: number;
    passed: number;
    failed: number;
  }>;
}

export interface FlaggedSessionsFilter {
  limit?: number;
  offset?: number;
  min_flag_severity?: 'low' | 'medium' | 'high';
  exercise?: 'squat' | 'pushup' | 'plank';
  date_range?: {
    start: string;
    end: string;
  };
}

// ==========================================
// UI Component Props Types
// ==========================================

export interface VerificationBadgeProps {
  verified: boolean;
  integrity_score: number;
  flagged: boolean;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  showTooltip?: boolean;
}

export interface IntegrityScoreDisplayProps {
  score: number;
  showLabel?: boolean;
  showBreakdown?: boolean;
  checks?: IntegrityCheckResult[];
}

export interface VerificationDetailsProps {
  session_id: string;
  verificationSummary: SessionVerificationSummary;
  onReportIssue?: () => void;
}

// ==========================================
// Helper Types
// ==========================================

export interface VerificationThresholds {
  verified_threshold: number; // Score needed to be verified (e.g., 0.7)
  flagged_threshold: number; // Score below which session is flagged (e.g., 0.5)
  warning_threshold: number; // Score that shows warning (e.g., 0.6)
}

export const DEFAULT_VERIFICATION_THRESHOLDS: VerificationThresholds = {
  verified_threshold: 0.7,
  flagged_threshold: 0.5,
  warning_threshold: 0.6
};

// ==========================================
// Utility Type Guards
// ==========================================

export function isVerified(session: VerifiedSession): boolean {
  return session.verified && session.integrity_score >= DEFAULT_VERIFICATION_THRESHOLDS.verified_threshold;
}

export function isFlagged(session: VerifiedSession): boolean {
  return session.flagged || session.integrity_score < DEFAULT_VERIFICATION_THRESHOLDS.flagged_threshold;
}

export function needsReview(session: VerifiedSession): boolean {
  return !session.verified && !session.flagged;
}

export function getVerificationStatus(session: VerifiedSession): 'verified' | 'flagged' | 'pending' | 'unverified' {
  if (session.flagged) return 'flagged';
  if (session.verified) return 'verified';
  if (session.integrity_score === null || session.integrity_score === undefined) return 'unverified';
  return 'pending';
}

export function getIntegrityScoreColor(score: number): string {
  if (score >= DEFAULT_VERIFICATION_THRESHOLDS.verified_threshold) return 'green';
  if (score >= DEFAULT_VERIFICATION_THRESHOLDS.warning_threshold) return 'yellow';
  if (score >= DEFAULT_VERIFICATION_THRESHOLDS.flagged_threshold) return 'orange';
  return 'red';
}

export function getIntegrityScoreLabel(score: number): string {
  if (score >= 0.9) return 'Excellent';
  if (score >= 0.7) return 'Good';
  if (score >= 0.5) return 'Fair';
  if (score >= 0.3) return 'Poor';
  return 'Very Poor';
}

