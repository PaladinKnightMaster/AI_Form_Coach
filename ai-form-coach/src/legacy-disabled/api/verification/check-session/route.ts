/**
 * API Endpoint: Check Session Verification
 * 
 * POST /api/verification/check-session
 * Runs integrity checks on a specific session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  runAllIntegrityChecks,
  calculateOverallIntegrityScore,
  type SessionData,
  type IntegrityCheckOptions
} from '@/lib/verification/integrityChecks';
import type { VerificationRequest, VerificationResponse } from '@/types/verification';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json() as VerificationRequest;
    const { session_id, force_recheck = false } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        user_id,
        exercise,
        total_reps,
        total_time_seconds,
        avg_rom_score,
        avg_tempo_ms,
        started_at,
        ended_at,
        verified,
        integrity_score,
        reps (
          idx,
          start_ms,
          end_ms,
          peak_depth,
          rom_score,
          avg_tempo_ms
        )
      `)
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this session' },
        { status: 403 }
      );
    }

    // Check if already verified (unless force_recheck)
    if (session.verified && !force_recheck) {
      return NextResponse.json({
        session_id: session.id,
        integrity_score: session.integrity_score || 0,
        verified: true,
        flagged: false,
        flag_reasons: [],
        checks: [],
        recommendations: [],
        timestamp: new Date().toISOString(),
        message: 'Session already verified'
      } as VerificationResponse);
    }

    // Fetch user's session history for comparison
    const { data: userHistory, error: historyError } = await supabase
      .from('sessions')
      .select(`
        id,
        user_id,
        exercise,
        total_reps,
        total_time_seconds,
        avg_rom_score,
        avg_tempo_ms,
        started_at,
        ended_at
      `)
      .eq('user_id', user.id)
      .neq('id', session_id)
      .order('started_at', { ascending: false })
      .limit(20); // Last 20 sessions for baseline

    if (historyError) {
      console.error('Error fetching user history:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch user history' },
        { status: 500 }
      );
    }

    // Fetch integrity check configuration
    const { data: configs, error: configError } = await supabase
      .from('integrity_check_config')
      .select('*')
      .eq('enabled', true);

    if (configError) {
      console.error('Error fetching config:', configError);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    // Build check options from config
    const options: IntegrityCheckOptions = {
      romThresholds: configs.find(c => c.check_name === 'rom_consistency')?.thresholds || {
        min_avg_rom_score: 0.3,
        max_rom_std_deviation: 0.4,
        min_reps_for_check: 3
      },
      tempoThresholds: configs.find(c => c.check_name === 'tempo_realism')?.thresholds || {
        min_tempo_ms: 800,
        max_tempo_ms: 8000,
        max_tempo_variance: 2.0
      },
      progressionThresholds: configs.find(c => c.check_name === 'progression_naturalness')?.thresholds || {
        max_rep_increase_percent: 50,
        max_time_increase_percent: 100,
        min_sessions_for_check: 2
      },
      outlierThresholds: configs.find(c => c.check_name === 'outlier_detection')?.thresholds || {
        z_score_threshold: 3.0,
        min_sessions_for_baseline: 5
      }
    };

    // Run integrity checks
    const checks = runAllIntegrityChecks(
      session as SessionData,
      (userHistory || []) as SessionData[],
      options
    );

    // Calculate weights from config
    const weights: Record<string, number> = {};
    configs.forEach(config => {
      weights[config.check_name] = config.weight;
    });

    // Calculate overall score
    const integrityScore = calculateOverallIntegrityScore(checks, weights);

    // Determine verification status
    const verified = integrityScore >= 0.7 && checks.every(c => c.passed);
    const flagged = integrityScore < 0.5 || checks.some(c => !c.passed && c.severity === 'error');
    const flagReasons = checks
      .filter(c => !c.passed)
      .map(c => c.message);

    // Save verification results to database
    const verificationRecords = checks.map(check => ({
      session_id: session.id,
      verification_type: check.check_type,
      verified_by: 'system',
      passed: check.passed,
      score: check.score,
      details: check.details,
      notes: check.message
    }));

    const { error: insertError } = await supabase
      .from('session_verifications')
      .insert(verificationRecords);

    if (insertError) {
      console.error('Error saving verifications:', insertError);
      // Continue anyway - verification still completed
    }

    // Update session with verification results
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        verified,
        integrity_score: integrityScore,
        flagged,
        flag_reason: flagReasons.join('; ') || null,
        verified_at: verified ? new Date().toISOString() : null
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (integrityScore < 0.7) {
      recommendations.push('Focus on maintaining consistent form throughout your set');
    }
    if (checks.find(c => c.check_type === 'rom_consistency_check' && !c.passed)) {
      recommendations.push('Try to maintain consistent depth/range of motion on each rep');
    }
    if (checks.find(c => c.check_type === 'tempo_realism_check' && !c.passed)) {
      recommendations.push('Control your tempo - avoid rushing through reps');
    }

    // Return response
    return NextResponse.json({
      session_id: session.id,
      integrity_score: integrityScore,
      verified,
      flagged,
      flag_reasons: flagReasons,
      checks,
      recommendations,
      timestamp: new Date().toISOString()
    } as VerificationResponse);

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

