import type { UserPlan } from '@/types/plans';
import type { ReadinessAssessment } from '@/lib/progression/engine';

export interface PlanAdjustment {
  type: 'volume_reduction' | 'mobility_day' | 'finisher_sets' | 'none';
  reason: string;
  originalPlan: UserPlan;
  adjustedPlan: UserPlan;
  adjustments: string[];
}

export interface PlanSession {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'mobility' | 'rest';
  duration: number; // minutes
  exercises: PlanExercise[];
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PlanExercise {
  name: string;
  sets: number;
  reps: number | string; // can be "30s" for time-based
  rest: number; // seconds
  weight?: number;
  notes?: string;
}

export class PlanAdjustmentService {
  private mobilityDayTemplate: PlanSession = {
    id: 'mobility-day',
    name: 'Recovery & Mobility',
    type: 'mobility',
    duration: 30,
    difficulty: 'beginner',
    description: 'Gentle movement and recovery session',
    exercises: [
      {
        name: 'Cat-Cow Stretch',
        sets: 3,
        reps: 10,
        rest: 30,
        notes: 'Slow, controlled movement'
      },
      {
        name: 'Hip Flexor Stretch',
        sets: 2,
        reps: '30s',
        rest: 60,
        notes: 'Hold each side'
      },
      {
        name: 'Shoulder Rolls',
        sets: 2,
        reps: 15,
        rest: 30,
        notes: 'Forward and backward'
      },
      {
        name: 'Deep Breathing',
        sets: 1,
        reps: '5min',
        rest: 0,
        notes: 'Meditation and relaxation'
      },
      {
        name: 'Light Walking',
        sets: 1,
        reps: '10min',
        rest: 0,
        notes: 'Easy pace, focus on form'
      }
    ]
  };

  private finisherSets: PlanExercise[] = [
    {
      name: 'Burpees',
      sets: 1,
      reps: 10,
      rest: 60,
      notes: 'Optional finisher - only if feeling strong'
    },
    {
      name: 'Mountain Climbers',
      sets: 1,
      reps: '30s',
      rest: 60,
      notes: 'Optional finisher - only if feeling strong'
    },
    {
      name: 'Jump Squats',
      sets: 1,
      reps: 15,
      rest: 60,
      notes: 'Optional finisher - only if feeling strong'
    }
  ];

  /**
   * Adjust a plan based on readiness assessment
   */
  adjustPlanForReadiness(
    plan: UserPlan,
    readiness: ReadinessAssessment | null,
    currentDay: number = 1
  ): PlanAdjustment {
    if (!readiness) {
      return {
        type: 'none',
        reason: 'No readiness assessment available',
        originalPlan: plan,
        adjustedPlan: plan,
        adjustments: []
      };
    }

    // Calculate overall readiness score from individual metrics (0-1 scale)
    const readinessScore = (
      (10 - readiness.sorenessLevel) + // Lower soreness = higher readiness
      (10 - readiness.fatigueLevel) + // Lower fatigue = higher readiness
      readiness.sleepQuality + // Higher sleep = higher readiness
      (10 - readiness.stressLevel) + // Lower stress = higher readiness
      readiness.motivationLevel // Higher motivation = higher readiness
    ) / 50; // Normalize to 0-1 scale
    
    const hasSoreness = readiness.sorenessLevel > 3; // Soreness scale 0-10, >3 is significant

    // Get today's session from the plan
    const todaySession = this.getTodaySession(plan, currentDay);
    if (!todaySession) {
      return {
        type: 'none',
        reason: 'No session scheduled for today',
        originalPlan: plan,
        adjustedPlan: plan,
        adjustments: []
      };
    }

    // Case 1: Very low readiness (< 20%) - Swap to mobility day
    if (readinessScore < 0.2) {
      return this.createMobilityDayAdjustment(plan, todaySession, readinessScore);
    }

    // Case 2: Low readiness (< 40%) - Reduce volume by 20%
    if (readinessScore < 0.4) {
      return this.createVolumeReductionAdjustment(plan, todaySession, readinessScore);
    }

    // Case 3: High readiness (> 0.7) and no soreness - Allow finisher sets
    if (readinessScore > 0.7 && !hasSoreness) {
      return this.createFinisherSetsAdjustment(plan, todaySession, readinessScore);
    }

    // No adjustments needed
    return {
      type: 'none',
      reason: `Readiness score ${Math.round(readinessScore * 100)}% is within normal range`,
      originalPlan: plan,
      adjustedPlan: plan,
      adjustments: []
    };
  }

