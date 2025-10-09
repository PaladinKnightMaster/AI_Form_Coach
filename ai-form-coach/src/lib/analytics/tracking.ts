// Enhanced Analytics Tracking for Investor-grade Metrics
import { logEvent } from '@/lib/observability/events';
// Enhanced Analytics Tracking for Investor-grade Metrics

// Enhanced event tracking with automatic conversion funnel updates
export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private analyticsService: { 
    trackEvent: (eventData: unknown, userId: string, sessionId?: string) => Promise<void>;
    updateConversionFunnel: (userId: string, stage: string, eventData?: Record<string, unknown>) => Promise<void>;
    recordSessionQuality: (sessionId: string, userId: string, qualityData: Record<string, unknown>) => Promise<void>;
  } | null = null;

  private constructor() {}

  public static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  // Initialize with analytics service
  public async initialize() {
    if (typeof window !== 'undefined') {
      const { analyticsService } = await import('./service');
      this.analyticsService = analyticsService as { 
        trackEvent: (eventData: unknown, userId: string, sessionId?: string) => Promise<void>;
        updateConversionFunnel: (userId: string, stage: string, eventData?: Record<string, unknown>) => Promise<void>;
        recordSessionQuality: (sessionId: string, userId: string, qualityData: Record<string, unknown>) => Promise<void>;
      };
    }
  }

  // Track retention events
  public async trackRetention(
    eventName: 'user_signup' | 'user_first_session' | 'user_week_1_active' | 'user_week_2_active',
    eventData: {
      cohortDate?: string;
      daysSinceSignup?: number;
      weeksSinceSignup?: number;
      totalSessions?: number;
    },
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      // Log to existing system
      await logEvent(eventName, eventData);

      // Track in enhanced analytics
      if (this.analyticsService && userId) {
        await this.analyticsService.trackEvent({
          eventType: 'retention',
          eventName,
          eventData
        }, userId, sessionId);
      }
    } catch (error) {
      console.error('Error tracking retention event:', error);
    }
  }

  // Track conversion events
  public async trackConversion(
    eventName: 'landing_page_view' | 'signup_start' | 'signup_complete' | 'first_session' | 'pro_trial_start' | 'pro_convert' | 'pack_purchase',
    eventData: {
      source?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      planType?: string;
      packId?: string;
    },
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      // Log to existing system
      await logEvent(eventName, eventData);

      // Track in enhanced analytics
      if (this.analyticsService && userId) {
        await this.analyticsService.trackEvent({
          eventType: 'conversion',
          eventName,
          eventData
        }, userId, sessionId);

        // Update conversion funnel
        await this.analyticsService.updateConversionFunnel(userId, this.getFunnelStage(eventName), eventData);
      }
    } catch (error) {
      console.error('Error tracking conversion event:', error);
    }
  }

  // Track session quality events
  public async trackSessionQuality(
    eventName: 'session_started' | 'session_ended' | 'session_verify' | 'undo_used' | 'pose_quality_low',
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
    },
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      // Log to existing system
      await logEvent(eventName, eventData);

      // Track in enhanced analytics
      if (this.analyticsService && userId) {
        await this.analyticsService.trackEvent({
          eventType: 'session_quality',
          eventName,
          eventData
        }, userId, sessionId);
      }
    } catch (error) {
      console.error('Error tracking session quality event:', error);
    }
  }

  // Track performance events
  public async trackPerformance(
    eventName: 'api_latency' | 'processing_time' | 'error_occurred' | 'device_processing',
    eventData: {
      latency?: number;
      processingTime?: number;
      errorType?: string;
      errorMessage?: string;
      component?: string;
    },
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      // Log to existing system
      await logEvent(eventName, eventData);

      // Track in enhanced analytics
      if (this.analyticsService && userId) {
        await this.analyticsService.trackEvent({
          eventType: 'performance',
          eventName,
          eventData
        }, userId, sessionId);
      }
    } catch (error) {
      console.error('Error tracking performance event:', error);
    }
  }

  // Track user behavior events
  public async trackUserBehavior(
    eventName: 'feature_used' | 'page_view' | 'button_click' | 'navigation',
    eventData: {
      feature?: string;
      page?: string;
      button?: string;
      fromPage?: string;
      toPage?: string;
    },
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      // Log to existing system
      await logEvent(eventName, eventData);

      // Track in enhanced analytics
      if (this.analyticsService && userId) {
        await this.analyticsService.trackEvent({
          eventType: 'user_behavior',
          eventName,
          eventData
        }, userId, sessionId);
      }
    } catch (error) {
      console.error('Error tracking user behavior event:', error);
    }
  }

  // Track monetization events
  public async trackMonetization(
    eventName: 'pricing_view' | 'checkout_start' | 'payment_success' | 'subscription_change' | 'pack_view' | 'pack_purchase',
    eventData: {
      planType?: string;
      price?: number;
      currency?: string;
      packId?: string;
      packTitle?: string;
      paymentMethod?: string;
    },
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      // Log to existing system
      await logEvent(eventName, eventData);

      // Track in enhanced analytics
      if (this.analyticsService && userId) {
        await this.analyticsService.trackEvent({
          eventType: 'monetization',
          eventName,
          eventData
        }, userId, sessionId);

        // Update conversion funnel for monetization events
        if (eventName === 'pack_purchase' && userId) {
          await this.analyticsService.updateConversionFunnel(userId, 'packPurchased', eventData);
        }
      }
    } catch (error) {
      console.error('Error tracking monetization event:', error);
    }
  }

  // Record session quality metrics
  public async recordSessionQualityMetrics(
    sessionId: string,
    userId: string,
    qualityData: {
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
      errorCount?: number;
    }
  ): Promise<void> {
    try {
      if (this.analyticsService) {
        await this.analyticsService.recordSessionQuality(sessionId, userId, qualityData);
      }
    } catch (error) {
      console.error('Error recording session quality metrics:', error);
    }
  }

  // Helper method to map event names to funnel stages
  private getFunnelStage(eventName: string): string {
    const stageMap: Record<string, string> = {
      'landing_page_view': 'landingPageViewed',
      'signup_start': 'signupStarted',
      'signup_complete': 'signupCompleted',
      'first_session': 'firstSessionStarted',
      'session_complete': 'firstSessionCompleted',
      'session_verify': 'firstVerifiedSession',
      'pro_trial_start': 'proTrialStarted',
      'pro_convert': 'proConverted',
      'pack_purchase': 'packPurchased'
    };

    return stageMap[eventName] || eventName;
  }
}

