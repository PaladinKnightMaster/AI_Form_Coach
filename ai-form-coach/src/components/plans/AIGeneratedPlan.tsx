"use client";

import { useState } from 'react';
import { Button, Icon, Badge } from '@/ui/DS';
import type { GeneratedPlan } from '@/lib/ai/planGenerator';

interface AIGeneratedPlanProps {
  plan: GeneratedPlan;
  onAccept: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  isGenerating?: boolean;
  isAccepting?: boolean;
}

export default function AIGeneratedPlan({ 
  plan, 
  onAccept, 
  onRegenerate, 
  onCancel,
  isGenerating = false,
  isAccepting = false
}: AIGeneratedPlanProps) {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  const getDifficultyStars = (level: number) => {
    return '★'.repeat(Math.min(level, 5)) + '☆'.repeat(Math.max(0, 5 - level));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'warning'; // Use warning for advanced since error is not supported
      default: return 'success';
    }
  };

  const weeks = Array.from({ length: plan.duration_weeks }, (_, i) => i + 1);
  const currentWeekSessions = plan.sessions.filter(session => session.week_number === selectedWeek);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                AI Generated Plan
              </h2>
              <p className="text-gray-600">
                Review your personalized workout plan
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>

          {/* Plan Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <Badge tone={getCategoryColor(plan.category)} className="mb-3">
                  {plan.category}
                </Badge>
                <p className="text-gray-600">
                  {plan.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">
                  {getDifficultyStars(plan.difficulty_level)}
                </div>
                <div className="text-xs text-gray-500">
                  {plan.difficulty_level}/10
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-semibold text-gray-900">
                  {plan.duration_weeks} weeks
                </div>
                <div className="text-gray-500">Duration</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {plan.sessions_per_week}/week
                </div>
                <div className="text-gray-500">Sessions</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {plan.avg_session_duration}min
                </div>
                <div className="text-gray-500">Per session</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {plan.equipment_required.length === 0 ? 'None' : plan.equipment_required.length}
                </div>
                <div className="text-gray-500">Equipment</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {plan.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-white/50 text-gray-700 text-sm rounded-full"
                >
                  {tag.replace('-', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Week Selector */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Select Week to Preview
            </h4>
            <div className="flex flex-wrap gap-2">
              {weeks.map((week) => (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedWeek === week
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Week {week}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions for Selected Week */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Week {selectedWeek} Sessions
            </h4>
            <div className="space-y-4">
              {currentWeekSessions.map((session, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedSession(expandedSession === index ? null : index)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-900">
                          Day {session.day_number}: {session.session_name}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {session.estimated_duration} minutes
                        </p>
                      </div>
                      <Icon
                        name={expandedSession === index ? "chevron-up" : "chevron-down"}
                        className="w-5 h-5 text-gray-400"
                      />
                    </div>
                  </button>
                  
                  {expandedSession === index && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <p className="text-gray-600 mb-4">
                        {session.session_description}
                      </p>
                      
                      <div className="space-y-3">
                        <h6 className="font-medium text-gray-900">
                          Exercises:
                        </h6>
                        {session.exercises.map((exercise, exIndex) => (
                          <div
                            key={exIndex}
                            className="bg-white rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-gray-900">
                                {exercise.name}
                              </h6>
                              <div className="text-sm text-gray-600">
                                {exercise.sets} sets
                                {exercise.reps && ` × ${exercise.reps}`}
                                {exercise.duration && ` × ${exercise.duration}`}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              Rest: {exercise.rest}
                              {exercise.notes && ` • ${exercise.notes}`}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {session.difficulty_notes && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> {session.difficulty_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
            
            <div className="flex gap-3">
              <Button
                onClick={onRegenerate}
                disabled={isGenerating}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Regenerating...
                  </>
                ) : (
                  'Regenerate Plan'
                )}
              </Button>
              
              <Button
                onClick={() => onAccept()}
                disabled={isAccepting}
                className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
              >
                {isAccepting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Accepting...
                  </div>
                ) : (
                  'Accept Plan'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
