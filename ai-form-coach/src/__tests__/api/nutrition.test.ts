import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/nutrition/meals/route';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn()
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn()
    }))
  }))
};

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => Promise.resolve(mockSupabase)
}));

describe('Nutrition Meals API', () => {
  const mockUser = { id: 'test-user-id' };
  const mockDate = '2025-01-18';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  describe('GET /api/nutrition/meals', () => {
    it('should return meals for a specific date', async () => {
      const mockMeals = [
        {
          id: 'meal-1',
          user_id: mockUser.id,
          date: mockDate,
          meal_type: 'breakfast',
          name: 'Morning Meal',
          meal_items: [
            {
              id: 'item-1',
              food_id: 'food-1',
              grams: 100,
              calories: 250,
              protein: 15,
              carbs: 30,
              fat: 8
            }
          ]
        }
      ];

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockMeals,
        error: null
      });

      const request = new NextRequest(`http://localhost:3000/api/nutrition/meals?date=${mockDate}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meals).toEqual(mockMeals);
    });

    it('should return empty array when no meals exist', async () => {
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: [],
        error: null
      });

      const request = new NextRequest(`http://localhost:3000/api/nutrition/meals?date=${mockDate}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meals).toEqual([]);
    });
  });

  describe('POST /api/nutrition/meals', () => {
    it('should create a new meal', async () => {
      const mealData = {
        date: mockDate,
        meal_type: 'lunch',
        name: 'Healthy Lunch',
        items: [
          {
            food_id: 'food-1',
            grams: 150
          }
        ]
      };

      const mockCreatedMeal = {
        id: 'new-meal-id',
        user_id: mockUser.id,
        ...mealData,
        created_at: '2025-01-18T00:00:00Z'
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockCreatedMeal,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(mealData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.meal.meal_type).toBe(mealData.meal_type);
    });

    it('should handle meal creation with items', async () => {
      const mealData = {
        date: mockDate,
        meal_type: 'dinner',
        name: 'Dinner',
        items: [
          {
            food_id: 'food-1',
            grams: 200
          },
          {
            food_id: 'food-2',
            grams: 100
          }
        ]
      };

      // Mock meal creation
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'new-meal-id', ...mealData },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(mealData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('PUT /api/nutrition/meals', () => {
    it('should update an existing meal', async () => {
      const mealId = 'meal-1';
      const updateData = {
        name: 'Updated Meal Name',
        items: [
          {
            food_id: 'food-1',
            grams: 250
          }
        ]
      };

      const mockUpdatedMeal = {
        id: mealId,
        user_id: mockUser.id,
        ...updateData,
        updated_at: '2025-01-18T00:00:00Z'
      };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedMeal,
        error: null
      });

      const request = new NextRequest(`http://localhost:3000/api/nutrition/meals?id=${mealId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.meal.name).toBe(updateData.name);
    });
  });

  describe('DELETE /api/nutrition/meals', () => {
    it('should delete a meal', async () => {
      const mealId = 'meal-1';

      mockSupabase.from().delete().eq.mockResolvedValue({
        data: null,
        error: null
      });

      const request = new NextRequest(`http://localhost:3000/api/nutrition/meals?id=${mealId}`, {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
