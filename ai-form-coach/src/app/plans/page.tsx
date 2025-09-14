"use client";

import { useState, useEffect } from 'react';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import type { PlanTemplate, UserPlan } from '@/types/plans';
import type { UserPreferences, GeneratedPlan } from '@/lib/ai/planGenerator';
import PlanWizard from '@/components/plans/PlanWizard';
import AIGeneratedPlan from '@/components/plans/AIGeneratedPlan';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function PlansPage() {
  const [activeView, setActiveView] = useState<'featured' | 'my-plans'>('featured');
  const [featuredPlans, setFeaturedPlans] = useState<PlanTemplate[]>([]);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // AI Plan Generation states
  const [showWizard, setShowWizard] = useState(false);
  const [showGeneratedPlan, setShowGeneratedPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch featured plans
  const fetchFeaturedPlans = async () => {
    try {
      const response = await fetch('/api/plans/templates?featured=true', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch featured plans');
      }
      const data = await response.json();
      setFeaturedPlans(data.templates || []);
    } catch (err) {
      console.error('Error fetching featured plans:', err);
      setError('Failed to load featured plans');
    }
  };

  // Fetch user plans
  const fetchUserPlans = async () => {
    try {
      const response = await fetch('/api/plans/user', {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, this is fine
          setUserPlans([]);
          return;
        }
        throw new Error('Failed to fetch user plans');
      }
      const data = await response.json();
      setUserPlans(data.userPlans || []);
    } catch (err) {
      console.error('Error fetching user plans:', err);
      setError('Failed to load user plans');
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchFeaturedPlans(),
        fetchUserPlans()
      ]);
      
      setLoading(false);
    };

    loadData();
  }, []);

  // Handle plan selection
  const handleSelectPlan = async (templateId: string, planName: string) => {
    try {
      setError(null); // Clear any previous errors
      
      const response = await fetch('/api/plans/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          template_id: templateId,
          name: planName
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to select a plan');
          return;
        }
        throw new Error('Failed to select plan');
      }

      // Refresh user plans
      await fetchUserPlans();
      
      // Show success message
      setSuccess(`Successfully started "${planName}" plan!`);
      
      // Switch to my plans view
      setActiveView('my-plans');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('Failed to select plan. Please try again.');
    }
  };

  // Handle AI plan generation
  const handleGenerateAIPlan = async (preferences: UserPreferences) => {
    try {
      setIsGenerating(true);
      setError(null);
      setShowWizard(false);

      // Check if user is authenticated
      const supabase = getSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Please sign in to generate AI plans');
        return;
      }

      const response = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to generate AI plans');
          return;
        }
        throw new Error('Failed to generate AI plan');
      }

      const data = await response.json();
      setGeneratedPlan(data.plan);
      setShowGeneratedPlan(true);
      
    } catch (err) {
      console.error('Error generating AI plan:', err);
      setError('Failed to generate AI plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptAIPlan = async (planId: string) => {
    try {
      setError(null);
      
      // Check if user is authenticated
      const supabase = getSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Please sign in to save your plan');
        return;
      }

      // Save the AI-generated plan directly
      const response = await fetch('/api/plans/save-ai-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          plan: generatedPlan,
          name: generatedPlan?.name || 'AI Generated Plan'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save plan');
      }

      // Refresh user plans
      await fetchUserPlans();
      
      // Close modals and show success
      setShowGeneratedPlan(false);
      setGeneratedPlan(null);
      setSuccess(`Successfully started "${generatedPlan?.name}" plan!`);
      setActiveView('my-plans');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error accepting AI plan:', err);
      setError('Failed to save plan. Please try again.');
    }
  };

  const handleRegenerateAIPlan = () => {
    setShowGeneratedPlan(false);
    setShowWizard(true);
  };

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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Icon name="alert-circle" className="w-5 h-5 text-red-500" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Icon name="check-circle" className="w-5 h-5 text-green-500" />
                <p className="text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading plans...</p>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-col items-center gap-4">
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
            
            {/* AI Plan Generation Button */}
            <Button
              onClick={() => setShowWizard(true)}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg shadow-lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Icon name="sparkles" className="w-4 h-4 mr-2" />
                  Create AI Plan
                </>
              )}
            </Button>
          </div>

          {/* Content */}
          {!loading && activeView === 'featured' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                Featured Plans
              </h2>
              {featuredPlans.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="calendar" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No featured plans available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Check back later for new workout plans.
                  </p>
                </div>
              ) : (
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

                      <Button 
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => handleSelectPlan(plan.id, plan.name)}
                      >
                        Select Plan
                      </Button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && activeView === 'my-plans' && (
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

      {/* AI Plan Generation Wizard */}
      {showWizard && (
        <PlanWizard
          onComplete={handleGenerateAIPlan}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {/* AI Generated Plan Modal */}
      {showGeneratedPlan && generatedPlan && (
        <AIGeneratedPlan
          plan={generatedPlan}
          onAccept={handleAcceptAIPlan}
          onRegenerate={handleRegenerateAIPlan}
          onCancel={() => {
            setShowGeneratedPlan(false);
            setGeneratedPlan(null);
          }}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}
