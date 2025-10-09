// Analytics and Metrics Types for Investor-grade tracking

export interface AnalyticsEvent {
  id: string;
  userId: string;
  sessionId?: string;
  eventType: 'retention' | 'conversion' | 'session_quality' | 'performance' | 'user_behavior' | 'monetization';
  eventName: string;
  eventData: Record<string, unknown>;
  deviceInfo?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
  timestamp: string;
  createdAt: string;
}

export interface UserRetentionMetrics {
  id: string;
  userId: string;
  cohortDate: string;
  day1Active: boolean;
  day7Active: boolean;
  day14Active: boolean;
  day30Active: boolean;
  week1Active: boolean;
  week2Active: boolean;
  week4Active: boolean;
  week8Active: boolean;
  week12Active: boolean;
  lastActivityDate?: string;
  totalSessions: number;
  totalVerifiedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionQualityMetrics {
  id: string;
  sessionId: string;
  userId: string;
  medianFps?: number;
  lowVisibilityRate?: number;
  falseRepUndoRate?: number;
  averagePoseConfidence?: number;
  deviceType?: string;
  browserType?: string;
  sessionCompletionRate?: number;
  verificationRate?: number;
  qualityScore?: number;
  apiLatencyMs?: number;
  processingTimeMs?: number;
  errorCount: number;
  createdAt: string;
}

export interface ConversionFunnel {
  id: string;
  userId: string;
  landingPageViewed: boolean;
  signupStarted: boolean;
  signupCompleted: boolean;
  firstSessionStarted: boolean;
  firstSessionCompleted: boolean;
  firstVerifiedSession: boolean;
  proTrialStarted: boolean;
  proConverted: boolean;
  packPurchased: boolean;
  landingPageAt?: string;
  signupStartedAt?: string;
  signupCompletedAt?: string;
  firstSessionAt?: string;
  firstCompletedAt?: string;
  firstVerifiedAt?: string;
  proTrialAt?: string;
  proConvertedAt?: string;
  packPurchasedAt?: string;
  conversionSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceGuardrails {
  id: string;
  metricName: string;
  metricValue: number;
  thresholdValue: number;
  status: 'pass' | 'warning' | 'fail';
  measurementDate: string;
  metadata?: Record<string, unknown>;
}

export interface CostGuardrails {
  id: string;
  metricName: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: 'pass' | 'warning' | 'fail';
  measurementDate: string;
  metadata?: Record<string, unknown>;
}

// Dashboard Response Types
export interface RetentionMetricsResponse {
  totalUsers: number;
  d1Retained: number;
  w1Retained: number;
  d1Rate: number;
  w1Rate: number;
  period: {
    start: string;
    end: string;
  };
}

export interface SessionMetricsResponse {
  totalSessions: number;
  completedSessions: number;
  verifiedSessions: number;
  completionRate: number;
  verificationRate: number;
  period: {
    start: string;
    end: string;
  };
}

export interface ProConversionMetricsResponse {
  totalUsers: number;
  proTrials: number;
  proConversions: number;
  packPurchases: number;
  trialRate: number;
  conversionRate: number;
  packAttachRate: number;
  period: {
    start: string;
    end: string;
  };
}

export interface QualityMetricsResponse {
  medianFps: number;
  avgVisibilityRate: number;
  avgUndoRate: number;
  avgConfidence: number;
  deviceBreakdown: {
    mobile?: number;
    desktop?: number;
    tablet?: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export interface PerformanceGuardrailsResponse {
  deviceProcessingRate: number;
  medianApiLatency: number;
  storagePerUserMB: number;
  thresholds: {
    deviceProcessingMin: number;
    apiLatencyMax: number;
    storagePerUserMax: number;
  };
  status: {
    deviceProcessing: 'pass' | 'fail';
    apiLatency: 'pass' | 'fail';
    storage: 'pass' | 'fail';
  };
}

// Event tracking types
export interface RetentionEvent {
  eventType: 'retention';
  eventName: 'user_signup' | 'user_first_session' | 'user_week_1_active' | 'user_week_2_active';
  eventData: {
    cohortDate?: string;
    daysSinceSignup?: number;
    weeksSinceSignup?: number;
    totalSessions?: number;
  };
}

export interface ConversionEvent {
  eventType: 'conversion';
  eventName: 'landing_page_view' | 'signup_start' | 'signup_complete' | 'first_session' | 'pro_trial_start' | 'pro_convert' | 'pack_purchase';
  eventData: {
    source?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    planType?: string;
    packId?: string;
  };
}

export interface SessionQualityEvent {
  eventType: 'session_quality';
  eventName: 'session_start' | 'session_complete' | 'session_verify' | 'rep_undo' | 'pose_quality_low';
  eventData: {
    exercise?: string;
    duration?: number;
    reps?: number;
    qualityScore?: number;
    fps?: number;
    visibilityRate?: number;
    confidence?: number;
    deviceType?: string;
    browserType?: string;
  };
}

export interface PerformanceEvent {
  eventType: 'performance';
  eventName: 'api_latency' | 'processing_time' | 'error_occurred' | 'device_processing';
  eventData: {
    latency?: number;
    processingTime?: number;
    errorType?: string;
    errorMessage?: string;
    component?: string;
  };
}

export interface UserBehaviorEvent {
  eventType: 'user_behavior';
  eventName: 'feature_used' | 'page_view' | 'button_click' | 'navigation';
  eventData: {
    feature?: string;
    page?: string;
    button?: string;
    fromPage?: string;
    toPage?: string;
  };
}

export interface MonetizationEvent {
  eventType: 'monetization';
  eventName: 'pricing_view' | 'checkout_start' | 'payment_success' | 'subscription_change' | 'pack_view' | 'pack_purchase';
  eventData: {
    planType?: string;
    price?: number;
    currency?: string;
    packId?: string;
    packTitle?: string;
    paymentMethod?: string;
  };
}

export type AnalyticsEventData = 
  | RetentionEvent 
  | ConversionEvent 
  | SessionQualityEvent 
  | PerformanceEvent 
  | UserBehaviorEvent 
  | MonetizationEvent;

// Dashboard filters
export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  cohortDate?: string;
  deviceType?: string;
  exercise?: string;
  conversionSource?: string;
}

// Dashboard summary
export interface AnalyticsDashboardSummary {
  retention: RetentionMetricsResponse;
  sessions: SessionMetricsResponse;
  conversion: ProConversionMetricsResponse;
  quality: QualityMetricsResponse;
  performance: PerformanceGuardrailsResponse;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
}
