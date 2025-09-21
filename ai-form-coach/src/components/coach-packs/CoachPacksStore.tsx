"use client";

import { useState, useEffect } from 'react';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import FeatureGate from '@/components/FeatureGate';
import LoadingOverlay from '@/components/LoadingOverlay';
import type { CoachPack } from '@/lib/subscription/types';

export default function CoachPacksStore() {
  const { success: showSuccess, error: showError, info: showInfo } = useToastContext();
  const [coachPacks, setCoachPacks] = useState<CoachPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchCoachPacks();
  }, []);

  const fetchCoachPacks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coach-packs', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch coach packs');
      }
      
      const data = await response.json();
      setCoachPacks(data.coachPacks || []);
    } catch (error) {
      console.error('Error fetching coach packs:', error);
      showError('Load Failed', 'Failed to load coach packs');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packId: string) => {
    try {
      setPurchasing(packId);
      
      const response = await fetch('/api/coach-packs/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ packId }),
      });

      if (!response.ok) {
        throw new Error('Failed to purchase coach pack');
      }

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        showSuccess('Purchase Successful!', 'Coach pack has been added to your library');
        fetchCoachPacks(); // Refresh the list
      }
    } catch (error) {
      console.error('Error purchasing coach pack:', error);
      showError('Purchase Failed', 'Failed to purchase coach pack');
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (priceInCents: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(priceInCents / 100);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading coach packs..." />;
  }

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg mr-4">
              <Icon name="package" className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Coach Packs
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Premium workout programs designed by fitness experts
          </p>
        </div>

        {/* Pro Access Gate */}
        <FeatureGate 
          feature="coach_packs_access"
          fallback={
            <div className="text-center py-12">
              <Icon name="lock" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Pro Feature
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Coach Packs are available with a Pro subscription
              </p>
              <Button variant="primary" asChild>
                <a href="/pricing">Upgrade to Pro</a>
              </Button>
            </div>
          }
        >
          {/* Coach Packs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {coachPacks.map((pack) => (
              <div
                key={pack.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1 pr-2">
                      {pack.name}
                    </h3>
                    <Badge className={`${getDifficultyColor(pack.difficulty_level)} flex-shrink-0`}>
                      {pack.difficulty_level}
                    </Badge>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1">
                    {pack.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Icon name="calendar" className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{pack.duration_weeks} weeks</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Icon name="dumbbell" className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{pack.equipment_required.join(', ') || 'Bodyweight'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {pack.target_goals.map((goal) => (
                      <Badge key={goal} className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs">
                        {goal}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(pack.price, pack.currency)}
                    </div>
                    
                    <Button
                      onClick={() => handlePurchase(pack.id)}
                      disabled={purchasing === pack.id}
                      className="bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0"
                    >
                      {purchasing === pack.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <>
                          <Icon name="plus" className="w-4 h-4 mr-2" />
                          Purchase
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {coachPacks.length === 0 && (
            <div className="text-center py-12">
              <Icon name="package" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No coach packs available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back soon for new premium workout programs
              </p>
            </div>
          )}
        </FeatureGate>
      </div>
    </Container>
  );
}