  private getTodaySession(plan: UserPlan, currentDay: number): PlanSession | null {
    try {
      // Handle template-based plans (no plan_data, need to fetch from template)
      if (!plan.plan_data || Object.keys(plan.plan_data).length === 0) {
        // For template-based plans, we can't adjust individual sessions
        // Return a generic session structure
        return {
          id: `day-${currentDay}`,
          name: `Day ${currentDay} - Template Plan`,
          type: 'strength',
          duration: 45,
          difficulty: 'intermediate',
          description: 'Template-based plan session',
          exercises: [
            {
              name: 'Template Exercise',
              sets: 3,
              reps: 10,
              rest: 60,
              notes: 'This is a template-based plan'
            }
          ]
        };
      }

      const planData = plan.plan_data;
      if (!planData.sessions || !Array.isArray(planData.sessions)) {
        return null;
      }

      // Find session for current day
      const session = planData.sessions.find((s: { day?: number; day_number?: number }) => s.day === currentDay || s.day_number === currentDay);
      if (!session) {
        return null;
      }

      return {
        id: session.id || `day-${currentDay}`,
        name: session.name || `Day ${currentDay}`,
        type: session.type || 'strength',
        duration: session.duration || 45,
        difficulty: session.difficulty || 'intermediate',
        description: session.description,
        exercises: session.exercises || []
      };
    } catch (error) {
      console.error('Error parsing plan session:', error);
      return null;
    }
  }

  private createMobilityDayAdjustment(
    plan: UserPlan,
    originalSession: PlanSession,
    readinessScore: number
  ): PlanAdjustment {
    const adjustedPlan = { ...plan };
    
    // Only adjust AI-generated plans (those with plan_data)
    if (adjustedPlan.plan_data && adjustedPlan.plan_data.sessions && Array.isArray(adjustedPlan.plan_data.sessions)) {
      const sessionIndex = adjustedPlan.plan_data.sessions.findIndex(
        (s: { id?: string; day?: string }) => s.id === originalSession.id || s.day === originalSession.id.split('-')[1]
      );
      
      if (sessionIndex !== -1) {
        adjustedPlan.plan_data.sessions[sessionIndex] = {
          ...this.mobilityDayTemplate,
          day: originalSession.id.split('-')[1] || '1',
          day_number: parseInt(originalSession.id.split('-')[1]) || 1
        };
      }
    } else {
      // For template-based plans, we can't modify the plan_data
      // Just return the original plan with a note
      return {
        type: 'mobility_day',
        reason: `Readiness score ${Math.round(readinessScore * 100)}% is very low - consider taking a rest day (template plans cannot be automatically adjusted)`,
        originalPlan: plan,
        adjustedPlan: plan,
        adjustments: [
          'Template-based plans cannot be automatically adjusted',
          'Consider taking a rest day or doing light mobility work',
          'Manual adjustment recommended for template plans'
        ]
      };
    }

    return {
      type: 'mobility_day',
      reason: `Readiness score ${Math.round(readinessScore * 100)}% is very low - switching to recovery day`,
      originalPlan: plan,
      adjustedPlan,
      adjustments: [
        'Replaced strength/cardio session with mobility day',
        'Reduced intensity to focus on recovery',
        'Added gentle stretching and breathing exercises'
      ]
    };
  }

  private createVolumeReductionAdjustment(
    plan: UserPlan,
    originalSession: PlanSession,
    readinessScore: number
  ): PlanAdjustment {
    const adjustedPlan = { ...plan };
    
    // Only adjust AI-generated plans (those with plan_data)
    if (adjustedPlan.plan_data && adjustedPlan.plan_data.sessions && Array.isArray(adjustedPlan.plan_data.sessions)) {
      const sessionIndex = adjustedPlan.plan_data.sessions.findIndex(
        (s: { id?: string; day?: string }) => s.id === originalSession.id || s.day === originalSession.id.split('-')[1]
      );
      
      if (sessionIndex !== -1) {
        const session = { ...adjustedPlan.plan_data.sessions[sessionIndex] };
        
        // Reduce sets by 20% (minimum 1 set)
        if (session.exercises) {
          session.exercises = session.exercises.map((exercise: { sets?: number; [key: string]: unknown }) => ({
            ...exercise,
            sets: Math.max(1, Math.round((exercise.sets || 1) * 0.8))
          }));
        }
        
        // Reduce duration by 20%
        session.duration = Math.round(session.duration * 0.8);
        
        adjustedPlan.plan_data.sessions[sessionIndex] = session;
      }
    } else {
      // For template-based plans, we can't modify the plan_data
      return {
        type: 'volume_reduction',
        reason: `Readiness score ${Math.round(readinessScore * 100)}% is low - consider reducing intensity (template plans cannot be automatically adjusted)`,
        originalPlan: plan,
        adjustedPlan: plan,
        adjustments: [
          'Template-based plans cannot be automatically adjusted',
          'Consider reducing sets or taking longer rest periods',
          'Manual adjustment recommended for template plans'
        ]
      };
    }

    return {
      type: 'volume_reduction',
      reason: `Readiness score ${Math.round(readinessScore * 100)}% is low - reducing volume by 20%`,
      originalPlan: plan,
      adjustedPlan,
      adjustments: [
        'Reduced sets by 20% for all exercises',
        'Reduced session duration by 20%',
        'Maintained exercise selection and form focus'
      ]
    };
  }

