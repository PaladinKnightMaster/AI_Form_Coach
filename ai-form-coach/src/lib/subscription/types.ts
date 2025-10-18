// Subscription and monetization types

export type SubscriptionTier = 'free' | 'pro' | 'founder';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionFeatures {
  // AI Plan Engine
  ai_plan_generation: boolean;
  custom_plan_creation: boolean;
  plan_optimization: boolean;
  
  // Detailed Trends & Analytics
  detailed_trends: boolean;
  advanced_analytics: boolean;
  export_data: boolean;
  historical_insights: boolean;
  
  // Health Sync
  health_data_sync: boolean;
  readiness_assessment: boolean;
  health_insights: boolean;
  
  // Nutrition (Basic vs Advanced)
  basic_nutrition_tracking: boolean;
  advanced_nutrition_features: boolean;
  
  // Coach Packs
  coach_packs_access: boolean;
  premium_programs: boolean;
  
  // Monthly Challenges
  monthly_challenges: boolean;
  challenge_analytics: boolean;
  leaderboards: boolean;
  
  // General Pro Features
  unlimited_sessions: boolean;
  priority_support: boolean;
  early_access: boolean;
}

export interface CoachPack {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  program_data: Record<string, unknown>; // JSON program structure
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  equipment_required: string[];
  target_goals: string[];
  preview_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlyChallenge {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  challenge_type: 'reps' | 'time' | 'consistency' | 'improvement';
  target_value: number;
  target_unit: string;
  exercise_type: 'squat' | 'pushup' | 'plank' | 'all';
  reward_description: string;
  is_active: boolean;
  participant_count: number;
  created_at: string;
}

export interface ChallengeParticipation {
  id: string;
  user_id: string;
  challenge_id: string;
  progress_value: number;
  completion_percentage: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price_monthly: number; // in cents
  price_yearly: number; // in cents
  features: SubscriptionFeatures;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  is_active: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  type: 'card' | 'bank_account';
  card_brand?: string;
  card_last4?: string;
  is_default: boolean;
  created_at: string;
}

export interface BillingHistory {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'paid' | 'pending' | 'failed';
  stripe_invoice_id?: string;
  created_at: string;
}

// Feature gating utilities
export const getFeatureAccess = (tier: SubscriptionTier): SubscriptionFeatures => {
  const baseFeatures: SubscriptionFeatures = {
    ai_plan_generation: false,
    custom_plan_creation: false,
    plan_optimization: false,
    detailed_trends: false,
    advanced_analytics: false,
    export_data: false,
    historical_insights: false,
    health_data_sync: false,
    readiness_assessment: false,
    health_insights: false,
    basic_nutrition_tracking: false,
    advanced_nutrition_features: false,
    coach_packs_access: false,
    premium_programs: false,
    monthly_challenges: false,
    challenge_analytics: false,
    leaderboards: false,
    unlimited_sessions: false,
    priority_support: false,
    early_access: false,
  };

  switch (tier) {
    case 'free':
      return {
        ...baseFeatures,
        // Free users get basic features
        readiness_assessment: true,
        basic_nutrition_tracking: true, // Basic nutrition tracking for free users
        unlimited_sessions: true, // Limited to 10 recent sessions
      };

    case 'pro':
      return {
        ...baseFeatures,
        // Pro users get all features
        ai_plan_generation: true,
        custom_plan_creation: true,
        plan_optimization: true,
        detailed_trends: true,
        advanced_analytics: true,
        export_data: true,
        historical_insights: true,
        health_data_sync: true,
        readiness_assessment: true,
        health_insights: true,
        basic_nutrition_tracking: true,
        advanced_nutrition_features: true, // Advanced nutrition features for Pro users
        coach_packs_access: true,
        premium_programs: true,
        monthly_challenges: true,
        challenge_analytics: true,
        leaderboards: true,
        unlimited_sessions: true,
        priority_support: true,
        early_access: true,
      };

    case 'founder':
      return {
        ...baseFeatures,
        // Founder users get everything Pro gets, plus lifetime access
        ai_plan_generation: true,
        custom_plan_creation: true,
        plan_optimization: true,
        detailed_trends: true,
        advanced_analytics: true,
        export_data: true,
        historical_insights: true,
        health_data_sync: true,
        readiness_assessment: true,
        health_insights: true,
        basic_nutrition_tracking: true,
        advanced_nutrition_features: true,
        coach_packs_access: true,
        premium_programs: true,
        monthly_challenges: true,
        challenge_analytics: true,
        leaderboards: true,
        unlimited_sessions: true,
        priority_support: true,
        early_access: true,
      };

    default:
      return baseFeatures;
  }
};

export const isFeatureEnabled = (tier: SubscriptionTier, feature: keyof SubscriptionFeatures): boolean => {
  const features = getFeatureAccess(tier);
  return features[feature];
};
