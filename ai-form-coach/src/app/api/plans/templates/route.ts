import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    
    // Build query
    let query = supabase
      .from('plan_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }
    
    const { data: templates, error } = await query;
    
    if (error) {
      console.error('Error fetching plan templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plan templates' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
