"use client";

import { useState, useEffect } from 'react';
import { Icon, Badge, Button } from '@/ui/DS';
import type { Alert } from '@/lib/monitoring/alerting';

interface AlertPanelProps {
  className?: string;
}

export default function AlertPanel({ className = '' }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  // Fetch active alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitoring/alerts?type=active');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      setResolving(alertId);
      const response = await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', alertId })
      });
      
      if (response.ok) {
        // Remove resolved alert from list
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setResolving(null);
    }
  };

  // Load alerts on mount
  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <Icon name="alert" className="w-5 h-5 text-red-500" />;
      case 'warning': return <Icon name="alert" className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Icon name="alert" className="w-5 h-5 text-blue-500" />;
      default: return <Icon name="bell" className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'critical': return <Badge tone="error">Critical</Badge>;
      case 'warning': return <Badge tone="warning">Warning</Badge>;
      case 'info': return <Badge tone="info">Info</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Active Alerts
        </h3>
        <div className="flex items-center space-x-2">
          <Badge tone={alerts.length === 0 ? 'success' : alerts.some(a => a.type === 'critical') ? 'error' : 'warning'}>
            {alerts.length} Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
          >
            <Icon name="refresh" className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <Icon name="check-circle" className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No active alerts. All systems are operating normally.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${
                alert.type === 'critical' 
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : alert.type === 'warning'
                  ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                  : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {alert.metric}
                      </span>
                      {getAlertBadge(alert.type)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Value: {alert.value.toFixed(2)}</span>
                      <span>Threshold: {alert.threshold}</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolveAlert(alert.id)}
                  loading={resolving === alert.id}
                  disabled={resolving === alert.id}
                >
                  <Icon name="check" className="w-4 h-4 mr-1" />
                  Resolve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
