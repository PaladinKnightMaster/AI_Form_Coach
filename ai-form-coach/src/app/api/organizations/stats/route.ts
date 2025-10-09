import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin of any organization (for now, allow all authenticated users)
    // In production, you might want to restrict this to super admins only
    const orgService = new (await import('@/lib/organizations/service')).OrganizationService(supabase);
    const stats = await orgService.getOrganizationStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Organization stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization statistics' },
      { status: 500 }
    );
  }
}
