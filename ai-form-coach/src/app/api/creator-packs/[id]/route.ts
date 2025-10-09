import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { creatorPacksService } from '@/lib/creator-packs/service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const packDetails = await creatorPacksService.getPackDetails(resolvedParams.id, user.id);
    
    return NextResponse.json(packDetails);
  } catch (error) {
    console.error('Creator pack details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pack details' },
      { status: 500 }
    );
  }
}
