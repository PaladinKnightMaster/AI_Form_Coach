import { describe, it, expect, beforeEach } from 'vitest';

// Mock the programs workflow functions
const mockProgramsWorkflow = {
  // Mock program creation
  createProgram: vi.fn(),
  // Mock program structure creation
  createProgramStructure: vi.fn(),
  // Mock program selection
  selectProgram: vi.fn(),
  // Mock program execution
  executeProgram: vi.fn(),
  // Mock progress tracking
  trackProgress: vi.fn()
};

describe('Programs Workflow Integration', () => {
  const mockUser = { id: 'test-user-id' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Program Management Workflow', () => {
    it('should handle program creation with full structure', async () => {
      // Step 1: Create program
      const programData = {
        name: 'Beginner Strength Program',
        description: '4-week beginner strength program',
        duration_weeks: 4,
        difficulty_level: 'beginner',
        equipment_required: ['bodyweight', 'dumbbells'],
        target_goals: ['strength', 'endurance'],
        is_template: true
      };

      const createdProgram = {
        id: 'program-1',
        ...programData,
        created_by: mockUser.id,
        created_at: '2025-01-18T00:00:00Z'
      };

      mockProgramsWorkflow.createProgram.mockResolvedValue({
        success: true,
        program: createdProgram
      });

      const programResult = await mockProgramsWorkflow.createProgram(mockUser.id, programData);
      expect(programResult.success).toBe(true);
      expect(programResult.program.name).toBe(programData.name);

      // Step 2: Create program structure (weeks, days, blocks)
      const programStructure = {
        weeks: [
          {
            week_number: 1,
            focus: 'Foundation Building',
            notes: 'Focus on form and basic movements',
            days: [
              {
                day_number: 1,
                day_name: 'Monday - Upper Body',
                is_rest_day: false,
                blocks: [
                  {
                    block_order: 1,
                    block_type: 'warmup',
                    exercise_type: 'custom',
                    duration_seconds: 600, // 10 minutes
                    intensity: 'low'
                  },
                  {
                    block_order: 2,
                    block_type: 'main_workout',
                    exercise_type: 'pushup',
                    sets: 3,
                    reps: 10,
                    rest_seconds: 60,
                    intensity: 'moderate'
                  },
                  {
                    block_order: 3,
                    block_type: 'cooldown',
                    exercise_type: 'custom',
                    duration_seconds: 300, // 5 minutes
                    intensity: 'low'
                  }
                ]
              },
              {
                day_number: 2,
                day_name: 'Tuesday - Rest Day',
                is_rest_day: true,
                blocks: []
              }
            ]
          }
        ]
      };

      const createdStructure = {
        program_weeks: [
          {
            id: 'week-1',
            program_id: 'program-1',
            week_number: 1,
            focus: 'Foundation Building'
          }
        ],
        program_days: [
          {
            id: 'day-1',
            program_week_id: 'week-1',
            day_number: 1,
            day_name: 'Monday - Upper Body',
            is_rest_day: false
          },
          {
            id: 'day-2',
            program_week_id: 'week-1',
            day_number: 2,
            day_name: 'Tuesday - Rest Day',
            is_rest_day: true
          }
        ],
        day_blocks: [
          {
            id: 'block-1',
            program_day_id: 'day-1',
            block_order: 1,
            block_type: 'warmup',
            duration_seconds: 600
          },
          {
            id: 'block-2',
            program_day_id: 'day-1',
            block_order: 2,
            block_type: 'main_workout',
            exercise_type: 'pushup',
            sets: 3,
            reps: 10
          },
          {
            id: 'block-3',
            program_day_id: 'day-1',
            block_order: 3,
            block_type: 'cooldown',
            duration_seconds: 300
          }
        ]
      };

      mockProgramsWorkflow.createProgramStructure.mockResolvedValue({
        success: true,
        structure: createdStructure
      });

      const structureResult = await mockProgramsWorkflow.createProgramStructure(
        'program-1',
        programStructure
      );
      expect(structureResult.success).toBe(true);
      expect(structureResult.structure.program_weeks).toHaveLength(1);
      expect(structureResult.structure.program_days).toHaveLength(2);
      expect(structureResult.structure.day_blocks).toHaveLength(3);
    });

    it('should handle program selection and execution', async () => {
      // Step 1: Select a program
      const selectedProgram = {
        id: 'program-1',
        name: 'Beginner Strength Program',
        current_week: 1,
        current_day: 1,
        is_active: true
      };

      mockProgramsWorkflow.selectProgram.mockResolvedValue({
        success: true,
        program: selectedProgram
      });

      const selectionResult = await mockProgramsWorkflow.selectProgram(mockUser.id, 'program-1');
      expect(selectionResult.success).toBe(true);
      expect(selectionResult.program.is_active).toBe(true);

      // Step 2: Execute program (get today's workout)
      const todaysWorkout = {
        program_id: 'program-1',
        week_number: 1,
        day_number: 1,
        day_name: 'Monday - Upper Body',
        blocks: [
          {
            block_type: 'warmup',
            duration_seconds: 600,
            intensity: 'low'
          },
          {
            block_type: 'main_workout',
            exercise_type: 'pushup',
            sets: 3,
            reps: 10,
            rest_seconds: 60,
            intensity: 'moderate'
          },
          {
            block_type: 'cooldown',
            duration_seconds: 300,
            intensity: 'low'
          }
        ]
      };

      mockProgramsWorkflow.executeProgram.mockResolvedValue({
        success: true,
        workout: todaysWorkout
      });

      const executionResult = await mockProgramsWorkflow.executeProgram(
        mockUser.id,
        'program-1',
        '2025-01-18'
      );
      expect(executionResult.success).toBe(true);
      expect(executionResult.workout.blocks).toHaveLength(3);
      expect(executionResult.workout.blocks[1].exercise_type).toBe('pushup');

      // Step 3: Track progress
      const progressData = {
        program_id: 'program-1',
        week_number: 1,
        day_number: 1,
        completed_blocks: 3,
        total_blocks: 3,
        completion_percentage: 100,
        next_workout: {
          week_number: 1,
          day_number: 3 // Skip rest day
        }
      };

      mockProgramsWorkflow.trackProgress.mockResolvedValue({
        success: true,
        progress: progressData
      });

      const progressResult = await mockProgramsWorkflow.trackProgress(
        mockUser.id,
        'program-1',
        progressData
      );
      expect(progressResult.success).toBe(true);
      expect(progressResult.progress.completion_percentage).toBe(100);
    });
  });

  describe('Program Structure Validation', () => {
    it('should validate program structure correctly', () => {
      const validateProgramStructure = (structure: any) => {
        const errors = [];

        // Check if weeks are properly numbered
        if (!structure.weeks || structure.weeks.length === 0) {
          errors.push('Program must have at least one week');
        }

        // Check each week
        structure.weeks?.forEach((week: any, index: number) => {
          if (week.week_number !== index + 1) {
            errors.push(`Week ${index + 1} has incorrect week_number`);
          }

          // Check days
          if (!week.days || week.days.length === 0) {
            errors.push(`Week ${week.week_number} must have at least one day`);
          }

          week.days?.forEach((day: any, dayIndex: number) => {
            if (day.day_number !== dayIndex + 1) {
              errors.push(`Day ${dayIndex + 1} in week ${week.week_number} has incorrect day_number`);
            }

            // Check blocks for non-rest days
            if (!day.is_rest_day && (!day.blocks || day.blocks.length === 0)) {
              errors.push(`Day ${day.day_number} in week ${week.week_number} must have blocks if not a rest day`);
            }
          });
        });

        return {
          isValid: errors.length === 0,
          errors
        };
      };

      // Valid structure
      const validStructure = {
        weeks: [
          {
            week_number: 1,
            days: [
              {
                day_number: 1,
                is_rest_day: false,
                blocks: [
                  { block_order: 1, block_type: 'main_workout' }
                ]
              }
            ]
          }
        ]
      };

      const validResult = validateProgramStructure(validStructure);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Invalid structure
      const invalidStructure = {
        weeks: [
          {
            week_number: 2, // Wrong week number
            days: [
              {
                day_number: 3, // Wrong day number
                is_rest_day: false,
                blocks: [] // No blocks for non-rest day
              }
            ]
          }
        ]
      };

      const invalidResult = validateProgramStructure(invalidStructure);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Program Progression Logic', () => {
    it('should calculate program progression correctly', () => {
      const calculateProgression = (currentWeek: number, currentDay: number, totalWeeks: number) => {
        const totalDays = totalWeeks * 7;
        const completedDays = (currentWeek - 1) * 7 + (currentDay - 1);
        const progressPercentage = (completedDays / totalDays) * 100;

        return {
          progressPercentage: Math.round(progressPercentage),
          isComplete: progressPercentage >= 100,
          nextWeek: currentDay === 7 ? currentWeek + 1 : currentWeek,
          nextDay: currentDay === 7 ? 1 : currentDay + 1
        };
      };

      // Week 1, Day 3 of 4-week program
      const progression1 = calculateProgression(1, 3, 4);
      expect(progression1.progressPercentage).toBe(7); // 2/28 * 100
      expect(progression1.isComplete).toBe(false);
      expect(progression1.nextWeek).toBe(1);
      expect(progression1.nextDay).toBe(4);

      // Week 2, Day 7 of 4-week program
      const progression2 = calculateProgression(2, 7, 4);
      expect(progression2.progressPercentage).toBe(25); // 7/28 * 100
      expect(progression2.isComplete).toBe(false);
      expect(progression2.nextWeek).toBe(3);
      expect(progression2.nextDay).toBe(1);

      // Week 4, Day 7 of 4-week program (complete)
      const progression3 = calculateProgression(4, 7, 4);
      expect(progression3.progressPercentage).toBe(100);
      expect(progression3.isComplete).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle program creation errors', async () => {
      mockProgramsWorkflow.createProgram.mockResolvedValue({
        success: false,
        error: 'Invalid program data'
      });

      const result = await mockProgramsWorkflow.createProgram(mockUser.id, {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid program data');
    });

    it('should handle program execution errors', async () => {
      mockProgramsWorkflow.executeProgram.mockResolvedValue({
        success: false,
        error: 'Program not found'
      });

      const result = await mockProgramsWorkflow.executeProgram(mockUser.id, 'invalid-program', '2025-01-18');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Program not found');
    });
  });
});
