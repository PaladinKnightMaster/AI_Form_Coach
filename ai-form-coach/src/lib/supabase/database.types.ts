export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          description: string | null
          earned_at: string | null
          id: string
          is_public: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          earned_at?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          earned_at?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_comments: {
        Row: {
          activity_id: string
          activity_type: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          activity_type: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          activity_type?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_likes: {
        Row: {
          activity_id: string
          activity_type: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          activity_type: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          activity_type?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          session_id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          session_id: string
          timestamp: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          session_id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string
          id: string
          status: string
          stripe_invoice_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description: string
          id?: string
          status: string
          stripe_invoice_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string
          id?: string
          status?: string
          stripe_invoice_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_billing_history_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participations: {
        Row: {
          challenge_id: string
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          progress_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          progress_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          progress_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_challenge_participations_challenge_id"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "monthly_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_challenge_participations_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_cues: {
        Row: {
          created_at: string | null
          key: string
          long: string | null
          severity: number
          short: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          key: string
          long?: string | null
          severity: number
          short: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          key?: string
          long?: string | null
          severity?: number
          short?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_pack_purchases: {
        Row: {
          amount: number
          coach_pack_id: string
          created_at: string | null
          currency: string
          id: string
          purchased_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          coach_pack_id: string
          created_at?: string | null
          currency?: string
          id?: string
          purchased_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          coach_pack_id?: string
          created_at?: string | null
          currency?: string
          id?: string
          purchased_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_coach_pack_purchases_coach_pack_id"
            columns: ["coach_pack_id"]
            isOneToOne: false
            referencedRelation: "coach_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_coach_pack_purchases_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_packs: {
        Row: {
          created_at: string | null
          creator: Json | null
          currency: string
          description: string
          difficulty_level: string
          duration_weeks: number
          equipment_required: string[] | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          preview: Json | null
          preview_available: boolean | null
          price: number
          program_data: Json
          purchase_count: number | null
          rating: number | null
          review_count: number | null
          short_description: string | null
          tags: string[] | null
          target_goals: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator?: Json | null
          currency?: string
          description: string
          difficulty_level: string
          duration_weeks: number
          equipment_required?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          preview?: Json | null
          preview_available?: boolean | null
          price: number
          program_data: Json
          purchase_count?: number | null
          rating?: number | null
          review_count?: number | null
          short_description?: string | null
          tags?: string[] | null
          target_goals?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator?: Json | null
          currency?: string
          description?: string
          difficulty_level?: string
          duration_weeks?: number
          equipment_required?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          preview?: Json | null
          preview_available?: boolean | null
          price?: number
          program_data?: Json
          purchase_count?: number | null
          rating?: number | null
          review_count?: number | null
          short_description?: string | null
          tags?: string[] | null
          target_goals?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coach_templates: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          display_name: string
          duration_minutes: number | null
          equipment_required: string[] | null
          exercise_focus: string[] | null
          id: string
          is_active: boolean | null
          template_config: Json
          template_name: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          display_name: string
          duration_minutes?: number | null
          equipment_required?: string[] | null
          exercise_focus?: string[] | null
          id?: string
          is_active?: boolean | null
          template_config: Json
          template_name: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          display_name?: string
          duration_minutes?: number | null
          equipment_required?: string[] | null
          exercise_focus?: string[] | null
          id?: string
          is_active?: boolean | null
          template_config?: Json
          template_name?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coaching_hints: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          exercise: string | null
          hint_key: string
          hint_message: string
          id: string
          joint_index: number | null
          joint_name: string | null
          phase: string | null
          rep_id: string | null
          rep_number: number | null
          session_id: string | null
          severity: string
          shown_at: string | null
          time_to_correction_ms: number | null
          user_id: string | null
          visibility_score: number | null
          was_followed: boolean | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          exercise?: string | null
          hint_key: string
          hint_message: string
          id?: string
          joint_index?: number | null
          joint_name?: string | null
          phase?: string | null
          rep_id?: string | null
          rep_number?: number | null
          session_id?: string | null
          severity: string
          shown_at?: string | null
          time_to_correction_ms?: number | null
          user_id?: string | null
          visibility_score?: number | null
          was_followed?: boolean | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          exercise?: string | null
          hint_key?: string
          hint_message?: string
          id?: string
          joint_index?: number | null
          joint_name?: string | null
          phase?: string | null
          rep_id?: string | null
          rep_number?: number | null
          session_id?: string | null
          severity?: string
          shown_at?: string | null
          time_to_correction_ms?: number | null
          user_id?: string | null
          visibility_score?: number | null
          was_followed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_hints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_quality_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "coaching_hints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_hints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "verified_sessions_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_goal_overrides: {
        Row: {
          calorie_target: number | null
          carbs_target: number | null
          created_at: string | null
          date: string
          fat_target: number | null
          fiber_target: number | null
          id: string
          note: string | null
          protein_target: number | null
          sodium_target: number | null
          sugar_target: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calorie_target?: number | null
          carbs_target?: number | null
          created_at?: string | null
          date: string
          fat_target?: number | null
          fiber_target?: number | null
          id?: string
          note?: string | null
          protein_target?: number | null
          sodium_target?: number | null
          sugar_target?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calorie_target?: number | null
          carbs_target?: number | null
          created_at?: string | null
          date?: string
          fat_target?: number | null
          fiber_target?: number | null
          id?: string
          note?: string | null
          protein_target?: number | null
          sodium_target?: number | null
          sugar_target?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_goal_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      day_blocks: {
        Row: {
          block_order: number
          block_type: string
          coach_template: string
          created_at: string | null
          duration_minutes: number | null
          duration_seconds: number | null
          exercise_type: string | null
          id: string
          intensity: string | null
          intensity_level: number | null
          notes: string | null
          program_day_id: string
          reps: number | null
          rest_seconds: number | null
          sets: number | null
          template_config: Json | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          block_order: number
          block_type: string
          coach_template: string
          created_at?: string | null
          duration_minutes?: number | null
          duration_seconds?: number | null
          exercise_type?: string | null
          id?: string
          intensity?: string | null
          intensity_level?: number | null
          notes?: string | null
          program_day_id: string
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          template_config?: Json | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          block_order?: number
          block_type?: string
          coach_template?: string
          created_at?: string | null
          duration_minutes?: number | null
          duration_seconds?: number | null
          exercise_type?: string | null
          id?: string
          intensity?: string | null
          intensity_level?: number | null
          notes?: string | null
          program_day_id?: string
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          template_config?: Json | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "day_blocks_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_day_blocks_program_day_id"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "program_days"
            referencedColumns: ["id"]
          },
        ]
      }
      device_calibration: {
        Row: {
          bodyline_target: number | null
          calibration_version: number | null
          created_at: string | null
          device_id: string
          id: string
          is_active: boolean | null
          pushup_elbow_bottom_angle: number | null
          squat_full_depth_angle: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bodyline_target?: number | null
          calibration_version?: number | null
          created_at?: string | null
          device_id: string
          id?: string
          is_active?: boolean | null
          pushup_elbow_bottom_angle?: number | null
          squat_full_depth_angle?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bodyline_target?: number | null
          calibration_version?: number | null
          created_at?: string | null
          device_id?: string
          id?: string
          is_active?: boolean | null
          pushup_elbow_bottom_angle?: number | null
          squat_full_depth_angle?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      error_events: {
        Row: {
          action: string | null
          component: string | null
          created_at: string | null
          error_level: string
          error_message: string
          error_stack: string | null
          id: string
          metadata: Json | null
          session_id: string
          timestamp: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          component?: string | null
          created_at?: string | null
          error_level: string
          error_message: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          session_id: string
          timestamp: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          component?: string | null
          created_at?: string | null
          error_level?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string
          timestamp?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          id: string
          name: string
          payload: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          payload?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          payload?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_quality_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "verified_sessions_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          message: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          message: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          message?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_quality_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "verified_sessions_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          barcode: string | null
          brand: string | null
          calories_per_100g: number
          carbs_per_100g: number
          category: string | null
          created_at: string | null
          created_by: string | null
          detailed_description: string | null
          fat_per_100g: number
          fiber_per_100g: number
          id: string
          ingredients: Json | null
          name: string
          protein_per_100g: number
          sodium_per_100g: number
          source: string | null
          sugar_per_100g: number
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          detailed_description?: string | null
          fat_per_100g?: number
          fiber_per_100g?: number
          id?: string
          ingredients?: Json | null
          name: string
          protein_per_100g?: number
          sodium_per_100g?: number
          source?: string | null
          sugar_per_100g?: number
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number
          carbs_per_100g?: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          detailed_description?: string | null
          fat_per_100g?: number
          fiber_per_100g?: number
          id?: string
          ingredients?: Json | null
          name?: string
          protein_per_100g?: number
          sodium_per_100g?: number
          source?: string | null
          sugar_per_100g?: number
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "foods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_achievements: {
        Row: {
          all_goals_met: boolean | null
          calorie_goal_met: boolean | null
          carbs_goal_met: boolean | null
          created_at: string | null
          date: string
          fat_goal_met: boolean | null
          fiber_goal_met: boolean | null
          id: string
          protein_goal_met: boolean | null
          sodium_goal_met: boolean | null
          sugar_goal_met: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_goals_met?: boolean | null
          calorie_goal_met?: boolean | null
          carbs_goal_met?: boolean | null
          created_at?: string | null
          date: string
          fat_goal_met?: boolean | null
          fiber_goal_met?: boolean | null
          id?: string
          protein_goal_met?: boolean | null
          sodium_goal_met?: boolean | null
          sugar_goal_met?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_goals_met?: boolean | null
          calorie_goal_met?: boolean | null
          carbs_goal_met?: boolean | null
          created_at?: string | null
          date?: string
          fat_goal_met?: boolean | null
          fiber_goal_met?: boolean | null
          id?: string
          protein_goal_met?: boolean | null
          sodium_goal_met?: boolean | null
          sugar_goal_met?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guardrail_rules: {
        Row: {
          action_parameters: Json
          action_type: string
          condition_parameters: Json
          condition_type: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          severity: string
          updated_at: string
        }
        Insert: {
          action_parameters?: Json
          action_type: string
          condition_parameters?: Json
          condition_type: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          name: string
          severity: string
          updated_at?: string
        }
        Update: {
          action_parameters?: Json
          action_type?: string
          condition_parameters?: Json
          condition_type?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
      guardrail_triggers: {
        Row: {
          acknowledged: boolean
          adjustment: Json
          block_id: string
          created_at: string
          id: string
          rule_id: string | null
          rule_name: string
          severity: string
          triggered_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          adjustment?: Json
          block_id: string
          created_at?: string
          id?: string
          rule_id?: string | null
          rule_name: string
          severity: string
          triggered_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          adjustment?: Json
          block_id?: string
          created_at?: string
          id?: string
          rule_id?: string | null
          rule_name?: string
          severity?: string
          triggered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardrail_triggers_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "guardrail_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      health_baselines: {
        Row: {
          created_at: string | null
          hrv_baseline: number | null
          id: string
          last_updated: string | null
          resting_hr_baseline: number
          sleep_baseline: number
          step_baseline: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hrv_baseline?: number | null
          id?: string
          last_updated?: string | null
          resting_hr_baseline?: number
          sleep_baseline?: number
          step_baseline?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          hrv_baseline?: number | null
          id?: string
          last_updated?: string | null
          resting_hr_baseline?: number
          sleep_baseline?: number
          step_baseline?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_baselines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_data: {
        Row: {
          created_at: string | null
          date: string
          hrv: number | null
          id: string
          resting_heart_rate: number | null
          sleep_duration: number | null
          step_count: number | null
          training_load: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          hrv?: number | null
          id?: string
          resting_heart_rate?: number | null
          sleep_duration?: number | null
          step_count?: number | null
          training_load?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          hrv?: number | null
          id?: string
          resting_heart_rate?: number | null
          sleep_duration?: number | null
          step_count?: number | null
          training_load?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integrity_check_config: {
        Row: {
          check_name: string
          description: string | null
          enabled: boolean | null
          id: string
          thresholds: Json
          updated_at: string | null
          updated_by: string | null
          weight: number | null
        }
        Insert: {
          check_name: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          thresholds: Json
          updated_at?: string | null
          updated_by?: string | null
          weight?: number | null
        }
        Update: {
          check_name?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          thresholds?: Json
          updated_at?: string | null
          updated_by?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          calories: number
          carbs: number
          created_at: string | null
          fat: number
          fiber: number
          food_id: string
          grams: number
          id: string
          meal_id: string
          protein: number
          sodium: number
          sugar: number
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string | null
          fat?: number
          fiber?: number
          food_id: string
          grams?: number
          id?: string
          meal_id: string
          protein?: number
          sodium?: number
          sugar?: number
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string | null
          fat?: number
          fiber?: number
          food_id?: string
          grams?: number
          id?: string
          meal_id?: string
          protein?: number
          sodium?: number
          sugar?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string | null
          date: string
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_public: {
        Row: {
          avg_session_minutes: number | null
          id: number
          rom_improved_pct: number | null
          total_reps_counted: number | null
          updated_at: string | null
        }
        Insert: {
          avg_session_minutes?: number | null
          id?: number
          rom_improved_pct?: number | null
          total_reps_counted?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_session_minutes?: number | null
          id?: number
          rom_improved_pct?: number | null
          total_reps_counted?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      monthly_challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          description: string
          end_date: string
          exercise_type: string
          id: string
          is_active: boolean | null
          name: string
          participant_count: number | null
          reward_description: string | null
          start_date: string
          target_unit: string
          target_value: number
        }
        Insert: {
          challenge_type: string
          created_at?: string | null
          description: string
          end_date: string
          exercise_type: string
          id?: string
          is_active?: boolean | null
          name: string
          participant_count?: number | null
          reward_description?: string | null
          start_date: string
          target_unit: string
          target_value: number
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          description?: string
          end_date?: string
          exercise_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          participant_count?: number | null
          reward_description?: string | null
          start_date?: string
          target_unit?: string
          target_value?: number
        }
        Relationships: []
      }
      organization_exports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          download_url: string | null
          end_date: string | null
          expires_at: string | null
          export_type: string
          id: string
          include_phi: boolean | null
          metrics_included: string[]
          organization_id: string
          record_count: number | null
          requested_by: string
          start_date: string | null
          status: string
          time_range: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          end_date?: string | null
          expires_at?: string | null
          export_type: string
          id?: string
          include_phi?: boolean | null
          metrics_included: string[]
          organization_id: string
          record_count?: number | null
          requested_by: string
          start_date?: string | null
          status?: string
          time_range: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          download_url?: string | null
          end_date?: string | null
          expires_at?: string | null
          export_type?: string
          id?: string
          include_phi?: boolean | null
          metrics_included?: string[]
          organization_id?: string
          record_count?: number | null
          requested_by?: string
          start_date?: string | null
          status?: string
          time_range?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_exports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_at: string | null
          invited_by: string
          organization_id: string
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by: string
          organization_id: string
          role?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string
          organization_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_metrics_cache: {
        Row: {
          expires_at: string | null
          generated_at: string | null
          id: string
          metrics_data: Json
          organization_id: string
          time_range: string
        }
        Insert: {
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          metrics_data: Json
          organization_id: string
          time_range: string
        }
        Update: {
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          metrics_data?: Json
          organization_id?: string
          time_range?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_metrics_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_webhook_logs: {
        Row: {
          event_type: string
          id: string
          next_retry_at: string | null
          organization_id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number | null
          sent_at: string | null
        }
        Insert: {
          event_type: string
          id?: string
          next_retry_at?: string | null
          organization_id: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          sent_at?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          next_retry_at?: string | null
          organization_id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_webhook_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          domain: string | null
          id: string
          is_active: boolean | null
          metadata: Json
          name: string
          settings: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json
          name: string
          settings?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json
          name?: string
          settings?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      pack_reviews: {
        Row: {
          cons: string[] | null
          content: string
          created_at: string | null
          id: string
          pack_id: string
          pros: string[] | null
          rating: number
          title: string
          updated_at: string | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          cons?: string[] | null
          content: string
          created_at?: string | null
          id?: string
          pack_id: string
          pros?: string[] | null
          rating: number
          title: string
          updated_at?: string | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          cons?: string[] | null
          content?: string
          created_at?: string | null
          id?: string
          pack_id?: string
          pros?: string[] | null
          rating?: number
          title?: string
          updated_at?: string | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pack_reviews_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "coach_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_uploads: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          pack_data: Json
          published_at: string | null
          published_pack_id: string | null
          rejection_reason: string | null
          status: string
          updated_at: string | null
          validation_result: Json | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          pack_data: Json
          published_at?: string | null
          published_pack_id?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          validation_result?: Json | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          pack_data?: Json
          published_at?: string | null
          published_pack_id?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pack_uploads_published_pack_id_fkey"
            columns: ["published_pack_id"]
            isOneToOne: false
            referencedRelation: "coach_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_last4: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          stripe_payment_method_id: string
          type: string
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          stripe_payment_method_id: string
          type: string
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          stripe_payment_method_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_methods_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          component: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string
          metric_value: number
          session_id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit: string
          metric_value: number
          session_id: string
          timestamp: string
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string
          metric_value?: number
          session_id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      plan_executions: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          feedback: string | null
          id: string
          overall_rating: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string
          weekly_plan_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          overall_rating?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
          weekly_plan_id: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          overall_rating?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_executions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_executions_weekly_plan_id_fkey"
            columns: ["weekly_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_quiz_responses: {
        Row: {
          additional_notes: string | null
          available_equipment: string[]
          created_at: string | null
          custom_schedule: Json | null
          experience_level: string
          id: string
          injury_considerations: string[] | null
          preferred_exercises: string[] | null
          primary_goal: string
          time_commitment: string
          time_preferences: string[] | null
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          available_equipment: string[]
          created_at?: string | null
          custom_schedule?: Json | null
          experience_level: string
          id?: string
          injury_considerations?: string[] | null
          preferred_exercises?: string[] | null
          primary_goal: string
          time_commitment: string
          time_preferences?: string[] | null
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          available_equipment?: string[]
          created_at?: string | null
          custom_schedule?: Json | null
          experience_level?: string
          id?: string
          injury_considerations?: string[] | null
          preferred_exercises?: string[] | null
          primary_goal?: string
          time_commitment?: string
          time_preferences?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_quiz_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_sessions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          cooldown: string[] | null
          created_at: string | null
          date: string
          day_number: number | null
          day_of_week: string
          difficulty_level: number | null
          difficulty_notes: string | null
          duration_minutes: number
          estimated_duration: number | null
          exercises: Json
          id: string
          notes: string | null
          session_description: string | null
          session_name: string | null
          session_order: number
          template_id: string | null
          updated_at: string | null
          user_notes: string | null
          user_rating: number | null
          warmup: string[] | null
          week_number: number | null
          weekly_plan_id: string
          workout_type: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          cooldown?: string[] | null
          created_at?: string | null
          date: string
          day_number?: number | null
          day_of_week: string
          difficulty_level?: number | null
          difficulty_notes?: string | null
          duration_minutes: number
          estimated_duration?: number | null
          exercises: Json
          id?: string
          notes?: string | null
          session_description?: string | null
          session_name?: string | null
          session_order: number
          template_id?: string | null
          updated_at?: string | null
          user_notes?: string | null
          user_rating?: number | null
          warmup?: string[] | null
          week_number?: number | null
          weekly_plan_id: string
          workout_type: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          cooldown?: string[] | null
          created_at?: string | null
          date?: string
          day_number?: number | null
          day_of_week?: string
          difficulty_level?: number | null
          difficulty_notes?: string | null
          duration_minutes?: number
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          notes?: string | null
          session_description?: string | null
          session_name?: string | null
          session_order?: number
          template_id?: string | null
          updated_at?: string | null
          user_notes?: string | null
          user_rating?: number | null
          warmup?: string[] | null
          week_number?: number | null
          weekly_plan_id?: string
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_plan_sessions_template_id"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "plan_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_sessions_weekly_plan_id_fkey"
            columns: ["weekly_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_templates: {
        Row: {
          avg_session_duration: number
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: number
          duration_weeks: number
          equipment_required: string[] | null
          goal_type: string
          id: string
          is_featured: boolean | null
          name: string
          plan_structure: Json
          preview_image_url: string | null
          sessions_per_week: number
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          avg_session_duration: number
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level: number
          duration_weeks: number
          equipment_required?: string[] | null
          goal_type: string
          id?: string
          is_featured?: boolean | null
          name: string
          plan_structure: Json
          preview_image_url?: string | null
          sessions_per_week: number
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avg_session_duration?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number
          duration_weeks?: number
          equipment_required?: string[] | null
          goal_type?: string
          id?: string
          is_featured?: boolean | null
          name?: string
          plan_structure?: Json
          preview_image_url?: string | null
          sessions_per_week?: number
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pose_quality_metrics: {
        Row: {
          average_landmark_visibility: number | null
          best_side: string | null
          created_at: string | null
          device_info: Json | null
          dropped_frames: number | null
          exercise: string | null
          fps: number | null
          id: string
          kalman_filter_applied: boolean | null
          low_visibility_frames: number | null
          median_filter_applied: boolean | null
          model: string | null
          outlier_rejections: number | null
          session_id: string | null
          stability_score: number | null
          timestamp: string | null
          total_frames: number | null
          tracking_confidence: number | null
          user_id: string | null
          visibility_score: number | null
        }
        Insert: {
          average_landmark_visibility?: number | null
          best_side?: string | null
          created_at?: string | null
          device_info?: Json | null
          dropped_frames?: number | null
          exercise?: string | null
          fps?: number | null
          id?: string
          kalman_filter_applied?: boolean | null
          low_visibility_frames?: number | null
          median_filter_applied?: boolean | null
          model?: string | null
          outlier_rejections?: number | null
          session_id?: string | null
          stability_score?: number | null
          timestamp?: string | null
          total_frames?: number | null
          tracking_confidence?: number | null
          user_id?: string | null
          visibility_score?: number | null
        }
        Update: {
          average_landmark_visibility?: number | null
          best_side?: string | null
          created_at?: string | null
          device_info?: Json | null
          dropped_frames?: number | null
          exercise?: string | null
          fps?: number | null
          id?: string
          kalman_filter_applied?: boolean | null
          low_visibility_frames?: number | null
          median_filter_applied?: boolean | null
          model?: string | null
          outlier_rejections?: number | null
          session_id?: string | null
          stability_score?: number | null
          timestamp?: string | null
          total_frames?: number | null
          tracking_confidence?: number | null
          user_id?: string | null
          visibility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pose_quality_metrics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_quality_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "pose_quality_metrics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pose_quality_metrics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "verified_sessions_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_credits_reset_at: string | null
          ai_credits_used: number
          avatar_url: string | null
          created_at: string | null
          id: string
          plan: string | null
          plan_renews_at: string | null
          stripe_customer_id: string | null
          username: string | null
        }
        Insert: {
          ai_credits_reset_at?: string | null
          ai_credits_used?: number
          avatar_url?: string | null
          created_at?: string | null
          id: string
          plan?: string | null
          plan_renews_at?: string | null
          stripe_customer_id?: string | null
          username?: string | null
        }
        Update: {
          ai_credits_reset_at?: string | null
          ai_credits_used?: number
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          plan?: string | null
          plan_renews_at?: string | null
          stripe_customer_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      program_days: {
        Row: {
          created_at: string | null
          day_name: string
          day_number: number
          id: string
          is_rest_day: boolean | null
          notes: string | null
          program_week_id: string
          total_duration_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_name: string
          day_number: number
          id?: string
          is_rest_day?: boolean | null
          notes?: string | null
          program_week_id: string
          total_duration_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_name?: string
          day_number?: number
          id?: string
          is_rest_day?: boolean | null
          notes?: string | null
          program_week_id?: string
          total_duration_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_days_program_week_id"
            columns: ["program_week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_days_program_week_id_fkey"
            columns: ["program_week_id"]
            isOneToOne: false
            referencedRelation: "program_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      program_executions: {
        Row: {
          block_id: string
          completion_percentage: number | null
          created_at: string | null
          day_number: number
          duration_minutes: number | null
          executed_at: string | null
          id: string
          notes: string | null
          program_id: string
          session_data: Json | null
          user_id: string
          user_rating: number | null
          week_number: number
        }
        Insert: {
          block_id: string
          completion_percentage?: number | null
          created_at?: string | null
          day_number: number
          duration_minutes?: number | null
          executed_at?: string | null
          id?: string
          notes?: string | null
          program_id: string
          session_data?: Json | null
          user_id: string
          user_rating?: number | null
          week_number: number
        }
        Update: {
          block_id?: string
          completion_percentage?: number | null
          created_at?: string | null
          day_number?: number
          duration_minutes?: number | null
          executed_at?: string | null
          id?: string
          notes?: string | null
          program_id?: string
          session_data?: Json | null
          user_id?: string
          user_rating?: number | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_executions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "day_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_executions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_executions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_weeks: {
        Row: {
          created_at: string | null
          deload_week: boolean | null
          description: string | null
          focus_areas: string[] | null
          id: string
          program_id: string
          updated_at: string | null
          week_name: string | null
          week_number: number
        }
        Insert: {
          created_at?: string | null
          deload_week?: boolean | null
          description?: string | null
          focus_areas?: string[] | null
          id?: string
          program_id: string
          updated_at?: string | null
          week_name?: string | null
          week_number: number
        }
        Update: {
          created_at?: string | null
          deload_week?: boolean | null
          description?: string | null
          focus_areas?: string[] | null
          id?: string
          program_id?: string
          updated_at?: string | null
          week_name?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_weeks_program_id"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: number
          duration_weeks: number
          equipment_required: string[] | null
          goals: string[] | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          program_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level: number
          duration_weeks?: number
          equipment_required?: string[] | null
          goals?: string[] | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          program_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number
          duration_weeks?: number
          equipment_required?: string[] | null
          goals?: string[] | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          program_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_programs_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      progression_decisions: {
        Row: {
          applied_at: string
          block_id: string
          confidence: number
          created_at: string
          decision: string
          id: string
          new_parameters: Json
          reasoning: string
          rule_id: string | null
          rule_name: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          block_id: string
          confidence: number
          created_at?: string
          decision: string
          id?: string
          new_parameters?: Json
          reasoning: string
          rule_id?: string | null
          rule_name: string
          user_id: string
        }
        Update: {
          applied_at?: string
          block_id?: string
          confidence?: number
          created_at?: string
          decision?: string
          id?: string
          new_parameters?: Json
          reasoning?: string
          rule_id?: string | null
          rule_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progression_decisions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "progression_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      progression_history: {
        Row: {
          block_id: string
          created_at: string
          current_parameters: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          block_id: string
          created_at?: string
          current_parameters?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          block_id?: string
          created_at?: string
          current_parameters?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progression_rules: {
        Row: {
          action_parameters: Json
          action_type: string
          condition_parameters: Json
          condition_type: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          action_parameters?: Json
          action_type: string
          condition_parameters?: Json
          condition_type: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          updated_at?: string
        }
        Update: {
          action_parameters?: Json
          action_type?: string
          condition_parameters?: Json
          condition_type?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      readiness_assessments: {
        Row: {
          assessment_date: string
          created_at: string | null
          fatigue_level: number
          id: string
          motivation_level: number
          sleep_quality: number
          soreness_level: number
          stress_level: number
          user_id: string
        }
        Insert: {
          assessment_date?: string
          created_at?: string | null
          fatigue_level: number
          id?: string
          motivation_level: number
          sleep_quality: number
          soreness_level: number
          stress_level: number
          user_id: string
        }
        Update: {
          assessment_date?: string
          created_at?: string | null
          fatigue_level?: number
          id?: string
          motivation_level?: number
          sleep_quality?: number
          soreness_level?: number
          stress_level?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_day: {
        Row: {
          computed_readiness: number | null
          created_at: string | null
          data_sources: string[] | null
          date: string
          fatigue_level: number | null
          hrv_average: number | null
          id: string
          last_updated: string | null
          motivation_level: number | null
          readiness_category: string | null
          resting_heart_rate: number | null
          sleep_duration: number | null
          sleep_quality: number | null
          soreness_level: number | null
          step_count: number | null
          stress_level: number | null
          training_load: number | null
          user_id: string
        }
        Insert: {
          computed_readiness?: number | null
          created_at?: string | null
          data_sources?: string[] | null
          date: string
          fatigue_level?: number | null
          hrv_average?: number | null
          id?: string
          last_updated?: string | null
          motivation_level?: number | null
          readiness_category?: string | null
          resting_heart_rate?: number | null
          sleep_duration?: number | null
          sleep_quality?: number | null
          soreness_level?: number | null
          step_count?: number | null
          stress_level?: number | null
          training_load?: number | null
          user_id: string
        }
        Update: {
          computed_readiness?: number | null
          created_at?: string | null
          data_sources?: string[] | null
          date?: string
          fatigue_level?: number | null
          hrv_average?: number | null
          id?: string
          last_updated?: string | null
          motivation_level?: number | null
          readiness_category?: string | null
          resting_heart_rate?: number | null
          sleep_duration?: number | null
          sleep_quality?: number | null
          soreness_level?: number | null
          step_count?: number | null
          stress_level?: number | null
          training_load?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_readiness_day_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reps: {
        Row: {
          avg_tempo_ms: number | null
          confidence: number | null
          created_at: string | null
          cues: string[] | null
          duration_ms: number | null
          end_ms: number
          error_count: number | null
          error_types: Json | null
          errors: Json | null
          exercise_metrics: Json | null
          id: string
          idx: number
          is_correct: boolean | null
          peak_depth: number | null
          quality: string | null
          quality_score: number | null
          rom_score: number | null
          session_id: string
          start_ms: number
          tempo: string | null
          valid: boolean | null
        }
        Insert: {
          avg_tempo_ms?: number | null
          confidence?: number | null
          created_at?: string | null
          cues?: string[] | null
          duration_ms?: number | null
          end_ms: number
          error_count?: number | null
          error_types?: Json | null
          errors?: Json | null
          exercise_metrics?: Json | null
          id?: string
          idx: number
          is_correct?: boolean | null
          peak_depth?: number | null
          quality?: string | null
          quality_score?: number | null
          rom_score?: number | null
          session_id: string
          start_ms: number
          tempo?: string | null
          valid?: boolean | null
        }
        Update: {
          avg_tempo_ms?: number | null
          confidence?: number | null
          created_at?: string | null
          cues?: string[] | null
          duration_ms?: number | null
          end_ms?: number
          error_count?: number | null
          error_types?: Json | null
          errors?: Json | null
          exercise_metrics?: Json | null
          id?: string
          idx?: number
          is_correct?: boolean | null
          peak_depth?: number | null
          quality?: string | null
          quality_score?: number | null
          rom_score?: number | null
          session_id?: string
          start_ms?: number
          tempo?: string | null
          valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_quality_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "reps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "verified_sessions_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      session_embeddings: {
        Row: {
          avg_quality: number
          avg_rom: number
          created_at: string | null
          exercise: Database["public"]["Enums"]["exercise_type"]
          feature_vector: Json
          id: string
          session_duration: number
          session_id: string
          total_reps: number
          updated_at: string | null
          user_id: string
          vector_dimensions: number
          vector_version: string
        }
        Insert: {
          avg_quality: number
          avg_rom: number
          created_at?: string | null
          exercise: Database["public"]["Enums"]["exercise_type"]
          feature_vector: Json
          id?: string
          session_duration: number
          session_id: string
          total_reps: number
          updated_at?: string | null
          user_id: string
          vector_dimensions?: number
          vector_version?: string
        }
        Update: {
          avg_quality?: number
          avg_rom?: number
          created_at?: string | null
          exercise?: Database["public"]["Enums"]["exercise_type"]
          feature_vector?: Json
          id?: string
          session_duration?: number
          session_id?: string
          total_reps?: number
          updated_at?: string | null
          user_id?: string
          vector_dimensions?: number
          vector_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_embeddings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_quality_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_embeddings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_embeddings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "verified_sessions_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_embeddings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_metrics: {
        Row: {
          average_rom: number
          average_tempo: number
          block_id: string
          completion_rate: number
          created_at: string
          executed_at: string
          exercise: string
          form_consistency: number
          id: string
          perceived_difficulty: number
          quality_score: number
          session_id: string
          total_reps: number | null
          total_sets: number
          total_time_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_rom: number
          average_tempo: number
          block_id: string
          completion_rate: number
          created_at?: string
          executed_at?: string
          exercise: string
          form_consistency: number
          id?: string
          perceived_difficulty: number
          quality_score: number
          session_id: string
          total_reps?: number | null
          total_sets?: number
          total_time_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_rom?: number
          average_tempo?: number
          block_id?: string
          completion_rate?: number
          created_at?: string
          executed_at?: string
          exercise?: string
          form_consistency?: number
          id?: string
          perceived_difficulty?: number
          quality_score?: number
          session_id?: string
          total_reps?: number | null
          total_sets?: number
          total_time_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_verifications: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          notes: string | null
          passed: boolean
          score: number | null
          session_id: string
          verification_type: string
          verified_by: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          notes?: string | null
          passed: boolean
          score?: number | null
          session_id: string
          verification_type: string
          verified_by: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          notes?: string | null
          passed?: boolean
          score?: number | null
          session_id?: string
          verification_type?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_verifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_quality_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_verifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_verifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "verified_sessions_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          avg_pose_quality: number | null
          avg_quality_score: number | null
          avg_rom_score: number | null
          avg_tempo_ms: number | null
          consistency_score: number | null
          correct_rate: number | null
          device_info: Json | null
          ended_at: string | null
          error_rate: number | null
          exercise: Database["public"]["Enums"]["exercise_type"]
          flag_reason: string | null
          flagged: boolean | null
          form_progression: string | null
          goal_type: string | null
          goal_value: number | null
          id: string
          improvement_trend: number | null
          integrity_score: number | null
          is_public: boolean | null
          notes: string | null
          quality_distribution: Json | null
          quality_score: number | null
          rpe: number | null
          started_at: string
          total_errors: number | null
          total_reps: number | null
          total_time_seconds: number | null
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          avg_pose_quality?: number | null
          avg_quality_score?: number | null
          avg_rom_score?: number | null
          avg_tempo_ms?: number | null
          consistency_score?: number | null
          correct_rate?: number | null
          device_info?: Json | null
          ended_at?: string | null
          error_rate?: number | null
          exercise: Database["public"]["Enums"]["exercise_type"]
          flag_reason?: string | null
          flagged?: boolean | null
          form_progression?: string | null
          goal_type?: string | null
          goal_value?: number | null
          id?: string
          improvement_trend?: number | null
          integrity_score?: number | null
          is_public?: boolean | null
          notes?: string | null
          quality_distribution?: Json | null
          quality_score?: number | null
          rpe?: number | null
          started_at?: string
          total_errors?: number | null
          total_reps?: number | null
          total_time_seconds?: number | null
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          avg_pose_quality?: number | null
          avg_quality_score?: number | null
          avg_rom_score?: number | null
          avg_tempo_ms?: number | null
          consistency_score?: number | null
          correct_rate?: number | null
          device_info?: Json | null
          ended_at?: string | null
          error_rate?: number | null
          exercise?: Database["public"]["Enums"]["exercise_type"]
          flag_reason?: string | null
          flagged?: boolean | null
          form_progression?: string | null
          goal_type?: string | null
          goal_value?: number | null
          id?: string
          improvement_trend?: number | null
          integrity_score?: number | null
          is_public?: boolean | null
          notes?: string | null
          quality_distribution?: Json | null
          quality_score?: number | null
          rpe?: number | null
          started_at?: string
          total_errors?: number | null
          total_reps?: number | null
          total_time_seconds?: number | null
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skeleton_events: {
        Row: {
          affected_joints: number[] | null
          canvas_fps: number | null
          canvas_height: number | null
          canvas_width: number | null
          color_used: string | null
          cpu_usage_percent: number | null
          created_at: string | null
          duration_ms: number | null
          event_type: string
          exercise: string | null
          frame_rate: number | null
          id: string
          memory_usage_mb: number | null
          opacity: number | null
          phase: string | null
          render_time_ms: number | null
          rep_number: number | null
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          affected_joints?: number[] | null
          canvas_fps?: number | null
          canvas_height?: number | null
          canvas_width?: number | null
          color_used?: string | null
          cpu_usage_percent?: number | null
          created_at?: string | null
          duration_ms?: number | null
          event_type: string
          exercise?: string | null
          frame_rate?: number | null
          id?: string
          memory_usage_mb?: number | null
          opacity?: number | null
          phase?: string | null
          render_time_ms?: number | null
          rep_number?: number | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          affected_joints?: number[] | null
          canvas_fps?: number | null
          canvas_height?: number | null
          canvas_width?: number | null
          color_used?: string | null
          cpu_usage_percent?: number | null
          created_at?: string | null
          duration_ms?: number | null
          event_type?: string
          exercise?: string | null
          frame_rate?: number | null
          id?: string
          memory_usage_mb?: number | null
          opacity?: number | null
          phase?: string | null
          render_time_ms?: number | null
          rep_number?: number | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skeleton_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_quality_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "skeleton_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skeleton_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "verified_sessions_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          features: Json
          id: string
          is_active: boolean | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          tier: string
        }
        Insert: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          tier: string
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          tier?: string
        }
        Relationships: []
      }
      user_active_programs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_day_number: number
          current_week_number: number
          id: string
          is_active: boolean | null
          program_id: string
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_day_number?: number
          current_week_number?: number
          id?: string
          is_active?: boolean | null
          program_id: string
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_day_number?: number
          current_week_number?: number
          id?: string
          is_active?: boolean | null
          program_id?: string
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_active_programs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          activity_level: string | null
          calorie_target: number
          carbs_target: number
          created_at: string | null
          fat_target: number
          fiber_target: number
          goal_type: string | null
          id: string
          protein_target: number
          sodium_target: number
          sugar_target: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_level?: string | null
          calorie_target?: number
          carbs_target?: number
          created_at?: string | null
          fat_target?: number
          fiber_target?: number
          goal_type?: string | null
          id?: string
          protein_target?: number
          sodium_target?: number
          sugar_target?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_level?: string | null
          calorie_target?: number
          carbs_target?: number
          created_at?: string | null
          fat_target?: number
          fiber_target?: number
          goal_type?: string | null
          id?: string
          protein_target?: number
          sodium_target?: number
          sugar_target?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plan_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          day_number: number
          id: string
          notes: string | null
          rating: number | null
          session_data: Json | null
          user_plan_id: string
          week_number: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          day_number: number
          id?: string
          notes?: string | null
          rating?: number | null
          session_data?: Json | null
          user_plan_id: string
          week_number: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          day_number?: number
          id?: string
          notes?: string | null
          rating?: number | null
          session_data?: Json | null
          user_plan_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_progress_user_plan_id_fkey"
            columns: ["user_plan_id"]
            isOneToOne: false
            referencedRelation: "user_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_day: number | null
          current_week: number | null
          id: string
          is_active: boolean | null
          is_completed: boolean | null
          is_custom: boolean | null
          name: string
          plan_data: Json
          started_at: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_day?: number | null
          current_week?: number | null
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          is_custom?: boolean | null
          name: string
          plan_data: Json
          started_at?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_day?: number | null
          current_week?: number | null
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          is_custom?: boolean | null
          name?: string
          plan_data?: Json
          started_at?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "plan_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          duration_seconds: number | null
          ended_at: string | null
          errors_count: number | null
          events_count: number | null
          id: string
          ip_address: unknown
          metadata: Json | null
          page_views: number | null
          referrer: string | null
          session_id: string
          started_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          duration_seconds?: number | null
          ended_at?: string | null
          errors_count?: number | null
          events_count?: number | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          page_views?: number | null
          referrer?: string | null
          session_id: string
          started_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          duration_seconds?: number | null
          ended_at?: string | null
          errors_count?: number | null
          events_count?: number | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          page_views?: number | null
          referrer?: string | null
          session_id?: string
          started_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_subscriptions_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_plans: {
        Row: {
          confidence_score: number
          created_at: string | null
          generation_method: string
          id: string
          is_active: boolean | null
          plan_data: Json
          updated_at: string | null
          user_id: string
          week_start_date: string
        }
        Insert: {
          confidence_score: number
          created_at?: string | null
          generation_method: string
          id?: string
          is_active?: boolean | null
          plan_data: Json
          updated_at?: string | null
          user_id: string
          week_start_date: string
        }
        Update: {
          confidence_score?: number
          created_at?: string | null
          generation_method?: string
          id?: string
          is_active?: boolean | null
          plan_data?: Json
          updated_at?: string | null
          user_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_targets: {
        Row: {
          created_at: string | null
          exercise: string
          id: string
          intensity: string
          notes: string | null
          target_reps: number | null
          target_time_seconds: number | null
          user_id: string
          volume: string
        }
        Insert: {
          created_at?: string | null
          exercise: string
          id?: string
          intensity: string
          notes?: string | null
          target_reps?: number | null
          target_time_seconds?: number | null
          user_id: string
          volume: string
        }
        Update: {
          created_at?: string | null
          exercise?: string
          id?: string
          intensity?: string
          notes?: string | null
          target_reps?: number | null
          target_time_seconds?: number | null
          user_id?: string
          volume?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_summary: {
        Row: {
          date: string | null
          event_count: number | null
          event_type: string | null
          unique_sessions: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      daily_totals: {
        Row: {
          date: string | null
          item_count: number | null
          meal_count: number | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_fiber: number | null
          total_protein: number | null
          total_sodium: number | null
          total_sugar: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_summary: {
        Row: {
          affected_sessions: number | null
          affected_users: number | null
          component: string | null
          error_count: number | null
          error_level: string | null
          hour: string | null
        }
        Relationships: []
      }
      health_readiness_scores: {
        Row: {
          date: string | null
          hrv: number | null
          readiness_category: string | null
          readiness_score: number | null
          resting_heart_rate: number | null
          sleep_duration: number | null
          step_count: number | null
          training_load: number | null
          user_id: string | null
        }
        Insert: {
          date?: string | null
          hrv?: number | null
          readiness_category?: never
          readiness_score?: never
          resting_heart_rate?: number | null
          sleep_duration?: number | null
          step_count?: number | null
          training_load?: number | null
          user_id?: string | null
        }
        Update: {
          date?: string | null
          hrv?: number | null
          readiness_category?: never
          readiness_score?: never
          resting_heart_rate?: number | null
          sleep_duration?: number | null
          step_count?: number | null
          training_load?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hint_effectiveness: {
        Row: {
          follow_rate: number | null
          followed_count: number | null
          hint_key: string | null
          severity: string | null
          total_hints: number | null
        }
        Relationships: []
      }
      performance_summary: {
        Row: {
          avg_value: number | null
          component: string | null
          hour: string | null
          max_value: number | null
          metric_name: string | null
          min_value: number | null
          sample_count: number | null
        }
        Relationships: []
      }
      session_quality_summary: {
        Row: {
          avg_fps: number | null
          avg_stability: number | null
          avg_visibility: number | null
          max_fps: number | null
          metric_count: number | null
          min_visibility: number | null
          session_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skeleton_performance: {
        Row: {
          avg_cpu: number | null
          avg_frame_rate: number | null
          avg_render_time: number | null
          event_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      verified_sessions_summary: {
        Row: {
          avg_rom_score: number | null
          avg_tempo_ms: number | null
          checks_failed: number | null
          checks_passed: number | null
          ended_at: string | null
          exercise: Database["public"]["Enums"]["exercise_type"] | null
          flag_reason: string | null
          flagged: boolean | null
          id: string | null
          integrity_score: number | null
          started_at: string | null
          total_reps: number | null
          total_time_seconds: number | null
          user_id: string | null
          verification_checks_run: number | null
          verified: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_verify_session: { Args: { p_session_id: string }; Returns: Json }
      calculate_daily_totals: {
        Args: { p_date: string; p_user_id: string }
        Returns: {
          total_calories: number
          total_carbs: number
          total_fat: number
          total_fiber: number
          total_protein: number
          total_sodium: number
          total_sugar: number
        }[]
      }
      calculate_health_readiness_score: {
        Args: { p_date: string; p_user_id: string }
        Returns: number
      }
      calculate_organization_adherence: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: Json
      }
      calculate_organization_form_iq: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: Json
      }
      calculate_organization_verified_minutes: {
        Args: {
          p_end_date: string
          p_organization_id: string
          p_start_date: string
        }
        Returns: Json
      }
      calculate_quality_score: {
        Args: { p_form: number; p_rom: number; p_tempo: number }
        Returns: number
      }
      calculate_readiness_score: {
        Args: {
          p_fatigue: number
          p_hrv: number
          p_motivation: number
          p_resting_hr: number
          p_sleep_duration: number
          p_sleep_quality: number
          p_soreness: number
          p_steps: number
          p_stress: number
          p_training_load: number
        }
        Returns: number
      }
      calculate_session_integrity_score: {
        Args: { p_session_id: string }
        Returns: number
      }
      calculate_session_quality_score: {
        Args: { session_id: string }
        Returns: number
      }
      calculate_stability_score: {
        Args: { session_id_param: string }
        Returns: number
      }
      check_and_increment_ai_credits: {
        Args: { p_user_id: string }
        Returns: {
          can_use_ai: boolean
          credits_limit: number
          credits_remaining: number
          credits_used: number
          reset_at: string
        }[]
      }
      check_top_10_entry: {
        Args: { p_exercise: string; p_time_filter?: string; p_user_id: string }
        Returns: {
          entered: boolean
          leaderboards: string[]
        }[]
      }
      check_top10_entry: {
        Args: { p_exercise: string; p_time_filter: string; p_user_id: string }
        Returns: {
          entered: boolean
          leaderboards: string[]
        }[]
      }
      check_user_exists: { Args: { p_email: string }; Returns: boolean }
      cleanup_old_analytics_data: { Args: never; Returns: undefined }
      create_user_plan_from_template: {
        Args: {
          p_custom_name?: string
          p_template_id: string
          p_user_id: string
        }
        Returns: string
      }
      evaluate_progression_rules: {
        Args: { p_block_id: string; p_user_id: string }
        Returns: {
          confidence: number
          decision: string
          new_parameters: Json
          reasoning: string
          rule_id: string
          rule_name: string
        }[]
      }
      find_similar_sessions: {
        Args: {
          p_exercise?: Database["public"]["Enums"]["exercise_type"]
          p_limit?: number
          p_min_similarity?: number
          p_session_id: string
          p_user_id: string
        }
        Returns: {
          avg_quality: number
          avg_rom: number
          created_at: string
          exercise: Database["public"]["Enums"]["exercise_type"]
          similar_session_id: string
          similarity: number
          total_reps: number
        }[]
      }
      get_activity_comment_count: {
        Args: { activity_id_param: string }
        Returns: number
      }
      get_activity_like_count: {
        Args: { activity_id_param: string }
        Returns: number
      }
      get_current_plan: {
        Args: { p_user_id: string }
        Returns: {
          completed_sessions: number
          completion_percentage: number
          confidence_score: number
          generation_method: string
          plan_data: Json
          plan_id: string
          sessions_count: number
          week_start_date: string
        }[]
      }
      get_current_streak: { Args: { p_user_id: string }; Returns: number }
      get_day_blocks: {
        Args: { p_program_day_id: string }
        Returns: {
          block_id: string
          block_order: number
          block_type: string
          coach_template: string
          duration_minutes: number
          intensity_level: number
          notes: string
          template_config: Json
          template_description: string
          template_display_name: string
        }[]
      }
      get_effective_daily_targets: {
        Args: { p_date: string; p_user_id: string }
        Returns: {
          calorie_target: number
          carbs_target: number
          fat_target: number
          fiber_target: number
          protein_target: number
          sodium_target: number
          sugar_target: number
        }[]
      }
      get_featured_plans: {
        Args: never
        Returns: {
          avg_session_duration: number
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: number
          duration_weeks: number
          equipment_required: string[] | null
          goal_type: string
          id: string
          is_featured: boolean | null
          name: string
          plan_structure: Json
          preview_image_url: string | null
          sessions_per_week: number
          tags: string[] | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "plan_templates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_latest_readiness: {
        Args: { p_user_id: string }
        Returns: {
          assessed_at: string
          energy_level: number
          id: string
          motivation: number
          notes: string
          overall_readiness: number
          sleep_quality: number
          soreness_level: number
          stress_level: number
        }[]
      }
      get_leaderboard_by_correct_rate: {
        Args: {
          p_exercise: string
          p_limit?: number
          p_time_filter: string
          p_verified_only?: boolean
        }
        Returns: {
          avg_quality_score: number
          best_session_date: string
          correct_rate: number
          exercise: string
          integrity_score: number
          last_session_date: string
          rank: number
          total_reps: number
          total_sessions: number
          total_volume: number
          user_email: string
          user_id: string
        }[]
      }
      get_leaderboard_by_exercise: {
        Args: {
          p_exercise: string
          p_limit?: number
          p_time_filter: string
          p_verified_only?: boolean
        }
        Returns: {
          avg_quality_score: number
          best_session_date: string
          correct_rate: number
          exercise: string
          integrity_score: number
          last_session_date: string
          rank: number
          total_reps: number
          total_sessions: number
          total_volume: number
          user_email: string
          user_id: string
        }[]
      }
      get_leaderboard_by_exercise_paginated: {
        Args: {
          p_exercise: string
          p_limit?: number
          p_offset?: number
          p_sort_by?: string
          p_time_filter: string
          p_verified_only?: boolean
        }
        Returns: {
          avg_quality_score: number
          best_session_date: string
          correct_rate: number
          exercise: string
          integrity_score: number
          last_session_date: string
          rank: number
          total_entries: number
          total_reps: number
          total_sessions: number
          total_volume: number
          user_email: string
          user_id: string
          verified_sessions: number
        }[]
      }
      get_leaderboard_by_volume: {
        Args: {
          p_exercise: string
          p_limit?: number
          p_time_filter: string
          p_verified_only?: boolean
        }
        Returns: {
          avg_quality_score: number
          best_session_date: string
          correct_rate: number
          exercise: string
          integrity_score: number
          last_session_date: string
          rank: number
          total_reps: number
          total_sessions: number
          total_volume: number
          user_email: string
          user_id: string
        }[]
      }
      get_organization_dashboard_data: {
        Args: { p_organization_id: string; p_time_range?: string }
        Returns: Json
      }
      get_organization_stats: { Args: never; Returns: Json }
      get_overall_leaderboard: {
        Args: {
          p_limit?: number
          p_time_filter: string
          p_verified_only?: boolean
        }
        Returns: {
          avg_quality_score: number
          best_session_date: string
          correct_rate: number
          exercise: string
          integrity_score: number
          last_session_date: string
          rank: number
          total_reps: number
          total_sessions: number
          total_volume: number
          user_email: string
          user_id: string
        }[]
      }
      get_overall_leaderboard_paginated: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_sort_by?: string
          p_time_filter: string
          p_verified_only?: boolean
        }
        Returns: {
          avg_quality_score: number
          best_session_date: string
          correct_rate: number
          exercise: string
          integrity_score: number
          last_session_date: string
          rank: number
          total_entries: number
          total_reps: number
          total_sessions: number
          total_volume: number
          user_email: string
          user_id: string
          verified_sessions: number
        }[]
      }
      get_pack_with_purchase_status: {
        Args: { pack_uuid: string; user_uuid?: string }
        Returns: {
          is_purchased: boolean
          pack_data: Json
          user_review: Json
        }[]
      }
      get_public_activities: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          activity_id: string
          activity_timestamp: string
          activity_type: string
          comment_count: number
          description: string
          is_liked: boolean
          like_count: number
          metrics: Json
          user_id: string
          username: string
        }[]
      }
      get_readiness_category: { Args: { p_score: number }; Returns: string }
      get_recent_session_quality: {
        Args: { p_block_id: string; p_limit?: number; p_user_id: string }
        Returns: {
          executed_at: string
          exercise: string
          quality_score: number
          session_id: string
        }[]
      }
      get_subscription_plan_by_tier: {
        Args: { tier_param: string }
        Returns: {
          id: string
          is_active: boolean
          name: string
          price_monthly: number
          price_yearly: number
          stripe_price_id_monthly: string
          stripe_price_id_yearly: string
          tier: string
        }[]
      }
      get_user_active_plan: {
        Args: { p_user_id: string }
        Returns: {
          completed_at: string | null
          created_at: string | null
          current_day: number | null
          current_week: number | null
          id: string
          is_active: boolean | null
          is_completed: boolean | null
          is_custom: boolean | null
          name: string
          plan_data: Json
          started_at: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_active_program: {
        Args: { p_user_id: string }
        Returns: {
          blocks_count: number
          current_day_number: number
          current_week_number: number
          day_name: string
          is_rest_day: boolean
          program_id: string
          program_name: string
          total_duration_minutes: number
          week_name: string
        }[]
      }
      get_user_analytics_summary: {
        Args: { p_user_id: string }
        Returns: {
          avg_session_duration: number
          error_rate: number
          most_active_hour: number
          total_errors: number
          total_events: number
          total_sessions: number
        }[]
      }
      get_user_best_session: {
        Args: {
          p_exercise: Database["public"]["Enums"]["exercise_type"]
          p_user_id: string
        }
        Returns: {
          avg_quality: number
          avg_rom: number
          created_at: string
          is_best_quality: boolean
          is_best_reps: boolean
          is_best_rom: boolean
          session_id: string
          total_reps: number
        }[]
      }
      get_user_by_email: {
        Args: { p_email: string }
        Returns: {
          created_at: string
          email: string
          email_confirmed_at: string
          id: string
        }[]
      }
      get_user_coaching_insights: {
        Args: {
          days_back?: number
          exercise_param?: string
          user_id_param: string
        }
        Returns: {
          follow_rate: number
          frequency: number
          hint_key: string
          last_shown: string
          message: string
        }[]
      }
      get_user_depth_sparkline: {
        Args: {
          p_exercise: string
          p_limit?: number
          p_time_filter: string
          p_user_id: string
          p_verified_only?: boolean
        }
        Returns: {
          avg_depth: number
          session_count: number
          session_date: string
        }[]
      }
      get_user_overall_rank: {
        Args: {
          p_time_filter: string
          p_user_id: string
          p_verified_only?: boolean
        }
        Returns: {
          avg_quality_score: number
          best_session_date: string
          correct_rate: number
          exercise: string
          integrity_score: number
          last_session_date: string
          percentile: number
          rank: number
          total_entries: number
          total_reps: number
          total_sessions: number
          total_volume: number
          user_email: string
          user_id: string
        }[]
      }
      get_user_rank: {
        Args: {
          p_exercise: string
          p_time_filter: string
          p_user_id: string
          p_verified_only?: boolean
        }
        Returns: {
          avg_quality_score: number
          best_session_date: string
          correct_rate: number
          exercise: string
          integrity_score: number
          last_session_date: string
          percentile: number
          rank: number
          total_entries: number
          total_reps: number
          total_sessions: number
          total_volume: number
          user_email: string
          user_id: string
        }[]
      }
      get_user_rank_with_context: {
        Args: {
          p_exercise: string
          p_sort_by?: string
          p_time_filter: string
          p_user_id: string
          p_verified_only?: boolean
        }
        Returns: {
          avg_quality_score: number
          best_session_date: string
          correct_rate: number
          exercise: string
          integrity_score: number
          is_current_user: boolean
          last_session_date: string
          rank: number
          total_entries: number
          total_reps: number
          total_sessions: number
          total_volume: number
          user_email: string
          user_id: string
          verified_sessions: number
        }[]
      }
      get_user_subscription_tier: {
        Args: { user_id_param: string }
        Returns: string
      }
      refresh_daily_totals: { Args: never; Returns: undefined }
      reset_expired_ai_credits: { Args: never; Returns: undefined }
      update_goal_achievements: {
        Args: { p_date: string; p_user_id: string }
        Returns: undefined
      }
      user_has_feature_access: {
        Args: { feature_name: string; user_id_param: string }
        Returns: boolean
      }
      user_has_purchased_pack: {
        Args: { pack_uuid: string; user_uuid: string }
        Returns: boolean
      }
      user_liked_activity: {
        Args: { activity_id_param: string; user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      exercise_type: "squat" | "pushup" | "plank"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      exercise_type: ["squat", "pushup", "plank"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
    },
  },
} as const
