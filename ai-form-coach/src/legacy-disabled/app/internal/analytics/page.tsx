"use client";

import { useState, useEffect, useCallback } from 'react';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import LoadingOverlay from '@/components/LoadingOverlay';
import AlertPanel from '@/components/monitoring/AlertPanel';
import { getCurrentUserId } from '@/lib/supabase/client';
import type { 
  AnalyticsDashboardSummary,
  PerformanceGuardrailsResponse
} from '@/lib/analytics/types';

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  className?: string;
}

function MetricCard({ title, value, subtitle, trend, status, className = '' }: MetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <span className="text-green-500 text-sm">↗</span>;
      case 'down': return <span className="text-red-500 text-sm">↘</span>;
      case 'stable': return <span className="text-gray-500 text-sm">→</span>;
      default: return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {getTrendIcon()}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      {subtitle && (
        <p className={`text-sm ${getStatusColor()}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Guardrails Status Component
interface GuardrailsStatusProps {
  guardrails: PerformanceGuardrailsResponse;
}

function GuardrailsStatus({ guardrails }: GuardrailsStatusProps) {
  const getStatusBadge = (status: 'pass' | 'fail') => {
    return status === 'pass' 
      ? <Badge tone="success">Pass</Badge>
      : <Badge tone="error">Fail</Badge>;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Performance Guardrails
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Device Processing</p>
            <p className="text-sm text-gray-500">
              {guardrails.deviceProcessingRate.toFixed(1)}% (Target: ≥{guardrails.thresholds.deviceProcessingMin}%)
            </p>
          </div>
          {getStatusBadge(guardrails.status.deviceProcessing)}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">API Latency</p>
            <p className="text-sm text-gray-500">
              {guardrails.medianApiLatency.toFixed(0)}ms (Target: ≤{guardrails.thresholds.apiLatencyMax}ms)
            </p>
          </div>
          {getStatusBadge(guardrails.status.apiLatency)}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Storage per User</p>
            <p className="text-sm text-gray-500">
              {guardrails.storagePerUserMB.toFixed(1)}MB (Target: ≤{guardrails.thresholds.storagePerUserMax}MB)
            </p>
          </div>
          {getStatusBadge(guardrails.status.storage)}
        </div>
      </div>
    </div>
  );
}

export default function InternalAnalyticsPage() {
  const { error: showError } = useToastContext();
  
  const [dashboard, setDashboard] = useState<AnalyticsDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await getCurrentUserId();
      if (!userId) {
        // Redirect to signin or show unauthorized message
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, []);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        timeRange
      });

      const response = await fetch(`/api/analytics/dashboard?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: AnalyticsDashboardSummary = await response.json();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      showError('Failed to load analytics', 'Unable to load analytics dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, timeRange, showError]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, fetchDashboard]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return <LoadingOverlay isVisible={true} message="Checking authentication..." />;
  }

  // Show unauthorized message
  if (!isAuthenticated) {
    return (
      <Container className="py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-6">
          This is an internal analytics dashboard. Please sign in to access.
        </p>
        <Button onClick={() => window.location.href = '/signin'}>
          Sign In
        </Button>
      </Container>
    );
  }

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading analytics dashboard..." />;
  }

  if (!dashboard) {
    return (
      <Container className="py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          No Data Available
        </h1>
        <p className="text-gray-600 mb-6">
          Unable to load analytics data. Please try refreshing.
        </p>
        <Button onClick={handleRefresh} loading={refreshing}>
          Refresh
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Internal Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Investor-grade metrics and performance monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button 
            onClick={handleRefresh} 
            loading={refreshing}
            variant="outline"
          >
            <Icon name="refresh" className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Guardrails */}
      <div className="mb-8">
        <GuardrailsStatus guardrails={dashboard.performance} />
      </div>

      {/* Active Alerts */}
      <div className="mb-8">
        <AlertPanel />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="D1 Retention"
          value={`${dashboard.retention.d1Rate.toFixed(1)}%`}
          subtitle={`${dashboard.retention.d1Retained} of ${dashboard.retention.totalUsers} users`}
          status={dashboard.retention.d1Rate >= 40 ? 'good' : dashboard.retention.d1Rate >= 20 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="W1 Retention"
          value={`${dashboard.retention.w1Rate.toFixed(1)}%`}
          subtitle={`${dashboard.retention.w1Retained} of ${dashboard.retention.totalUsers} users`}
          status={dashboard.retention.w1Rate >= 20 ? 'good' : dashboard.retention.w1Rate >= 10 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Session Completion"
          value={`${dashboard.sessions.completionRate.toFixed(1)}%`}
          subtitle={`${dashboard.sessions.completedSessions} of ${dashboard.sessions.totalSessions} sessions`}
          status={dashboard.sessions.completionRate >= 80 ? 'good' : dashboard.sessions.completionRate >= 60 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Verification Rate"
          value={`${dashboard.sessions.verificationRate.toFixed(1)}%`}
          subtitle={`${dashboard.sessions.verifiedSessions} verified sessions`}
          status={dashboard.sessions.verificationRate >= 70 ? 'good' : dashboard.sessions.verificationRate >= 50 ? 'warning' : 'critical'}
        />
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Pro Trial Rate"
          value={`${dashboard.conversion.trialRate.toFixed(1)}%`}
          subtitle={`${dashboard.conversion.proTrials} of ${dashboard.conversion.totalUsers} users`}
          status={dashboard.conversion.trialRate >= 10 ? 'good' : dashboard.conversion.trialRate >= 5 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Pro Conversion"
          value={`${dashboard.conversion.conversionRate.toFixed(1)}%`}
          subtitle={`${dashboard.conversion.proConversions} of ${dashboard.conversion.proTrials} trials`}
          status={dashboard.conversion.conversionRate >= 20 ? 'good' : dashboard.conversion.conversionRate >= 10 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Pack Attach Rate"
          value={`${dashboard.conversion.packAttachRate.toFixed(1)}%`}
          subtitle={`${dashboard.conversion.packPurchases} pack purchases`}
          status={dashboard.conversion.packAttachRate >= 5 ? 'good' : dashboard.conversion.packAttachRate >= 2 ? 'warning' : 'critical'}
        />
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Median FPS"
          value={dashboard.quality.medianFps.toFixed(1)}
          subtitle="Frames per second"
          status={dashboard.quality.medianFps >= 30 ? 'good' : dashboard.quality.medianFps >= 20 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Visibility Rate"
          value={`${dashboard.quality.avgVisibilityRate.toFixed(1)}%`}
          subtitle="Pose visibility"
          status={dashboard.quality.avgVisibilityRate >= 80 ? 'good' : dashboard.quality.avgVisibilityRate >= 60 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Undo Rate"
          value={`${dashboard.quality.avgUndoRate.toFixed(1)}%`}
          subtitle="False rep corrections"
          status={dashboard.quality.avgUndoRate <= 10 ? 'good' : dashboard.quality.avgUndoRate <= 20 ? 'warning' : 'critical'}
        />
        
        <MetricCard
          title="Avg Confidence"
          value={`${dashboard.quality.avgConfidence.toFixed(1)}%`}
          subtitle="Pose confidence"
          status={dashboard.quality.avgConfidence >= 80 ? 'good' : dashboard.quality.avgConfidence >= 60 ? 'warning' : 'critical'}
        />
      </div>

      {/* Device Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quality by Device Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(dashboard.quality.deviceBreakdown).map(([device, confidence]) => (
            <div key={device} className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {confidence ? `${confidence.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {device} Confidence
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Last updated: {new Date(dashboard.generatedAt).toLocaleString()}</p>
        <p>Period: {new Date(dashboard.period.start).toLocaleDateString()} - {new Date(dashboard.period.end).toLocaleDateString()}</p>
      </div>
    </Container>
  );
}
