import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get user's nutrition goals
    const { data: goals } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();

    // Get meals for the day
    const { data: meals } = await supabase
      .from('meals')
      .select(`
        *,
        foods (
          name,
          protein_per_100g,
          calories_per_100g,
          category
        )
      `)
      .eq('user_id', user.id)
      .eq('date', date)
      .order('meal_type', { ascending: true });

    // Get all foods consumed in the last 30 days for top foods
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentMeals } = await supabase
      .from('meals')
      .select(`
        *,
        foods (
          name,
          protein_per_100g,
          calories_per_100g,
          category
        )
      `)
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    // Calculate protein distribution by meal
    const proteinDistribution = calculateProteinDistribution(meals || []);
    
    // Calculate top foods
    const topFoods = calculateTopFoods(recentMeals || []);
    
    // Generate meal swap suggestions
    const mealSwaps = generateMealSwapSuggestions(meals || [], goals, date);

    return NextResponse.json({
      proteinDistribution,
      topFoods,
      mealSwaps,
      goals: goals || null,
      date
    });

  } catch (error) {
    console.error('Nutrition insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateProteinDistribution(meals: Array<{
  meal_type: string;
  quantity: number;
  foods?: {
    name: string;
    protein_per_100g: number;
  } | null;
}>) {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const distribution = mealTypes.map(mealType => {
    const mealData = meals.filter(m => m.meal_type === mealType);
    const totalProtein = mealData.reduce((sum, meal) => {
      const proteinPerGram = meal.foods?.protein_per_100g || 0;
      return sum + (proteinPerGram * meal.quantity / 100);
    }, 0);
    
    return {
      mealType,
      protein: Math.round(totalProtein * 10) / 10,
      mealCount: mealData.length,
      foods: mealData.map(m => ({
        name: m.foods?.name || 'Unknown',
        protein: Math.round((m.foods?.protein_per_100g || 0) * m.quantity / 100 * 10) / 10
      }))
    };
  });

  const totalProtein = distribution.reduce((sum, meal) => sum + meal.protein, 0);
  
  return distribution.map(meal => ({
    ...meal,
    percentage: totalProtein > 0 ? Math.round((meal.protein / totalProtein) * 100) : 0
  }));
}

function calculateTopFoods(meals: Array<{
  date: string;
  quantity: number;
  foods?: {
    name: string;
    protein_per_100g: number;
    calories_per_100g: number;
    category: string;
  } | null;
}>) {
  const foodCounts = new Map();
  
  meals.forEach(meal => {
    const foodName = meal.foods?.name || 'Unknown';
    const existing = foodCounts.get(foodName) || {
      name: foodName,
      count: 0,
      totalProtein: 0,
      totalCalories: 0,
      category: meal.foods?.category || 'other',
      lastConsumed: meal.date
    };
    
    existing.count += 1;
    existing.totalProtein += (meal.foods?.protein_per_100g || 0) * meal.quantity / 100;
    existing.totalCalories += (meal.foods?.calories_per_100g || 0) * meal.quantity / 100;
    existing.lastConsumed = meal.date > existing.lastConsumed ? meal.date : existing.lastConsumed;
    
    foodCounts.set(foodName, existing);
  });

  return Array.from(foodCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(food => ({
      ...food,
      avgProtein: Math.round(food.totalProtein / food.count * 10) / 10,
      avgCalories: Math.round(food.totalCalories / food.count * 10) / 10
    }));
}

function generateMealSwapSuggestions(
  meals: Array<{
    meal_type: string;
    quantity: number;
    foods?: {
      name: string;
      protein_per_100g: number;
    } | null;
  }>, 
  goals: { protein_target?: number } | null, 
  date?: string
) {
  const suggestions = [];
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  
  // Check if we're looking at today's data
  const isToday = !date || date === new Date().toISOString().split('T')[0];
  
  // Check protein target by dinner time (6 PM) - only for today's data
  if (isToday && currentHour >= 18 && goals?.protein_target) {
    const totalProtein = meals.reduce((sum, meal) => {
      const proteinPerGram = meal.foods?.protein_per_100g || 0;
      return sum + (proteinPerGram * meal.quantity / 100);
    }, 0);
    
    const proteinRemaining = goals.protein_target - totalProtein;
    
    if (proteinRemaining > 10) {
      suggestions.push({
        type: 'protein_boost',
        priority: 'high',
        title: 'Protein Boost Needed! 🥩',
        message: `You're ${Math.round(proteinRemaining)}g short of your daily protein goal.`,
        suggestion: 'Add a high-protein side to your dinner or have a protein-rich snack.',
        foods: [
          { name: 'Greek Yogurt', protein: 20, reason: 'Quick protein boost' },
          { name: 'Hard-boiled Eggs', protein: 12, reason: 'Perfect evening snack' },
          { name: 'Cottage Cheese', protein: 15, reason: 'Light and filling' },
          { name: 'Protein Shake', protein: 25, reason: 'Fast and convenient' }
        ]
      });
    }
  }
  
  // Check for meal variety - only for today's data
  if (isToday) {
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    const missingMeals = mealTypes.filter(mealType => 
      !meals.some(meal => meal.meal_type === mealType)
    );
    
    if (missingMeals.length > 0) {
      suggestions.push({
        type: 'missing_meal',
        priority: 'medium',
        title: 'Missing Meals 📅',
        message: `You haven't logged ${missingMeals.join(' or ')} today.`,
        suggestion: 'Regular meals help maintain steady energy and meet your nutrition goals.',
        foods: []
      });
    }
  }
  
  // Check for low variety in top foods
  const recentFoods = meals.map(m => m.foods?.name).filter(Boolean);
  const uniqueFoods = new Set(recentFoods);
  
  if (uniqueFoods.size < 3 && meals.length > 2) {
    suggestions.push({
      type: 'variety',
      priority: 'low',
      title: 'Mix It Up! 🌈',
      message: 'You\'ve been eating similar foods lately.',
      suggestion: 'Try adding some variety to get a broader range of nutrients.',
      foods: [
        { name: 'Different Vegetables', protein: 0, reason: 'More vitamins & minerals' },
        { name: 'New Protein Source', protein: 0, reason: 'Complete amino acid profile' },
        { name: 'Whole Grains', protein: 0, reason: 'Fiber and B vitamins' }
      ]
    });
  }
  
  return suggestions;
}
