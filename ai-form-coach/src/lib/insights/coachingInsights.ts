import type { Exercise, RepMetric } from '@/lib/validators/types';
import type { FormIQMetrics } from '@/lib/validators/formIQ';

export interface CoachingInsight {
  id: string;
  type: 'tip' | 'warning' | 'achievement' | 'habit';
  title: string;
  message: string;
  action?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
  priority: 'low' | 'medium' | 'high';
  icon: string;
  color: string;
}

export interface SessionAnalysis {
  insights: CoachingInsight[];
  overallScore: number;
  recommendations: string[];
  nextSessionSuggestion: string;
}

/**
 * Generate intelligent coaching insights based on session data
 */
export function generateCoachingInsights(
  exercise: Exercise,
  metrics: RepMetric[],
  formIQMetrics: FormIQMetrics,
  sessionDurationMs: number,
  previousSessions?: Array<{ exercise: string; formIQ?: number; started_at: string }>
): SessionAnalysis {
  const insights: CoachingInsight[] = [];
  const recommendations: string[] = [];

  // Form IQ Analysis
  if (formIQMetrics.formIQ >= 0.9) {
    insights.push({
      id: 'form-excellent',
      type: 'achievement',
      title: 'Exceptional Form!',
      message: 'Your technique is outstanding. You\'re moving with near-perfect form.',
      priority: 'high',
      icon: '🎯',
      color: 'text-green-600'
    });
  } else if (formIQMetrics.formIQ < 0.6) {
    insights.push({
      id: 'form-improvement',
      type: 'tip',
      title: 'Focus on Form Quality',
      message: 'Slow down and prioritize proper technique over speed for better results.',
      action: {
        text: 'View Form Tips',
        href: '/faq'
      },
      priority: 'high',
      icon: '📚',
      color: 'text-orange-600'
    });
    recommendations.push('Reduce rep speed by 20% and focus on full range of motion');
  }

  // Side Balance Analysis
  const imbalance = Math.abs(formIQMetrics.sideBalance - 0.5);
  if (imbalance > 0.15 && (exercise === 'squat' || exercise === 'pushup')) {
    const dominantSide = formIQMetrics.sideBalance > 0.5 ? 'right' : 'left';
    insights.push({
      id: 'side-imbalance',
      type: 'warning',
      title: 'Side Imbalance Detected',
      message: `Your ${dominantSide} side is working harder. Focus on balanced movement.`,
      priority: 'medium',
      icon: '⚖️',
      color: 'text-yellow-600'
    });
    recommendations.push(`Add single-${dominantSide === 'right' ? 'left' : 'right'} exercises to your routine`);
  }

  // Range of Motion Analysis
  if (formIQMetrics.rangeOfMotion < 0.7) {
    insights.push({
      id: 'rom-improvement',
      type: 'tip',
      title: 'Increase Range of Motion',
      message: 'You\'re not reaching full depth. Focus on mobility and flexibility.',
      action: {
        text: 'Mobility Tips',
        href: '/faq'
      },
      priority: 'medium',
      icon: '🤸',
      color: 'text-blue-600'
    });
    recommendations.push('Add 5 minutes of dynamic warm-up before your next session');
  }

  // Tempo Analysis
  if (formIQMetrics.tempo < 0.6) {
    insights.push({
      id: 'tempo-inconsistent',
      type: 'tip',
      title: 'Inconsistent Tempo',
      message: 'Try to maintain steady rhythm throughout your set.',
      priority: 'low',
      icon: '🎵',
      color: 'text-purple-600'
    });
    recommendations.push('Count "1-2-3" for each rep to maintain consistent timing');
  }

  // Session Duration Analysis
  const durationMinutes = sessionDurationMs / (1000 * 60);
  if (durationMinutes < 5 && metrics.length > 0) {
    insights.push({
      id: 'session-short',
      type: 'habit',
      title: 'Quick Session',
      message: 'Great job fitting in a workout! Consider longer sessions for better results.',
      action: {
        text: 'View Plans',
        href: '/plans'
      },
      priority: 'low',
      icon: '⏱️',
      color: 'text-indigo-600'
    });
  } else if (durationMinutes > 45) {
    insights.push({
      id: 'session-long',
      type: 'warning',
      title: 'Long Session',
      message: 'Extended workouts can lead to fatigue. Consider shorter, focused sessions.',
      priority: 'medium',
      icon: '🔋',
      color: 'text-orange-600'
    });
  }

  // Consistency Analysis (if previous sessions available)
  if (previousSessions && previousSessions.length > 0) {
    const recentSessions = previousSessions.filter(s => {
      const sessionDate = new Date(s.started_at);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return sessionDate >= threeDaysAgo;
    });

    if (recentSessions.length >= 3) {
      insights.push({
        id: 'consistency-great',
        type: 'achievement',
        title: 'Consistency Streak!',
        message: `You've worked out ${recentSessions.length} times in the last 3 days. Amazing dedication!`,
        priority: 'high',
        icon: '🔥',
        color: 'text-green-600'
      });
    } else if (recentSessions.length === 0) {
      insights.push({
        id: 'consistency-nudge',
        type: 'habit',
        title: 'Welcome Back!',
        message: 'It\'s been a few days. Consistency is key to seeing results.',
        action: {
          text: 'Set Reminder',
          href: '/account'
        },
        priority: 'medium',
        icon: '📅',
        color: 'text-blue-600'
      });
    }
  }

  // Exercise-Specific Insights
  if (exercise === 'squat') {
    const avgDepth = metrics.reduce((sum, m) => sum + ((m as any).peakDepth ?? 0), 0) / metrics.length;
    if (avgDepth > 80) {
      insights.push({
        id: 'squat-depth-excellent',
        type: 'achievement',
        title: 'Deep Squats!',
        message: 'Excellent squat depth! You\'re building serious leg strength.',
        priority: 'medium',
        icon: '🦵',
        color: 'text-green-600'
      });
    }
  } else if (exercise === 'pushup') {
    if (metrics.length >= 20) {
      insights.push({
        id: 'pushup-endurance',
        type: 'achievement',
        title: 'Push-up Endurance!',
        message: 'Great endurance! You\'re building impressive upper body strength.',
        priority: 'medium',
        icon: '💪',
        color: 'text-green-600'
      });
    }
  } else if (exercise === 'plank') {
    if (durationMinutes >= 2) {
      insights.push({
        id: 'plank-endurance',
        type: 'achievement',
        title: 'Core Strength!',
        message: 'Impressive plank hold! Your core stability is excellent.',
        priority: 'medium',
        icon: '🔥',
        color: 'text-green-600'
      });
    }
  }

  // Overall Score Calculation
  const overallScore = calculateOverallScore(formIQMetrics, metrics.length, durationMinutes);

  // Next Session Suggestion
  const nextSessionSuggestion = generateNextSessionSuggestion(
    exercise,
    formIQMetrics,
    metrics.length,
    previousSessions
  );

  return {
    insights: insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }),
    overallScore,
    recommendations,
    nextSessionSuggestion
  };
}

