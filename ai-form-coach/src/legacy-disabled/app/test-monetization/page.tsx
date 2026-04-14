"use client";

import { useState, useEffect } from 'react';
import { Container, Button, Icon } from '@/ui/DS';
import FeatureGate from '@/components/FeatureGate';
import { subscriptionService } from '@/lib/subscription/subscriptionService';
import type { SubscriptionFeatures } from '@/lib/subscription/types';

export default function TestMonetizationPage() {
  const [userTier, setUserTier] = useState<string>('free');
  const [features, setFeatures] = useState<SubscriptionFeatures | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testSubscriptionService();
  }, []);

  const testSubscriptionService = async () => {
    try {
      setLoading(true);
      
      // Test getting user tier
      const supabase = (await import('@/lib/supabase/client')).getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const tier = await subscriptionService.getUserTier(user.id);
        const userFeatures = await subscriptionService.getUserFeatures(user.id);
        setUserTier(tier);
        setFeatures(userFeatures);
      } else {
        const freeFeatures = subscriptionService.getFeatureAccess('free');
        setFeatures(freeFeatures);
      }
    } catch (error) {
      console.error('Error testing subscription service:', error);
    } finally {
      setLoading(false);
    }
  };

  const testFeatureAccess = async (feature: keyof SubscriptionFeatures) => {
    try {
      const supabase = (await import('@/lib/supabase/client')).getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const hasAccess = await subscriptionService.hasFeatureAccess(user.id, feature);
        alert(`Feature "${feature}": ${hasAccess ? 'ACCESS GRANTED' : 'ACCESS DENIED'}`);
      } else {
        const freeFeatures = subscriptionService.getFeatureAccess('free');
        const hasAccess = freeFeatures[feature];
        alert(`Feature "${feature}" (free tier): ${hasAccess ? 'ACCESS GRANTED' : 'ACCESS DENIED'}`);
      }
    } catch (error) {
      console.error('Error testing feature access:', error);
      alert('Error testing feature access');
    }
  };

  if (loading) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading monetization test...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Monetization System Test
        </h1>

        {/* Current Status */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">User Tier:</p>
              <p className="text-lg font-medium text-gray-900">{userTier}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Features Available:</p>
              <p className="text-lg font-medium text-gray-900">
                {features ? Object.values(features).filter(Boolean).length : 0} / {features ? Object.keys(features).length : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Feature Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {features && Object.entries(features).map(([feature, hasAccess]) => (
            <div
              key={feature}
              className={`p-4 rounded-lg border ${
                hasAccess 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">
                  {feature.replace(/_/g, ' ')}
                </h3>
                <Icon 
                  name={hasAccess ? "check" : "x"} 
                  className={`w-4 h-4 ${hasAccess ? 'text-green-600' : 'text-red-600'}`} 
                />
              </div>
              <Button
                size="sm"
                onClick={() => testFeatureAccess(feature as keyof SubscriptionFeatures)}
                className="w-full"
              >
                Test Access
              </Button>
            </div>
          ))}
        </div>

        {/* FeatureGate Tests */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">FeatureGate Component Tests</h2>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-medium mb-4">AI Plan Generation (Pro Feature)</h3>
            <FeatureGate feature="ai_plan_generation">
              <div className="p-4 bg-green-100 rounded-lg">
                <p className="text-green-800">
                  ✅ You have access to AI Plan Generation!
                </p>
              </div>
            </FeatureGate>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-medium mb-4">Coach Packs Access (Pro Feature)</h3>
            <FeatureGate feature="coach_packs_access">
              <div className="p-4 bg-green-100 rounded-lg">
                <p className="text-green-800">
                  ✅ You have access to Coach Packs!
                </p>
              </div>
            </FeatureGate>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-medium mb-4">Monthly Challenges (Pro Feature)</h3>
            <FeatureGate feature="monthly_challenges">
              <div className="p-4 bg-green-100 rounded-lg">
                <p className="text-green-800">
                  ✅ You have access to Monthly Challenges!
                </p>
              </div>
            </FeatureGate>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="font-medium mb-4">Readiness Assessment (Free Feature)</h3>
            <FeatureGate feature="readiness_assessment">
              <div className="p-4 bg-green-100 rounded-lg">
                <p className="text-green-800">
                  ✅ You have access to Readiness Assessment!
                </p>
              </div>
            </FeatureGate>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Button asChild>
            <a href="/coach-packs">Test Coach Packs</a>
          </Button>
          <Button asChild>
            <a href="/challenges">Test Challenges</a>
          </Button>
          <Button asChild>
            <a href="/pricing">View Pricing</a>
          </Button>
        </div>
      </div>
    </Container>
  );
}
