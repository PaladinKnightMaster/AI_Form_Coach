/**
 * API Endpoint: Get Verification Statistics
 * 
 * GET /api/verification/stats
 * Retrieves overall verification statistics for the current user
 */

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { VerificationStats } from '@/types/verification';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's sessions with verification status
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, verified, flagged, integrity_score')
      .eq('user_id', user.id);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    const totalSessions = sessions?.length || 0;
    const verifiedSessions = sessions?.filter(s => s.verified).length || 0;
    const flaggedSessions = sessions?.filter(s => s.flagged).length || 0;
    const pendingReview = sessions?.filter(s => !s.verified && !s.flagged).length || 0;
    
    // Calculate average integrity score
    const sessionsWithScores = sessions?.filter(s => s.integrity_score !== null) || [];
    const averageIntegrityScore = sessionsWithScores.length > 0
      ? sessionsWithScores.reduce((sum, s) => sum + (s.integrity_score || 0), 0) / sessionsWithScores.length
      : 0;

    const verificationRate = totalSessions > 0 ? (verifiedSessions / totalSessions) * 100 : 0;
    const flagRate = totalSessions > 0 ? (flaggedSessions / totalSessions) * 100 : 0;

    // Fetch verification check statistics
    const { data: verifications, error: verificationsError } = await supabase
      .from('session_verifications')
      .select('verification_type, passed')
      .in('session_id', sessions?.map(s => s.id) || []);

    if (verificationsError) {
      console.error('Error fetching verifications:', verificationsError);
    }

    // Aggregate checks by type
    const checksByType: Record<string, { total: number; passed: number; failed: number }> = {};
    
    (verifications || []).forEach(v => {
      if (!checksByType[v.verification_type]) {
        checksByType[v.verification_type] = { total: 0, passed: 0, failed: 0 };
      }
      checksByType[v.verification_type].total++;
      if (v.passed) {
        checksByType[v.verification_type].passed++;
      } else {
        checksByType[v.verification_type].failed++;
      }
    });

    // Build response
    const stats: VerificationStats = {
      total_sessions: totalSessions,
      verified_sessions: verifiedSessions,
      flagged_sessions: flaggedSessions,
      pending_review: pendingReview,
      average_integrity_score: Math.round(averageIntegrityScore * 100) / 100,
      verification_rate: Math.round(verificationRate * 10) / 10,
      flag_rate: Math.round(flagRate * 10) / 10,
      checks_by_type: checksByType
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching verification stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch verification statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

