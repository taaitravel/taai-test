export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budget: {
        Row: {
          activities_b: number | null
          activities_s: number | null
          car_rental_b: number | null
          car_rental_s: number | null
          created_at: string
          flight_b: number | null
          flight_s: number | null
          food_b: number | null
          food_s: number | null
          hotel_b: number | null
          hotel_s: number | null
          id: number
          itin_id: string
          s_day: number | null
          s_pp: number | null
          s_pp_day: number | null
          s_rate: number | null
          total_b: number | null
          total_s: number | null
          userid: string
        }
        Insert: {
          activities_b?: number | null
          activities_s?: number | null
          car_rental_b?: number | null
          car_rental_s?: number | null
          created_at?: string
          flight_b?: number | null
          flight_s?: number | null
          food_b?: number | null
          food_s?: number | null
          hotel_b?: number | null
          hotel_s?: number | null
          id?: number
          itin_id: string
          s_day?: number | null
          s_pp?: number | null
          s_pp_day?: number | null
          s_rate?: number | null
          total_b?: number | null
          total_s?: number | null
          userid?: string
        }
        Update: {
          activities_b?: number | null
          activities_s?: number | null
          car_rental_b?: number | null
          car_rental_s?: number | null
          created_at?: string
          flight_b?: number | null
          flight_s?: number | null
          food_b?: number | null
          food_s?: number | null
          hotel_b?: number | null
          hotel_s?: number | null
          id?: number
          itin_id?: string
          s_day?: number | null
          s_pp?: number | null
          s_pp_day?: number | null
          s_rate?: number | null
          total_b?: number | null
          total_s?: number | null
          userid?: string
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
          itin_id: string
          itin_locations: Json | null
          itin_map_locations: Json | null
          itin_name: string | null
          reservations: Json | null
          spending: number | null
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
          itin_id?: string
          itin_locations?: Json | null
          itin_map_locations?: Json | null
          itin_name?: string | null
          reservations?: Json | null
          spending?: number | null
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
          itin_id?: string
          itin_locations?: Json | null
          itin_map_locations?: Json | null
          itin_name?: string | null
          reservations?: Json | null
          spending?: number | null
          userid?: string | null
        }
        Relationships: []
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
          created_at: string
          email: string | null
          first_name: string
          flight_freq: Json | null
          id: number
          itineraries: Json | null
          last_name: string | null
          p_airlines: Json | null
          p_car_rentals: Json | null
          p_hotels: Json | null
          state: string | null
          taai_rating: number | null
          taai_rating_text: string | null
          user_type: string
          userid: string | null
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
          created_at?: string
          email?: string | null
          first_name: string
          flight_freq?: Json | null
          id?: number
          itineraries?: Json | null
          last_name?: string | null
          p_airlines?: Json | null
          p_car_rentals?: Json | null
          p_hotels?: Json | null
          state?: string | null
          taai_rating?: number | null
          taai_rating_text?: string | null
          user_type: string
          userid?: string | null
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
          created_at?: string
          email?: string | null
          first_name?: string
          flight_freq?: Json | null
          id?: number
          itineraries?: Json | null
          last_name?: string | null
          p_airlines?: Json | null
          p_car_rentals?: Json | null
          p_hotels?: Json | null
          state?: string | null
          taai_rating?: number | null
          taai_rating_text?: string | null
          user_type?: string
          userid?: string | null
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
      has_access_level: {
        Args: {
          _user_id: string
          _level: Database["public"]["Enums"]["access_level"]
        }
        Returns: boolean
      }
    }
    Enums: {
      access_level: "user" | "admin"
      user_type: "individual" | "corporate"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_level: ["user", "admin"],
      user_type: ["individual", "corporate"],
    },
  },
} as const
