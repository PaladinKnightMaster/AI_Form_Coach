"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import type { PlanTemplate, UserPlan } from '@/types/plans';
import type { UserPreferences, GeneratedPlan } from '@/lib/ai/planGenerator';
import type { CreatorPack } from '@/lib/creator-packs/types';
import PlanWizard from '@/components/plans/PlanWizard';
import AIGeneratedPlan from '@/components/plans/AIGeneratedPlan';
import PlanManagementModal from '@/components/plans/PlanManagementModal';
import LoadingOverlay from '@/components/LoadingOverlay';
import LoadingButton from '@/components/LoadingButton';
import FeatureGate from '@/components/FeatureGate';
import { creatorPacksService } from '@/lib/creator-packs/service';
import { useToastContext } from '@/components/ToastProvider';
import { getSupabaseClient, getCurrentUserId } from '@/lib/supabase/client';

export default function PlansPage() {
  const router = useRouter();
  const { success: showSuccess, error: showError, info: showInfo } = useToastContext();
  const [activeView, setActiveView] = useState<'featured' | 'my-plans'>('featured');
  const [featuredPlans, setFeaturedPlans] = useState<PlanTemplate[]>([]);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [purchasedPacks, setPurchasedPacks] = useState<CreatorPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null); // Track which plan is being selected
  const [acceptingPlan, setAcceptingPlan] = useState(false); // Track if accepting AI plan
  
  // Plan Management states
  const [selectedPlan, setSelectedPlan] = useState<UserPlan | null>(null);
  const [showPlanManagement, setShowPlanManagement] = useState(false);
  const [removingPlan, setRemovingPlan] = useState<string | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);
  
  // AI Plan Generation states
  const [showWizard, setShowWizard] = useState(false);
  const [showGeneratedPlan, setShowGeneratedPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch featured plans
  const fetchFeaturedPlans = useCallback(async () => {
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
      showError('Failed to load featured plans', 'Unable to load featured plans. Please try again.');
    }
  }, [showError]);

  // Check if user is authenticated
  const checkAuthStatus = async () => {
    try {
      const userId = await getCurrentUserId();
      return !!userId;
    } catch {
      return false;
    }
  };

  // Fetch user plans
  const fetchUserPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/plans/user', {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        // User not authenticated, this is expected and fine
        setUserPlans([]);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user plans: ${response.status}`);
      }
      
      const data = await response.json();
      setUserPlans(data.userPlans || []);
    } catch (err) {
      // Only log errors that aren't authentication-related
      if (err instanceof Error && !err.message.includes('401')) {
        console.error('Error fetching user plans:', err);
        showError('Failed to load user plans', 'Unable to load your plans. Please try again.');
      }
    }
  }, [showError]);

  // Fetch purchased Creator Packs
  const fetchPurchasedPacks = useCallback(async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      
      const packs = await creatorPacksService.getUserPurchasedPacks(userId);
      setPurchasedPacks(packs);
    } catch (err) {
      console.error('Error fetching purchased packs:', err);
      showError('Failed to load purchased packs', 'Unable to load your purchased packs. Please try again.');
    }
  }, [showError]);

  const checkAuthentication = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthenticated(false);
        router.push('/signin?redirect=/plans');
        return;
      }
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      router.push('/signin?redirect=/plans');
    }
  }, [router]);

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  // Load data after authentication
  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        setLoading(true);
        // Clear any previous errors
        
        await Promise.all([
          fetchFeaturedPlans(),
          fetchUserPlans(),
          fetchPurchasedPacks()
        ]);
        
        setLoading(false);
      };

      loadData();
    }
  }, [isAuthenticated, fetchFeaturedPlans, fetchUserPlans, fetchPurchasedPacks]);

  // Fetch user plans when switching to my-plans view
  useEffect(() => {
    if (activeView === 'my-plans') {
      fetchUserPlans();
    }
  }, [activeView, fetchUserPlans]);

  // Handle plan selection
  const handleSelectPlan = async (templateId: string, planName: string) => {
    try {
      // Clear any previous errors // Clear any previous errors
      setSelectingPlan(templateId); // Start loading state
      
      // Check authentication first
      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        showError('Authentication Required', 'Please sign in to save plans');
        setSelectingPlan(null);
        return;
      }
      
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
          showError('Authentication Required', 'Please sign in to select a plan');
          setSelectingPlan(null);
          return;
        }
        
        // Get error details from response
        let errorMessage = 'Failed to select plan';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If we can't parse the error response, use the status text
          errorMessage = `Failed to select plan: ${response.status} ${response.statusText}`;
        }
        
        console.error('Plan selection error:', response.status, errorMessage);
        showError('Plan Selection Failed', errorMessage);
        setSelectingPlan(null);
        return;
      }

      // Show success message
      showSuccess('Plan Added Successfully!', `"${planName}" has been added to your collection`);
      
      // Switch to my plans view (will automatically fetch plans when view changes)
      setActiveView('my-plans');
      
    } catch (err) {
      console.error('Error selecting plan:', err);
      showError('Plan Selection Failed', 'Failed to select plan. Please try again.');
    } finally {
      setSelectingPlan(null); // Always clear loading state
    }
  };

  // Handle AI plan generation
  const handleGenerateAIPlan = async (preferences: UserPreferences) => {
    try {
      setIsGenerating(true);
      // Clear any previous errors
      setShowWizard(false);

      // Check if user is authenticated
      const supabase = getSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        showError('Authentication Required', 'Please sign in to generate AI plans');
        setIsGenerating(false);
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
          showError('Authentication Required', 'Please sign in to generate AI plans');
          return;
        }
        throw new Error('Failed to generate AI plan');
      }

      const data = await response.json();
      setGeneratedPlan(data.plan);
      setShowGeneratedPlan(true);
      
    } catch (err) {
      console.error('Error generating AI plan:', err);
      showError('AI Generation Failed', 'Failed to generate AI plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptAIPlan = async () => {
    try {
      // Clear any previous errors
      setAcceptingPlan(true);
      
      // Check if user is authenticated
      const supabase = getSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        showError('Authentication Required', 'Please sign in to save your plan');
        setAcceptingPlan(false);
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

      // Close modals and show success
      setShowGeneratedPlan(false);
      setGeneratedPlan(null);
      showSuccess('AI Plan Saved!', `"${generatedPlan?.name}" has been added to your collection`);
      setActiveView('my-plans');
      
    } catch (err) {
      console.error('Error accepting AI plan:', err);
      showError('Save Failed', 'Failed to save plan. Please try again.');
    } finally {
      setAcceptingPlan(false);
    }
  };

  const handleRegenerateAIPlan = () => {
    setShowGeneratedPlan(false);
    setShowWizard(true);
  };

  // Plan Management Functions
  const handleManagePlan = (plan: UserPlan) => {
    setSelectedPlan(plan);
    setShowPlanManagement(true);
  };

  const handleContinuePlan = (plan: UserPlan) => {
    setShowPlanManagement(false);
    showInfo('Starting Workout', 'Redirecting to your workout session...');
    
    // Navigate to coach page with plan information
    // We'll pass the plan ID as a query parameter so the coach page can load the plan
    router.push(`/coach?planId=${plan.id}&planName=${encodeURIComponent(plan.name)}`);
  };

  const handleToggleActive = async (planId: string, isActive: boolean) => {
    try {
      setUpdatingPlan(planId);
      
      const response = await fetch('/api/plans/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          plan_id: planId,
          is_active: isActive
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      // Refresh user plans
      await fetchUserPlans();
      showSuccess('Plan Updated', `Plan ${isActive ? 'activated' : 'paused'} successfully!`);
    } catch (err) {
      console.error('Error updating plan:', err);
      showError('Update Failed', 'Failed to update plan. Please try again.');
    } finally {
      setUpdatingPlan(null);
    }
  };

  const handleRemovePlan = async (planId: string) => {
    try {
      setRemovingPlan(planId);
      
      const response = await fetch('/api/plans/user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ plan_id: planId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove plan');
      }

      // Refresh user plans
      await fetchUserPlans();
      setShowPlanManagement(false);
      showSuccess('Plan Removed', 'Plan has been successfully removed from your collection');
    } catch (err) {
      console.error('Error removing plan:', err);
      showError('Removal Failed', 'Failed to remove plan. Please try again.');
    } finally {
      setRemovingPlan(null);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50" suppressHydrationWarning>
      <Container>
        <div className="py-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <Badge tone="info" size="lg" className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-700 border-purple-200">
                🚀 AI-Powered Planning
              </Badge>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Workout Plans
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Choose from our expertly crafted plans or create a personalized program with AI
              </p>
            </div>
          </div>



          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading plans...</p>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white rounded-lg p-1 shadow-lg">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveView('featured')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeView === 'featured'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
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
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon name="user" className="w-4 h-4" />
                  My Plans
                </button>
              </div>
            </div>
            
            {/* AI Plan Generation Button */}
            <FeatureGate feature="ai_plan_generation">
              <LoadingButton
                onClick={() => setShowWizard(true)}
                loading={isGenerating}
                loadingText="Opening Wizard..."
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg shadow-lg"
              >
                <Icon name="zap" className="w-4 h-4 mr-2" />
                Create AI Plan
              </LoadingButton>
            </FeatureGate>
          </div>

          {/* Content */}
          {!loading && activeView === 'featured' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center">
                Featured Plans
              </h2>
              {featuredPlans.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="calendar" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No featured plans available
                  </h3>
                  <p className="text-gray-600">
                    Check back later for new workout plans.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {plan.name}
                          </h3>
                          <Badge tone={getCategoryColor(plan.category)} className="mt-1">
                            {plan.category}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {getDifficultyStars(plan.difficulty_level)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {plan.difficulty_level}/10
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm">
                        {plan.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
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

                      <div className="flex flex-wrap gap-1">
                        {plan.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag.replace('-', ' ')}
                          </span>
                        ))}
                      </div>

                      <LoadingButton
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => handleSelectPlan(plan.id, plan.name)}
                        loading={selectingPlan === plan.id}
                        loadingText="Adding to Collection..."
                      >
                        Select Plan
                      </LoadingButton>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && activeView === 'my-plans' && (
            <div className="space-y-8">
              {/* My Plans Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
                  My Plans
                </h2>
                {userPlans.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="user" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No plans yet
                    </h3>
                    <p className="text-gray-600 mb-6">
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
                      className="bg-white rounded-xl p-6 shadow-lg"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900">
                            {plan.name}
                          </h3>
                          {plan.is_active && (
                            <Badge tone="success">Active</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-semibold text-gray-900">
                              Week {plan.current_week}
                            </div>
                            <div className="text-gray-500">Current</div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              Day {plan.current_day}
                            </div>
                            <div className="text-gray-500">Progress</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <LoadingButton 
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => handleContinuePlan(plan)}
                          >
                            <Icon name="play" className="w-4 h-4 mr-2" />
                            Continue Plan
                          </LoadingButton>
                          
                          <Button 
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => handleManagePlan(plan)}
                          >
                            <Icon name="settings" className="w-4 h-4 mr-2" />
                            Manage Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>

              {/* Creator Packs Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    My Creator Packs
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => window.open('/creator-packs', '_blank')}
                  >
                    <Icon name="package" className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </div>
                
                {purchasedPacks.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Icon name="package" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No purchased packs yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Discover premium workout programs created by fitness experts.
                    </p>
                    <Button
                      onClick={() => window.open('/creator-packs', '_blank')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      <Icon name="package" className="w-4 h-4 mr-2" />
                      Browse Creator Packs
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchasedPacks.map((pack) => (
                      <div
                        key={pack.id}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {pack.title}
                              </h3>
                              <Badge tone="success" className="mt-1">
                                Purchased
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {pack.difficulty}
                              </div>
                              <div className="text-xs text-gray-500">
                                {pack.duration} weeks
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm">
                            {pack.shortDescription}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              by {pack.creator?.name || 'Unknown Creator'}
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => window.open(`/creator-packs/${pack.id}`, '_blank')}
                            >
                              View Pack
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Container>

      {/* AI Plan Generation Wizard */}
      {showWizard && (
        <PlanWizard
          onComplete={handleGenerateAIPlan}
          onCancel={() => setShowWizard(false)}
          isGenerating={isGenerating}
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
          isAccepting={acceptingPlan}
        />
      )}

      {/* Loading Overlay for Plan Selection */}
      <LoadingOverlay
        isVisible={!!selectingPlan}
        message="Adding Plan to Your Collection"
        subMessage="This may take a few seconds..."
      />

      {/* Loading Overlay for Plan Removal */}
      <LoadingOverlay
        isVisible={!!removingPlan}
        message="Removing Plan"
        subMessage="Please wait while we remove your plan..."
      />

      {/* Loading Overlay for Plan Updates */}
      <LoadingOverlay
        isVisible={!!updatingPlan}
        message="Updating Plan"
        subMessage="Please wait while we update your plan..."
      />

      {/* Plan Management Modal */}
      {selectedPlan && (
        <PlanManagementModal
          plan={selectedPlan}
          isOpen={showPlanManagement}
          onClose={() => {
            setShowPlanManagement(false);
            setSelectedPlan(null);
          }}
          onRemove={handleRemovePlan}
          onContinue={handleContinuePlan}
          onToggleActive={handleToggleActive}
          isRemoving={removingPlan === selectedPlan.id}
          isUpdating={updatingPlan === selectedPlan.id}
        />
      )}
    </div>
  );
}
