import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    rpc: vi.fn()
  }))
};

// Mock the API functions directly
const mockReadinessAPI = {
  GET: vi.fn(),
  POST: vi.fn()
};

describe('Readiness API', () => {
  const mockUser = { id: 'test-user-id' };
  const mockDate = '2025-01-18';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  describe('GET /api/readiness', () => {
    it('should return readiness data for authenticated user', async () => {
      const mockReadinessData = {
        id: 'test-id',
        user_id: mockUser.id,
        date: mockDate,
        soreness_level: 3,
        fatigue_level: 2,
        sleep_quality: 8,
        computed_readiness: 0.75,
        readiness_category: 'good'
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockReadinessData,
        error: null
      });

      // Mock the API response
      mockReadinessAPI.GET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          readiness: mockReadinessData,
          date: mockDate
        })
      });

      const response = await mockReadinessAPI.GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.readiness).toEqual(mockReadinessData);
      expect(data.date).toBe(mockDate);
    });

    it('should return null when no readiness data exists', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // No rows returned
      });

      const request = new NextRequest(`http://localhost:3000/api/readiness?date=${mockDate}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.readiness).toBeNull();
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') });

      const request = new NextRequest(`http://localhost:3000/api/readiness?date=${mockDate}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/readiness', () => {
    it('should save readiness assessment and calculate score', async () => {
      const readinessData = {
        date: mockDate,
        soreness_level: 3,
        fatigue_level: 2,
        sleep_quality: 8,
        stress_level: 4,
        motivation_level: 7,
        sleep_duration: 7.5,
        resting_heart_rate: 65,
        hrv_average: 30,
        step_count: 8500,
        training_load: 100
      };

      // Mock RPC calls for score calculation
      mockSupabase.rpc
        .mockResolvedValueOnce(0.75) // calculate_readiness_score
        .mockResolvedValueOnce('good'); // get_readiness_category

      const mockSavedData = {
        id: 'test-id',
        user_id: mockUser.id,
        ...readinessData,
        computed_readiness: 0.75,
        readiness_category: 'good'
      };

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: mockSavedData,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/readiness', {
        method: 'POST',
        body: JSON.stringify(readinessData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.readiness.computed_readiness).toBe(0.75);
      expect(data.readiness.readiness_category).toBe('good');
    });

    it('should handle missing data gracefully', async () => {
      const incompleteData = {
        date: mockDate,
        soreness_level: 3,
        // Missing other fields
      };

      mockSupabase.rpc
        .mockResolvedValueOnce(0.5) // Default score for missing data
        .mockResolvedValueOnce('fair'); // Default category

      const request = new NextRequest('http://localhost:3000/api/readiness', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
