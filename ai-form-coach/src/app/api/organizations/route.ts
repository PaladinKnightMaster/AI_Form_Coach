import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    const orgService = new (await import('@/lib/organizations/service')).OrganizationService(supabase);
    const organizations = await orgService.getOrganizations(user.id, page, limit);
    
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Organizations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, domain, settings, metadata } = body;

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        description,
        domain,
        settings: settings || {
          allowPHI: false,
          dataRetentionDays: 365,
          exportFormat: 'csv',
          defaultTimeRange: '30d',
          refreshInterval: 60,
          webhookEnabled: false
        },
        metadata: metadata || {
          industry: null,
          size: null,
          region: null,
          contactEmail: null,
          billingTier: 'pilot'
        }
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    // Add creator as admin
    const { error: userError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        role: 'admin',
        assigned_by: user.id
      });

    if (userError) {
      console.error('Error adding user to organization:', userError);
      // Clean up organization if user assignment fails
      await supabase.from('organizations').delete().eq('id', organization.id);
      return NextResponse.json({ error: 'Failed to assign user to organization' }, { status: 500 });
    }

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Create organization API error:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
