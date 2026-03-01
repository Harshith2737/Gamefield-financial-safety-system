export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          level: number
          xp: number
          total_scenarios_played: number
          total_correct_choices: number
          streak_days: number
          last_played_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          level?: number
          xp?: number
          total_scenarios_played?: number
          total_correct_choices?: number
          streak_days?: number
          last_played_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          level?: number
          xp?: number
          total_scenarios_played?: number
          total_correct_choices?: number
          streak_days?: number
          last_played_at?: string | null
          updated_at?: string
        }
      }
      scenarios: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          category: 'fake_loan' | 'kyc_fraud' | 'refund_scam' | 'upi_scam' | 'phishing' | 'lottery_scam'
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          xp_reward: number
          thumbnail_emoji: string
          is_active: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description: string
          category: 'fake_loan' | 'kyc_fraud' | 'refund_scam' | 'upi_scam' | 'phishing' | 'lottery_scam'
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          xp_reward?: number
          thumbnail_emoji?: string
          is_active?: boolean
          order_index?: number
        }
        Update: Partial<Database['public']['Tables']['scenarios']['Insert']>
      }
      scenario_steps: {
        Row: {
          id: string
          scenario_id: string
          step_order: number
          message_type: 'sms' | 'call' | 'whatsapp' | 'email' | 'app_screen' | 'popup'
          sender: string
          content: string
          context_note: string | null
          is_entry_point: boolean
          created_at: string
        }
        Insert: {
          id?: string
          scenario_id: string
          step_order: number
          message_type: 'sms' | 'call' | 'whatsapp' | 'email' | 'app_screen' | 'popup'
          sender: string
          content: string
          context_note?: string | null
          is_entry_point?: boolean
        }
        Update: Partial<Database['public']['Tables']['scenario_steps']['Insert']>
      }
      scenario_choices: {
        Row: {
          id: string
          step_id: string
          choice_text: string
          is_safe: boolean
          feedback_title: string
          feedback_explanation: string
          red_flags: string[] | null
          xp_gained: number
          next_step_id: string | null
          is_terminal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          step_id: string
          choice_text: string
          is_safe: boolean
          feedback_title: string
          feedback_explanation: string
          red_flags?: string[] | null
          xp_gained?: number
          next_step_id?: string | null
          is_terminal?: boolean
        }
        Update: Partial<Database['public']['Tables']['scenario_choices']['Insert']>
      }
      user_scenario_progress: {
        Row: {
          id: string
          user_id: string
          scenario_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          score: number
          correct_choices: number
          total_choices: number
          completed_at: string | null
          started_at: string
        }
        Insert: {
          id?: string
          user_id: string
          scenario_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          score?: number
          correct_choices?: number
          total_choices?: number
          completed_at?: string | null
          started_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_scenario_progress']['Insert']>
      }
      badges: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          emoji: string
          category: 'scenario' | 'streak' | 'level' | 'special'
          requirement_type: string
          requirement_value: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description: string
          emoji: string
          category: 'scenario' | 'streak' | 'level' | 'special'
          requirement_type: string
          requirement_value: number
        }
        Update: Partial<Database['public']['Tables']['badges']['Insert']>
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_badges']['Insert']>
      }
      quick_check_logs: {
        Row: {
          id: string
          user_id: string | null
          input_text: string
          result: 'safe' | 'suspicious' | 'dangerous'
          risk_score: number
          red_flags_found: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          input_text: string
          result: 'safe' | 'suspicious' | 'dangerous'
          risk_score: number
          red_flags_found?: string[] | null
        }
        Update: Partial<Database['public']['Tables']['quick_check_logs']['Insert']>
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Scenario = Database['public']['Tables']['scenarios']['Row']
export type ScenarioStep = Database['public']['Tables']['scenario_steps']['Row']
export type ScenarioChoice = Database['public']['Tables']['scenario_choices']['Row']
export type UserScenarioProgress = Database['public']['Tables']['user_scenario_progress']['Row']
export type Badge = Database['public']['Tables']['badges']['Row']
export type UserBadge = Database['public']['Tables']['user_badges']['Row']
export type QuickCheckLog = Database['public']['Tables']['quick_check_logs']['Row']
