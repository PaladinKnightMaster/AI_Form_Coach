import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not configured',
        hasApiKey: false 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Simple test prompt
    const result = await model.generateContent("Say 'Hello, Gemini API is working!' in JSON format: {\"message\": \"your response here\"}");
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      hasApiKey: true,
      response: text,
      message: 'Gemini API is working correctly'
    });

  } catch (error) {
    console.error('Gemini test error:', error);
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      message: 'Gemini API test failed'
    }, { status: 500 });
  }
}
