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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_allowance_periods: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          period_end: string
          period_start: string
          source: string | null
          tokens_granted: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          period_end: string
          period_start: string
          source?: string | null
          tokens_granted?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          period_end?: string
          period_start?: string
          source?: string | null
          tokens_granted?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_credit_settings: {
        Row: {
          description: string | null
          key: string
          value_int: number
        }
        Insert: {
          description?: string | null
          key: string
          value_int: number
        }
        Update: {
          description?: string | null
          key?: string
          value_int?: number
        }
        Relationships: []
      }
      ai_engine_weights: {
        Row: {
          created_at: string
          engine_key: string
          engine_query: string
          id: string
          trend_value: number
          weight: number
        }
        Insert: {
          created_at?: string
          engine_key: string
          engine_query: string
          id?: string
          trend_value: number
          weight: number
        }
        Update: {
          created_at?: string
          engine_key?: string
          engine_query?: string
          id?: string
          trend_value?: number
          weight?: number
        }
        Relationships: []
      }
      analyses: {
        Row: {
          ai_engine: string
          brand_id: string
          context: string | null
          full_response: string | null
          id: string
          mention_type: string | null
          mentioned: boolean | null
          occurred_at: string
          points_earned: number | null
          position: number | null
          query: string
          query_index: number | null
          question_type: string | null
          question_weight: number | null
          run_id: string
          sentiment: string | null
          url: string | null
        }
        Insert: {
          ai_engine: string
          brand_id: string
          context?: string | null
          full_response?: string | null
          id?: string
          mention_type?: string | null
          mentioned?: boolean | null
          occurred_at?: string
          points_earned?: number | null
          position?: number | null
          query: string
          query_index?: number | null
          question_type?: string | null
          question_weight?: number | null
          run_id?: string
          sentiment?: string | null
          url?: string | null
        }
        Update: {
          ai_engine?: string
          brand_id?: string
          context?: string | null
          full_response?: string | null
          id?: string
          mention_type?: string | null
          mentioned?: boolean | null
          occurred_at?: string
          points_earned?: number | null
          position?: number | null
          query?: string
          query_index?: number | null
          question_type?: string | null
          question_weight?: number | null
          run_id?: string
          sentiment?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_analyses_brand"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_runs: {
        Row: {
          ai_engine: string | null
          avg_position: number | null
          brand_id: string
          brand_name: string
          citation_count: number | null
          competitor_1_gap: string | null
          competitor_1_name: string | null
          competitor_1_score: number | null
          competitor_2_gap: string | null
          competitor_2_name: string | null
          competitor_2_score: number | null
          competitor_3_gap: string | null
          competitor_3_name: string | null
          competitor_3_score: number | null
          competitor_data: Json | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          error_message: string | null
          id: string
          mention_rate: number | null
          monitoring_config_id: string | null
          progress: number | null
          queries_completed: number | null
          retry_count: number | null
          run_id: string
          status: string
          top_position_count: number | null
          topic: string
          total_mentions: number | null
          total_queries: number | null
          updated_at: string
          user_id: string
          visibility_score: number | null
        }
        Insert: {
          ai_engine?: string | null
          avg_position?: number | null
          brand_id: string
          brand_name: string
          citation_count?: number | null
          competitor_1_gap?: string | null
          competitor_1_name?: string | null
          competitor_1_score?: number | null
          competitor_2_gap?: string | null
          competitor_2_name?: string | null
          competitor_2_score?: number | null
          competitor_3_gap?: string | null
          competitor_3_name?: string | null
          competitor_3_score?: number | null
          competitor_data?: Json | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          mention_rate?: number | null
          monitoring_config_id?: string | null
          progress?: number | null
          queries_completed?: number | null
          retry_count?: number | null
          run_id: string
          status: string
          top_position_count?: number | null
          topic: string
          total_mentions?: number | null
          total_queries?: number | null
          updated_at?: string
          user_id: string
          visibility_score?: number | null
        }
        Update: {
          ai_engine?: string | null
          avg_position?: number | null
          brand_id?: string
          brand_name?: string
          citation_count?: number | null
          competitor_1_gap?: string | null
          competitor_1_name?: string | null
          competitor_1_score?: number | null
          competitor_2_gap?: string | null
          competitor_2_name?: string | null
          competitor_2_score?: number | null
          competitor_3_gap?: string | null
          competitor_3_name?: string | null
          competitor_3_score?: number | null
          competitor_data?: Json | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          mention_rate?: number | null
          monitoring_config_id?: string | null
          progress?: number | null
          queries_completed?: number | null
          retry_count?: number | null
          run_id?: string
          status?: string
          top_position_count?: number | null
          topic?: string
          total_mentions?: number | null
          total_queries?: number | null
          updated_at?: string
          user_id?: string
          visibility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_runs_monitoring_config_id_fkey"
            columns: ["monitoring_config_id"]
            isOneToOne: false
            referencedRelation: "monitoring_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_runs_monitoring_config_id_fkey"
            columns: ["monitoring_config_id"]
            isOneToOne: false
            referencedRelation: "monitoring_configs_due"
            referencedColumns: ["config_id"]
          },
          {
            foreignKeyName: "fk_analysis_runs_brand"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          competitor_1: string | null
          competitor_2: string | null
          competitor_3: string | null
          created_at: string
          id: string
          last_run: string | null
          name: string
          topic: string
          updated_at: string
          user_id: string
          visibility_score: number
        }
        Insert: {
          competitor_1?: string | null
          competitor_2?: string | null
          competitor_3?: string | null
          created_at?: string
          id?: string
          last_run?: string | null
          name: string
          topic: string
          updated_at?: string
          user_id: string
          visibility_score?: number
        }
        Update: {
          competitor_1?: string | null
          competitor_2?: string | null
          competitor_3?: string | null
          created_at?: string
          id?: string
          last_run?: string | null
          name?: string
          topic?: string
          updated_at?: string
          user_id?: string
          visibility_score?: number
        }
        Relationships: []
      }
      coach_conversations: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          message: string
          role: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          message: string
          role: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          message?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_conversations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          run_id: string | null
          text: string
          type: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          run_id?: string | null
          text: string
          type: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          run_id?: string | null
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_insights_brand"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_usage_events: {
        Row: {
          completion_tokens: number
          created_at: string
          credits_charged: number
          feature: string | null
          id: string
          idempotency_key: string
          metadata: Json
          model: string | null
          prompt_tokens: number
          provider: string | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          credits_charged?: number
          feature?: string | null
          id?: string
          idempotency_key: string
          metadata?: Json
          model?: string | null
          prompt_tokens?: number
          provider?: string | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          credits_charged?: number
          feature?: string | null
          id?: string
          idempotency_key?: string
          metadata?: Json
          model?: string | null
          prompt_tokens?: number
          provider?: string | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      monitoring_configs: {
        Row: {
          active: boolean | null
          brand_id: string
          created_at: string
          enabled_engines: string[]
          frequency: string
          id: string
          last_run_at: string | null
          next_run_at: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          brand_id: string
          created_at?: string
          enabled_engines?: string[]
          frequency: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          brand_id?: string
          created_at?: string
          enabled_engines?: string[]
          frequency?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_monitoring_configs_brand"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          plan: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          plan?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          plan?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          id: number
          ip_hash: string
          last_run: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          ip_hash: string
          last_run: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          ip_hash?: string
          last_run?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          active_until: string | null
          plan: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_until?: string | null
          plan?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_until?: string | null
          plan?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      ai_engine_weights_latest: {
        Row: {
          created_at: string | null
          engine_key: string | null
          engine_query: string | null
          trend_value: number | null
          weight: number | null
        }
        Relationships: []
      }
      analysis_run_summary: {
        Row: {
          actual_mentions_count: number | null
          actual_results_count: number | null
          avg_position: number | null
          brand_id: string | null
          brand_name: string | null
          citation_count: number | null
          completed_at: string | null
          created_at: string | null
          id: string | null
          mention_rate: number | null
          progress: number | null
          queries_completed: number | null
          run_id: string | null
          status: string | null
          top_position_count: number | null
          topic: string | null
          total_mentions: number | null
          total_queries: number | null
          updated_at: string | null
          visibility_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_analysis_runs_brand"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      latest_brand_analyses: {
        Row: {
          brand_id: string | null
          brand_name: string | null
          completed_at: string | null
          created_at: string | null
          id: string | null
          mention_rate: number | null
          run_id: string | null
          status: string | null
          topic: string | null
          total_mentions: number | null
          visibility_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_analysis_runs_brand"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_configs_due: {
        Row: {
          brand_id: string | null
          brand_name: string | null
          config_id: string | null
          enabled_engines: string[] | null
          frequency: string | null
          last_run_at: string | null
          next_run_at: string | null
          topic: string | null
          user_id: string | null
          user_plan: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_monitoring_configs_brand"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ai_allowance_current: {
        Row: {
          created_at: string | null
          credits_granted: number | null
          credits_used: number | null
          id: string | null
          metadata: Json | null
          period_end: string | null
          period_start: string | null
          remaining_credits: number | null
          remaining_tokens: number | null
          source: string | null
          tokens_granted: number | null
          tokens_per_credit: number | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_next_run_at: { Args: { p_frequency: string }; Returns: string }
      can_add_brand: { Args: { user_uuid: string }; Returns: boolean }
      can_create_monitoring_config: {
        Args: { p_brand_id: string; p_user_id: string }
        Returns: {
          can_create: boolean
          reason: string
        }[]
      }
      get_analysis_progress: {
        Args: { p_run_id: string }
        Returns: {
          error_message: string
          progress: number
          queries_completed: number
          run_id: string
          status: string
          total_mentions: number
          total_queries: number
          visibility_score: number
        }[]
      }
      get_user_plan: { Args: { user_uuid: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
