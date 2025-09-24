import { GoogleGenerativeAI } from '@google/generative-ai';
import { Buffer } from 'buffer';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface FoodAnalysisResult {
  name: string;
  brand?: string;
  category: string;
  estimatedWeight: number; // in grams
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  confidence: number; // 0-100
  description: string;
}

export async function analyzeFoodImage(imageFile: File): Promise<FoodAnalysisResult> {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert image to base64
    console.log('Converting image to base64...', { fileName: imageFile.name, size: imageFile.size, type: imageFile.type });
    const imageBase64 = await fileToBase64(imageFile);
    console.log('Base64 conversion successful, length:', imageBase64.length);

    const prompt = `
You are a nutrition expert AI. Analyze this food image and provide detailed nutritional information.

Please respond with a JSON object containing:
{
  "name": "Food name (be specific, e.g., 'Grilled Chicken Breast' not just 'Chicken')",
  "brand": "Brand name if visible, otherwise null",
  "category": "Food category (fruits, vegetables, protein, dairy, grains, snacks, beverages, etc.)",
  "estimatedWeight": "Estimated weight in grams based on visual size",
  "nutritionalInfo": {
    "calories": "Calories per 100g",
    "protein": "Protein in grams per 100g",
    "carbs": "Carbohydrates in grams per 100g", 
    "fat": "Fat in grams per 100g",
    "fiber": "Fiber in grams per 100g (if applicable)",
    "sugar": "Sugar in grams per 100g (if applicable)",
    "sodium": "Sodium in mg per 100g (if applicable)"
  },
  "confidence": "Confidence level 0-100 based on image clarity and food identification",
  "description": "Brief description of what you see in the image"
}

Guidelines:
- Be as specific as possible with food names
- Estimate weight based on common serving sizes and visual cues
- Provide nutritional values per 100g (standard nutrition label format)
- If you can't identify the food clearly, set confidence low
- If multiple foods are visible, focus on the most prominent one
- Consider cooking methods (grilled, fried, raw, etc.) in your analysis
- Be conservative with estimates if uncertain

IMPORTANT: Respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or additional text. Just the raw JSON object.
`;

    console.log('Calling Gemini API...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageFile.type,
        },
      },
    ]);

    console.log('Gemini API response received');
    const response = await result.response;
    const text = response.text();
    console.log('Gemini response text:', text.substring(0, 200) + '...');

    // Parse JSON response
    let analysisResult: FoodAnalysisResult;
    try {
      // Clean the response text - remove markdown formatting if present
      let cleanText = text.trim();
      
      // Remove markdown code blocks
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object in the response
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      console.log('Cleaned response text:', cleanText.substring(0, 200) + '...');
      analysisResult = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response text:', text);
      throw new Error('Failed to parse AI response as JSON: ' + parseError);
    }

    // Validate and clean the response
    return validateAndCleanAnalysis(analysisResult);

  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to analyze food image. Please try again.');
  }
}

function validateAndCleanAnalysis(result: {
  name?: string;
  brand?: string;
  category?: string;
  estimatedWeight?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  confidence?: number;
}): FoodAnalysisResult {
  return {
    name: result.name || 'Unknown Food',
    brand: result.brand || undefined,
    category: result.category || 'other',
    estimatedWeight: Math.max(1, Math.min(1000, result.estimatedWeight || 100)),
    nutritionalInfo: {
      calories: Math.max(0, result.nutritionalInfo?.calories || 0),
      protein: Math.max(0, result.nutritionalInfo?.protein || 0),
      carbs: Math.max(0, result.nutritionalInfo?.carbs || 0),
      fat: Math.max(0, result.nutritionalInfo?.fat || 0),
      fiber: result.nutritionalInfo?.fiber ? Math.max(0, result.nutritionalInfo.fiber) : undefined,
      sugar: result.nutritionalInfo?.sugar ? Math.max(0, result.nutritionalInfo.sugar) : undefined,
      sodium: result.nutritionalInfo?.sodium ? Math.max(0, result.nutritionalInfo.sodium) : undefined,
    },
    confidence: Math.max(0, Math.min(100, result.confidence || 0)),
    description: result.description || 'Food analysis completed',
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Convert File to ArrayBuffer first
      file.arrayBuffer().then((buffer) => {
        try {
          // Convert ArrayBuffer to base64 using Node.js Buffer
          const base64 = Buffer.from(buffer).toString('base64');
          resolve(base64);
        } catch (error) {
          reject(new Error('Error converting to base64: ' + error));
        }
      }).catch((error) => {
        reject(new Error('Error reading file buffer: ' + error));
      });
    } catch (error) {
      reject(new Error('Error processing file: ' + error));
    }
  });
}

export async function getFoodSuggestions(query: string): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a nutrition expert. Given a food search query, provide 10 relevant food suggestions.

Query: "${query}"

Respond with a JSON array of food names, ordered by relevance:
["Food 1", "Food 2", "Food 3", ...]

Guidelines:
- Include common variations and cooking methods
- Be specific (e.g., "Grilled Chicken Breast" not just "Chicken")
- Include both generic and brand names when relevant
- Order by most common/relevant first
- Keep names concise but descriptive

Respond ONLY with valid JSON array, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const suggestions = JSON.parse(text);
      return Array.isArray(suggestions) ? suggestions.slice(0, 10) : [];
    } catch (parseError) {
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      return [];
    }
  } catch (error) {
    console.error('Gemini suggestions error:', error);
    return [];
  }
}
