import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Organization,
  OrganizationUser,
  OrganizationMetrics,
  OrganizationDashboardResponse,
  OrganizationDashboardFilters,
  CSVExportRequest,
  CSVExportResponse,
  OrganizationInvite,
  OrganizationListResponse,
  OrganizationUsersResponse,
  OrganizationStatsResponse
} from './types';

export class OrganizationService {
  constructor(private supabase: SupabaseClient) {}

  // Organization Management
  async getOrganizations(userId: string, page = 1, limit = 10): Promise<OrganizationListResponse> {
    try {
      const { data, error } = await this.supabase
        .from('organization_users')
        .select(`
          organization_id,
          role,
          organizations (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('Error fetching organizations:', error);
        throw new Error('Failed to fetch organizations');
      }

      const organizations = (data || [])
        .map(item => this.transformOrganizationFromDB(item.organizations as unknown as Record<string, unknown>))
        .filter(Boolean);

      return {
        organizations,
        total: organizations.length,
        page,
        limit
      };
    } catch (error) {
      console.error('Error in getOrganizations:', error);
      throw error;
    }
  }

  async getOrganization(organizationId: string, userId: string): Promise<Organization> {
    try {
      // First check if user has access to this organization
      const { data: access, error: accessError } = await this.supabase
        .from('organization_users')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (accessError || !access) {
        throw new Error('Access denied to organization');
      }

      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        throw new Error('Failed to fetch organization');
      }

      return this.transformOrganizationFromDB(data);
    } catch (error) {
      console.error('Error in getOrganization:', error);
      throw error;
    }
  }

  async getOrganizationUsers(organizationId: string, userId: string, page = 1, limit = 20): Promise<OrganizationUsersResponse> {
    try {
      // Check if user has access to this organization
      const { data: access, error: accessError } = await this.supabase
        .from('organization_users')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (accessError || !access) {
        throw new Error('Access denied to organization');
      }

      const { data, error } = await this.supabase
        .from('organization_users')
        .select(`
          *,
          profiles (id, email)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('Error fetching organization users:', error);
        throw new Error('Failed to fetch organization users');
      }

      const users = (data || []).map(item => this.transformOrganizationUserFromDB(item));

      return {
        users,
        total: users.length,
        page,
        limit
      };
    } catch (error) {
      console.error('Error in getOrganizationUsers:', error);
      throw error;
    }
  }

