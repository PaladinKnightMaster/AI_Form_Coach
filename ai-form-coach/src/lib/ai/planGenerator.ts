import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface UserPreferences {
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  goal_type: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness';
  available_equipment: string[];
  time_per_session: number; // in minutes
  sessions_per_week: number;
  workout_duration_weeks: number;
  injuries_or_limitations?: string[];
  preferred_workout_types?: string[];
}

export interface GeneratedPlan {
  name: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  goal_type: string;
  equipment_required: string[];
  duration_weeks: number;
  difficulty_level: number;
  sessions_per_week: number;
  avg_session_duration: number;
  tags: string[];
  sessions: GeneratedSession[];
}

export interface GeneratedSession {
  week_number: number;
  day_number: number;
  session_name: string;
  session_description: string;
  exercises: Exercise[];
  estimated_duration: number;
  difficulty_notes?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps?: string;
  duration?: string;
  rest: string;
  notes?: string;
}

interface RawPlanData {
  name?: string;
  description?: string;
  category?: string;
  goal_type?: string;
  equipment_required?: string[];
  duration_weeks?: number;
  difficulty_level?: number;
  sessions_per_week?: number;
  avg_session_duration?: number;
  tags?: string[];
  sessions?: RawSessionData[];
}

interface RawSessionData {
  week_number?: number;
  day_number?: number;
  session_name?: string;
  session_description?: string;
  exercises?: RawExerciseData[];
  estimated_duration?: number;
  difficulty_notes?: string;
}

interface RawExerciseData {
  name?: string;
  sets?: number;
  reps?: string;
  duration?: string;
  rest?: string;
  notes?: string;
}

export class AIPlanGenerator {
  async generatePlan(preferences: UserPreferences): Promise<GeneratedPlan> {
    let text = '';
    let jsonText = '';
    
    try {
      const prompt = this.buildPrompt(preferences);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
      
      // Extract JSON from markdown code blocks if present
      jsonText = text;
      if (text.includes('```json')) {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }
      } else if (text.includes('```')) {
        const jsonMatch = text.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }
      }
      
      // Parse the JSON response
      const planData = JSON.parse(jsonText);
      
