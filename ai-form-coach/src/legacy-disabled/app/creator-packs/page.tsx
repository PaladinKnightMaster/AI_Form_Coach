"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Container, Button, Icon, Badge } from '@/ui/DS';
import { useToastContext } from '@/components/ToastProvider';
import LoadingOverlay from '@/components/LoadingOverlay';
import { creatorPacksService } from '@/lib/creator-packs/service';
import type { CreatorPack, PackSearchParams, PackFilters } from '@/lib/creator-packs/types';

export default function CreatorPacksMarketplace() {
  const { error: showError } = useToastContext();
  const [packs, setPacks] = useState<CreatorPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<PackSearchParams>({
    page: 1,
    limit: 12,
    sortBy: 'newest'
  });
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchPacks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await creatorPacksService.getPacks(searchParams);
      
      setPacks(response.packs);
      setTotal(response.total);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Error fetching creator packs:', error);
      showError('Load Failed', 'Failed to load creator packs');
    } finally {
      setLoading(false);
    }
  }, [searchParams, showError]);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({
      ...prev,
      query: query || undefined,
      page: 1
    }));
  };

  const handleFilterChange = (filters: Partial<PackFilters>) => {
    setSearchParams(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      page: 1
    }));
  };

  const handleSortChange = (sortBy: PackSearchParams['sortBy']) => {
    setSearchParams(prev => ({
      ...prev,
      sortBy,
      page: 1
    }));
  };

  const handleLoadMore = () => {
    setSearchParams(prev => ({
      ...prev,
      page: (prev.page || 1) + 1
    }));
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

  if (loading && packs.length === 0) {
    return <LoadingOverlay isVisible={true} message="Loading creator packs..." />;
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Creator Packs Marketplace
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Discover premium workout programs created by fitness experts. 
          Each pack includes detailed workouts, progress tracking, and expert guidance.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search creator packs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Icon name="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4">
          {/* Difficulty Filter */}
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange({
                difficulty: value ? [value as 'beginner' | 'intermediate' | 'advanced'] : undefined
              });
            }}
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Duration Filter */}
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            onChange={(e) => {
              const value = e.target.value;
              let duration: { min?: number; max?: number } | undefined;
              switch (value) {
                case 'short':
                  duration = { max: 4 };
                  break;
                case 'medium':
                  duration = { min: 5, max: 8 };
                  break;
                case 'long':
                  duration = { min: 9 };
                  break;
                default:
                  duration = undefined;
              }
              handleFilterChange({ duration });
            }}
          >
            <option value="">All Durations</option>
            <option value="short">1-4 weeks</option>
            <option value="medium">5-8 weeks</option>
            <option value="long">9+ weeks</option>
          </select>

          {/* Price Filter */}
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            onChange={(e) => {
              const value = e.target.value;
              let price: { min?: number; max?: number } | undefined;
              switch (value) {
                case 'low':
                  price = { max: 20 };
                  break;
                case 'medium':
                  price = { min: 21, max: 50 };
                  break;
                case 'high':
                  price = { min: 51 };
                  break;
                default:
                  price = undefined;
              }
              handleFilterChange({ price });
            }}
          >
            <option value="">All Prices</option>
            <option value="low">Under $20</option>
            <option value="medium">$20-$50</option>
            <option value="high">$50+</option>
          </select>

          {/* Sort */}
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            value={searchParams.sortBy}
            onChange={(e) => handleSortChange(e.target.value as 'newest' | 'oldest' | 'price_low' | 'price_high' | 'rating' | 'popularity')}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Showing {packs.length} of {total} creator packs
        </p>
      </div>

      {/* Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Pack Image/Thumbnail */}
            <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
              {pack.preview?.thumbnailUrl ? (
                <Image
                  src={pack.preview.thumbnailUrl}
                  alt={pack.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="text-white text-center">
                  <Icon name="dumbbell" className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-medium">{pack.title}</p>
                </div>
              )}
            </div>

            {/* Pack Content */}
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {pack.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {pack.shortDescription}
                  </p>
                </div>
                {pack.isFeatured && (
                  <Badge tone="success" className="ml-2">
                    Featured
                  </Badge>
                )}
              </div>

              {/* Creator Info */}
              {pack.creator?.name && (
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full mr-2 flex items-center justify-center">
                    <Icon name="user" className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    by {pack.creator.name}
                  </span>
                  {pack.creator.verified && (
                    <Icon name="check-circle" className="w-4 h-4 text-blue-500 ml-1" />
                  )}
                </div>
              )}

              {/* Pack Details */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Icon name="clock" className="w-4 h-4 mr-1" />
                  {pack.duration} weeks
                </div>
                <Badge tone="neutral" className={getDifficultyColor(pack.difficulty)}>
                  {pack.difficulty}
                </Badge>
                {pack.rating > 0 && (
                  <div className="flex items-center">
                    <div className="flex mr-1">
                      {renderStars(pack.rating)}
                    </div>
                    <span>({pack.reviewCount})</span>
                  </div>
                )}
              </div>

              {/* Equipment */}
              {pack.equipment.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Equipment:</p>
                  <div className="flex flex-wrap gap-1">
                    {pack.equipment.slice(0, 3).map((item, index) => (
                      <Badge key={index} tone="neutral" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                    {pack.equipment.length > 3 && (
                      <Badge tone="neutral" className="text-xs">
                        +{pack.equipment.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Highlights */}
              {pack.preview?.highlights && pack.preview.highlights.length > 0 && (
                <div className="mb-4">
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {pack.preview.highlights.slice(0, 2).map((highlight, index) => (
                      <li key={index} className="flex items-start">
                        <Icon name="check" className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Price and Action */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(pack.price, pack.currency)}
                  </span>
                  {pack.purchaseCount > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {pack.purchaseCount} purchases
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={() => window.open(`/creator-packs/${pack.id}`, '_blank')}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && packs.length === 0 && (
        <div className="text-center py-12">
          <Icon name="search" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No creator packs found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </Container>
  );
}
