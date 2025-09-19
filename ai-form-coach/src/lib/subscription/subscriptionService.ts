import { getSupabaseClient } from '@/lib/supabase/client';
import type { 
  UserSubscription, 
  SubscriptionTier, 
  SubscriptionFeatures,
  CoachPack,
  MonthlyChallenge,
  ChallengeParticipation,
  SubscriptionPlan
} from './types';

export class SubscriptionService {
  private supabase = getSupabaseClient();

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      return null;
    }
  }

  /**
   * Get user's subscription tier
   */
  async getUserTier(userId: string): Promise<SubscriptionTier> {
    const subscription = await this.getUserSubscription(userId);
    return subscription?.tier || 'free';
  }

  /**
   * Get user's feature access
   */
  async getUserFeatures(userId: string): Promise<SubscriptionFeatures> {
    const tier = await this.getUserTier(userId);
    return this.getFeatureAccess(tier);
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(userId: string, feature: keyof SubscriptionFeatures): Promise<boolean> {
    const features = await this.getUserFeatures(userId);
    return features[feature];
  }

  /**
   * Get feature access for a tier
   */
  getFeatureAccess(tier: SubscriptionTier): SubscriptionFeatures {
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
          readiness_assessment: true,
          unlimited_sessions: true, // Limited to 10 recent sessions
        };

      case 'pro':
      case 'founder':
        return {
          ...baseFeatures,
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
  }

  /**
   * Get available coach packs
   */
  async getCoachPacks(): Promise<CoachPack[]> {
    try {
      const { data, error } = await this.supabase
        .from('coach_packs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coach packs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCoachPacks:', error);
      return [];
    }
  }

  /**
   * Get active monthly challenge
   */
  async getActiveChallenge(): Promise<MonthlyChallenge | null> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await this.supabase
        .from('monthly_challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', now)
        .lte('start_date', now)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching active challenge:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getActiveChallenge:', error);
      return null;
    }
  }

  /**
   * Get user's challenge participation
   */
  async getUserChallengeParticipation(userId: string, challengeId: string): Promise<ChallengeParticipation | null> {
    try {
      const { data, error } = await this.supabase
        .from('challenge_participations')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching challenge participation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserChallengeParticipation:', error);
      return null;
    }
  }

  /**
   * Join a monthly challenge
   */
  async joinChallenge(userId: string, challengeId: string): Promise<ChallengeParticipation | null> {
    try {
      // Check if user already joined
      const existing = await this.getUserChallengeParticipation(userId, challengeId);
      if (existing) {
        return existing;
      }

      const { data, error } = await this.supabase
        .from('challenge_participations')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          progress_value: 0,
          completion_percentage: 0,
          is_completed: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error joining challenge:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in joinChallenge:', error);
      return null;
    }
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(
    userId: string, 
    challengeId: string, 
    progressValue: number
  ): Promise<ChallengeParticipation | null> {
    try {
      const participation = await this.getUserChallengeParticipation(userId, challengeId);
      if (!participation) {
        return null;
      }

      const challenge = await this.getActiveChallenge();
      if (!challenge) {
        return null;
      }

      const completionPercentage = Math.min((progressValue / challenge.target_value) * 100, 100);
      const isCompleted = completionPercentage >= 100;

      const { data, error } = await this.supabase
        .from('challenge_participations')
        .update({
          progress_value: progressValue,
          completion_percentage: completionPercentage,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', participation.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating challenge progress:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateChallengeProgress:', error);
      return null;
    }
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId: string, limit: number = 10): Promise<ChallengeParticipation[]> {
    try {
      const { data, error } = await this.supabase
        .from('challenge_participations')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('challenge_id', challengeId)
        .order('completion_percentage', { ascending: false })
        .order('progress_value', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching challenge leaderboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getChallengeLeaderboard:', error);
      return [];
    }
  }

  /**
   * Check if user can access a feature (with fallback to free tier)
   */
  async checkFeatureAccess(userId: string, feature: keyof SubscriptionFeatures): Promise<boolean> {
    try {
      // If no user ID, assume free tier
      if (!userId) {
        const freeFeatures = this.getFeatureAccess('free');
        return freeFeatures[feature];
      }

      return await this.hasFeatureAccess(userId, feature);
    } catch (error) {
      console.error('Error checking feature access:', error);
      // Fallback to free tier on error
      const freeFeatures = this.getFeatureAccess('free');
      return freeFeatures[feature];
    }
  }

  /**
   * Get subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await this.supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('Error fetching subscription plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSubscriptionPlans:', error);
      return [];
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
