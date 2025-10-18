/**
 * Food Image Service
 * Fetches food images from various sources including stock photos and AI generation
 */

interface FoodImageResult {
  imageUrl: string;
  source: 'unsplash' | 'pixabay' | 'gemini' | 'placeholder' | 'openfoodfacts';
  alt: string;
}

/**
 * Generate intelligent search terms for food images
 * Creates multiple search variations to improve image matching
 */
function generateSearchTerms(foodName: string, brand?: string): string[] {
  const terms: string[] = [];
  
  // Clean and normalize inputs
  const cleanFoodName = foodName.trim().toLowerCase();
  const cleanBrand = brand?.trim().toLowerCase();
  
  // Add base food name
  terms.push(cleanFoodName);
  
  if (cleanBrand) {
    // Add brand variations
    terms.push(`${cleanBrand} ${cleanFoodName}`);
    terms.push(cleanBrand);
    
    // Handle common brand name variations and abbreviations
    const brandVariations = generateBrandVariations(cleanBrand);
    for (const variation of brandVariations) {
      terms.push(`${variation} ${cleanFoodName}`);
    }
  }
  
  // Add generic food category terms for better matching
  const foodCategoryTerms = generateFoodCategoryTerms(cleanFoodName);
  terms.push(...foodCategoryTerms);
  
  // Remove duplicates and return
  return [...new Set(terms)];
}

/**
 * Generate brand name variations for better search results
 */
function generateBrandVariations(brand: string): string[] {
  const variations: string[] = [];
  
  // Handle common brand name patterns
  const brandLower = brand.toLowerCase();
  
  // Split compound brand names (e.g., "Coca-Cola" -> ["coca", "cola"])
  const brandWords = brandLower.split(/[\s\-&]+/).filter(word => word.length > 2);
  
  // Add individual words
  variations.push(...brandWords);
  
  // Add common abbreviations and variations
  if (brandLower.includes('coca') && brandLower.includes('cola')) {
    variations.push('coke', 'coca cola');
  }
  
  if (brandLower.includes('pepsi')) {
    variations.push('pepsi cola');
  }
  
  // Add variations for common patterns
  if (brandWords.length > 1) {
    // Add first word only
    variations.push(brandWords[0]);
    // Add last word only  
    variations.push(brandWords[brandWords.length - 1]);
  }
  
  return variations;
}

/**
 * Generate food category terms for broader search matching
 */
function generateFoodCategoryTerms(foodName: string): string[] {
  const terms: string[] = [];
  
  // Add generic food terms
  terms.push(`${foodName} food`);
  terms.push(`${foodName} product`);
  
  // Add category-specific terms based on common food types
  const foodLower = foodName.toLowerCase();
  
  if (foodLower.includes('drink') || foodLower.includes('soda') || foodLower.includes('cola')) {
    terms.push('beverage', 'soft drink', 'soda');
  }
  
  if (foodLower.includes('snack') || foodLower.includes('chip') || foodLower.includes('cracker')) {
    terms.push('snack food', 'packaged snack');
  }
  
  if (foodLower.includes('cereal') || foodLower.includes('breakfast')) {
    terms.push('breakfast cereal', 'cereal box');
  }
  
  if (foodLower.includes('candy') || foodLower.includes('chocolate') || foodLower.includes('sweet')) {
    terms.push('confectionery', 'sweet treat');
  }
  
  return terms;
}

/**
 * Get food image from Unsplash API
 */
async function getUnsplashImage(foodName: string, brand?: string): Promise<FoodImageResult | null> {
  try {
    // Generate intelligent search terms
    const searchTerms = generateSearchTerms(foodName, brand);
    
    // Try each search term until we find results
    for (const term of searchTerms) {
      const query = encodeURIComponent(`${term} food product`);
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=3&orientation=landscape&client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`
      );
    
      if (!response.ok) {
        console.warn('Unsplash API response not ok:', response.status, response.statusText);
        continue; // Try next search term
      }
      
      const data = await response.json();
      console.log(`Unsplash search "${term}":`, { total: data.total, results: data.results?.length });
      
      if (data.results && data.results.length > 0) {
        // Use full size for better quality, fallback to regular
        const imageUrl = data.results[0].urls.full || data.results[0].urls.regular;
        return {
          imageUrl: imageUrl,
          source: 'unsplash',
          alt: `${brand ? brand + ' ' : ''}${foodName} food image from Unsplash`
        };
      }
    }
  } catch (error) {
    console.warn('Unsplash API error:', error);
  }
  return null;
}

/**
 * Get food image from Pixabay API
 */
async function getPixabayImage(foodName: string, brand?: string): Promise<FoodImageResult | null> {
  try {
    // Generate intelligent search terms
    const searchTerms = generateSearchTerms(foodName, brand);
    
    // Try each search term until we find results
    for (const term of searchTerms) {
      const query = encodeURIComponent(`${term} food product`);
      const response = await fetch(
        `https://pixabay.com/api/?key=${process.env.NEXT_PUBLIC_PIXABAY_API_KEY}&q=${query}&image_type=photo&category=food&per_page=3&safesearch=true&min_width=400&min_height=300`
      );
      
      if (!response.ok) {
        console.warn('Pixabay API response not ok:', response.status, response.statusText);
        continue; // Try next search term
      }
      
      const data = await response.json();
      console.log(`Pixabay search "${term}":`, { totalHits: data.totalHits, hits: data.hits?.length });
      
      if (data.hits && data.hits.length > 0) {
        // Use largeImageURL for better quality, fallback to webformatURL
        const imageUrl = data.hits[0].largeImageURL || data.hits[0].webformatURL;
        return {
          imageUrl: imageUrl,
          source: 'pixabay',
          alt: `${brand ? brand + ' ' : ''}${foodName} food image from Pixabay`
        };
      }
    }
  } catch (error) {
    console.warn('Pixabay API error:', error);
  }
  return null;
}