  private createFinisherSetsAdjustment(
    plan: UserPlan,
    originalSession: PlanSession,
    readinessScore: number
  ): PlanAdjustment {
    const adjustedPlan = { ...plan };
    
    // Only adjust AI-generated plans (those with plan_data)
    if (adjustedPlan.plan_data && adjustedPlan.plan_data.sessions && Array.isArray(adjustedPlan.plan_data.sessions)) {
      const sessionIndex = adjustedPlan.plan_data.sessions.findIndex(
        (s: { id?: string; day?: string }) => s.id === originalSession.id || s.day === originalSession.id.split('-')[1]
      );
      
      if (sessionIndex !== -1) {
        const session = { ...adjustedPlan.plan_data.sessions[sessionIndex] };
        
        // Add finisher sets to the end
        if (session.exercises) {
          session.exercises = [
            ...session.exercises,
            ...this.finisherSets.map(finisher => ({
              ...finisher,
              name: `[OPTIONAL] ${finisher.name}`,
              notes: `${finisher.notes} - Only if feeling strong and energized`
            }))
          ];
        }
        
        // Increase duration slightly
        session.duration = session.duration + 10; // Add 10 minutes for finishers
        
        adjustedPlan.plan_data.sessions[sessionIndex] = session;
      }
    } else {
      // For template-based plans, we can't modify the plan_data
      return {
        type: 'finisher_sets',
        reason: `Readiness score ${Math.round(readinessScore * 100)}% is high with no soreness - consider adding extra sets (template plans cannot be automatically adjusted)`,
        originalPlan: plan,
        adjustedPlan: plan,
        adjustments: [
          'Template-based plans cannot be automatically adjusted',
          'Consider adding extra sets or exercises if feeling strong',
          'Manual adjustment recommended for template plans'
        ]
      };
    }

    return {
      type: 'finisher_sets',
      reason: `Readiness score ${Math.round(readinessScore * 100)}% is high with no soreness - adding optional finisher sets`,
      originalPlan: plan,
      adjustedPlan,
      adjustments: [
        'Added optional finisher sets',
        'Increased session duration by 10 minutes',
        'All finisher exercises are marked as optional'
      ]
    };
  }

  /**
   * Get a human-readable summary of the adjustment
   */
  getAdjustmentSummary(adjustment: PlanAdjustment): string {
    switch (adjustment.type) {
      case 'mobility_day':
        return `🔄 Recovery Day: ${adjustment.reason}`;
      case 'volume_reduction':
        return `📉 Volume Reduced: ${adjustment.reason}`;
      case 'finisher_sets':
        return `⚡ Finisher Sets Added: ${adjustment.reason}`;
      default:
        return `✅ No adjustments needed: ${adjustment.reason}`;
    }
  }

  /**
   * Save adjusted plan to database
   */
  async saveAdjustedPlan(adjustedPlan: UserPlan): Promise<boolean> {
    try {
      const response = await fetch('/api/plans/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: adjustedPlan.id,
          plan_data: adjustedPlan.plan_data
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving adjusted plan:', error);
      return false;
    }
  }

  /**
   * Get detailed adjustment information for display
   */
  getAdjustmentDetails(adjustment: PlanAdjustment): {
    title: string;
    description: string;
    adjustments: string[];
    icon: string;
    color: string;
  } {
    switch (adjustment.type) {
      case 'mobility_day':
        return {
          title: 'Recovery Day Activated',
          description: 'Your readiness is very low, so we\'ve switched to a gentle recovery session.',
          adjustments: adjustment.adjustments,
          icon: '🔄',
          color: 'blue'
        };
      case 'volume_reduction':
        return {
          title: 'Volume Reduced',
          description: 'Your readiness is low, so we\'ve reduced the workout intensity.',
          adjustments: adjustment.adjustments,
          icon: '📉',
          color: 'yellow'
        };
      case 'finisher_sets':
        return {
          title: 'Finisher Sets Available',
          description: 'You\'re feeling great! Optional high-intensity finishers have been added.',
          adjustments: adjustment.adjustments,
          icon: '⚡',
          color: 'green'
        };
      default:
        return {
          title: 'No Adjustments Needed',
          description: 'Your readiness is in the optimal range for today\'s planned workout.',
          adjustments: [],
          icon: '✅',
          color: 'gray'
        };
    }
  }
}
