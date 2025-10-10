"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import LoadingOverlay from '@/components/LoadingOverlay';
import { creatorPacksService } from '@/lib/creator-packs/service';
import { getCurrentUserId } from '@/lib/supabase/client';
import type { PackDetailsResponse } from '@/lib/creator-packs/types';

export default function PackDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToastContext();
  const [packDetails, setPackDetails] = useState<PackDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'reviews'>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await getCurrentUserId();
      setIsAuthenticated(!!userId);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchPackDetails = async () => {
      try {
        setLoading(true);
        const details = await creatorPacksService.getPackDetails(params.id);
        setPackDetails(details);
      } catch (error) {
        console.error('Error fetching pack details:', error);
        showError('Load Failed', 'Failed to load pack details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPackDetails();
    }
  }, [params.id, showError]);

  const handlePurchase = async () => {
    if (!packDetails) return;

    if (!isAuthenticated) {
      router.push(`/signin?redirect=/creator-packs/${params.id}`);
      return;
    }

    try {
      setPurchasing(true);
      
      const response = await fetch('/api/creator-packs/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ packId: params.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate purchase');
      }

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        showSuccess('Purchase Successful!', 'Pack has been added to your library');
        // Refresh pack details to update purchase status
        const details = await creatorPacksService.getPackDetails(params.id);
        setPackDetails(details);
      }
    } catch (error) {
      console.error('Error purchasing pack:', error);
      showError('Purchase Failed', 'Failed to purchase pack');
    } finally {
      setPurchasing(false);
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

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon key={i} name="star" className="w-4 h-4 text-yellow-400 fill-current" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="w-4 h-4 text-yellow-400 fill-current relative">
          <Icon name="star" className="w-4 h-4 text-gray-300" />
          <div className="absolute inset-0 w-2 h-4 overflow-hidden">
            <Icon name="star" className="w-4 h-4 text-yellow-400 fill-current" />
          </div>
        </div>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Icon key={`empty-${i}`} name="star" className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading pack details..." />;
  }

  if (!packDetails) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Pack Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The pack you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </Container>
    );
  }

  const { pack, isPurchased, relatedPacks } = packDetails;

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Pack Image/Thumbnail */}
        <div className="lg:col-span-1">
          <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center relative">
            {pack.preview?.thumbnailUrl ? (
              <Image
                src={pack.preview.thumbnailUrl}
                alt={pack.title}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="text-white text-center">
                <Icon name="dumbbell" className="w-20 h-20 mx-auto mb-4" />
                <p className="text-lg font-medium">{pack.title}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pack Info */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {pack.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                {pack.description}
              </p>
            </div>
            {pack.isFeatured && (
              <Badge tone="success">Featured</Badge>
            )}
          </div>

          {/* Creator Info */}
          {pack.creator?.name && (
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full mr-3 flex items-center justify-center">
                <Icon name="user" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {pack.creator.name}
                </p>
                {pack.creator.credentials && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pack.creator.credentials.join(', ')}
                  </p>
                )}
              </div>
              {pack.creator.verified && (
                <Icon name="check-circle" className="w-5 h-5 text-blue-500 ml-2" />
              )}
            </div>
          )}

          {/* Pack Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {pack.duration}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Weeks</div>
            </div>
            <div className="text-center">
              <Badge tone="neutral" className={getDifficultyColor(pack.difficulty)}>
                {pack.difficulty}
              </Badge>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                {renderStars(pack.rating)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ({pack.reviewCount} reviews)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {pack.purchaseCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Purchases</div>
            </div>
          </div>

          {/* Equipment */}
          {pack.equipment.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Equipment Required</h3>
                <div className="flex flex-wrap gap-2">
                  {pack.equipment.map((item, index) => (
                    <Badge key={index} tone="neutral">
                      {item}
                    </Badge>
                  ))}
                </div>
            </div>
          )}

          {/* Price and Purchase */}
          <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPrice(pack.price, pack.currency)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                One-time purchase &bull; Lifetime access
              </p>
            </div>
            <div>
              {isPurchased ? (
                <Button variant="outline" disabled>
                  <Icon name="check" className="w-4 h-4 mr-2" />
                  Purchased
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? 'Processing...' : 'Purchase Pack'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'content', label: 'Content' },
              { id: 'reviews', label: 'Reviews' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'content' | 'reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Highlights */}
            {pack.preview?.highlights && pack.preview.highlights.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  What&apos;s Included
                </h3>
                <ul className="space-y-2">
                  {pack.preview.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <Icon name="check" className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {pack.preview?.requirements && pack.preview.requirements.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Requirements
                </h3>
                <ul className="space-y-2">
                  {pack.preview.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <Icon name="alert-circle" className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Target Goals */}
            {pack.targetGoals.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Target Goals
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pack.targetGoals.map((goal, index) => (
                    <Badge key={index} tone="info">
                      {goal.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Program Content
            </h3>
            {isPurchased ? (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Full program content will be displayed here for purchased packs.
                </p>
                {/* TODO: Implement full content display */}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="lock" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Content Locked
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Purchase this pack to unlock the full program content
                </p>
                <Button variant="primary" onClick={handlePurchase}>
                  Purchase Pack
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Reviews ({pack.reviewCount})
            </h3>
            {pack.reviewCount > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Reviews will be displayed here.
                </p>
                {/* TODO: Implement reviews display */}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="message" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Reviews Yet
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Be the first to review this pack after purchasing it.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related Packs */}
      {relatedPacks.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Related Packs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedPacks.map((relatedPack) => (
              <div
                key={relatedPack.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Icon name="dumbbell" className="w-8 h-8 text-white" />
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {relatedPack.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {relatedPack.duration} weeks • {relatedPack.difficulty}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatPrice(relatedPack.price, relatedPack.currency)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/creator-packs/${relatedPack.id}`, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