/**
 * Generate food image using Gemini API
 */
async function generateGeminiImage(foodName: string, brand?: string): Promise<FoodImageResult | null> {
  try {
    const prompt = `Generate a realistic, appetizing image of ${brand ? brand + ' ' : ''}${foodName}. The image should be a clean, professional food photography style with good lighting and composition.`;
    
    const response = await fetch('/api/ai/generate-food-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.imageUrl) {
      return {
        imageUrl: data.imageUrl,
        source: 'gemini',
        alt: `${brand ? brand + ' ' : ''}${foodName} food image`
      };
    }
  } catch (error) {
    console.warn('Gemini image generation error:', error);
  }
  return null;
}

/**
 * Get placeholder food image
 */
function getPlaceholderImage(foodName: string): FoodImageResult {
  // Use a more attractive food placeholder
  const placeholderUrl = `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center&auto=format&q=80`;
  
  return {
    imageUrl: placeholderUrl,
    source: 'placeholder',
    alt: `${foodName} food placeholder`
  };
}

/**
 * Main function to get food image from multiple sources
 */
export async function getFoodImage(foodName: string, brand?: string): Promise<FoodImageResult> {
  const searchTerm = `${brand ? brand + ' ' : ''}${foodName}`;
  console.log(`🖼️ Fetching image for: ${searchTerm}`);
  
  // Try Unsplash first (free, good quality)
  if (process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY) {
    console.log('🔍 Trying Unsplash...');
    const unsplashResult = await getUnsplashImage(foodName, brand);
    if (unsplashResult) {
      console.log('✅ Got image from Unsplash:', unsplashResult.imageUrl);
      return unsplashResult;
    }
    console.log('❌ Unsplash failed');
  } else {
    console.log('⚠️ Unsplash API key not configured');
  }
  
  // Try Pixabay as fallback
  if (process.env.NEXT_PUBLIC_PIXABAY_API_KEY) {
    console.log('🔍 Trying Pixabay...');
    const pixabayResult = await getPixabayImage(foodName, brand);
    if (pixabayResult) {
      console.log('✅ Got image from Pixabay:', pixabayResult.imageUrl);
      return pixabayResult;
    }
    console.log('❌ Pixabay failed');
  } else {
    console.log('⚠️ Pixabay API key not configured');
  }
  
  // Try Gemini AI generation
  if (process.env.GEMINI_API_KEY) {
    console.log('🔍 Trying Gemini AI...');
    const geminiResult = await generateGeminiImage(foodName, brand);
    if (geminiResult) {
      console.log('✅ Generated image with Gemini:', geminiResult.imageUrl);
      return geminiResult;
    }
    console.log('❌ Gemini AI failed');
  } else {
    console.log('⚠️ Gemini API key not configured');
  }
  
  // Fallback to placeholder
  console.log('⚠️ Using placeholder image');
  return getPlaceholderImage(foodName);
}

/**
 * Get cached food image or fetch new one
 */
const imageCache = new Map<string, FoodImageResult>();

export async function getCachedFoodImage(foodName: string, brand?: string): Promise<FoodImageResult> {
  const cacheKey = `${brand || ''}-${foodName}`.toLowerCase();
  
  if (imageCache.has(cacheKey)) {
    console.log('📸 Using cached image');
    return imageCache.get(cacheKey)!;
  }
  
  const result = await getFoodImage(foodName, brand);
  imageCache.set(cacheKey, result);
  
  return result;
}
