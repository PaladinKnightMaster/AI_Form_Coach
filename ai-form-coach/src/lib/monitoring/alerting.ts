// Real-time Monitoring and Alerting System
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PerformanceGuardrailsResponse,
  RetentionMetricsResponse,
  SessionMetricsResponse,
  ProConversionMetricsResponse,
  QualityMetricsResponse
} from '@/lib/analytics/types';

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  metric: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  cooldownMinutes: number;
}

export class MonitoringService {
  private supabase: SupabaseClient;
  private alertRules: AlertRule[] = [];
  private activeAlerts: Map<string, Alert> = new Map();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.initializeAlertRules();
  }

  // Initialize default alert rules
  private initializeAlertRules(): void {
    this.alertRules = [
      // Retention Alerts
      {
        id: 'd1_retention_critical',
        name: 'D1 Retention Critical',
        metric: 'd1Retention',
        operator: 'lt',
        threshold: 15,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 60
      },
      {
        id: 'd1_retention_warning',
        name: 'D1 Retention Warning',
        metric: 'd1Retention',
        operator: 'lt',
        threshold: 25,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 30
      },
      {
        id: 'w1_retention_critical',
        name: 'W1 Retention Critical',
        metric: 'w1Retention',
        operator: 'lt',
        threshold: 8,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 60
      },
      {
        id: 'w1_retention_warning',
        name: 'W1 Retention Warning',
        metric: 'w1Retention',
        operator: 'lt',
        threshold: 15,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 30
      },

      // Session Quality Alerts
      {
        id: 'session_completion_critical',
        name: 'Session Completion Critical',
        metric: 'sessionCompletion',
        operator: 'lt',
        threshold: 50,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 30
      },
      {
        id: 'session_completion_warning',
        name: 'Session Completion Warning',
        metric: 'sessionCompletion',
        operator: 'lt',
        threshold: 70,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 15
      },
      {
        id: 'verification_rate_critical',
        name: 'Verification Rate Critical',
        metric: 'verificationRate',
        operator: 'lt',
        threshold: 40,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 30
      },
      {
        id: 'verification_rate_warning',
        name: 'Verification Rate Warning',
        metric: 'verificationRate',
        operator: 'lt',
        threshold: 60,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 15
      },

      // Performance Alerts
      {
        id: 'api_latency_critical',
        name: 'API Latency Critical',
        metric: 'apiLatency',
        operator: 'gt',
        threshold: 500,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 15
      },
      {
        id: 'api_latency_warning',
        name: 'API Latency Warning',
        metric: 'apiLatency',
        operator: 'gt',
        threshold: 200,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 10
      },
      {
        id: 'device_processing_critical',
        name: 'Device Processing Critical',
        metric: 'deviceProcessing',
        operator: 'lt',
        threshold: 90,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 30
      },
      {
        id: 'device_processing_warning',
        name: 'Device Processing Warning',
        metric: 'deviceProcessing',
        operator: 'lt',
        threshold: 95,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 15
      },

      // Quality Alerts
      {
        id: 'fps_critical',
        name: 'FPS Critical',
        metric: 'medianFps',
        operator: 'lt',
        threshold: 15,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 30
      },
      {
        id: 'fps_warning',
        name: 'FPS Warning',
        metric: 'medianFps',
        operator: 'lt',
        threshold: 25,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 15
      },
      {
        id: 'visibility_critical',
        name: 'Visibility Critical',
        metric: 'visibilityRate',
        operator: 'lt',
        threshold: 50,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 30
      },
      {
        id: 'visibility_warning',
        name: 'Visibility Warning',
        metric: 'visibilityRate',
        operator: 'lt',
        threshold: 70,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 15
      },

      // Conversion Alerts
      {
        id: 'pro_conversion_critical',
        name: 'Pro Conversion Critical',
        metric: 'proConversion',
        operator: 'lt',
        threshold: 5,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 60
      },
      {
        id: 'pro_conversion_warning',
        name: 'Pro Conversion Warning',
        metric: 'proConversion',
        operator: 'lt',
        threshold: 10,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 30
      }
    ];
  }

  // Check metrics against alert rules
  public async checkMetrics(
    retention: RetentionMetricsResponse,
    sessions: SessionMetricsResponse,
    conversion: ProConversionMetricsResponse,
    quality: QualityMetricsResponse,
    performance: PerformanceGuardrailsResponse
  ): Promise<Alert[]> {
    const newAlerts: Alert[] = [];
    const metrics = {
      d1Retention: retention.d1Rate,
      w1Retention: retention.w1Rate,
      sessionCompletion: sessions.completionRate,
      verificationRate: sessions.verificationRate,
      apiLatency: performance.medianApiLatency,
      deviceProcessing: performance.deviceProcessingRate,
      medianFps: quality.medianFps,
      visibilityRate: quality.avgVisibilityRate,
      proConversion: conversion.conversionRate
    };

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const metricValue = metrics[rule.metric as keyof typeof metrics];
      if (metricValue === undefined) continue;

      const shouldAlert = this.evaluateRule(rule, metricValue);
      if (shouldAlert) {
        const alertKey = `${rule.id}_${rule.metric}`;
        const existingAlert = this.activeAlerts.get(alertKey);

        // Check cooldown period
        if (existingAlert && this.isInCooldown(existingAlert, rule.cooldownMinutes)) {
          continue;
        }

        const alert: Alert = {
          id: `${alertKey}_${Date.now()}`,
          type: rule.severity,
          metric: rule.metric,
          message: this.generateAlertMessage(rule, metricValue),
          value: metricValue,
          threshold: rule.threshold,
          timestamp: new Date().toISOString(),
          resolved: false
        };

        newAlerts.push(alert);
        this.activeAlerts.set(alertKey, alert);

        // Store alert in database
        await this.storeAlert(alert);
      } else {
        // Resolve existing alert if metric is back to normal
        const alertKey = `${rule.id}_${rule.metric}`;
        const existingAlert = this.activeAlerts.get(alertKey);
        if (existingAlert && !existingAlert.resolved) {
          await this.resolveAlert(existingAlert.id);
          this.activeAlerts.delete(alertKey);
        }
      }
    }

    return newAlerts;
  }

  // Evaluate alert rule
  private evaluateRule(rule: AlertRule, value: number): boolean {
    switch (rule.operator) {
      case 'gt': return value > rule.threshold;
      case 'lt': return value < rule.threshold;
      case 'eq': return value === rule.threshold;
      case 'gte': return value >= rule.threshold;
      case 'lte': return value <= rule.threshold;
      default: return false;
    }
  }

  // Check if alert is in cooldown period
  private isInCooldown(alert: Alert, cooldownMinutes: number): boolean {
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const timeSinceAlert = Date.now() - new Date(alert.timestamp).getTime();
    return timeSinceAlert < cooldownMs;
  }

  // Generate alert message
  private generateAlertMessage(rule: AlertRule, value: number): string {
    const operatorText = {
      'gt': 'exceeded',
      'lt': 'dropped below',
      'eq': 'equals',
      'gte': 'reached or exceeded',
      'lte': 'reached or dropped below'
    };

    return `${rule.name}: ${rule.metric} has ${operatorText[rule.operator]} ${rule.threshold} (current: ${value.toFixed(2)})`;
  }

  // Store alert in database
  private async storeAlert(alert: Alert): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('alerts')
        .insert({
          id: alert.id,
          type: alert.type,
          metric: alert.metric,
          message: alert.message,
          value: alert.value,
          threshold: alert.threshold,
          timestamp: alert.timestamp,
          resolved: alert.resolved
        });

      if (error) {
        console.error('Error storing alert:', error);
      }
    } catch (error) {
      console.error('Error in storeAlert:', error);
    }
  }

  // Resolve alert
  public async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        console.error('Error resolving alert:', error);
      }
    } catch (error) {
      console.error('Error in resolveAlert:', error);
    }
  }

  // Get active alerts
  public async getActiveAlerts(): Promise<Alert[]> {
    try {
      const { data, error } = await this.supabase
        .from('alerts')
        .select('*')
        .eq('resolved', false)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching active alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveAlerts:', error);
      return [];
    }
  }

  // Get alert history
  public async getAlertHistory(limit: number = 50): Promise<Alert[]> {
    try {
      const { data, error } = await this.supabase
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching alert history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAlertHistory:', error);
      return [];
    }
  }

  // Send alert notifications
  public async sendAlertNotifications(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      try {
        // Send email notification for critical alerts
        if (alert.type === 'critical') {
          await this.sendEmailAlert(alert);
        }

        // Send Slack notification for all alerts
        await this.sendSlackAlert(alert);

        // Log alert to console in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(`🚨 ALERT [${alert.type.toUpperCase()}]: ${alert.message}`);
        }
      } catch (error) {
        console.error('Error sending alert notification:', error);
      }
    }
  }

  // Send email alert
  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Implementation would depend on your email service (SendGrid, AWS SES, etc.)
    console.log(`Email alert: ${alert.message}`);
  }

  // Send Slack alert
  private async sendSlackAlert(alert: Alert): Promise<void> {
    // Implementation would depend on your Slack webhook configuration
    console.log(`Slack alert: ${alert.message}`);
  }

  // Get alert rules
  public getAlertRules(): AlertRule[] {
    return this.alertRules;
  }

  // Update alert rule
  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    }
  }

  // Enable/disable alert rule
  public toggleAlertRule(ruleId: string, enabled: boolean): void {
    this.updateAlertRule(ruleId, { enabled });
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService(
  typeof window !== 'undefined' 
    ? (await import('@/lib/supabase/client')).getSupabaseClient()
    : null as unknown as SupabaseClient // This will be properly initialized in API routes
);
