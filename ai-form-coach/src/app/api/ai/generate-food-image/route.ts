import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // For now, we'll use a placeholder since Gemini doesn't have image generation
    // In the future, we could integrate with DALL-E, Midjourney, or other image generation APIs
    console.log('🎨 Image generation requested for:', prompt);
    
    // Return a placeholder that looks like a food image
    const placeholderImageUrl = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center&auto=format&q=80`;
    
    return NextResponse.json({
      success: true,
      imageUrl: placeholderImageUrl,
      source: 'placeholder',
      prompt: prompt
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
