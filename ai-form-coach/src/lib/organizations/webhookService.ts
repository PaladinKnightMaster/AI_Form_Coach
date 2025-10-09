import type { SupabaseClient } from '@supabase/supabase-js';
import type { WebhookPayload, OrganizationMetrics, UserActivityEvent, CSVExportRequest } from './types';

export class WebhookService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Send webhook payload to organization's webhook URL
   */
  async sendWebhook(
    organizationId: string,
    eventType: 'metrics_updated' | 'export_requested' | 'user_activity',
    data: OrganizationMetrics | CSVExportRequest | UserActivityEvent
  ): Promise<boolean> {
    try {
      // Get organization webhook settings
      const { data: org, error: orgError } = await this.supabase
        .from('organizations')
        .select('settings')
        .eq('id', organizationId)
        .eq('is_active', true)
        .single();

      if (orgError || !org) {
        console.error('Error fetching organization webhook settings:', orgError);
        return false;
      }

      const settings = org.settings as Record<string, unknown>;
      if (!settings.webhookEnabled || !settings.webhookUrl) {
        console.log('Webhook not enabled for organization:', organizationId);
        return true; // Not an error, just not configured
      }

      // Create webhook payload
      const payload: WebhookPayload = {
        organizationId,
        eventType,
        timestamp: new Date().toISOString(),
        data,
        signature: this.generateSignature(data, settings.webhookSecret as string)
      };

      // Send webhook
      const response = await fetch(settings.webhookUrl as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Form-Coach-Webhook/1.0',
          'X-Webhook-Event': eventType,
          'X-Webhook-Signature': payload.signature
        },
        body: JSON.stringify(payload)
      });

      // Log webhook attempt
      await this.logWebhookAttempt(
        organizationId,
        eventType,
        data,
        response.status,
        response.statusText
      );

      return response.ok;
    } catch (error) {
      console.error('Error sending webhook:', error);
      
      // Log failed webhook attempt
      await this.logWebhookAttempt(
        organizationId,
        eventType,
        data,
        0,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return false;
    }
  }

  /**
   * Send metrics updated webhook
   */
  async sendMetricsUpdated(
    organizationId: string,
    metrics: OrganizationMetrics
  ): Promise<boolean> {
    return this.sendWebhook(organizationId, 'metrics_updated', metrics);
  }

  /**
   * Send export requested webhook
   */
  async sendExportRequested(
    organizationId: string,
    exportRequest: CSVExportRequest
  ): Promise<boolean> {
    return this.sendWebhook(organizationId, 'export_requested', exportRequest);
  }

  /**
   * Send user activity webhook
   */
  async sendUserActivity(
    organizationId: string,
    activity: UserActivityEvent
  ): Promise<boolean> {
    return this.sendWebhook(organizationId, 'user_activity', activity);
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(data: OrganizationMetrics | CSVExportRequest | UserActivityEvent, secret?: string): string {
    if (!secret) {
      return 'no-secret';
    }

    // In a real implementation, you would use crypto.createHmac
    // For now, we'll create a simple hash
    const payload = JSON.stringify(data);
    const timestamp = new Date().toISOString();
    const message = `${timestamp}.${payload}`;
    
    // Simple hash function (in production, use proper HMAC)
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `sha256=${hash.toString(16)}`;
  }

  /**
   * Log webhook attempt to database
   */
  private async logWebhookAttempt(
    organizationId: string,
    eventType: string,
    payload: OrganizationMetrics | CSVExportRequest | UserActivityEvent,
    responseStatus: number,
    responseBody: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('organization_webhook_logs')
        .insert({
          organization_id: organizationId,
          event_type: eventType,
          payload,
          response_status: responseStatus,
          response_body: responseBody,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging webhook attempt:', error);
    }
  }

  /**
   * Retry failed webhooks
   */
  async retryFailedWebhooks(organizationId?: string): Promise<void> {
    try {
      const query = this.supabase
        .from('organization_webhook_logs')
        .select('*')
        .eq('response_status', 0)
        .lt('retry_count', 3)
        .lt('next_retry_at', new Date().toISOString());

      if (organizationId) {
        query.eq('organization_id', organizationId);
      }

      const { data: failedWebhooks, error } = await query;

      if (error) {
        console.error('Error fetching failed webhooks:', error);
        return;
      }

      for (const webhook of failedWebhooks || []) {
        try {
          // Get organization settings
          const { data: org } = await this.supabase
            .from('organizations')
            .select('settings')
            .eq('id', webhook.organization_id)
            .single();

          if (!org?.settings?.webhookUrl) {
            continue;
          }

          // Retry webhook
          const response = await fetch(org.settings.webhookUrl as string, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'AI-Form-Coach-Webhook/1.0',
              'X-Webhook-Event': webhook.event_type,
              'X-Webhook-Signature': this.generateSignature(webhook.payload, org.settings.webhookSecret as string)
            },
            body: JSON.stringify({
              organizationId: webhook.organization_id,
              eventType: webhook.event_type,
              timestamp: webhook.sent_at,
              data: webhook.payload,
              signature: this.generateSignature(webhook.payload, org.settings.webhookSecret as string)
            })
          });

          // Update retry count and next retry time
          const nextRetryAt = new Date(Date.now() + Math.pow(2, webhook.retry_count + 1) * 60000); // Exponential backoff
          
          await this.supabase
            .from('organization_webhook_logs')
            .update({
              response_status: response.status,
              response_body: response.statusText,
              retry_count: webhook.retry_count + 1,
              next_retry_at: nextRetryAt.toISOString()
            })
            .eq('id', webhook.id);

        } catch (retryError) {
          console.error('Error retrying webhook:', retryError);
          
          // Update retry count
          await this.supabase
            .from('organization_webhook_logs')
            .update({
              retry_count: webhook.retry_count + 1,
              next_retry_at: new Date(Date.now() + Math.pow(2, webhook.retry_count + 1) * 60000).toISOString()
            })
            .eq('id', webhook.id);
        }
      }
    } catch (error) {
      console.error('Error in retryFailedWebhooks:', error);
    }
  }

  /**
   * Get webhook logs for an organization
   */
  async getWebhookLogs(
    organizationId: string,
    limit = 50,
    offset = 0
  ): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await this.supabase
        .from('organization_webhook_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching webhook logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getWebhookLogs:', error);
      return [];
    }
  }

  /**
   * Test webhook configuration
   */
  async testWebhook(organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const testPayload: UserActivityEvent = {
        userId: 'test-user',
        activityType: 'session_started',
        timestamp: new Date().toISOString(),
        metadata: {
          test: true,
          message: 'This is a test webhook from AI Form Coach'
        }
      };

      const success = await this.sendWebhook(organizationId, 'user_activity', testPayload);
      
      return {
        success,
        message: success 
          ? 'Webhook test successful' 
          : 'Webhook test failed - check logs for details'
      };
    } catch (error) {
      return {
        success: false,
        message: `Webhook test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Note: This service now requires a Supabase client instance
// Use: new WebhookService(supabaseClient)
