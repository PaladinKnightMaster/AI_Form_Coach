import { NextRequest, NextResponse } from 'next/server';
import { heroImageService } from '@/lib/images/heroImages';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'hero';
    const query = searchParams.get('query');
    const orientation = searchParams.get('orientation') as 'landscape' | 'portrait' | 'squarish' || 'landscape';

    const image = await heroImageService.getHeroImage(section, {
      query: query || undefined,
      orientation,
      width: 1200,
      height: 600
    });

    return NextResponse.json({
      success: true,
      image,
      section,
      query,
      orientation
    });
  } catch (error) {
    console.error('Error testing hero images:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: 'Using local images due to API error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, count = 3 } = body;

    const images = await heroImageService.getHeroImages(section, count);

    return NextResponse.json({
      success: true,
      images,
      section,
      count
    });
  } catch (error) {
    console.error('Error testing hero images batch:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
