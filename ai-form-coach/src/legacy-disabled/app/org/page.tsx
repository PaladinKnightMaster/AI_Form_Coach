"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import LoadingOverlay from '@/components/LoadingOverlay';
import { getCurrentUserId } from '@/lib/supabase/client';
import type { Organization, OrganizationListResponse } from '@/lib/organizations/types';

export default function OrganizationsPage() {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToastContext();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await getCurrentUserId();
      if (!userId) {
        router.push('/signin?redirect=/org');
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [router]);

  // Fetch organizations
  const fetchOrganizations = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await fetch('/api/organizations', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data: OrganizationListResponse = await response.json();
      setOrganizations(data.organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showError('Failed to load organizations', 'Unable to load your organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showError]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrganizations();
    }
  }, [isAuthenticated, fetchOrganizations]);

  const handleCreateOrganization = async (formData: FormData) => {
    try {
      setCreating(true);
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          domain: formData.get('domain') || undefined,
          settings: {
            allowPHI: formData.get('allowPHI') === 'on',
            dataRetentionDays: 365,
            exportFormat: 'csv',
            defaultTimeRange: '30d',
            refreshInterval: 60,
            webhookEnabled: false
          },
          metadata: {
            industry: formData.get('industry') || undefined,
            size: formData.get('size') || undefined,
            region: formData.get('region') || undefined,
            contactEmail: formData.get('contactEmail') || undefined,
            billingTier: 'pilot'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create organization');
      }

      const newOrg = await response.json();
      setOrganizations(prev => [newOrg, ...prev]);
      setShowCreateForm(false);
      showSuccess('Organization created', 'Your organization has been created successfully.');
    } catch (error) {
      console.error('Error creating organization:', error);
      showError('Failed to create organization', 'Unable to create organization. Please try again.');
    } finally {
      setCreating(false);
    }
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
    return <LoadingOverlay isVisible={true} message="Loading organizations..." />;
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Organizations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your organization dashboards and analytics
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={creating}
        >
          <Icon name="plus" className="w-4 h-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {/* Create Organization Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Organization
          </h3>
          <form action={handleCreateOrganization} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Domain (optional)
                </label>
                <input
                  type="text"
                  name="domain"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter organization description"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry
                </label>
                <select
                  name="industry"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select industry</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="fitness">Fitness</option>
                  <option value="education">Education</option>
                  <option value="corporate">Corporate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Size
                </label>
                <select
                  name="size"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select size</option>
                  <option value="small">Small (1-50)</option>
                  <option value="medium">Medium (51-200)</option>
                  <option value="large">Large (201-1000)</option>
                  <option value="enterprise">Enterprise (1000+)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="contact@example.com"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="allowPHI"
                id="allowPHI"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allowPHI" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Allow PHI (Personal Health Information) in exports
              </label>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={creating}
                loading={creating}
              >
                {creating ? 'Creating...' : 'Create Organization'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Organizations List */}
      {organizations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Icon name="package" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No organizations yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first organization to start tracking team analytics and form quality.
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            disabled={creating}
          >
            <Icon name="plus" className="w-4 h-4 mr-2" />
            Create Organization
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/org/${org.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {org.name}
                  </h3>
                  {org.domain && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {org.domain}
                    </p>
                  )}
                </div>
                <Badge tone="success">
                  {org.metadata.billingTier || 'pilot'}
                </Badge>
              </div>

              {org.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {org.description}
                </p>
              )}

              <div className="space-y-2 mb-4">
                {org.metadata.industry && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Icon name="home" className="w-4 h-4 mr-2" />
                    {org.metadata.industry}
                  </div>
                )}
                {org.metadata.size && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Icon name="user" className="w-4 h-4 mr-2" />
                    {org.metadata.size}
                  </div>
                )}
                {org.settings.allowPHI && (
                  <div className="flex items-center text-sm text-blue-500 dark:text-blue-400">
                    <Icon name="lock" className="w-4 h-4 mr-2" />
                    PHI Enabled
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Created {new Date(org.createdAt).toLocaleDateString()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/org/${org.id}`);
                  }}
                >
                  <Icon name="arrow-right" className="w-4 h-4 mr-1" />
                  View Dashboard
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
