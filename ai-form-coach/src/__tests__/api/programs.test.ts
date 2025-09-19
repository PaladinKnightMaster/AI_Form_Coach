import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/programs/route';

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
    }))
  }))
};

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => Promise.resolve(mockSupabase)
}));

describe('Programs API', () => {
  const mockUser = { id: 'test-user-id' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  describe('GET /api/programs', () => {
    it('should return template programs', async () => {
      const mockPrograms = [
        {
          id: 'program-1',
          name: 'Beginner Strength',
          description: '4-week beginner program',
          duration_weeks: 4,
          difficulty_level: 'beginner',
          is_template: true,
          program_weeks: []
        }
      ];

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockPrograms,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/programs?is_template=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.programs).toEqual(mockPrograms);
    });

    it('should return user-created programs', async () => {
      const mockPrograms = [
        {
          id: 'program-2',
          name: 'My Custom Program',
          description: 'Custom workout program',
          duration_weeks: 6,
          difficulty_level: 'intermediate',
          is_template: false,
          created_by: mockUser.id,
          program_weeks: []
        }
      ];

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockPrograms,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/programs?is_template=false');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.programs).toEqual(mockPrograms);
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') });

      const request = new NextRequest('http://localhost:3000/api/programs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/programs', () => {
    it('should create a new program', async () => {
      const programData = {
        name: 'Test Program',
        description: 'Test description',
        duration_weeks: 4,
        difficulty_level: 'beginner',
        equipment_required: ['bodyweight'],
        target_goals: ['strength'],
        is_template: true
      };

      const mockCreatedProgram = {
        id: 'new-program-id',
        ...programData,
        created_by: mockUser.id,
        created_at: '2025-01-18T00:00:00Z'
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockCreatedProgram,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/programs', {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.program.name).toBe(programData.name);
    });

    it('should create program with weeks and days', async () => {
      const programData = {
        name: 'Complete Program',
        description: 'Program with weeks and days',
        duration_weeks: 2,
        difficulty_level: 'beginner',
        equipment_required: ['bodyweight'],
        target_goals: ['strength'],
        is_template: true,
        weeks: [
          {
            week_number: 1,
            focus: 'Strength Building',
            notes: 'Week 1 notes',
            days: [
              {
                day_number: 1,
                day_name: 'Monday',
                is_rest_day: false,
                blocks: [
                  {
                    block_order: 1,
                    block_type: 'main_workout',
                    exercise_type: 'squat',
                    sets: 3,
                    reps: 10,
                    intensity: 'moderate'
                  }
                ]
              }
            ]
          }
        ]
      };

      // Mock the program creation
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'new-program-id', ...programData },
        error: null
      });

      // Mock week and day creation (these would be called multiple times)
      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({ data: { id: 'week-1-id' }, error: null }) // Week creation
        .mockResolvedValueOnce({ data: { id: 'day-1-id' }, error: null }) // Day creation
        .mockResolvedValueOnce({ data: { id: 'block-1-id' }, error: null }); // Block creation

      const request = new NextRequest('http://localhost:3000/api/programs', {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.program.name).toBe(programData.name);
    });
  });
});
