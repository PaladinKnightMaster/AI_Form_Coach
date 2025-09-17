// Open Food Facts API integration for barcode lookup

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  product_name_en?: string;
  brands?: string;
  categories?: string;
  image_url?: string;
  image_front_url?: string;
  image_nutrition_url?: string;
  nutriments?: {
    energy_100g?: number;
    energy_kcal_100g?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fat_100g?: number;
    saturated_fat_100g?: number;
    fiber_100g?: number;
    sodium_100g?: number;
    salt_100g?: number;
  };
  serving_size?: string;
  quantity?: string;
}

export interface MappedFoodData {
  name: string;
  brand?: string;
  category?: string;
  image_url?: string;
  serving_size: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v0/product';

export async function lookupProductByBarcode(barcode: string): Promise<MappedFoodData | null> {
  try {
    console.log('Looking up barcode:', barcode);
    
    const response = await fetch(`${OPEN_FOOD_FACTS_API}/${barcode}.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 0 || !data.product) {
      console.log('Product not found in Open Food Facts');
      return null;
    }
    
    const product = data.product as OpenFoodFactsProduct;
    console.log('Found product:', product.product_name);
    
    return mapOpenFoodFactsToAppFormat(product);
    
  } catch (error) {
    console.error('Error looking up product:', error);
    throw new Error('Failed to lookup product information');
  }
}

function mapOpenFoodFactsToAppFormat(product: OpenFoodFactsProduct): MappedFoodData {
  const nutriments = product.nutriments || {};
  
  // Determine serving size (default to 100g if not specified)
  let servingSize = 100;
  if (product.serving_size) {
    const servingMatch = product.serving_size.match(/(\d+)/);
    if (servingMatch) {
      servingSize = parseInt(servingMatch[1]);
    }
  }
  
  // Map nutrients with fallbacks
  const calories = nutriments.energy_kcal_100g || 
                  (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0); // Convert kJ to kcal
  
  const protein = nutriments.proteins_100g || 0;
  const carbs = nutriments.carbohydrates_100g || 0;
  const fat = nutriments.fat_100g || 0;
  const fiber = nutriments.fiber_100g;
  const sugar = nutriments.sugars_100g;
  const sodium = nutriments.sodium_100g || (nutriments.salt_100g ? nutriments.salt_100g * 1000 : undefined);
  
  // Calculate per-serving values
  const servingMultiplier = servingSize / 100;
  
  return {
    name: product.product_name_en || product.product_name || 'Unknown Product',
    brand: product.brands,
    category: product.categories,
    image_url: product.image_front_url || product.image_url,
    serving_size: servingSize,
    calories: Math.round(calories * servingMultiplier),
    protein: Math.round(protein * servingMultiplier * 10) / 10,
    carbs: Math.round(carbs * servingMultiplier * 10) / 10,
    fat: Math.round(fat * servingMultiplier * 10) / 10,
    fiber: fiber ? Math.round(fiber * servingMultiplier * 10) / 10 : undefined,
    sugar: sugar ? Math.round(sugar * servingMultiplier * 10) / 10 : undefined,
    sodium: sodium ? Math.round(sodium * servingMultiplier) : undefined,
  };
}

// Cache for recently looked up foods
const foodCache = new Map<string, MappedFoodData>();
const CACHE_SIZE_LIMIT = 50;

export function getCachedFood(barcode: string): MappedFoodData | null {
  return foodCache.get(barcode) || null;
}

export function cacheFood(barcode: string, foodData: MappedFoodData): void {
  // Remove oldest entries if cache is full
  if (foodCache.size >= CACHE_SIZE_LIMIT) {
    const firstKey = foodCache.keys().next().value;
    foodCache.delete(firstKey);
  }
  
  foodCache.set(barcode, foodData);
}

export function clearFoodCache(): void {
  foodCache.clear();
}

// Get all cached foods for offline access
export function getAllCachedFoods(): Map<string, MappedFoodData> {
  return new Map(foodCache);
}