      // Validate and structure the response
      return this.validateAndStructurePlan(planData, preferences);
    } catch (error) {
      console.error('Error generating AI plan:', error);
      console.error('Raw response text:', text);
      console.error('Extracted JSON text:', jsonText);
      
      if (error instanceof SyntaxError) {
        throw new Error('AI returned invalid JSON format. Please try again.');
      }
      
      throw new Error('Failed to generate AI plan. Please try again.');
    }
  }

  private buildPrompt(preferences: UserPreferences): string {
    return `
You are an expert fitness trainer and workout plan creator. Generate a comprehensive workout plan based on the user's preferences.

User Preferences:
- Fitness Level: ${preferences.fitness_level}
- Goal: ${preferences.goal_type}
- Available Equipment: ${preferences.available_equipment.join(', ') || 'Bodyweight only'}
- Time per Session: ${preferences.time_per_session} minutes
- Sessions per Week: ${preferences.sessions_per_week}
- Program Duration: ${preferences.workout_duration_weeks} weeks
- Injuries/Limitations: ${preferences.injuries_or_limitations?.join(', ') || 'None'}
- Preferred Workout Types: ${preferences.preferred_workout_types?.join(', ') || 'Any'}

Create a detailed workout plan that includes:

1. A compelling plan name and description
2. Appropriate difficulty level (1-10 scale)
3. Progressive weekly sessions that build upon each other
4. Exercises suitable for the user's equipment and fitness level
5. Proper rest periods and progression

IMPORTANT: Return ONLY a valid JSON object. Do not wrap it in markdown code blocks or add any other text. The response must be parseable JSON with this exact structure:

{
  "name": "Plan Name",
  "description": "Detailed description of the plan",
  "category": "beginner|intermediate|advanced",
  "goal_type": "weight_loss|muscle_gain|strength|endurance|general_fitness",
  "equipment_required": ["equipment1", "equipment2"],
  "duration_weeks": ${preferences.workout_duration_weeks},
  "difficulty_level": 5,
  "sessions_per_week": ${preferences.sessions_per_week},
  "avg_session_duration": ${preferences.time_per_session},
  "tags": ["tag1", "tag2", "tag3"],
  "sessions": [
    {
      "week_number": 1,
      "day_number": 1,
      "session_name": "Session Name",
      "session_description": "What this session focuses on",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 3,
          "reps": "8-12",
          "rest": "60s",
          "notes": "Form tips or variations"
        }
      ],
      "estimated_duration": ${preferences.time_per_session},
      "difficulty_notes": "Any special considerations"
    }
  ]
}

Important Guidelines:
- Make exercises progressive and appropriate for the fitness level
- Include proper warm-up and cool-down suggestions in session descriptions
- Ensure equipment requirements match what the user has available
- Create realistic progression over the weeks
- Include variety to prevent boredom
- Consider the user's goal type in exercise selection
- Make the plan challenging but achievable

Generate a complete ${preferences.workout_duration_weeks}-week plan with ${preferences.sessions_per_week} sessions per week.
`;
  }

  private validateAndStructurePlan(planData: RawPlanData, preferences: UserPreferences): GeneratedPlan {
    // Validate required fields
    if (!planData.name || !planData.description || !planData.sessions) {
      throw new Error('Invalid plan data received from AI');
    }

    // Ensure sessions are properly structured
    const validatedSessions: GeneratedSession[] = planData.sessions.map((session: RawSessionData) => ({
      week_number: session.week_number || 1,
      day_number: session.day_number || 1,
      session_name: session.session_name || 'Workout Session',
      session_description: session.session_description || '',
      exercises: (session.exercises || []).map((exercise: RawExerciseData) => ({
        name: exercise.name || 'Exercise',
        sets: exercise.sets || 3,
        reps: exercise.reps,
        duration: exercise.duration,
        rest: exercise.rest || '60s',
        notes: exercise.notes
      })),
      estimated_duration: session.estimated_duration || preferences.time_per_session,
      difficulty_notes: session.difficulty_notes
    }));

    return {
      name: planData.name,
      description: planData.description,
      category: (planData.category as 'beginner' | 'intermediate' | 'advanced') || preferences.fitness_level,
      goal_type: planData.goal_type || preferences.goal_type,
      equipment_required: planData.equipment_required || preferences.available_equipment,
      duration_weeks: planData.duration_weeks || preferences.workout_duration_weeks,
      difficulty_level: Math.min(Math.max(planData.difficulty_level || 5, 1), 10),
      sessions_per_week: planData.sessions_per_week || preferences.sessions_per_week,
      avg_session_duration: planData.avg_session_duration || preferences.time_per_session,
      tags: planData.tags || this.generateTags(preferences),
      sessions: validatedSessions
    };
  }

  private generateTags(preferences: UserPreferences): string[] {
    const tags: string[] = [];
    
    // Add fitness level tag
    tags.push(preferences.fitness_level);
    
    // Add goal type tag
    tags.push(preferences.goal_type.replace('_', '-'));
    
    // Add equipment tags
    if (preferences.available_equipment.length === 0) {
      tags.push('bodyweight');
    } else {
      preferences.available_equipment.forEach(equipment => {
        tags.push(equipment.replace(' ', '-').toLowerCase());
      });
    }
    
    // Add workout type tags
    if (preferences.preferred_workout_types) {
      preferences.preferred_workout_types.forEach(type => {
        tags.push(type.replace(' ', '-').toLowerCase());
      });
    }
    
    return tags;
  }
}

// Export a singleton instance
export const aiPlanGenerator = new AIPlanGenerator();
