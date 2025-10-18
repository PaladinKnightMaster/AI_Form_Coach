// Report Data Collection Service

import { getSupabaseClient } from '@/lib/supabase/client';
import type { SessionReportData, RepReportData, ReportInsight } from './types';

export class ReportDataCollector {
  private supabase = getSupabaseClient();

  async collectSessionData(sessionId: string): Promise<SessionReportData | null> {
    try {
      // Get session data
      const { data: session, error: sessionError } = await this.supabase
        .from('sessions')
        .select(`
          id,
          exercise,
          started_at,
          ended_at,
          total_reps,
          correct_rate,
          avg_quality_score,
          integrity_score,
          notes
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Error fetching session data:', sessionError);
        return null;
      }

      // Get rep data
      const { data: reps, error: repsError } = await this.supabase
        .from('reps')
        .select(`
          id,
          idx,
          start_ms,
          end_ms,
          peak_depth,
          rom_score,
          is_correct,
          confidence,
          errors,
          quality,
          quality_score,
          tempo
        `)
        .eq('session_id', sessionId)
        .order('idx', { ascending: true });

      if (repsError) {
        console.error('Error fetching rep data:', repsError);
        return null;
      }

      // Calculate session duration
      const startTime = new Date(session.started_at).getTime();
      const endTime = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      // Calculate average ROM score
      const avgRomScore = reps && reps.length > 0 
        ? reps.reduce((sum, rep) => sum + (rep.rom_score || 0), 0) / reps.length
        : 0;

      // Transform rep data
      const repData: RepReportData[] = (reps || []).map(rep => ({
        idx: rep.idx,
        startMs: rep.start_ms,
        endMs: rep.end_ms,
        duration: rep.end_ms - rep.start_ms,
        isCorrect: rep.is_correct,
        quality: rep.quality,
        qualityScore: rep.quality_score,
        peakDepth: rep.peak_depth,
        romScore: rep.rom_score,
        tempo: rep.tempo,
        errors: rep.errors as Array<{
          type: string;
          severity: 'low' | 'medium' | 'high';
          message: string;
          duration: number;
        }> || null,
        confidence: rep.confidence
      }));

      // Generate insights
      const insights = this.generateInsights(session, repData);

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();

      return {
        sessionId: session.id,
        exercise: session.exercise as 'squat' | 'pushup' | 'plank',
        startedAt: session.started_at,
        endedAt: session.ended_at,
        duration,
        totalReps: session.total_reps || 0,
        correctRate: session.correct_rate || 0,
        avgQualityScore: session.avg_quality_score || 0,
        integrityScore: session.integrity_score || 0,
        avgRomScore,
        reps: repData,
        insights,
        nextFocus: this.generateNextFocus(insights, session.exercise),
        userId: user?.id || '',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error collecting session data:', error);
      return null;
    }
  }

  private generateInsights(session: {
    avg_quality_score: number | null;
    correct_rate: number | null;
    exercise: string;
  }, reps: RepReportData[]): ReportInsight[] {
    const insights: ReportInsight[] = [];

    // Quality insight
    if (session.avg_quality_score) {
      if (session.avg_quality_score >= 80) {
        insights.push({
          type: 'form',
          title: 'Excellent Form Quality',
          description: `Your average form quality was ${Math.round(session.avg_quality_score)}%, showing excellent technique throughout the session.`,
          severity: 'positive',
          recommendation: 'Maintain this high standard and focus on consistency.'
        });
      } else if (session.avg_quality_score >= 60) {
        insights.push({
          type: 'form',
          title: 'Good Form Quality',
          description: `Your average form quality was ${Math.round(session.avg_quality_score)}%, showing solid technique with room for improvement.`,
          severity: 'neutral',
          recommendation: 'Focus on maintaining proper form throughout each rep.'
        });
      } else {
        insights.push({
          type: 'form',
          title: 'Form Needs Attention',
          description: `Your average form quality was ${Math.round(session.avg_quality_score)}%. Focus on proper technique.`,
          severity: 'negative',
          recommendation: 'Slow down and focus on form over speed. Consider reducing weight or reps.'
        });
      }
    }

    // Correctness insight
    if (session.correct_rate !== null) {
      const correctRate = session.correct_rate * 100;
      if (correctRate >= 90) {
        insights.push({
          type: 'consistency',
          title: 'Outstanding Consistency',
          description: `${Math.round(correctRate)}% of your reps were performed correctly.`,
          severity: 'positive',
          recommendation: 'Excellent work! You\'re ready to increase intensity.'
        });
      } else if (correctRate >= 70) {
        insights.push({
          type: 'consistency',
          title: 'Good Consistency',
          description: `${Math.round(correctRate)}% of your reps were performed correctly.`,
          severity: 'neutral',
          recommendation: 'Focus on maintaining proper form throughout the entire range of motion.'
        });
      } else {
        insights.push({
          type: 'consistency',
          title: 'Consistency Needs Work',
          description: `${Math.round(correctRate)}% of your reps were performed correctly.`,
          severity: 'negative',
          recommendation: 'Focus on quality over quantity. Reduce reps and perfect your form.'
        });
      }
    }

    // Tempo analysis
    const tempoCounts = reps.reduce((acc, rep) => {
      if (rep.tempo) {
        acc[rep.tempo] = (acc[rep.tempo] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalTempoReps = Object.values(tempoCounts).reduce((sum, count) => sum + count, 0);
    if (totalTempoReps > 0) {
      const fastPercentage = (tempoCounts.fast || 0) / totalTempoReps * 100;
      const slowPercentage = (tempoCounts.slow || 0) / totalTempoReps * 100;

      if (fastPercentage > 50) {
        insights.push({
          type: 'tempo',
          title: 'Fast Tempo Detected',
          description: `${Math.round(fastPercentage)}% of your reps were performed at a fast tempo.`,
          severity: 'neutral',
          recommendation: 'Consider slowing down to focus on control and muscle engagement.'
        });
      } else if (slowPercentage > 50) {
        insights.push({
          type: 'tempo',
          title: 'Controlled Tempo',
          description: `${Math.round(slowPercentage)}% of your reps were performed at a controlled tempo.`,
          severity: 'positive',
          recommendation: 'Great tempo control! This helps with muscle engagement and form.'
        });
      }
    }

    // ROM analysis
    const avgRom = reps.reduce((sum, rep) => sum + (rep.romScore || 0), 0) / reps.length;
    if (avgRom > 0) {
      if (avgRom >= 80) {
        insights.push({
          type: 'strength',
          title: 'Excellent Range of Motion',
          description: `Your average ROM score was ${Math.round(avgRom)}%, showing full range of motion.`,
          severity: 'positive',
          recommendation: 'Maintain this excellent range of motion for maximum muscle engagement.'
        });
      } else if (avgRom >= 60) {
        insights.push({
          type: 'strength',
          title: 'Good Range of Motion',
          description: `Your average ROM score was ${Math.round(avgRom)}%.`,
          severity: 'neutral',
          recommendation: 'Focus on achieving full range of motion for better results.'
        });
      } else {
        insights.push({
          type: 'strength',
          title: 'Limited Range of Motion',
          description: `Your average ROM score was ${Math.round(avgRom)}%.`,
          severity: 'negative',
          recommendation: 'Focus on achieving full range of motion. Consider reducing weight or reps.'
        });
      }
    }

    return insights;
  }

  private generateNextFocus(insights: ReportInsight[], exercise: string): string[] {
    const focus: string[] = [];

    // Add focus based on insights
    insights.forEach(insight => {
      if (insight.recommendation) {
        focus.push(insight.recommendation);
      }
    });

    // Add exercise-specific focus
    switch (exercise) {
      case 'squat':
        focus.push('Focus on keeping your chest up and knees tracking over toes');
        focus.push('Ensure full depth while maintaining proper spine alignment');
        break;
      case 'pushup':
        focus.push('Maintain a straight line from head to heels');
        focus.push('Control the descent and explosive ascent');
        break;
      case 'plank':
        focus.push('Keep your core engaged and body in a straight line');
        focus.push('Breathe steadily and maintain the position');
        break;
    }

    // Remove duplicates and limit to 3 items
    return [...new Set(focus)].slice(0, 3);
  }
}

export const reportDataCollector = new ReportDataCollector();
