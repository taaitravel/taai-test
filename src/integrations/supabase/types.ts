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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_commissions: {
        Row: {
          agent_id: string
          booking_id: string
          commission_amount: number
          commission_rate: number
          commission_status: string | null
          created_at: string
          earned_date: string | null
          id: string
          paid_date: string | null
        }
        Insert: {
          agent_id: string
          booking_id: string
          commission_amount: number
          commission_rate: number
          commission_status?: string | null
          created_at?: string
          earned_date?: string | null
          id?: string
          paid_date?: string | null
        }
        Update: {
          agent_id?: string
          booking_id?: string
          commission_amount?: number
          commission_rate?: number
          commission_status?: string | null
          created_at?: string
          earned_date?: string | null
          id?: string
          paid_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "expedia_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_audit_log: {
        Row: {
          action: string
          booking_id: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action: string
          booking_id: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          booking_id?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_audit_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "expedia_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payments: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          payment_amount: number
          payment_date: string
          payment_method: string
          payment_reference: string | null
          payment_status: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          payment_amount: number
          payment_date?: string
          payment_method: string
          payment_reference?: string | null
          payment_status?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
          payment_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "expedia_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booked_at: string
          booking_details: Json
          booking_ref: string | null
          created_at: string
          id: string
          itinerary_id: string | null
          quote_id: string | null
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booked_at?: string
          booking_details: Json
          booking_ref?: string | null
          created_at?: string
          id?: string
          itinerary_id?: string | null
          quote_id?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booked_at?: string
          booking_details?: Json
          booking_ref?: string | null
          created_at?: string
          id?: string
          itinerary_id?: string | null
          quote_id?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      business_metrics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_date: string
          metric_type: string
          metric_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_date: string
          metric_type: string
          metric_value: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_type?: string
          metric_value?: number
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          external_ref: string
          id: string
          item_data: Json | null
          itinerary_id: string | null
          price: number
          saved_at: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_ref: string
          id?: string
          item_data?: Json | null
          itinerary_id?: string | null
          price: number
          saved_at?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_ref?: string
          id?: string
          item_data?: Json | null
          itinerary_id?: string | null
          price?: number
          saved_at?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_itineraries: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          itinerary_id: number
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          itinerary_id: number
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          itinerary_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_itineraries_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "itinerary_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_itineraries_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
        ]
      }
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
      expedia_bookings: {
        Row: {
          base_cost: number
          booking_date: string
          booking_details: Json
          booking_reference: string
          booking_status: string | null
          booking_type: string
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          currency: string | null
          expedia_data: Json | null
          expedia_property_id: string | null
          fees: number
          id: string
          images: Json | null
          itinerary_id: number
          payment_status: string | null
          service_end_date: string | null
          service_start_date: string | null
          taxes: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          base_cost?: number
          booking_date?: string
          booking_details?: Json
          booking_reference: string
          booking_status?: string | null
          booking_type: string
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          currency?: string | null
          expedia_data?: Json | null
          expedia_property_id?: string | null
          fees?: number
          id?: string
          images?: Json | null
          itinerary_id: number
          payment_status?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          taxes?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          base_cost?: number
          booking_date?: string
          booking_details?: Json
          booking_reference?: string
          booking_status?: string | null
          booking_type?: string
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          currency?: string | null
          expedia_data?: Json | null
          expedia_property_id?: string | null
          fees?: number
          id?: string
          images?: Json | null
          itinerary_id?: number
          payment_status?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          taxes?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedia_bookings_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary: {
        Row: {
          activities: Json | null
          attendees: Json | null
          b_efficiency_rate: number | null
          budget: number | null
          budget_rate: number | null
          created_at: string
          expedia_data: Json | null
          flights: Json | null
          hotels: Json | null
          id: number
          images: Json | null
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
          expedia_data?: Json | null
          flights?: Json | null
          hotels?: Json | null
          id?: number
          images?: Json | null
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
          expedia_data?: Json | null
          flights?: Json | null
          hotels?: Json | null
          id?: number
          images?: Json | null
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
      itinerary_attendees: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          itinerary_id: number
          joined_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          itinerary_id: number
          joined_at?: string | null
          role: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          itinerary_id?: number
          joined_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_attendees_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
        ]
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
      itinerary_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      itinerary_event_completions: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          event_date: string | null
          event_index: number
          event_type: string
          id: string
          itinerary_id: number
          notes: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          event_date?: string | null
          event_index: number
          event_type: string
          id?: string
          itinerary_id: number
          notes?: string | null
          user_id?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          event_date?: string | null
          event_index?: number
          event_type?: string
          id?: string
          itinerary_id?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_event_completions_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_events: {
        Row: {
          action: string
          after_state: Json | null
          ai_request_id: string | null
          before_state: Json | null
          created_at: string | null
          id: string
          item_id: string | null
          item_type: string | null
          itinerary_id: number
          user_id: string
        }
        Insert: {
          action: string
          after_state?: Json | null
          ai_request_id?: string | null
          before_state?: Json | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          itinerary_id: number
          user_id: string
        }
        Update: {
          action?: string
          after_state?: Json | null
          ai_request_id?: string | null
          before_state?: Json | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_type?: string | null
          itinerary_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_events_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_invitations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          invite_method: string
          invite_token: string | null
          invite_value: string
          invited_by: string
          itinerary_id: number
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_method: string
          invite_token?: string | null
          invite_value: string
          invited_by: string
          itinerary_id: number
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_method?: string
          invite_token?: string | null
          invite_value?: string
          invited_by?: string
          itinerary_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_invitations_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          payment_date: string | null
          payment_status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subscriber_id: string | null
          subscription_tier: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          payment_date?: string | null
          payment_status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subscriber_id?: string | null
          subscription_tier: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          payment_date?: string | null
          payment_status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subscriber_id?: string | null
          subscription_tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          items: Json
          itinerary_id: string | null
          quote_name: string | null
          status: string | null
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          items: Json
          itinerary_id?: string | null
          quote_name?: string | null
          status?: string | null
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          items?: Json
          itinerary_id?: string | null
          quote_name?: string | null
          status?: string | null
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string | null
          id: string
          results_count: number | null
          search_date: string | null
          search_params: Json
          search_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_date?: string | null
          search_params: Json
          search_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_date?: string | null
          search_params?: Json
          search_type?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          credits_remaining: number | null
          email: string
          id: string
          max_itineraries: number | null
          max_shared_friends: number | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          credits_remaining?: number | null
          email: string
          id?: string
          max_itineraries?: number | null
          max_shared_friends?: number | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          credits_remaining?: number | null
          email?: string
          id?: string
          max_itineraries?: number | null
          max_shared_friends?: number | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string
          credits_used: number | null
          id: string
          usage_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          credits_used?: number | null
          id?: string
          usage_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          credits_used?: number | null
          id?: string
          usage_type?: string
          user_id?: string | null
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
      users: {
        Row: {
          address: string | null
          avatar_url: string | null
          avg_spending: number | null
          bio: string | null
          cell: number | null
          city: string | null
          comp_name: string | null
          countries_visited: Json | null
          country: string | null
          created_at: string | null
          currency: string | null
          date_format: string | null
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
          theme_preference: string | null
          user_type: string | null
          userid: string
          username: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          avg_spending?: number | null
          bio?: string | null
          cell?: number | null
          city?: string | null
          comp_name?: string | null
          countries_visited?: Json | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
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
          theme_preference?: string | null
          user_type?: string | null
          userid: string
          username?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          avg_spending?: number | null
          bio?: string | null
          cell?: number | null
          city?: string | null
          comp_name?: string | null
          countries_visited?: Json | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
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
          theme_preference?: string | null
          user_type?: string | null
          userid?: string
          username?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string | null
          id: string
          item_data: Json
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_data: Json
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_data?: Json
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_itinerary_role: {
        Args: { itinerary_id_param: number; user_id_param: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_itinerary_attendee: {
        Args: { itinerary_id_param: number; user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "support"
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
      app_role: ["admin", "support"],
    },
  },
} as const
