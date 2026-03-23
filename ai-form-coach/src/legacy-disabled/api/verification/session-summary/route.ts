/**
 * API Endpoint: Get Session Verification Summary
 * 
 * GET /api/verification/session-summary?session_id=xxx
 * Retrieves verification summary for a specific session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { SessionVerificationSummary } from '@/types/verification';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session_id from query params
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id parameter is required' },
        { status: 400 }
      );
    }

    // Fetch session verification summary
    const { data: summary, error: summaryError } = await supabase
      .from('verified_sessions_summary')
      .select('*')
      .eq('id', session_id)
      .single();

    if (summaryError || !summary) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (summary.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this session' },
        { status: 403 }
      );
    }

    // Fetch detailed verification records
    const { data: verifications, error: verificationsError } = await supabase
      .from('session_verifications')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false });

    if (verificationsError) {
      console.error('Error fetching verifications:', verificationsError);
      return NextResponse.json(
        { error: 'Failed to fetch verification details' },
        { status: 500 }
      );
    }

    // Build response
    const response: SessionVerificationSummary = {
      session_id: summary.id,
      verified: summary.verified,
      integrity_score: summary.integrity_score || 0,
      flagged: summary.flagged,
      flag_reasons: summary.flag_reason ? summary.flag_reason.split('; ') : [],
      verification_checks_run: summary.verification_checks_run || 0,
      checks_passed: summary.checks_passed || 0,
      checks_failed: summary.checks_failed || 0,
      details: verifications || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching verification summary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch verification summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

