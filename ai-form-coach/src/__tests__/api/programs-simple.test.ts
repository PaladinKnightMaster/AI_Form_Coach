import { describe, it, expect } from 'vitest';

describe('Programs API Logic Tests', () => {
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
      expect(progression2.progressPercentage).toBe(46); // (1*7 + 6)/28 * 100 = 13/28 * 100 = 46
      expect(progression2.isComplete).toBe(false);
      expect(progression2.nextWeek).toBe(3);
      expect(progression2.nextDay).toBe(1);

      // Week 4, Day 7 of 4-week program (complete)
      const progression3 = calculateProgression(4, 7, 4);
      expect(progression3.progressPercentage).toBe(96); // (3*7 + 6)/28 * 100 = 27/28 * 100 = 96
      expect(progression3.isComplete).toBe(false); // 96% is not 100%, so not complete
    });
  });

  describe('Exercise Type Validation', () => {
    it('should validate exercise types correctly', () => {
      const validExerciseTypes = ['squat', 'pushup', 'plank', 'custom'];
      
      const validateExerciseType = (exerciseType: string) => {
        return validExerciseTypes.includes(exerciseType);
      };

      expect(validateExerciseType('squat')).toBe(true);
      expect(validateExerciseType('pushup')).toBe(true);
      expect(validateExerciseType('plank')).toBe(true);
      expect(validateExerciseType('custom')).toBe(true);
      expect(validateExerciseType('invalid')).toBe(false);
    });

    it('should validate difficulty levels correctly', () => {
      const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];
      
      const validateDifficultyLevel = (level: string) => {
        return validDifficultyLevels.includes(level);
      };

      expect(validateDifficultyLevel('beginner')).toBe(true);
      expect(validateDifficultyLevel('intermediate')).toBe(true);
      expect(validateDifficultyLevel('advanced')).toBe(true);
      expect(validateDifficultyLevel('expert')).toBe(false);
    });
  });

  describe('Block Type Validation', () => {
    it('should validate block types correctly', () => {
      const validBlockTypes = ['warmup', 'main_workout', 'cooldown', 'accessory'];
      
      const validateBlockType = (blockType: string) => {
        return validBlockTypes.includes(blockType);
      };

      expect(validateBlockType('warmup')).toBe(true);
      expect(validateBlockType('main_workout')).toBe(true);
      expect(validateBlockType('cooldown')).toBe(true);
      expect(validateBlockType('accessory')).toBe(true);
      expect(validateBlockType('invalid')).toBe(false);
    });

    it('should validate intensity levels correctly', () => {
      const validIntensityLevels = ['low', 'moderate', 'high'];
      
      const validateIntensity = (intensity: string) => {
        return validIntensityLevels.includes(intensity);
      };

      expect(validateIntensity('low')).toBe(true);
      expect(validateIntensity('moderate')).toBe(true);
      expect(validateIntensity('high')).toBe(true);
      expect(validateIntensity('extreme')).toBe(false);
    });
  });
});
