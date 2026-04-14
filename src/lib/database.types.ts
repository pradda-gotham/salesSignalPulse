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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      dossiers: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          org_id: string
          signal_id: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          org_id: string
          signal_id?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          org_id?: string
          signal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: true
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_audit_log: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          dossier_id: string
          field_path: string
          id: string
          new_value: Json
          org_id: string
          previous_value: Json
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          dossier_id: string
          field_path: string
          id?: string
          new_value: Json
          org_id: string
          previous_value: Json
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          dossier_id?: string
          field_path?: string
          id?: string
          new_value?: Json
          org_id?: string
          previous_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "estimate_audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hunt_logs: {
        Row: {
          completed_at: string | null
          error: string | null
          id: string
          org_id: string
          signals_found: number | null
          started_at: string | null
          status: string | null
          trigger_id: string | null
        }
        Insert: {
          completed_at?: string | null
          error?: string | null
          id?: string
          org_id: string
          signals_found?: number | null
          started_at?: string | null
          status?: string | null
          trigger_id?: string | null
        }
        Update: {
          completed_at?: string | null
          error?: string | null
          id?: string
          org_id?: string
          signals_found?: number | null
          started_at?: string | null
          status?: string | null
          trigger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hunt_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hunt_logs_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          business_profile: Json | null
          created_at: string | null
          id: string
          name: string
          onboarding_status: string | null
          website_url: string | null
        }
        Insert: {
          business_profile?: Json | null
          created_at?: string | null
          id?: string
          name: string
          onboarding_status?: string | null
          website_url?: string | null
        }
        Update: {
          business_profile?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          onboarding_status?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      product_catalog: {
        Row: {
          category: string
          cost_basis: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          sku: string
          unit: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          category?: string
          cost_basis?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          sku: string
          unit?: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          cost_basis?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          sku?: string
          unit?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_catalog_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_cards: {
        Row: {
          category: string
          created_at: string | null
          default_rate: number
          description: string
          id: string
          is_active: boolean | null
          org_id: string
          region: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          default_rate: number
          description: string
          id?: string
          is_active?: boolean | null
          org_id: string
          region?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          default_rate?: number
          description?: string
          id?: string
          is_active?: boolean | null
          org_id?: string
          region?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_cards_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          confidence: string | null
          contacted_at: string | null
          created_at: string | null
          decision_maker: string | null
          fingerprint: string
          found_at: string | null
          headline: string
          id: string
          matched_products: string[] | null
          org_id: string
          score: number | null
          source_title: string | null
          source_url: string | null
          status: string | null
          summary: string | null
          tracked_website_id: string | null
          trigger_id: string | null
          urgency: string | null
        }
        Insert: {
          confidence?: string | null
          contacted_at?: string | null
          created_at?: string | null
          decision_maker?: string | null
          fingerprint: string
          found_at?: string | null
          headline: string
          id?: string
          matched_products?: string[] | null
          org_id: string
          score?: number | null
          source_title?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          tracked_website_id?: string | null
          trigger_id?: string | null
          urgency?: string | null
        }
        Update: {
          confidence?: string | null
          contacted_at?: string | null
          created_at?: string | null
          decision_maker?: string | null
          fingerprint?: string
          found_at?: string | null
          headline?: string
          id?: string
          matched_products?: string[] | null
          org_id?: string
          score?: number | null
          source_title?: string | null
          source_url?: string | null
          status?: string | null
          summary?: string | null
          tracked_website_id?: string | null
          trigger_id?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_tracked_website_id_fkey"
            columns: ["tracked_website_id"]
            isOneToOne: false
            referencedRelation: "tracked_websites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_websites: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_scanned_at: string | null
          org_id: string | null
          purpose: string | null
          target_keywords: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scanned_at?: string | null
          org_id?: string | null
          purpose?: string | null
          target_keywords?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scanned_at?: string | null
          org_id?: string | null
          purpose?: string | null
          target_keywords?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_websites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      triggers: {
        Row: {
          created_at: string | null
          event: string
          id: string
          is_active: boolean | null
          logic: string | null
          org_id: string
          product: string
          source: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: string
          is_active?: boolean | null
          logic?: string | null
          org_id: string
          product: string
          source?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: string
          is_active?: boolean | null
          logic?: string | null
          org_id?: string
          product?: string
          source?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "triggers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          org_id: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          org_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          org_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
