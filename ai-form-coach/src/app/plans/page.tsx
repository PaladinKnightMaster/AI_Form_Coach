"use client";

import { useState } from 'react';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import type { PlanTemplate, UserPlan } from '@/types/plans';

export default function PlansPage() {
  const [activeView, setActiveView] = useState<'featured' | 'my-plans'>('featured');

  // Mock data for featured plans
  const featuredPlans: PlanTemplate[] = [
    {
      id: '1',
      name: 'Beginner Bodyweight',
      description: 'Perfect for complete beginners. Build strength and confidence with no equipment needed.',
      category: 'beginner',
      goal_type: 'general_fitness',
      equipment_required: [],
      duration_weeks: 4,
      difficulty_level: 2,
      sessions_per_week: 3,
      avg_session_duration: 30,
      is_featured: true,
      tags: ['bodyweight', 'beginner', 'no-equipment']
    },
    {
      id: '2',
      name: 'Strength Builder',
      description: 'Build real strength with this progressive program. Uses basic equipment to develop functional strength.',
      category: 'intermediate',
      goal_type: 'strength',
      equipment_required: ['dumbbells', 'pull-up-bar'],
      duration_weeks: 6,
      difficulty_level: 5,
      sessions_per_week: 4,
      avg_session_duration: 45,
      is_featured: true,
      tags: ['strength', 'dumbbells', 'intermediate']
    },
    {
      id: '3',
      name: 'Fat Loss HIIT',
      description: 'High-intensity workouts designed to maximize calorie burn and improve cardiovascular fitness.',
      category: 'beginner',
      goal_type: 'fat_loss',
      equipment_required: [],
      duration_weeks: 4,
      difficulty_level: 6,
      sessions_per_week: 4,
      avg_session_duration: 25,
      is_featured: true,
      tags: ['hiit', 'fat-loss', 'cardio', 'bodyweight']
    }
  ];

  // Mock data for user plans
  const userPlans: UserPlan[] = [
    {
      id: 'user-1',
      name: 'My Current Plan',
      current_week: 2,
      current_day: 3,
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];

  const getDifficultyStars = (level: number) => {
    return '★'.repeat(Math.min(level, 5)) + '☆'.repeat(Math.max(0, 5 - level));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'info';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Container>
        <div className="py-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Workout Plans
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose from our expertly crafted plans or create a personalized program
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveView('featured')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeView === 'featured'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon name="star" className="w-4 h-4" />
                  Featured Plans
                </button>
                <button
                  onClick={() => setActiveView('my-plans')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeView === 'my-plans'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon name="user" className="w-4 h-4" />
                  My Plans
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {activeView === 'featured' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                Featured Plans
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {plan.name}
                          </h3>
                          <Badge tone={getCategoryColor(plan.category)} className="mt-1">
                            {plan.category}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {getDifficultyStars(plan.difficulty_level)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {plan.difficulty_level}/10
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {plan.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {plan.duration_weeks} weeks
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">Duration</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {plan.sessions_per_week}/week
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">Sessions</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {plan.avg_session_duration}min
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">Per session</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {plan.equipment_required.length === 0 ? 'None' : plan.equipment_required.length}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">Equipment</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {plan.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                          >
                            {tag.replace('-', ' ')}
                          </span>
                        ))}
                      </div>

                      <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                        Select Plan
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'my-plans' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                My Plans
              </h2>
              {userPlans.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="user" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No plans yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Select a featured plan to get started.
                  </p>
                  <Button
                    onClick={() => setActiveView('featured')}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Browse Featured Plans
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {plan.name}
                          </h3>
                          {plan.is_active && (
                            <Badge tone="success">Active</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              Week {plan.current_week}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">Current</div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              Day {plan.current_day}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">Progress</div>
                          </div>
                        </div>

                        <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                          Continue Plan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
