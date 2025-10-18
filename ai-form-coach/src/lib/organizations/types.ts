// Organization Dashboard Types
// B2B-ready, read-only pilot system

export interface Organization {
  id: string;
  name: string;
  description?: string;
  domain?: string; // Optional domain for auto-assignment
  settings: OrganizationSettings;
  metadata: OrganizationMetadata;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface OrganizationSettings {
  // Privacy and data settings
  allowPHI: boolean; // Whether to include PHI beyond user ID
  dataRetentionDays: number;
  exportFormat: 'csv' | 'json';
  
  // Dashboard settings
  defaultTimeRange: '7d' | '30d' | '90d' | '1y';
  refreshInterval: number; // minutes
  
  // Webhook settings
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEnabled: boolean;
}

export interface OrganizationMetadata {
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  region?: string;
  contactEmail?: string;
  billingTier?: 'pilot' | 'basic' | 'premium' | 'enterprise';
}

export interface OrganizationUser {
  id: string;
  organizationId: string;
  userId: string;
  role: 'admin' | 'viewer' | 'member';
  assignedAt: string;
  assignedBy: string;
  isActive: boolean;
  lastAccessedAt?: string;
}

export interface OrganizationMetrics {
  organizationId: string;
  timeRange: string;
  generatedAt: string;
  
  // Form IQ Trends
  formIQ: {
    average: number;
    trend: 'improving' | 'stable' | 'declining';
    weeklyData: FormIQDataPoint[];
    distribution: {
      excellent: number; // 0.8-1.0
      good: number;      // 0.6-0.8
      fair: number;      // 0.4-0.6
      poor: number;      // 0.0-0.4
    };
  };
  
  // Verified Minutes
  verifiedMinutes: {
    total: number;
    averagePerUser: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    weeklyData: VerifiedMinutesDataPoint[];
    byExercise: {
      squat: number;
      pushup: number;
      plank: number;
      other: number;
    };
  };
  
  // Adherence Percentage
  adherence: {
    overall: number; // 0-100
    trend: 'improving' | 'stable' | 'declining';
    weeklyData: AdherenceDataPoint[];
    byUser: UserAdherenceData[];
  };
  
  // Flagged → Verified Resolution Count
  resolution: {
    totalFlagged: number;
    totalResolved: number;
    resolutionRate: number; // 0-100
    averageResolutionTime: number; // hours
    weeklyData: ResolutionDataPoint[];
    commonIssues: {
      issue: string;
      count: number;
      resolutionRate: number;
    }[];
  };
  
  // User Summary
  users: {
    total: number;
    active: number; // users with sessions in time range
    new: number; // users added in time range
    engagement: {
      high: number; // >3 sessions/week
      medium: number; // 1-3 sessions/week
      low: number; // <1 session/week
    };
  };
}

export interface FormIQDataPoint {
  week: string; // YYYY-MM-DD
  average: number;
  count: number; // number of sessions
}

export interface VerifiedMinutesDataPoint {
  week: string;
  totalMinutes: number;
  userCount: number;
}

export interface AdherenceDataPoint {
  week: string;
  percentage: number;
  targetSessions: number;
  actualSessions: number;
}

export interface ResolutionDataPoint {
  week: string;
  flagged: number;
  resolved: number;
  resolutionRate: number;
}

export interface UserAdherenceData {
  userId: string;
  userEmail: string; // Only if allowPHI is true
  adherence: number;
  totalSessions: number;
  targetSessions: number;
  lastSessionDate?: string;
}

export interface OrganizationDashboardFilters {
  timeRange: '7d' | '30d' | '90d' | '1y' | 'custom';
  startDate?: string;
  endDate?: string;
  includePHI: boolean;
  exerciseFilter?: string[];
  userFilter?: string[];
}

export interface OrganizationDashboardResponse {
  organization: Organization;
  metrics: OrganizationMetrics;
  filters: OrganizationDashboardFilters;
  generatedAt: string;
}

export interface CSVExportRequest {
  organizationId: string;
  metrics: string[]; // Which metrics to include
  format: 'detailed' | 'summary';
  includePHI: boolean;
  timeRange: string;
  startDate?: string;
  endDate?: string;
}

export interface CSVExportResponse {
  downloadUrl: string;
  expiresAt: string;
  recordCount: number;
}

export interface WebhookPayload {
  organizationId: string;
  eventType: 'metrics_updated' | 'export_requested' | 'user_activity';
  timestamp: string;
  data: OrganizationMetrics | CSVExportRequest | UserActivityEvent;
  signature: string; // HMAC signature for verification
}

export interface UserActivityEvent {
  userId: string;
  activityType: 'session_started' | 'session_completed' | 'goal_achieved';
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: 'admin' | 'viewer' | 'member';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

// API Response types
export interface OrganizationListResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
}

export interface OrganizationUsersResponse {
  users: OrganizationUser[];
  total: number;
  page: number;
  limit: number;
}

export interface OrganizationStatsResponse {
  totalOrganizations: number;
  totalUsers: number;
  activeOrganizations: number;
  totalSessions: number;
  averageFormIQ: number;
  totalVerifiedMinutes: number;
}
