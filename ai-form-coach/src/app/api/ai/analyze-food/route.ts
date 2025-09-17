import { NextRequest, NextResponse } from 'next/server';
import { analyzeFoodImage, getFoodSuggestions } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const action = formData.get('action') as string;

    if (!imageFile && action !== 'suggestions') {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (action === 'suggestions') {
      const query = formData.get('query') as string;
      if (!query) {
        return NextResponse.json({ error: 'No query provided' }, { status: 400 });
      }

      const suggestions = await getFoodSuggestions(query);
      return NextResponse.json({ suggestions });
    }

    // Analyze food image
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an image.' }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Please upload an image smaller than 10MB.' }, { status: 400 });
    }

    console.log('Starting food analysis for file:', { 
      name: imageFile.name, 
      size: imageFile.size, 
      type: imageFile.type 
    });

    const analysisResult = await analyzeFoodImage(imageFile);
    
    return NextResponse.json({
      success: true,
      result: analysisResult
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to analyze food image. Please try again.' 
    }, { status: 500 });
  }
}