  // Dashboard Data
  async getOrganizationDashboard(
    organizationId: string,
    userId: string,
    filters: OrganizationDashboardFilters
  ): Promise<OrganizationDashboardResponse> {
    try {
      // Check if user has access to this organization
      const { data: access, error: accessError } = await this.supabase
        .from('organization_users')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (accessError || !access) {
        throw new Error('Access denied to organization');
      }

      // Get organization data
      const organization = await this.getOrganization(organizationId, userId);

      // Get metrics using the database function
      const { data: metricsData, error: metricsError } = await this.supabase
        .rpc('get_organization_dashboard_data', {
          p_organization_id: organizationId,
          p_time_range: filters.timeRange
        });

      if (metricsError) {
        console.error('Error fetching organization metrics:', metricsError);
        throw new Error('Failed to fetch organization metrics');
      }

      const metrics = this.transformMetricsFromDB(metricsData);

      return {
        organization,
        metrics,
        filters,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getOrganizationDashboard:', error);
      throw error;
    }
  }

  // CSV Export
  async requestCSVExport(
    organizationId: string,
    userId: string,
    request: CSVExportRequest
  ): Promise<CSVExportResponse> {
    try {
      // Check if user has access to this organization
      const { data: access, error: accessError } = await this.supabase
        .from('organization_users')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (accessError || !access) {
        throw new Error('Access denied to organization');
      }

      // Create export record
      const { data: exportRecord, error: exportError } = await this.supabase
        .from('organization_exports')
        .insert({
          organization_id: organizationId,
          requested_by: userId,
          export_type: request.format === 'detailed' ? 'csv' : 'json',
          metrics_included: request.metrics,
          include_phi: request.includePHI,
          time_range: request.timeRange,
          start_date: request.startDate,
          end_date: request.endDate,
          status: 'pending'
        })
        .select()
        .single();

      if (exportError) {
        console.error('Error creating export request:', exportError);
        throw new Error('Failed to create export request');
      }

      // Generate download URL (in a real implementation, this would trigger background processing)
      const downloadUrl = `/api/organizations/${organizationId}/exports/${exportRecord.id}/download`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      // Update export record with download URL
      await this.supabase
        .from('organization_exports')
        .update({
          download_url: downloadUrl,
          status: 'completed',
          completed_at: new Date().toISOString(),
          record_count: 0 // Will be updated when actual export is generated
        })
        .eq('id', exportRecord.id);

      return {
        downloadUrl,
        expiresAt,
        recordCount: 0
      };
    } catch (error) {
      console.error('Error in requestCSVExport:', error);
      throw error;
    }
  }

  // User Management
  async inviteUser(
    organizationId: string,
    userId: string,
    email: string,
    role: 'admin' | 'viewer' | 'member'
  ): Promise<OrganizationInvite> {
    try {
      // Check if user is admin of this organization
      const { data: access, error: accessError } = await this.supabase
        .from('organization_users')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (accessError || !access || access.role !== 'admin') {
        throw new Error('Access denied - admin role required');
      }

      const { data, error } = await this.supabase
        .from('organization_invites')
        .insert({
          organization_id: organizationId,
          email,
          role,
          invited_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating organization invite:', error);
        throw new Error('Failed to create organization invite');
      }

      return this.transformOrganizationInviteFromDB(data);
    } catch (error) {
      console.error('Error in inviteUser:', error);
      throw error;
    }
  }

  async acceptInvite(inviteId: string, userId: string): Promise<OrganizationUser> {
    try {
      // Get invite details
      const { data: invite, error: inviteError } = await this.supabase
        .from('organization_invites')
        .select('*')
        .eq('id', inviteId)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invite) {
        throw new Error('Invalid or expired invite');
      }

      // Check if invite is expired
      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('Invite has expired');
      }

      // Create organization user
      const { data: orgUser, error: orgUserError } = await this.supabase
        .from('organization_users')
        .insert({
          organization_id: invite.organization_id,
          user_id: userId,
          role: invite.role,
          assigned_by: invite.invited_by
        })
        .select()
        .single();

      if (orgUserError) {
        console.error('Error creating organization user:', orgUserError);
        throw new Error('Failed to join organization');
      }

      // Update invite status
      await this.supabase
        .from('organization_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteId);

      return this.transformOrganizationUserFromDB(orgUser);
    } catch (error) {
      console.error('Error in acceptInvite:', error);
      throw error;
    }
  }

  // Statistics
  async getOrganizationStats(): Promise<OrganizationStatsResponse> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_organization_stats');

      if (error) {
        console.error('Error fetching organization stats:', error);
        throw new Error('Failed to fetch organization statistics');
      }

      return data || {
        totalOrganizations: 0,
        totalUsers: 0,
        activeOrganizations: 0,
        totalSessions: 0,
        averageFormIQ: 0,
        totalVerifiedMinutes: 0
      };
    } catch (error) {
      console.error('Error in getOrganizationStats:', error);
      throw error;
    }
  }

  // Data Transformation Methods
  private transformOrganizationFromDB(dbOrg: Record<string, unknown>): Organization {
    return {
      id: dbOrg.id as string,
      name: dbOrg.name as string,
      description: dbOrg.description as string | undefined,
      domain: dbOrg.domain as string | undefined,
      settings: (dbOrg.settings || {}) as unknown as Organization['settings'],
      metadata: (dbOrg.metadata || {}) as unknown as Organization['metadata'],
      createdAt: dbOrg.created_at as string,
      updatedAt: dbOrg.updated_at as string,
      isActive: dbOrg.is_active as boolean
    };
  }

  private transformOrganizationUserFromDB(dbUser: Record<string, unknown>): OrganizationUser {
    return {
      id: dbUser.id as string,
      organizationId: dbUser.organization_id as string,
      userId: dbUser.user_id as string,
      role: dbUser.role as 'admin' | 'viewer' | 'member',
      assignedAt: dbUser.assigned_at as string,
      assignedBy: dbUser.assigned_by as string,
      isActive: dbUser.is_active as boolean,
      lastAccessedAt: dbUser.last_accessed_at as string | undefined
    };
  }

  private transformOrganizationInviteFromDB(dbInvite: Record<string, unknown>): OrganizationInvite {
    return {
      id: dbInvite.id as string,
      organizationId: dbInvite.organization_id as string,
      email: dbInvite.email as string,
      role: dbInvite.role as 'admin' | 'viewer' | 'member',
      invitedBy: dbInvite.invited_by as string,
      invitedAt: dbInvite.invited_at as string,
      expiresAt: dbInvite.expires_at as string,
      acceptedAt: dbInvite.accepted_at as string | undefined,
      status: dbInvite.status as 'pending' | 'accepted' | 'expired' | 'cancelled'
    };
  }

  private transformMetricsFromDB(dbMetrics: Record<string, unknown>): OrganizationMetrics {
    return {
      organizationId: dbMetrics.organizationId as string,
      timeRange: dbMetrics.timeRange as string,
      generatedAt: dbMetrics.generatedAt as string,
      formIQ: (dbMetrics.formIQ || {}) as unknown as OrganizationMetrics['formIQ'],
      verifiedMinutes: (dbMetrics.verifiedMinutes || {}) as unknown as OrganizationMetrics['verifiedMinutes'],
      adherence: (dbMetrics.adherence || {}) as unknown as OrganizationMetrics['adherence'],
      resolution: (dbMetrics.resolution || {}) as unknown as OrganizationMetrics['resolution'],
      users: (dbMetrics.users || {}) as unknown as OrganizationMetrics['users']
    };
  }
}

// Note: This service now requires a Supabase client instance
// Use: new OrganizationService(supabaseClient)
