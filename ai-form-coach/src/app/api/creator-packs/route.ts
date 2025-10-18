import { NextResponse } from 'next/server';
import { creatorPacksService } from '@/lib/creator-packs/service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query = searchParams.get('query') || undefined;
    const difficulty = searchParams.get('difficulty')?.split(',') as ('beginner' | 'intermediate' | 'advanced')[] | undefined;
    const durationMin = searchParams.get('durationMin') ? parseInt(searchParams.get('durationMin')!) : undefined;
    const durationMax = searchParams.get('durationMax') ? parseInt(searchParams.get('durationMax')!) : undefined;
    const priceMin = searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined;
    const priceMax = searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined;
    const equipment = searchParams.get('equipment')?.split(',');
    const targetGoals = searchParams.get('targetGoals')?.split(',');
    const tags = searchParams.get('tags')?.split(',');
    const ratingMin = searchParams.get('ratingMin') ? parseFloat(searchParams.get('ratingMin')!) : undefined;
    const isFeatured = searchParams.get('isFeatured') === 'true' ? true : undefined;
    const sortBy = (searchParams.get('sortBy') as 'newest' | 'oldest' | 'price_low' | 'price_high' | 'rating' | 'popularity') || 'newest';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12;

    const filters = {
      difficulty,
      duration: durationMin || durationMax ? { min: durationMin, max: durationMax } : undefined,
      price: priceMin || priceMax ? { min: priceMin, max: priceMax } : undefined,
      equipment,
      targetGoals,
      tags,
      rating: ratingMin ? { min: ratingMin } : undefined,
      isFeatured
    };

    const searchParams_obj = {
      query,
      filters,
      sortBy,
      page,
      limit
    };

    const response = await creatorPacksService.getPacks(searchParams_obj);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Creator packs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator packs' },
      { status: 500 }
    );
  }
}