// Export singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance();

// Convenience functions for common tracking scenarios
export const trackUserSignup = async (userId: string, source?: string) => {
  await analyticsTracker.trackConversion('signup_complete', { source }, userId);
  await analyticsTracker.trackRetention('user_signup', { cohortDate: new Date().toISOString().split('T')[0] }, userId);
};

export const trackFirstSession = async (userId: string, sessionId: string) => {
  await analyticsTracker.trackConversion('first_session', { source: 'app' }, userId, sessionId);
  await analyticsTracker.trackRetention('user_first_session', { totalSessions: 1 }, userId, sessionId);
};

export const trackSessionQuality = async (
  sessionId: string, 
  userId: string, 
  qualityData: {
    medianFps?: number;
    lowVisibilityRate?: number;
    falseRepUndoRate?: number;
    averagePoseConfidence?: number;
    deviceType?: string;
    browserType?: string;
    qualityScore?: number;
    apiLatencyMs?: number;
    processingTimeMs?: number;
    errorCount?: number;
  }
) => {
  await analyticsTracker.recordSessionQualityMetrics(sessionId, userId, qualityData);
};

export const trackProConversion = async (userId: string, planType: string, price: number, currency: string) => {
  await analyticsTracker.trackMonetization('payment_success', { planType, price, currency }, userId);
};

export const trackPackPurchase = async (userId: string, packId: string, packTitle: string, price: number, currency: string) => {
  await analyticsTracker.trackMonetization('pack_purchase', { packId, packTitle, price, currency }, userId);
};

export const trackPerformanceMetrics = async (
  userId: string,
  sessionId: string,
  metrics: {
    latency?: number;
    processingTime?: number;
    errorType?: string;
    errorMessage?: string;
    component?: string;
  }
) => {
  if (metrics.latency) {
    await analyticsTracker.trackPerformance('api_latency', { latency: metrics.latency }, userId, sessionId);
  }
  if (metrics.processingTime) {
    await analyticsTracker.trackPerformance('processing_time', { processingTime: metrics.processingTime }, userId, sessionId);
  }
  if (metrics.errorType) {
    await analyticsTracker.trackPerformance('error_occurred', {
      errorType: metrics.errorType,
      errorMessage: metrics.errorMessage,
      component: metrics.component
    }, userId, sessionId);
  }
};

// Initialize tracker when module loads
if (typeof window !== 'undefined') {
  analyticsTracker.initialize();
}
