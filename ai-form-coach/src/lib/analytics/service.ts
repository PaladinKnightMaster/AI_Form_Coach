import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  UserRetentionMetrics,
  ConversionFunnel,
  PerformanceGuardrails,
  CostGuardrails,
  RetentionMetricsResponse,
  SessionMetricsResponse,
  ProConversionMetricsResponse,
  QualityMetricsResponse,
  PerformanceGuardrailsResponse,
  AnalyticsEventData,
  AnalyticsFilters,
  AnalyticsDashboardSummary
} from './types';

export class AnalyticsService {
  constructor(private supabase: SupabaseClient) {}

  // Track analytics events
  async trackEvent(eventData: AnalyticsEventData, userId: string, sessionId?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('analytics_events_enhanced')
        .insert({
          user_id: userId,
          session_id: sessionId,
          event_type: eventData.eventType,
          event_name: eventData.eventName,
          event_data: eventData.eventData,
          device_info: this.getDeviceInfo(),
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking analytics event:', error);
      }
    } catch (error) {
      console.error('Error in trackEvent:', error);
    }
  }

  // Update conversion funnel
  async updateConversionFunnel(
    userId: string, 
    stage: keyof ConversionFunnel, 
    eventData?: Record<string, unknown>
  ): Promise<void> {
    try {
      const updateData: Partial<ConversionFunnel> = {
        [stage]: true,
        [`${stage}At`]: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add conversion source data if provided
      if (eventData?.conversionSource) {
        updateData.conversionSource = eventData.conversionSource as string;
      }
      if (eventData?.utmSource) {
        updateData.utmSource = eventData.utmSource as string;
      }
      if (eventData?.utmMedium) {
        updateData.utmMedium = eventData.utmMedium as string;
      }
      if (eventData?.utmCampaign) {
        updateData.utmCampaign = eventData.utmCampaign as string;
      }

      const { error } = await this.supabase
        .from('conversion_funnel')
        .upsert({
          user_id: userId,
          ...updateData
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating conversion funnel:', error);
      }
    } catch (error) {
      console.error('Error in updateConversionFunnel:', error);
    }
  }

  // Record session quality metrics
  async recordSessionQuality(
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
      const { error } = await this.supabase
        .from('session_quality_metrics')
        .insert({
          session_id: sessionId,
          user_id: userId,
          ...qualityData,
          error_count: qualityData.errorCount || 0
        });

      if (error) {
        console.error('Error recording session quality:', error);
      }
    } catch (error) {
      console.error('Error in recordSessionQuality:', error);
    }
  }

  // Get retention metrics
  async getRetentionMetrics(filters: AnalyticsFilters): Promise<RetentionMetricsResponse> {
    try {
      const { data, error } = await this.supabase.rpc('calculate_retention_metrics', {
        p_start_date: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_end_date: filters.endDate || new Date().toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error getting retention metrics:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getRetentionMetrics:', error);
      throw error;
    }
  }

  // Get session metrics
  async getSessionMetrics(filters: AnalyticsFilters): Promise<SessionMetricsResponse> {
    try {
      const { data, error } = await this.supabase.rpc('calculate_session_metrics', {
        p_start_date: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: filters.endDate || new Date().toISOString()
      });

      if (error) {
        console.error('Error getting session metrics:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getSessionMetrics:', error);
      throw error;
    }
  }

  // Get Pro conversion metrics
  async getProConversionMetrics(filters: AnalyticsFilters): Promise<ProConversionMetricsResponse> {
    try {
      const { data, error } = await this.supabase.rpc('calculate_pro_conversion_metrics', {
        p_start_date: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: filters.endDate || new Date().toISOString()
      });

      if (error) {
        console.error('Error getting Pro conversion metrics:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getProConversionMetrics:', error);
      throw error;
    }
  }

  // Get quality metrics
  async getQualityMetrics(filters: AnalyticsFilters): Promise<QualityMetricsResponse> {
    try {
      const { data, error } = await this.supabase.rpc('calculate_quality_metrics', {
        p_start_date: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: filters.endDate || new Date().toISOString()
      });

      if (error) {
        console.error('Error getting quality metrics:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getQualityMetrics:', error);
      throw error;
    }
  }

  // Get performance guardrails
  async getPerformanceGuardrails(): Promise<PerformanceGuardrailsResponse> {
    try {
      const { data, error } = await this.supabase.rpc('check_performance_guardrails');

      if (error) {
        console.error('Error getting performance guardrails:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getPerformanceGuardrails:', error);
      throw error;
    }
  }

  // Get comprehensive dashboard summary
  async getDashboardSummary(filters: AnalyticsFilters): Promise<AnalyticsDashboardSummary> {
    try {
      const [retention, sessions, conversion, quality, performance] = await Promise.all([
        this.getRetentionMetrics(filters),
        this.getSessionMetrics(filters),
        this.getProConversionMetrics(filters),
        this.getQualityMetrics(filters),
        this.getPerformanceGuardrails()
      ]);

      return {
        retention,
        sessions,
        conversion,
        quality,
        performance,
        generatedAt: new Date().toISOString(),
        period: {
          start: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: filters.endDate || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error in getDashboardSummary:', error);
      throw error;
    }
  }

  // Get user retention metrics for a specific user
  async getUserRetentionMetrics(userId: string): Promise<UserRetentionMetrics | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_retention_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('cohort_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No data found
        }
        console.error('Error getting user retention metrics:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserRetentionMetrics:', error);
      throw error;
    }
  }

  // Get conversion funnel for a specific user
  async getUserConversionFunnel(userId: string): Promise<ConversionFunnel | null> {
    try {
      const { data, error } = await this.supabase
        .from('conversion_funnel')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No data found
        }
        console.error('Error getting user conversion funnel:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserConversionFunnel:', error);
      throw error;
    }
  }

  // Get recent performance guardrails
  async getRecentPerformanceGuardrails(limit: number = 10): Promise<PerformanceGuardrails[]> {
    try {
      const { data, error } = await this.supabase
        .from('performance_guardrails')
        .select('*')
        .order('measurement_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting recent performance guardrails:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentPerformanceGuardrails:', error);
      throw error;
    }
  }

  // Get recent cost guardrails
  async getRecentCostGuardrails(limit: number = 10): Promise<CostGuardrails[]> {
    try {
      const { data, error } = await this.supabase
        .from('cost_guardrails')
        .select('*')
        .order('measurement_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting recent cost guardrails:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentCostGuardrails:', error);
      throw error;
    }
  }

  // Helper method to get device info
  private getDeviceInfo(): Record<string, unknown> {
    if (typeof window === 'undefined') {
      return {};
    }

    const userAgent = window.navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    return {
      isMobile,
      isTablet,
      isDesktop,
      userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      language: window.navigator.language,
      platform: window.navigator.platform
    };
  }

  // Helper method to calculate time range from filter
  private getTimeRange(filters: AnalyticsFilters): { start: string; end: string } {
    const now = new Date();
    let start: Date;

    switch (filters.timeRange) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      start: filters.startDate || start.toISOString(),
      end: filters.endDate || now.toISOString()
    };
  }
}

// Export a singleton instance for client-side use
export const analyticsService = new AnalyticsService(
  typeof window !== 'undefined' 
    ? (await import('@/lib/supabase/client')).getSupabaseClient()
    : null as unknown as SupabaseClient // This will be properly initialized in API routes
);
