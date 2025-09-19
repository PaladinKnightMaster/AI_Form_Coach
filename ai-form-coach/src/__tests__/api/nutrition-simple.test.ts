import { describe, it, expect } from 'vitest';

describe('Nutrition API Logic Tests', () => {
  describe('Macro Calculations', () => {
    it('should calculate macro percentages correctly', () => {
      const calculateMacroPercentages = (calories: number, protein: number, carbs: number, fat: number) => {
        const proteinCalories = protein * 4;
        const carbsCalories = carbs * 4;
        const fatCalories = fat * 9;
        
        return {
          proteinPercentage: (proteinCalories / calories) * 100,
          carbsPercentage: (carbsCalories / calories) * 100,
          fatPercentage: (fatCalories / calories) * 100
        };
      };

      const result = calculateMacroPercentages(2000, 150, 250, 65);
      
      expect(result.proteinPercentage).toBe(30); // 150*4/2000*100
      expect(result.carbsPercentage).toBe(50);   // 250*4/2000*100
      expect(result.fatPercentage).toBe(29.25);  // 65*9/2000*100
    });

    it('should calculate food macros per gram correctly', () => {
      const food = {
        calories_per_100g: 165,
        protein_per_100g: 31,
        carbs_per_100g: 0,
        fat_per_100g: 3.6
      };

      const grams = 150;

      const calculatedMacros = {
        calories: (grams / 100) * food.calories_per_100g,
        protein: (grams / 100) * food.protein_per_100g,
        carbs: (grams / 100) * food.carbs_per_100g,
        fat: (grams / 100) * food.fat_per_100g
      };

      expect(calculatedMacros.calories).toBe(247.5);
      expect(calculatedMacros.protein).toBe(46.5);
      expect(calculatedMacros.carbs).toBe(0);
      expect(calculatedMacros.fat).toBe(5.4);
    });
  });

  describe('Goal Achievement Logic', () => {
    it('should calculate goal achievement correctly', () => {
      const goals = {
        calorie_target: 2000,
        protein_target: 150,
        carbs_target: 250,
        fat_target: 65
      };

      const dailyTotals = {
        total_calories: 2100,
        total_protein: 155,
        total_carbs: 200,
        total_fat: 70
      };

      const achievements = {
        calorie_goal_met: dailyTotals.total_calories >= goals.calorie_target,
        protein_goal_met: dailyTotals.total_protein >= goals.protein_target,
        carbs_goal_met: dailyTotals.total_carbs >= goals.carbs_target,
        fat_goal_met: dailyTotals.total_fat >= goals.fat_target,
        all_goals_met: 
          dailyTotals.total_calories >= goals.calorie_target &&
          dailyTotals.total_protein >= goals.protein_target &&
          dailyTotals.total_carbs >= goals.carbs_target &&
          dailyTotals.total_fat >= goals.fat_target
      };

      expect(achievements.calorie_goal_met).toBe(true);
      expect(achievements.protein_goal_met).toBe(true);
      expect(achievements.carbs_goal_met).toBe(false);
      expect(achievements.fat_goal_met).toBe(true);
      expect(achievements.all_goals_met).toBe(false);
    });

    it('should calculate progress percentages correctly', () => {
      const goals = {
        calorie_target: 2000,
        protein_target: 150
      };

      const dailyTotals = {
        total_calories: 1500,
        total_protein: 120
      };

      const progress = {
        calorie_progress: (dailyTotals.total_calories / goals.calorie_target) * 100,
        protein_progress: (dailyTotals.total_protein / goals.protein_target) * 100
      };

      expect(progress.calorie_progress).toBe(75); // 1500/2000*100
      expect(progress.protein_progress).toBe(80); // 120/150*100
    });
  });

  describe('Streak Calculation', () => {
    it('should calculate streak correctly', () => {
      const goalAchievements = [
        { date: '2025-01-18', all_goals_met: true },  // index 0 - most recent
        { date: '2025-01-17', all_goals_met: true },  // index 1
        { date: '2025-01-16', all_goals_met: true },  // index 2
        { date: '2025-01-15', all_goals_met: false }, // index 3
        { date: '2025-01-14', all_goals_met: true },  // index 4
        { date: '2025-01-13', all_goals_met: true }   // index 5 - oldest
      ];

      const calculateStreak = (achievements: any[]) => {
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Process from most recent to oldest for current streak
        for (let i = 0; i < achievements.length; i++) {
          if (achievements[i].all_goals_met) {
            currentStreak++;
          } else {
            break; // Stop counting when we hit a failed day
          }
        }

        // Process from oldest to newest for longest streak
        for (const achievement of achievements) {
          if (achievement.all_goals_met) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }

        return { currentStreak, longestStreak };
      };

      const result = calculateStreak(goalAchievements);
      expect(result.currentStreak).toBe(3); // Last 3 consecutive days (18th, 17th, 16th) - stops at 15th because it's false
      expect(result.longestStreak).toBe(3); // Max consecutive (16th, 17th, 18th)
    });
  });
});
