export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      contact_inquiries: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          id: string
          inquiry_type: string
          message: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          inquiry_type: string
          message: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string
          message?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      country_coordinates: {
        Row: {
          country_code: string | null
          country_name: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          country_name: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          country_name?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      itinerary: {
        Row: {
          activities: Json | null
          attendees: Json | null
          b_efficiency_rate: number | null
          budget: number | null
          budget_rate: number | null
          created_at: string
          flights: Json | null
          hotels: Json | null
          id: number
          itin_date_end: string | null
          itin_date_start: string | null
          itin_desc: string | null
          itin_id: string | null
          itin_locations: Json | null
          itin_map_locations: Json | null
          itin_name: string | null
          reservations: Json | null
          spending: number | null
          user_type: string | null
          userid: string | null
        }
        Insert: {
          activities?: Json | null
          attendees?: Json | null
          b_efficiency_rate?: number | null
          budget?: number | null
          budget_rate?: number | null
          created_at?: string
          flights?: Json | null
          hotels?: Json | null
          id?: number
          itin_date_end?: string | null
          itin_date_start?: string | null
          itin_desc?: string | null
          itin_id?: string | null
          itin_locations?: Json | null
          itin_map_locations?: Json | null
          itin_name?: string | null
          reservations?: Json | null
          spending?: number | null
          user_type?: string | null
          userid?: string | null
        }
        Update: {
          activities?: Json | null
          attendees?: Json | null
          b_efficiency_rate?: number | null
          budget?: number | null
          budget_rate?: number | null
          created_at?: string
          flights?: Json | null
          hotels?: Json | null
          id?: number
          itin_date_end?: string | null
          itin_date_start?: string | null
          itin_desc?: string | null
          itin_id?: string | null
          itin_locations?: Json | null
          itin_map_locations?: Json | null
          itin_name?: string | null
          reservations?: Json | null
          spending?: number | null
          user_type?: string | null
          userid?: string | null
        }
        Relationships: []
      }
      itinerary_budget_breakdown: {
        Row: {
          budgeted_amount: number
          category: string
          created_at: string
          id: string
          itinerary_id: number
          spent_amount: number
          updated_at: string
        }
        Insert: {
          budgeted_amount?: number
          category: string
          created_at?: string
          id?: string
          itinerary_id: number
          spent_amount?: number
          updated_at?: string
        }
        Update: {
          budgeted_amount?: number
          category?: string
          created_at?: string
          id?: string
          itinerary_id?: number
          spent_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_budget_breakdown_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          avg_spending: number | null
          cell: number | null
          city: string | null
          comp_name: string | null
          countries_visited: Json | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          flight_freq: Json | null
          id: number
          itineraries: Json | null
          last_name: string | null
          p_airlines: Json | null
          p_car_rentals: Json | null
          p_hotels: Json | null
          privacy_accepted_at: string | null
          state: string | null
          taai_rating: number | null
          taai_rating_text: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          user_type: string | null
          userid: string
          username: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          avg_spending?: number | null
          cell?: number | null
          city?: string | null
          comp_name?: string | null
          countries_visited?: Json | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          flight_freq?: Json | null
          id?: number
          itineraries?: Json | null
          last_name?: string | null
          p_airlines?: Json | null
          p_car_rentals?: Json | null
          p_hotels?: Json | null
          privacy_accepted_at?: string | null
          state?: string | null
          taai_rating?: number | null
          taai_rating_text?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          user_type?: string | null
          userid: string
          username?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          avg_spending?: number | null
          cell?: number | null
          city?: string | null
          comp_name?: string | null
          countries_visited?: Json | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          flight_freq?: Json | null
          id?: number
          itineraries?: Json | null
          last_name?: string | null
          p_airlines?: Json | null
          p_car_rentals?: Json | null
          p_hotels?: Json | null
          privacy_accepted_at?: string | null
          state?: string | null
          taai_rating?: number | null
          taai_rating_text?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          user_type?: string | null
          userid?: string
          username?: string | null
          zip?: string | null
        }
        Relationships: []
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