/**
 * Calculate overall session score
 */
function calculateOverallScore(
  formIQMetrics: FormIQMetrics,
  repCount: number,
  durationMinutes: number
): number {
  const formWeight = 0.4;
  const volumeWeight = 0.3;
  const durationWeight = 0.3;

  // Form score (0-1)
  const formScore = formIQMetrics.formIQ;

  // Volume score (normalized by exercise expectations)
  const volumeScore = Math.min(1, repCount / 20); // 20 reps = perfect volume score

  // Duration score (5-30 minutes is optimal)
  const durationScore = durationMinutes < 5 
    ? durationMinutes / 5 
    : durationMinutes > 30 
    ? Math.max(0.5, 1 - (durationMinutes - 30) / 30)
    : 1;

  return formScore * formWeight + volumeScore * volumeWeight + durationScore * durationWeight;
}

/**
 * Generate next session suggestion
 */
function generateNextSessionSuggestion(
  currentExercise: Exercise,
  formIQMetrics: FormIQMetrics,
  repCount: number,
  previousSessions?: Array<{ exercise: string; started_at: string }>
): string {
  // Analyze recent exercise distribution
  const recentExercises = previousSessions?.slice(0, 5).map(s => s.exercise) ?? [];
  const exerciseCounts = recentExercises.reduce((acc, ex) => {
    acc[ex] = (acc[ex] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // If form IQ is low, suggest focusing on current exercise
  if (formIQMetrics.formIQ < 0.7) {
    return `Continue practicing ${currentExercise}s with slower tempo to improve form quality.`;
  }

  // If side balance is poor, suggest corrective work
  const imbalance = Math.abs(formIQMetrics.sideBalance - 0.5);
  if (imbalance > 0.15) {
    return `Add unilateral exercises to address side imbalance in your next session.`;
  }

  // Suggest exercise variety
  const leastUsedExercise = ['squat', 'pushup', 'plank']
    .filter(ex => ex !== currentExercise)
    .sort((a, b) => (exerciseCounts[a] || 0) - (exerciseCounts[b] || 0))[0];

  if (leastUsedExercise) {
    return `Try ${leastUsedExercise}s next to maintain balanced training.`;
  }

  // Default suggestion
  return `Great session! Try increasing reps or duration in your next workout.`;
}

/**
 * Generate habit nudges based on user behavior
 */
export function generateHabitNudges(
  lastSessionDate?: string,
  weeklySessionCount?: number,
  avgFormIQ?: number
): CoachingInsight[] {
  const nudges: CoachingInsight[] = [];

  // Consistency nudges
  if (lastSessionDate) {
    const daysSinceLastSession = Math.floor(
      (Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastSession >= 3) {
      nudges.push({
        id: 'comeback-nudge',
        type: 'habit',
        title: 'Time to Get Moving!',
        message: `It's been ${daysSinceLastSession} days since your last workout. Even 5 minutes counts!`,
        action: {
          text: 'Quick Workout',
          href: '/coach'
        },
        priority: 'high',
        icon: '🏃',
        color: 'text-blue-600'
      });
    } else if (daysSinceLastSession === 1) {
      nudges.push({
        id: 'momentum-nudge',
        type: 'habit',
        title: 'Keep the Momentum!',
        message: 'You worked out yesterday. Build on that momentum with another session today.',
        action: {
          text: 'Continue Streak',
          href: '/coach'
        },
        priority: 'medium',
        icon: '⚡',
        color: 'text-green-600'
      });
    }
  }

  // Weekly volume nudges
  if (weeklySessionCount !== undefined) {
    if (weeklySessionCount < 2) {
      nudges.push({
        id: 'frequency-nudge',
        type: 'habit',
        title: 'Aim for More Frequency',
        message: 'Try to get at least 3 workouts per week for optimal results.',
        action: {
          text: 'Plan Workouts',
          href: '/plans'
        },
        priority: 'medium',
        icon: '📈',
        color: 'text-purple-600'
      });
    } else if (weeklySessionCount >= 5) {
      nudges.push({
        id: 'frequency-excellent',
        type: 'achievement',
        title: 'Workout Warrior!',
        message: `${weeklySessionCount} workouts this week! You're crushing your fitness goals.`,
        priority: 'high',
        icon: '🏆',
        color: 'text-gold-600'
      });
    }
  }

  // Form quality nudges
  if (avgFormIQ !== undefined) {
    if (avgFormIQ < 0.6) {
      nudges.push({
        id: 'form-focus-nudge',
        type: 'tip',
        title: 'Quality Over Quantity',
        message: 'Focus on perfecting your form rather than increasing reps.',
        action: {
          text: 'Form Guide',
          href: '/faq'
        },
        priority: 'high',
        icon: '🎯',
        color: 'text-orange-600'
      });
    } else if (avgFormIQ >= 0.85) {
      nudges.push({
        id: 'form-mastery',
        type: 'achievement',
        title: 'Form Master!',
        message: 'Your technique is consistently excellent. Ready for more challenging variations?',
        action: {
          text: 'Advanced Plans',
          href: '/plans'
        },
        priority: 'medium',
        icon: '🥇',
        color: 'text-green-600'
      });
    }
  }

  return nudges;
}

/**
 * Generate smart coaching cues based on real-time analysis
 */
export function generateSmartCues(
  exercise: Exercise,
  formIQMetrics: FormIQMetrics,
  currentPhase: string,
  repCount: number
): string[] {
  const cues: string[] = [];

  // Form IQ-based cues
  if (formIQMetrics.formIQ < 0.7) {
    cues.push('Focus on form quality');
  }

  // Side balance cues
  const imbalance = Math.abs(formIQMetrics.sideBalance - 0.5);
  if (imbalance > 0.1) {
    const weakerSide = formIQMetrics.sideBalance > 0.5 ? 'left' : 'right';
    cues.push(`Engage ${weakerSide} side more`);
  }

  // Exercise-specific cues based on metrics
  if (exercise === 'squat') {
    if (formIQMetrics.rangeOfMotion < 0.7) {
      cues.push('Squat deeper');
    }
    if (currentPhase === 'down') {
      cues.push('Hips back, chest up');
    }
  } else if (exercise === 'pushup') {
    if (formIQMetrics.rangeOfMotion < 0.7) {
      cues.push('Lower to 90 degrees');
    }
    if (currentPhase === 'down') {
      cues.push('Keep core tight');
    }
  }

  // Rep count milestones
  if (repCount > 0 && repCount % 10 === 0) {
    cues.push(`${repCount} reps! Keep going`);
  }

  return cues.slice(0, 2); // Limit to 2 cues to avoid overwhelming
}

/**
 * Calculate streak and habit metrics
 */
export function calculateHabitMetrics(sessions: Array<{ started_at: string; exercise: string }>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  const checkDate = new Date(today);

  // Calculate current streak
  while (true) {
    const dayStart = new Date(checkDate);
    const dayEnd = new Date(checkDate);
    dayEnd.setHours(23, 59, 59, 999);

    const hasWorkout = sessions.some(s => {
      const sessionDate = new Date(s.started_at);
      return sessionDate >= dayStart && sessionDate <= dayEnd;
    });

    if (hasWorkout) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (currentStreak === 0) {
      // No workout today, check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Streak broken
      break;
    }

    // Prevent infinite loop
    if (currentStreak > 365) break;
  }

  // Calculate weekly frequency
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyCount = sessions.filter(s => new Date(s.started_at) >= oneWeekAgo).length;

  return {
    currentStreak,
    weeklyCount,
    isConsistent: weeklyCount >= 3,
    needsMotivation: weeklyCount < 2
  };
}
