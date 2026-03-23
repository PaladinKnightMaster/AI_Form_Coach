import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { creatorPacksService } from '@/lib/creator-packs/service';
import type { PackUploadForm } from '@/lib/creator-packs/types';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has creator access (dev-only for now)
    // TODO: Implement proper creator verification system
    
    const formData: PackUploadForm = await request.json();
    
    // Validate the form
    const validation = creatorPacksService.validatePackUpload(formData);
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        errors: validation.errors
      }, { status: 400 });
    }
    
    // Upload the pack
    const result = await creatorPacksService.uploadPack(formData, user.id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Creator pack upload API error:', error);
    return NextResponse.json(
      { 
        success: false,
        errors: [{
          field: 'general',
          message: 'Failed to upload pack',
          severity: 'error'
        }]
      },
      { status: 500 }
    );
  }
}

