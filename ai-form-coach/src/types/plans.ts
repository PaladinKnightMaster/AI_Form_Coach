// Basic types for the plans system
export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  goal_type: string;
  equipment_required: string[];
  duration_weeks: number;
  difficulty_level: number;
  sessions_per_week: number;
  avg_session_duration: number;
  is_featured: boolean;
  tags: string[];
}

export interface UserPlan {
  id: string;
  user_id: string;
  name: string;
  current_week: number;
  current_day: number;
  is_active: boolean;
  template_id?: string | null;
  plan_data?: any; // JSONB field containing plan details
  created_at: string;
  updated_at: string;
}
