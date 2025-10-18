import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const results = {
      unsplash: {
        configured: !!process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
        key: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ? '***configured***' : 'not configured'
      },
      pixabay: {
        configured: !!process.env.NEXT_PUBLIC_PIXABAY_API_KEY,
        key: process.env.NEXT_PUBLIC_PIXABAY_API_KEY ? '***configured***' : 'not configured'
      },
      gemini: {
        configured: !!process.env.GEMINI_API_KEY,
        key: process.env.GEMINI_API_KEY ? '***configured***' : 'not configured'
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Image API configuration status',
      results
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Failed to test APIs' },
      { status: 500 }
    );
  }
}
