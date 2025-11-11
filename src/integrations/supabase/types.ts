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
          position: number | null
          query: string
          query_index: number | null
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
          position?: number | null
          query: string
          query_index?: number | null
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
          position?: number | null
          query?: string
          query_index?: number | null
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
          avg_position: number | null
          brand_id: string
          brand_name: string
          citation_count: number | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          mention_rate: number | null
          progress: number | null
          queries_completed: number | null
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
          avg_position?: number | null
          brand_id: string
          brand_name: string
          citation_count?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          mention_rate?: number | null
          progress?: number | null
          queries_completed?: number | null
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
          avg_position?: number | null
          brand_id?: string
          brand_name?: string
          citation_count?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          mention_rate?: number | null
          progress?: number | null
          queries_completed?: number | null
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
      competitors: {
        Row: {
          brand_id: string
          competitor_name: string
          created_at: string
          delta: number
          id: string
          score: number
        }
        Insert: {
          brand_id: string
          competitor_name: string
          created_at?: string
          delta?: number
          id?: string
          score?: number
        }
        Update: {
          brand_id?: string
          competitor_name?: string
          created_at?: string
          delta?: number
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_competitors_brand"
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
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          plan: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          plan?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
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
    }
    Functions: {
      can_add_brand: { Args: { user_uuid: string }; Returns: boolean }
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
