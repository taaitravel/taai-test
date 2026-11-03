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
    PostgrestVersion: "12.2.3"
  }
  public: {
    Tables: {
      account_closures: {
        Row: {
          closed_at: string
          email: string
          purge_after: string
          reopened_at: string | null
          request_id: string
          status: string
          stripe_customer_id: string | null
          user_id: string
        }
        Insert: {
          closed_at?: string
          email: string
          purge_after: string
          reopened_at?: string | null
          request_id?: string
          status?: string
          stripe_customer_id?: string | null
          user_id: string
        }
        Update: {
          closed_at?: string
          email?: string
          purge_after?: string
          reopened_at?: string | null
          request_id?: string
          status?: string
          stripe_customer_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      account_deletion_audit: {
        Row: {
          billing_retain_until: string
          email_sent: boolean
          id: string
          miles_memory_deleted: number
          notes: string | null
          purged_at: string
          request_id: string
          shared_itineraries_transferred: number
          solo_itineraries_deleted: number
          storage_objects_removed: number
          stripe_customer_deleted: boolean
        }
        Insert: {
          billing_retain_until: string
          email_sent?: boolean
          id?: string
          miles_memory_deleted?: number
          notes?: string | null
          purged_at?: string
          request_id: string
          shared_itineraries_transferred?: number
          solo_itineraries_deleted?: number
          storage_objects_removed?: number
          stripe_customer_deleted?: boolean
        }
        Update: {
          billing_retain_until?: string
          email_sent?: boolean
          id?: string
          miles_memory_deleted?: number
          notes?: string | null
          purged_at?: string
          request_id?: string
          shared_itineraries_transferred?: number
          solo_itineraries_deleted?: number
          storage_objects_removed?: number
          stripe_customer_deleted?: boolean
        }
        Relationships: []
      }
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
      agent_task_approvals: {
        Row: {
          action_class: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          expires_at: string | null
          id: string
          requested_at: string
          requested_by: string | null
          requested_scope: Json
          status: string
          task_id: string
        }
        Insert: {
          action_class: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          expires_at?: string | null
          id?: string
          requested_at?: string
          requested_by?: string | null
          requested_scope?: Json
          status?: string
          task_id: string
        }
        Update: {
          action_class?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          expires_at?: string | null
          id?: string
          requested_at?: string
          requested_by?: string | null
          requested_scope?: Json
          status?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_task_approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_task_events: {
        Row: {
          actor_key: string | null
          actor_kind: string
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          summary: string
          task_id: string
        }
        Insert: {
          actor_key?: string | null
          actor_kind: string
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          summary: string
          task_id: string
        }
        Update: {
          actor_key?: string | null
          actor_kind?: string
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          summary?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_task_evidence: {
        Row: {
          evidence_type: string
          id: string
          label: string
          metadata: Json
          recorded_at: string
          recorded_by: string | null
          reference_url: string | null
          summary: string
          task_id: string
        }
        Insert: {
          evidence_type: string
          id?: string
          label: string
          metadata?: Json
          recorded_at?: string
          recorded_by?: string | null
          reference_url?: string | null
          summary: string
          task_id: string
        }
        Update: {
          evidence_type?: string
          id?: string
          label?: string
          metadata?: Json
          recorded_at?: string
          recorded_by?: string | null
          reference_url?: string | null
          summary?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_task_evidence_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          action_class: string
          approval_required: boolean
          assigned_agent: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          next_action: string | null
          objective: string
          risk_level: string
          routed_by: string
          source_context: Json
          started_at: string | null
          status: string
          success_criteria: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_class?: string
          approval_required?: boolean
          assigned_agent: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          next_action?: string | null
          objective: string
          risk_level?: string
          routed_by?: string
          source_context?: Json
          started_at?: string | null
          status?: string
          success_criteria?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_class?: string
          approval_required?: boolean
          assigned_agent?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          next_action?: string | null
          objective?: string
          risk_level?: string
          routed_by?: string
          source_context?: Json
          started_at?: string | null
          status?: string
          success_criteria?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      attendee_balances: {
        Row: {
          amount: number
          created_at: string
          creditor_user_id: string | null
          currency: string
          debtor_user_id: string | null
          id: string
          itinerary_id: number
          note: string | null
          source_split_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          creditor_user_id?: string | null
          currency?: string
          debtor_user_id?: string | null
          id?: string
          itinerary_id: number
          note?: string | null
          source_split_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          creditor_user_id?: string | null
          currency?: string
          debtor_user_id?: string | null
          id?: string
          itinerary_id?: number
          note?: string | null
          source_split_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_attempts: {
        Row: {
          cart_item_id: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          external_booking_ref: string | null
          id: string
          itinerary_id: number | null
          phase: string
          provider: string
          quote_id: string | null
          request: Json | null
          response: Json | null
          success: boolean
          user_id: string
        }
        Insert: {
          cart_item_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          external_booking_ref?: string | null
          id?: string
          itinerary_id?: number | null
          phase: string
          provider: string
          quote_id?: string | null
          request?: Json | null
          response?: Json | null
          success?: boolean
          user_id: string
        }
        Update: {
          cart_item_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          external_booking_ref?: string | null
          id?: string
          itinerary_id?: number | null
          phase?: string
          provider?: string
          quote_id?: string | null
          request?: Json | null
          response?: Json | null
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      booking_audit_log: {
        Row: {
          action: string
          booking_id: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          booking_id: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          booking_id?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
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
      booking_completions: {
        Row: {
          booking_intent_id: string | null
          change_requests: Json | null
          created_at: string
          currency: string | null
          guest_details: Json | null
          id: string
          item_data: Json
          item_type: string
          net_revenue: number | null
          notes: string | null
          provider: string
          provider_confirmation_code: string | null
          provider_contact: Json | null
          provider_cost: number
          receipt_url: string | null
          service_end_date: string | null
          service_start_date: string | null
          status: string
          stripe_fee: number | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          taai_commission: number | null
          taai_service_fee: number
          tax_amount: number
          total_charged: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_intent_id?: string | null
          change_requests?: Json | null
          created_at?: string
          currency?: string | null
          guest_details?: Json | null
          id?: string
          item_data?: Json
          item_type: string
          net_revenue?: number | null
          notes?: string | null
          provider: string
          provider_confirmation_code?: string | null
          provider_contact?: Json | null
          provider_cost?: number
          receipt_url?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          status?: string
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          taai_commission?: number | null
          taai_service_fee?: number
          tax_amount?: number
          total_charged?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_intent_id?: string | null
          change_requests?: Json | null
          created_at?: string
          currency?: string | null
          guest_details?: Json | null
          id?: string
          item_data?: Json
          item_type?: string
          net_revenue?: number | null
          notes?: string | null
          provider?: string
          provider_confirmation_code?: string | null
          provider_contact?: Json | null
          provider_cost?: number
          receipt_url?: string | null
          service_end_date?: string | null
          service_start_date?: string | null
          status?: string
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          taai_commission?: number | null
          taai_service_fee?: number
          tax_amount?: number
          total_charged?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_completions_booking_intent_id_fkey"
            columns: ["booking_intent_id"]
            isOneToOne: false
            referencedRelation: "booking_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_intents: {
        Row: {
          cart_item_id: string | null
          created_at: string
          currency: string | null
          event_type: string
          guest_details: Json | null
          id: string
          item_data: Json
          item_id: string | null
          item_type: string
          itinerary_id: number | null
          metadata: Json | null
          price_snapshot: number | null
          provider: string
          service_dates: Json | null
          user_id: string
        }
        Insert: {
          cart_item_id?: string | null
          created_at?: string
          currency?: string | null
          event_type: string
          guest_details?: Json | null
          id?: string
          item_data?: Json
          item_id?: string | null
          item_type: string
          itinerary_id?: number | null
          metadata?: Json | null
          price_snapshot?: number | null
          provider: string
          service_dates?: Json | null
          user_id: string
        }
        Update: {
          cart_item_id?: string | null
          created_at?: string
          currency?: string | null
          event_type?: string
          guest_details?: Json | null
          id?: string
          item_data?: Json
          item_id?: string | null
          item_type?: string
          itinerary_id?: number | null
          metadata?: Json | null
          price_snapshot?: number | null
          provider?: string
          service_dates?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_intents_cart_item_id_fkey"
            columns: ["cart_item_id"]
            isOneToOne: false
            referencedRelation: "cart_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_intents_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
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
      booking_quotes: {
        Row: {
          consumed_at: string | null
          created_at: string
          currency: string
          diffs: Json
          expires_at: string
          id: string
          items: Json
          itinerary_id: number | null
          provider_total: number
          status: string
          stripe_session_id: string | null
          taxes_and_fees: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          currency?: string
          diffs?: Json
          expires_at: string
          id?: string
          items: Json
          itinerary_id?: number | null
          provider_total: number
          status?: string
          stripe_session_id?: string | null
          taxes_and_fees: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          currency?: string
          diffs?: Json
          expires_at?: string
          id?: string
          items?: Json
          itinerary_id?: number | null
          provider_total?: number
          status?: string
          stripe_session_id?: string | null
          taxes_and_fees?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_receipts: {
        Row: {
          booking_id: string | null
          created_at: string
          currency: string
          id: string
          pdf_path: string | null
          quote_id: string | null
          receipt_json: Json
          receipt_number: string
          sent_to: string[] | null
          stripe_session_id: string | null
          total: number
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          pdf_path?: string | null
          quote_id?: string | null
          receipt_json?: Json
          receipt_number: string
          sent_to?: string[] | null
          stripe_session_id?: string | null
          total?: number
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          pdf_path?: string | null
          quote_id?: string | null
          receipt_json?: Json
          receipt_number?: string
          sent_to?: string[] | null
          stripe_session_id?: string | null
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booked_at: string
          booking_details: Json
          booking_ref: string | null
          cancellation_policy: Json | null
          commission: number | null
          created_at: string
          id: string
          itinerary_id: string | null
          provider: string | null
          provider_booking_ref: string | null
          quote_id: string | null
          status: string | null
          supplier_charge: number | null
          total_amount: number
          updated_at: string
          user_id: string | null
          voucher_url: string | null
        }
        Insert: {
          booked_at?: string
          booking_details: Json
          booking_ref?: string | null
          cancellation_policy?: Json | null
          commission?: number | null
          created_at?: string
          id?: string
          itinerary_id?: string | null
          provider?: string | null
          provider_booking_ref?: string | null
          quote_id?: string | null
          status?: string | null
          supplier_charge?: number | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
          voucher_url?: string | null
        }
        Update: {
          booked_at?: string
          booking_details?: Json
          booking_ref?: string | null
          cancellation_policy?: Json | null
          commission?: number | null
          created_at?: string
          id?: string
          itinerary_id?: string | null
          provider?: string | null
          provider_booking_ref?: string | null
          quote_id?: string | null
          status?: string | null
          supplier_charge?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          voucher_url?: string | null
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
      cart_item_splits: {
        Row: {
          attendee_label: string | null
          attendee_user_id: string | null
          auto_added: boolean
          cart_item_id: string
          computed_amount: number
          computed_taxes_and_fees: number
          created_at: string
          id: string
          itinerary_id: number
          paid_by_user_id: string | null
          payment_status: string
          share_method: string
          share_value: number | null
          updated_at: string
        }
        Insert: {
          attendee_label?: string | null
          attendee_user_id?: string | null
          auto_added?: boolean
          cart_item_id: string
          computed_amount?: number
          computed_taxes_and_fees?: number
          created_at?: string
          id?: string
          itinerary_id: number
          paid_by_user_id?: string | null
          payment_status?: string
          share_method?: string
          share_value?: number | null
          updated_at?: string
        }
        Update: {
          attendee_label?: string | null
          attendee_user_id?: string | null
          auto_added?: boolean
          cart_item_id?: string
          computed_amount?: number
          computed_taxes_and_fees?: number
          created_at?: string
          id?: string
          itinerary_id?: number
          paid_by_user_id?: string | null
          payment_status?: string
          share_method?: string
          share_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          booking_status: string
          created_at: string
          external_id: string | null
          external_ref: string
          id: string
          item_data: Json | null
          itinerary_id: string | null
          last_price: number | null
          last_repriced_at: string | null
          price: number
          provider: string
          provider_ref: Json
          rate_expires_at: string | null
          saved_at: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_status?: string
          created_at?: string
          external_id?: string | null
          external_ref: string
          id?: string
          item_data?: Json | null
          itinerary_id?: string | null
          last_price?: number | null
          last_repriced_at?: string | null
          price: number
          provider?: string
          provider_ref?: Json
          rate_expires_at?: string | null
          saved_at?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_status?: string
          created_at?: string
          external_id?: string | null
          external_ref?: string
          id?: string
          item_data?: Json | null
          itinerary_id?: string | null
          last_price?: number | null
          last_repriced_at?: string | null
          price?: number
          provider?: string
          provider_ref?: Json
          rate_expires_at?: string | null
          saved_at?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_mutes: {
        Row: {
          created_at: string
          id: string
          itinerary_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          itinerary_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          itinerary_id?: number
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
      financial_ledger: {
        Row: {
          amount: number
          booking_completion_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          entry_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          amount: number
          booking_completion_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          entry_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          amount?: number
          booking_completion_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          entry_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_ledger_booking_completion_id_fkey"
            columns: ["booking_completion_id"]
            isOneToOne: false
            referencedRelation: "booking_completions"
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
          creation_key: string | null
          editing_locked: boolean
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
          planned_traveler_count: number
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
          creation_key?: string | null
          editing_locked?: boolean
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
          planned_traveler_count?: number
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
          creation_key?: string | null
          editing_locked?: boolean
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
          planned_traveler_count?: number
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
      itinerary_chat_messages: {
        Row: {
          attachment_data: Json | null
          attachment_type: string | null
          content: string | null
          created_at: string
          deleted: boolean
          edited_at: string | null
          id: string
          itinerary_id: number
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachment_data?: Json | null
          attachment_type?: string | null
          content?: string | null
          created_at?: string
          deleted?: boolean
          edited_at?: string | null
          id?: string
          itinerary_id: number
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachment_data?: Json | null
          attachment_type?: string | null
          content?: string | null
          created_at?: string
          deleted?: boolean
          edited_at?: string | null
          id?: string
          itinerary_id?: number
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "itinerary_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_chat_participants: {
        Row: {
          id: string
          itinerary_id: number
          joined_at: string
          user_id: string
        }
        Insert: {
          id?: string
          itinerary_id: number
          joined_at?: string
          user_id: string
        }
        Update: {
          id?: string
          itinerary_id?: number
          joined_at?: string
          user_id?: string
        }
        Relationships: []
      }
      itinerary_chat_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "itinerary_chat_messages"
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
          delivery_status: string
          expires_at: string | null
          id: string
          invite_method: string
          invite_token: string | null
          invite_value: string
          invited_by: string
          inviter_display_name: string | null
          itinerary_id: number
          responded_at: string | null
          revoked_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          delivery_status?: string
          expires_at?: string | null
          id?: string
          invite_method: string
          invite_token?: string | null
          invite_value: string
          invited_by: string
          inviter_display_name?: string | null
          itinerary_id: number
          responded_at?: string | null
          revoked_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          delivery_status?: string
          expires_at?: string | null
          id?: string
          invite_method?: string
          invite_token?: string | null
          invite_value?: string
          invited_by?: string
          inviter_display_name?: string | null
          itinerary_id?: number
          responded_at?: string | null
          revoked_at?: string | null
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
      lifecycle_email_log: {
        Row: {
          dedupe_key: string
          id: string
          sent_at: string
          template_id: string
          to_email: string
        }
        Insert: {
          dedupe_key: string
          id?: string
          sent_at?: string
          template_id: string
          to_email: string
        }
        Update: {
          dedupe_key?: string
          id?: string
          sent_at?: string
          template_id?: string
          to_email?: string
        }
        Relationships: []
      }
      master_admins: {
        Row: {
          email: string
          protected_at: string
          protected_reason: string
          user_id: string
        }
        Insert: {
          email: string
          protected_at?: string
          protected_reason: string
          user_id: string
        }
        Update: {
          email?: string
          protected_at?: string
          protected_reason?: string
          user_id?: string
        }
        Relationships: []
      }
      miles_memory: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          chat_mentions: boolean
          chat_messages: boolean
          created_at: string
          deals: boolean
          newsletter: boolean
          traveller_accepts: boolean
          traveller_requests: boolean
          trip_reminder_lead_hours: number
          trip_reminders: boolean
          trip_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_mentions?: boolean
          chat_messages?: boolean
          created_at?: string
          deals?: boolean
          newsletter?: boolean
          traveller_accepts?: boolean
          traveller_requests?: boolean
          trip_reminder_lead_hours?: number
          trip_reminders?: boolean
          trip_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_mentions?: boolean
          chat_messages?: boolean
          created_at?: string
          deals?: boolean
          newsletter?: boolean
          traveller_accepts?: boolean
          traveller_requests?: boolean
          trip_reminder_lead_hours?: number
          trip_reminders?: boolean
          trip_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      plan_limits: {
        Row: {
          display_name: string
          max_itineraries: number
          max_shared_friends: number
          monthly_ai_credits: number
          tier: string
        }
        Insert: {
          display_name: string
          max_itineraries: number
          max_shared_friends: number
          monthly_ai_credits: number
          tier: string
        }
        Update: {
          display_name?: string
          max_itineraries?: number
          max_shared_friends?: number
          monthly_ai_credits?: number
          tier?: string
        }
        Relationships: []
      }
      quote_reprice_events: {
        Row: {
          cart_item_id: string | null
          created_at: string
          id: string
          inputs: Json
          new_price: number
          old_price: number
          quote_id: string
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          cart_item_id?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          new_price?: number
          old_price?: number
          quote_id: string
          reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          cart_item_id?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          new_price?: number
          old_price?: number
          quote_id?: string
          reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_reprice_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "booking_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_travelers: {
        Row: {
          cart_item_id: string
          created_at: string
          id: string
          item_type: string
          quote_id: string
          traveler_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          cart_item_id: string
          created_at?: string
          id?: string
          item_type: string
          quote_id: string
          traveler_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          cart_item_id?: string
          created_at?: string
          id?: string
          item_type?: string
          quote_id?: string
          traveler_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      saved_travelers: {
        Row: {
          created_at: string
          dob: string | null
          email: string | null
          first_name: string
          frequent_flyer: Json | null
          gender: string | null
          id: string
          is_self: boolean
          label: string | null
          last_name: string
          nationality: string | null
          passport_expiry: string | null
          passport_number: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dob?: string | null
          email?: string | null
          first_name: string
          frequent_flyer?: Json | null
          gender?: string | null
          id?: string
          is_self?: boolean
          label?: string | null
          last_name: string
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dob?: string | null
          email?: string | null
          first_name?: string
          frequent_flyer?: Json | null
          gender?: string | null
          id?: string
          is_self?: boolean
          label?: string | null
          last_name?: string
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
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
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_date?: string | null
          search_params: Json
          search_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_date?: string | null
          search_params?: Json
          search_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_price_tiers: {
        Row: {
          active: boolean
          lookup_key: string | null
          price_id: string
          product_id: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          lookup_key?: string | null
          price_id: string
          product_id?: string | null
          tier: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          lookup_key?: string | null
          price_id?: string
          product_id?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_price_tiers_tier_fkey"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "plan_limits"
            referencedColumns: ["tier"]
          },
        ]
      }
      subscribers: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          credits_remaining: number | null
          email: string
          id: string
          max_itineraries: number | null
          max_shared_friends: number | null
          payment_failed_at: string | null
          payment_failure_summary: string | null
          payment_retry_at: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          credits_remaining?: number | null
          email: string
          id?: string
          max_itineraries?: number | null
          max_shared_friends?: number | null
          payment_failed_at?: string | null
          payment_failure_summary?: string | null
          payment_retry_at?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          credits_remaining?: number | null
          email?: string
          id?: string
          max_itineraries?: number | null
          max_shared_friends?: number | null
          payment_failed_at?: string | null
          payment_failure_summary?: string | null
          payment_retry_at?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trip_balances_ledger: {
        Row: {
          amount: number
          created_at: string
          currency: string
          debtor_label: string | null
          debtor_user_id: string | null
          id: string
          itinerary_id: number
          note: string | null
          payer_user_id: string | null
          source_cart_item_id: string | null
          source_receipt_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          debtor_label?: string | null
          debtor_user_id?: string | null
          id?: string
          itinerary_id: number
          note?: string | null
          payer_user_id?: string | null
          source_cart_item_id?: string | null
          source_receipt_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          debtor_label?: string | null
          debtor_user_id?: string | null
          id?: string
          itinerary_id?: number
          note?: string | null
          payer_user_id?: string | null
          source_cart_item_id?: string | null
          source_receipt_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      trip_external_bookings: {
        Row: {
          amount_paid: number | null
          amount_remaining: number | null
          archived_at: string | null
          associated_itinerary_item_id: string | null
          associated_itinerary_item_type: string | null
          booking_title: string
          booking_url: string | null
          cancellation_terms: string | null
          category: string
          confirmation_number: string | null
          created_at: string
          created_by: string | null
          currency: string
          destination: string | null
          end_at: string | null
          evidence_quality: string
          evidence_type: string
          id: string
          itinerary_id: number
          location: string | null
          manually_reported: boolean
          notes: string | null
          origin: string | null
          payment_status: string
          provider_contact: string | null
          provider_name: string
          record_status: string
          refundable_amount: number | null
          source: string
          start_at: string
          total_amount: number | null
          traveler_names: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_paid?: number | null
          amount_remaining?: number | null
          archived_at?: string | null
          associated_itinerary_item_id?: string | null
          associated_itinerary_item_type?: string | null
          booking_title: string
          booking_url?: string | null
          cancellation_terms?: string | null
          category: string
          confirmation_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          destination?: string | null
          end_at?: string | null
          evidence_quality?: string
          evidence_type?: string
          id?: string
          itinerary_id: number
          location?: string | null
          manually_reported?: boolean
          notes?: string | null
          origin?: string | null
          payment_status?: string
          provider_contact?: string | null
          provider_name: string
          record_status?: string
          refundable_amount?: number | null
          source?: string
          start_at: string
          total_amount?: number | null
          traveler_names?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_paid?: number | null
          amount_remaining?: number | null
          archived_at?: string | null
          associated_itinerary_item_id?: string | null
          associated_itinerary_item_type?: string | null
          booking_title?: string
          booking_url?: string | null
          cancellation_terms?: string | null
          category?: string
          confirmation_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          destination?: string | null
          end_at?: string | null
          evidence_quality?: string
          evidence_type?: string
          id?: string
          itinerary_id?: number
          location?: string | null
          manually_reported?: boolean
          notes?: string | null
          origin?: string | null
          payment_status?: string
          provider_contact?: string | null
          provider_name?: string
          record_status?: string
          refundable_amount?: number | null
          source?: string
          start_at?: string
          total_amount?: number | null
          traveler_names?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_external_bookings_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          completion_tokens: number | null
          created_at: string
          credits_used: number | null
          id: string
          model: string | null
          prompt_tokens: number | null
          total_tokens: number | null
          usage_type: string
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          credits_used?: number | null
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          total_tokens?: number | null
          usage_type: string
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          credits_used?: number | null
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          total_tokens?: number | null
          usage_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_booking_preferences: {
        Row: {
          default_payer_mode: string
          last_traveler_doc_used: string | null
          preferred_bed: string | null
          preferred_cabin_class: string | null
          preferred_currency: string
          preferred_meal: string | null
          preferred_room_type: string | null
          preferred_seat: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          default_payer_mode?: string
          last_traveler_doc_used?: string | null
          preferred_bed?: string | null
          preferred_cabin_class?: string | null
          preferred_currency?: string
          preferred_meal?: string | null
          preferred_room_type?: string | null
          preferred_seat?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          default_payer_mode?: string
          last_traveler_doc_used?: string | null
          preferred_bed?: string | null
          preferred_cabin_class?: string | null
          preferred_currency?: string
          preferred_meal?: string | null
          preferred_room_type?: string | null
          preferred_seat?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          status?: string
          updated_at?: string
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
          first_touch_at: string | null
          flight_freq: Json | null
          id: number
          itineraries: Json | null
          landing_path: string | null
          last_active_at: string | null
          last_name: string | null
          p_airlines: Json | null
          p_car_rentals: Json | null
          p_hotels: Json | null
          privacy_accepted_at: string | null
          signup_referrer: string | null
          state: string | null
          taai_rating: number | null
          taai_rating_text: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          theme_preference: string | null
          user_type: string | null
          userid: string
          username: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          welcome_email_sent_at: string | null
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
          first_touch_at?: string | null
          flight_freq?: Json | null
          id?: number
          itineraries?: Json | null
          landing_path?: string | null
          last_active_at?: string | null
          last_name?: string | null
          p_airlines?: Json | null
          p_car_rentals?: Json | null
          p_hotels?: Json | null
          privacy_accepted_at?: string | null
          signup_referrer?: string | null
          state?: string | null
          taai_rating?: number | null
          taai_rating_text?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          theme_preference?: string | null
          user_type?: string | null
          userid: string
          username?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          welcome_email_sent_at?: string | null
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
          first_touch_at?: string | null
          flight_freq?: Json | null
          id?: number
          itineraries?: Json | null
          landing_path?: string | null
          last_active_at?: string | null
          last_name?: string | null
          p_airlines?: Json | null
          p_car_rentals?: Json | null
          p_hotels?: Json | null
          privacy_accepted_at?: string | null
          signup_referrer?: string | null
          state?: string | null
          taai_rating?: number | null
          taai_rating_text?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          theme_preference?: string | null
          user_type?: string | null
          userid?: string
          username?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          welcome_email_sent_at?: string | null
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
      account_is_closed: { Args: { p_user_id: string }; Returns: boolean }
      apply_free_itinerary_locks: {
        Args: { p_keep: number; p_user_id: string }
        Returns: number
      }
      consume_ai_credit: { Args: { uid: string }; Returns: Json }
      current_tier: { Args: { uid: string }; Returns: string }
      get_chat_joined_at: {
        Args: { p_itinerary_id: number; p_user_id: string }
        Returns: string
      }
      get_itinerary_participant_profiles: {
        Args: { p_itinerary_id: number }
        Returns: {
          avatar_url: string
          first_name: string
          last_name: string
          role: string
          user_id: string
          username: string
        }[]
      }
      get_itinerary_role: {
        Args: { itinerary_id_param: number; user_id_param: string }
        Returns: string
      }
      get_my_plan_usage: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agent_state_changing_action: {
        Args: { p_action_class: string }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { p_itinerary_id: number; p_user_id: string }
        Returns: boolean
      }
      is_itinerary_attendee: {
        Args: { itinerary_id_param: number; user_id_param: string }
        Returns: boolean
      }
      list_user_storage_objects: {
        Args: { p_itinerary_ids: number[]; p_user_id: string }
        Returns: {
          bucket_id: string
          name: string
        }[]
      }
      notify_user: {
        Args: {
          _itinerary_id?: number
          _message: string
          _pref_key: string
          _reference_id?: string
          _reference_type?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      prepare_account_purge: {
        Args: { p_request_id: string; p_user_id: string }
        Returns: Json
      }
      recompute_balances_for_item: {
        Args: { _cart_item_id: string }
        Returns: undefined
      }
      recompute_cart_item_splits: {
        Args: { _cart_item_id: string }
        Returns: undefined
      }
      record_ai_turn_tokens: {
        Args: {
          p_completion_tokens: number
          p_model: string
          p_prompt_tokens: number
          p_total_tokens: number
          uid: string
          usage_id: string
        }
        Returns: undefined
      }
      record_usage: {
        Args: { credits?: number; kind: string; uid: string }
        Returns: undefined
      }
      release_ai_credit: {
        Args: { uid: string; usage_id: string }
        Returns: undefined
      }
      release_storage_upload: {
        Args: { p_bucket: string; p_object_name: string }
        Returns: undefined
      }
      reserve_storage_upload: {
        Args: { p_bucket: string; p_object_name: string }
        Returns: undefined
      }
      respond_to_itinerary_invitation: {
        Args: { p_accept: boolean; p_invitation_id: string }
        Returns: Json
      }
      revoke_user_sessions: { Args: { p_user_id: string }; Returns: undefined }
      touch_last_active: { Args: never; Returns: undefined }
      transfer_itinerary_owner: {
        Args: { p_from: string; p_itinerary_id: number; p_to: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
