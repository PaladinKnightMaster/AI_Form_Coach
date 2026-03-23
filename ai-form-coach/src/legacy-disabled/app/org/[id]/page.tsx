"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Button, Icon } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import LoadingOverlay from '@/components/LoadingOverlay';
import { getCurrentUserId } from '@/lib/supabase/client';
import type { 
  OrganizationDashboardResponse, 
  OrganizationDashboardFilters, 
  OrganizationMetrics 
} from '@/lib/organizations/types';

export default function OrganizationDashboardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToastContext();
  
  const [dashboard, setDashboard] = useState<OrganizationDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [filters, setFilters] = useState<OrganizationDashboardFilters>({
    timeRange: '30d',
    includePHI: false
  });
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'form-iq' | 'verified-minutes' | 'adherence' | 'resolution'>('overview');

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await getCurrentUserId();
      if (!userId) {
        router.push('/signin?redirect=/org/' + params.id);
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [router, params.id]);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated || !params.id) return;

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        timeRange: filters.timeRange,
        includePHI: filters.includePHI.toString()
      });

      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.exerciseFilter) queryParams.append('exerciseFilter', filters.exerciseFilter.join(','));
      if (filters.userFilter) queryParams.append('userFilter', filters.userFilter.join(','));

      const response = await fetch(`/api/organizations/${params.id}/dashboard?${queryParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      showError('Failed to load dashboard', 'Unable to load organization dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, params.id, filters, showError]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, fetchDashboard]);

  const handleExport = async () => {
    if (!dashboard) return;

    try {
      setExporting(true);
      const response = await fetch(`/api/organizations/${params.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          organizationId: params.id,
          metrics: ['formIQ', 'verifiedMinutes', 'adherence', 'resolution'],
          format: 'detailed',
          includePHI: filters.includePHI,
          timeRange: filters.timeRange,
          startDate: filters.startDate,
          endDate: filters.endDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create export');
      }

      const { downloadUrl } = await response.json();
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `organization-dashboard-${params.id}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess('Export created', 'Your organization data export has been downloaded.');
    } catch (error) {
      console.error('Error creating export:', error);
      showError('Export failed', 'Unable to create export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<OrganizationDashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return <LoadingOverlay isVisible={true} message="Checking authentication..." />;
  }

  // Redirect if not authenticated (handled in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading dashboard..." />;
  }

  if (!dashboard) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Organization Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load dashboard data.
          </p>
        </div>
      </Container>
    );
  }

  const { organization, metrics } = dashboard;

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {organization.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organization Dashboard
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/org')}
          >
            <Icon name="arrow-right" className="w-4 h-4 mr-2" />
            Back to Organizations
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            loading={exporting}
          >
            <Icon name="download" className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Range
            </label>
            <select
              value={filters.timeRange}
              onChange={(e) => handleFilterChange({ timeRange: e.target.value as '7d' | '30d' | '90d' | '1y' | 'custom' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Include PHI
            </label>
            <select
              value={filters.includePHI.toString()}
              onChange={(e) => handleFilterChange({ includePHI: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={fetchDashboard}
              className="w-full"
            >
              <Icon name="refresh" className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: 'chart' },
            { id: 'form-iq', label: 'Form IQ', icon: 'target' },
            { id: 'verified-minutes', label: 'Verified Minutes', icon: 'clock' },
            { id: 'adherence', label: 'Adherence', icon: 'check-circle' },
            { id: 'resolution', label: 'Resolution', icon: 'alert-circle' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'form-iq' | 'verified-minutes' | 'adherence' | 'resolution')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon name={tab.icon as 'chart' | 'target' | 'clock' | 'check-circle' | 'alert-circle'} className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab metrics={metrics} />
      )}
      {activeTab === 'form-iq' && (
        <FormIQTab metrics={metrics} />
      )}
      {activeTab === 'verified-minutes' && (
        <VerifiedMinutesTab metrics={metrics} />
      )}
      {activeTab === 'adherence' && (
        <AdherenceTab metrics={metrics} />
      )}
      {activeTab === 'resolution' && (
        <ResolutionTab metrics={metrics} />
      )}
    </Container>
  );
}

// Tab Components
function OverviewTab({ metrics }: { metrics: OrganizationMetrics }) {
  return (
    <div className="space-y-8">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Form IQ Average"
          value={`${(metrics.formIQ.average * 100).toFixed(1)}%`}
          trend={metrics.formIQ.trend}
          icon="target"
        />
        <MetricCard
          title="Verified Minutes"
          value={metrics.verifiedMinutes.total.toLocaleString()}
          trend={metrics.verifiedMinutes.trend}
          icon="clock"
        />
        <MetricCard
          title="Adherence Rate"
          value={`${metrics.adherence.overall.toFixed(1)}%`}
          trend={metrics.adherence.trend}
          icon="check-circle"
        />
        <MetricCard
          title="Active Users"
          value={metrics.users.active.toString()}
          trend="stable"
          icon="user"
        />
      </div>

      {/* User Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.users.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Users
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {metrics.users.active}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active Users
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {metrics.users.new}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              New Users
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormIQTab({ metrics }: { metrics: OrganizationMetrics }) {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Form IQ Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics.formIQ.distribution.excellent}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Excellent (80-100%)
            </div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.formIQ.distribution.good}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Good (60-80%)
            </div>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {metrics.formIQ.distribution.fair}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              Fair (40-60%)
            </div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {metrics.formIQ.distribution.poor}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              Poor (0-40%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifiedMinutesTab({ metrics }: { metrics: OrganizationMetrics }) {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Verified Minutes by Exercise
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.verifiedMinutes.byExercise.squat}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Squat Minutes
            </div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics.verifiedMinutes.byExercise.pushup}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Pushup Minutes
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {metrics.verifiedMinutes.byExercise.plank}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">
              Plank Minutes
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {metrics.verifiedMinutes.byExercise.other}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Other Minutes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdherenceTab({ metrics }: { metrics: OrganizationMetrics }) {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Engagement Levels
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics.users.engagement.high}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              High Engagement (&gt;3 sessions/week)
            </div>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {metrics.users.engagement.medium}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              Medium Engagement (1-3 sessions/week)
            </div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {metrics.users.engagement.low}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              Low Engagement (&lt;1 session/week)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResolutionTab({ metrics }: { metrics: OrganizationMetrics }) {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resolution Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.resolution.totalFlagged}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Flagged
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {metrics.resolution.totalResolved}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Resolved
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {metrics.resolution.resolutionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Resolution Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  trend, 
  icon 
}: { 
  title: string; 
  value: string; 
  trend: string; 
  icon: string; 
}) {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 dark:text-green-400';
      case 'declining': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return 'trending-up';
      case 'declining': return 'chevron-down';
      default: return 'x';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className="flex items-center">
          <Icon name={icon as 'target' | 'clock' | 'check-circle' | 'user'} className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <Icon 
          name={getTrendIcon(trend) as 'trending-up' | 'chevron-down' | 'x'} 
          className={`w-4 h-4 mr-1 ${getTrendColor(trend)}`} 
        />
        <span className={`text-sm ${getTrendColor(trend)}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}
