// Creator Packs Service

import { getSupabaseClient } from '@/lib/supabase/client';
import type { 
  CreatorPack, 
  PackPurchase, 
  PackReview, 
  PackUploadForm, 
  PackValidationResult,
  PackValidationError,
  PackValidationWarning,
  PackSearchParams,
  PacksListResponse,
  PackDetailsResponse,
  PackUploadResponse,
  PackPreview,
  PackContent,
  PackCreator
} from './types';

export class CreatorPacksService {
  private supabase = getSupabaseClient();

  // Get all creator packs with filtering and pagination
  async getPacks(params: PackSearchParams = {}): Promise<PacksListResponse> {
    try {
      const {
        query,
        filters = {},
        sortBy = 'newest',
        page = 1,
        limit = 12
      } = params;

      let queryBuilder = this.supabase
        .from('coach_packs')
        .select('*')
        .eq('is_active', true);

      // Apply text search
      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,short_description.ilike.%${query}%`);
      }

      // Apply filters
      if (filters.difficulty && filters.difficulty.length > 0) {
        queryBuilder = queryBuilder.in('difficulty_level', filters.difficulty);
      }

      if (filters.duration) {
        if (filters.duration.min) {
          queryBuilder = queryBuilder.gte('duration_weeks', filters.duration.min);
        }
        if (filters.duration.max) {
          queryBuilder = queryBuilder.lte('duration_weeks', filters.duration.max);
        }
      }

      if (filters.price) {
        if (filters.price.min) {
          queryBuilder = queryBuilder.gte('price', filters.price.min * 100); // Convert to cents
        }
        if (filters.price.max) {
          queryBuilder = queryBuilder.lte('price', filters.price.max * 100);
        }
      }

      if (filters.equipment && filters.equipment.length > 0) {
        queryBuilder = queryBuilder.overlaps('equipment_required', filters.equipment);
      }

      if (filters.targetGoals && filters.targetGoals.length > 0) {
        queryBuilder = queryBuilder.overlaps('target_goals', filters.targetGoals);
      }

      if (filters.tags && filters.tags.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', filters.tags);
      }

      if (filters.rating && filters.rating.min) {
        queryBuilder = queryBuilder.gte('rating', filters.rating.min);
      }

      if (filters.isFeatured !== undefined) {
        queryBuilder = queryBuilder.eq('is_featured', filters.isFeatured);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
          break;
        case 'oldest':
          queryBuilder = queryBuilder.order('created_at', { ascending: true });
          break;
        case 'price_low':
          queryBuilder = queryBuilder.order('price', { ascending: true });
          break;
        case 'price_high':
          queryBuilder = queryBuilder.order('price', { ascending: false });
          break;
        case 'rating':
          queryBuilder = queryBuilder.order('rating', { ascending: false });
          break;
        case 'popularity':
          queryBuilder = queryBuilder.order('purchase_count', { ascending: false });
          break;
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data: packs, error, count } = await queryBuilder;

      if (error) {
        console.error('Error fetching creator packs:', error);
        throw new Error('Failed to fetch creator packs');
      }

      return {
        packs: (packs || []).map(this.transformPackFromDB),
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error in getPacks:', error);
      throw error;
    }
  }

  // Get pack details with purchase status
  async getPackDetails(packId: string, userId?: string): Promise<PackDetailsResponse> {
    try {
      // Get pack details with purchase status
      const { data, error } = await this.supabase
        .rpc('get_pack_with_purchase_status', {
          pack_uuid: packId,
          user_uuid: userId || null
        });

      if (error || !data || data.length === 0) {
        throw new Error('Pack not found');
      }

      const result = data[0];
      const pack = this.transformPackFromDB(result.pack_data);
      const isPurchased = result.is_purchased || false;
      const userReview = result.user_review || null;

      // Get related packs (same difficulty level, excluding current pack)
      const { data: relatedPacks } = await this.supabase
        .from('coach_packs')
        .select('*')
        .eq('is_active', true)
        .eq('difficulty_level', pack.difficulty)
        .neq('id', packId)
        .limit(4);

      return {
        pack,
        isPurchased,
        userReview,
        relatedPacks: (relatedPacks || []).map(this.transformPackFromDB)
      };
    } catch (error) {
      console.error('Error getting pack details:', error);
      throw error;
    }
  }

  // Check if user has purchased a pack
  async hasUserPurchasedPack(packId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('user_has_purchased_pack', {
          user_uuid: userId,
          pack_uuid: packId
        });

      if (error) {
        console.error('Error checking pack purchase:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in hasUserPurchasedPack:', error);
      return false;
    }
  }

  // Get user's purchased packs
  async getUserPurchasedPacks(userId: string): Promise<CreatorPack[]> {
    try {
      const { data, error } = await this.supabase
        .from('coach_pack_purchases')
        .select(`
          coach_pack_id,
          purchased_at,
          coach_packs (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('purchased_at', { ascending: false });

      if (error) {
        console.error('Error fetching user purchases:', error);
        throw new Error('Failed to fetch purchased packs');
      }

      return (data || [])
        .map(item => this.transformPackFromDB(item.coach_packs as unknown as Record<string, unknown>))
        .filter(Boolean);
    } catch (error) {
      console.error('Error in getUserPurchasedPacks:', error);
      throw error;
    }
  }

  // Purchase a pack (create purchase record)
  async purchasePack(packId: string, userId: string, stripePaymentIntentId?: string): Promise<PackPurchase> {
    try {
      // Get pack details
      const { data: pack, error: packError } = await this.supabase
        .from('coach_packs')
        .select('*')
        .eq('id', packId)
        .single();

      if (packError || !pack) {
        throw new Error('Pack not found');
      }

      // Create purchase record
      const { data: purchase, error: purchaseError } = await this.supabase
        .from('coach_pack_purchases')
        .insert({
          user_id: userId,
          coach_pack_id: packId,
          amount: pack.price,
          currency: pack.currency,
          stripe_payment_intent_id: stripePaymentIntentId,
          status: 'completed'
        })
        .select()
        .single();

      if (purchaseError) {
        console.error('Error creating purchase record:', purchaseError);
        throw new Error('Failed to record purchase');
      }

      return {
        id: purchase.id,
        userId: purchase.user_id,
        packId: purchase.coach_pack_id,
        pack: this.transformPackFromDB(pack),
        purchaseDate: purchase.purchased_at,
        price: purchase.amount,
        currency: purchase.currency,
        stripePaymentIntentId: purchase.stripe_payment_intent_id,
        status: purchase.status as 'completed' | 'pending' | 'failed' | 'refunded'
      };
    } catch (error) {
      console.error('Error in purchasePack:', error);
      throw error;
    }
  }

  // Add a review for a pack
  async addPackReview(packId: string, userId: string, review: Omit<PackReview, 'id' | 'userId' | 'packId' | 'createdAt' | 'updatedAt' | 'user'>): Promise<PackReview> {
    try {
      const { data, error } = await this.supabase
        .from('pack_reviews')
        .insert({
          user_id: userId,
          pack_id: packId,
          rating: review.rating,
          title: review.title,
          content: review.content,
          pros: review.pros,
          cons: review.cons,
          would_recommend: review.wouldRecommend
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding pack review:', error);
        throw new Error('Failed to add review');
      }

      // Get user info for the review
      const { data: user } = await this.supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .single();

      return {
        id: data.id,
        userId: data.user_id,
        packId: data.pack_id,
        rating: data.rating,
        title: data.title,
        content: data.content,
        pros: data.pros,
        cons: data.cons,
        wouldRecommend: data.would_recommend,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        user: {
          name: user?.display_name || 'Anonymous',
          avatarUrl: user?.avatar_url
        }
      };
    } catch (error) {
      console.error('Error in addPackReview:', error);
      throw error;
    }
  }

  // Validate pack upload form
  validatePackUpload(form: PackUploadForm): PackValidationResult {
    const errors: PackValidationError[] = [];
    const warnings: PackValidationWarning[] = [];

    // Required field validation
    if (!form.title || form.title.trim().length < 3) {
      errors.push({
        field: 'title',
        message: 'Title must be at least 3 characters long',
        severity: 'error'
      });
    }

    if (!form.description || form.description.trim().length < 10) {
      errors.push({
        field: 'description',
        message: 'Description must be at least 10 characters long',
        severity: 'error'
      });
    }

    if (!form.shortDescription || form.shortDescription.trim().length < 5) {
      errors.push({
        field: 'shortDescription',
        message: 'Short description must be at least 5 characters long',
        severity: 'error'
      });
    }

    if (form.duration < 1 || form.duration > 52) {
      errors.push({
        field: 'duration',
        message: 'Duration must be between 1 and 52 weeks',
        severity: 'error'
      });
    }

    if (form.price < 100 || form.price > 100000) { // $1 to $1000
      errors.push({
        field: 'price',
        message: 'Price must be between $1.00 and $1000.00',
        severity: 'error'
      });
    }

    // Content validation
    if (!form.content.weeks || form.content.weeks.length === 0) {
      errors.push({
        field: 'content.weeks',
        message: 'At least one week of content is required',
        severity: 'error'
      });
    }

    if (form.content.weeks && form.content.weeks.length !== form.duration) {
      warnings.push({
        field: 'content.weeks',
        message: `Number of weeks in content (${form.content.weeks.length}) doesn't match duration (${form.duration})`,
        suggestion: 'Update content to match the specified duration'
      });
    }

    // Preview validation
    if (!form.preview.sampleWorkouts || form.preview.sampleWorkouts.length === 0) {
      errors.push({
        field: 'preview.sampleWorkouts',
        message: 'At least one sample workout is required for preview',
        severity: 'error'
      });
    }

    if (!form.preview.highlights || form.preview.highlights.length === 0) {
      warnings.push({
        field: 'preview.highlights',
        message: 'No highlights provided',
        suggestion: 'Add key highlights to help users understand the pack value'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Upload a new pack (dev-only for now)
  async uploadPack(form: PackUploadForm, creatorId: string): Promise<PackUploadResponse> {
    try {
      // Validate the form
      const validation = this.validatePackUpload(form);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Transform form data to database format
      const packData = {
        title: form.title,
        description: form.description,
        short_description: form.shortDescription,
        duration_weeks: form.duration,
        difficulty_level: form.difficulty,
        price: form.price,
        currency: form.currency,
        program_data: form.content,
        preview: form.preview,
        creator: form.creator,
        tags: form.tags,
        equipment_required: form.equipment,
        target_goals: form.targetGoals,
        is_active: false, // Will be activated after review
        is_featured: false,
        purchase_count: 0,
        rating: 0,
        review_count: 0
      };

      // Create upload record
      const { data, error } = await this.supabase
        .from('pack_uploads')
        .insert({
          creator_id: creatorId,
          pack_data: packData,
          validation_result: validation,
          status: 'pending_review'
        })
        .select()
        .single();

      if (error) {
        console.error('Error uploading pack:', error);
        throw new Error('Failed to upload pack');
      }

      return {
        success: true,
        packId: data.id,
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('Error in uploadPack:', error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          severity: 'error'
        }]
      };
    }
  }

  // Transform database record to CreatorPack type
  private transformPackFromDB(dbPack: Record<string, unknown>): CreatorPack {
    return {
      id: dbPack.id as string,
      title: (dbPack.title || dbPack.name) as string,
      description: dbPack.description as string,
      shortDescription: (dbPack.short_description || (dbPack.description as string)?.substring(0, 100) + '...') as string,
      duration: dbPack.duration_weeks as number,
      difficulty: dbPack.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
      preview: (dbPack.preview || {}) as unknown as PackPreview,
      price: dbPack.price as number,
      currency: dbPack.currency as string,
      content: (dbPack.program_data || {}) as unknown as PackContent,
      creator: (dbPack.creator || {}) as unknown as PackCreator,
      tags: (dbPack.tags || []) as string[],
      equipment: (dbPack.equipment_required || []) as string[],
      targetGoals: (dbPack.target_goals || []) as string[],
      isActive: dbPack.is_active as boolean,
      isFeatured: (dbPack.is_featured || false) as boolean,
      purchaseCount: (dbPack.purchase_count || 0) as number,
      rating: (dbPack.rating || 0) as number,
      reviewCount: (dbPack.review_count || 0) as number,
      createdAt: dbPack.created_at as string,
      updatedAt: dbPack.updated_at as string
    };
  }
}

export const creatorPacksService = new CreatorPacksService();
