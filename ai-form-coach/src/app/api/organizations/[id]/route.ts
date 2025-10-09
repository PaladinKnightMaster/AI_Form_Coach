import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const orgService = new (await import('@/lib/organizations/service')).OrganizationService(supabase);
    const organization = await orgService.getOrganization(resolvedParams.id, user.id);
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Organization details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const body = await request.json();
    const { name, description, domain, settings, metadata } = body;

    // Check if user is admin of this organization
    const { data: access, error: accessError } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', resolvedParams.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (accessError || !access || access.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied - admin role required' }, { status: 403 });
    }

    // Update organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .update({
        name,
        description,
        domain,
        settings,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (orgError) {
      console.error('Error updating organization:', orgError);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Update organization API error:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}
