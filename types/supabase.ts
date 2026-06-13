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
      ai_knowledge: {
        Row: {
          id: string
          clinic_id: string
          question: string
          answer: string
          question_hi: string | null
          answer_hi: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          question: string
          answer: string
          question_hi?: string | null
          answer_hi?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          question?: string
          answer?: string
          question_hi?: string | null
          answer_hi?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          }
        ]
      }
      analytics_snapshots: {
        Row: {
          id: string
          clinic_id: string
          snapshot_date: string
          total_appointments: number
          confirmed_count: number
          completed_count: number
          cancelled_count: number
          no_show_count: number
          new_patients: number
          widget_sessions: number
          bookings_via_widget: number
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          snapshot_date: string
          total_appointments?: number
          confirmed_count?: number
          completed_count?: number
          cancelled_count?: number
          no_show_count?: number
          new_patients?: number
          widget_sessions?: number
          bookings_via_widget?: number
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          snapshot_date?: string
          total_appointments?: number
          confirmed_count?: number
          completed_count?: number
          cancelled_count?: number
          no_show_count?: number
          new_patients?: number
          widget_sessions?: number
          bookings_via_widget?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string | null
          service_id: string | null
          patient_name: string
          patient_email: string | null
          patient_phone: string | null
          service_name: string | null
          duration_minutes: number
          appointment_date: string
          start_time: string
          end_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          patient_notes: string | null
          doctor_notes: string | null
          booked_via: string
          booking_language: Database["public"]["Enums"]["language_code"]
          confirmation_sent: boolean
          reminder_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_id?: string | null
          service_id?: string | null
          patient_name: string
          patient_email?: string | null
          patient_phone?: string | null
          service_name?: string | null
          duration_minutes?: number
          appointment_date: string
          start_time: string
          end_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          patient_notes?: string | null
          doctor_notes?: string | null
          booked_via?: string
          booking_language?: Database["public"]["Enums"]["language_code"]
          confirmation_sent?: boolean
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          patient_id?: string | null
          service_id?: string | null
          patient_name?: string
          patient_email?: string | null
          patient_phone?: string | null
          service_name?: string | null
          duration_minutes?: number
          appointment_date?: string
          start_time?: string
          end_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          patient_notes?: string | null
          doctor_notes?: string | null
          booked_via?: string
          booking_language?: Database["public"]["Enums"]["language_code"]
          confirmation_sent?: boolean
          reminder_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      availability: {
        Row: {
          id: string
          clinic_id: string
          day_of_week: number
          is_available: boolean
          start_time: string
          end_time: string
          break_start: string | null
          break_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          day_of_week: number
          is_available?: boolean
          start_time?: string
          end_time?: string
          break_start?: string | null
          break_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          day_of_week?: number
          is_available?: boolean
          start_time?: string
          end_time?: string
          break_start?: string | null
          break_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          }
        ]
      }
      blocked_dates: {
        Row: {
          id: string
          clinic_id: string
          blocked_date: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          blocked_date: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          blocked_date?: string
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_sessions: {
        Row: {
          id: string
          clinic_id: string
          appointment_id: string | null
          session_token: string
          completed_booking: boolean
          messages_count: number
          language_used: Database["public"]["Enums"]["language_code"]
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
        }
        Insert: {
          id?: string
          clinic_id: string
          appointment_id?: string | null
          session_token: string
          completed_booking?: boolean
          messages_count?: number
          language_used?: Database["public"]["Enums"]["language_code"]
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
        }
        Update: {
          id?: string
          clinic_id?: string
          appointment_id?: string | null
          session_token?: string
          completed_booking?: boolean
          messages_count?: number
          language_used?: Database["public"]["Enums"]["language_code"]
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          }
        ]
      }
      clinics: {
        Row: {
          id: string
          user_id: string
          name: string
          doctor_name: string
          specialty: string | null
          description: string | null
          address: string | null
          city: string | null
          country: string
          phone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
          widget_theme_color: string
          widget_tone: string
          timezone: string
          language: Database["public"]["Enums"]["language_code"]
          slot_duration_minutes: number
          buffer_time_minutes: number
          max_advance_days: number
          min_notice_hours: number
          notification_channel: Database["public"]["Enums"]["notification_channel"]
          whatsapp_number: string | null
          email_notifications: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          plan_status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          doctor_name: string
          specialty?: string | null
          description?: string | null
          address?: string | null
          city?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          widget_theme_color?: string
          widget_tone?: string
          timezone?: string
          language?: Database["public"]["Enums"]["language_code"]
          slot_duration_minutes?: number
          buffer_time_minutes?: number
          max_advance_days?: number
          min_notice_hours?: number
          notification_channel?: Database["public"]["Enums"]["notification_channel"]
          whatsapp_number?: string | null
          email_notifications?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          doctor_name?: string
          specialty?: string | null
          description?: string | null
          address?: string | null
          city?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          widget_theme_color?: string
          widget_tone?: string
          timezone?: string
          language?: Database["public"]["Enums"]["language_code"]
          slot_duration_minutes?: number
          buffer_time_minutes?: number
          max_advance_days?: number
          min_notice_hours?: number
          notification_channel?: Database["public"]["Enums"]["notification_channel"]
          whatsapp_number?: string | null
          email_notifications?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          id: string
          clinic_id: string
          appointment_id: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          recipient: string
          type: string
          status: string
          error_message: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          appointment_id?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          recipient: string
          type: string
          status?: string
          error_message?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          appointment_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          recipient?: string
          type?: string
          status?: string
          error_message?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          }
        ]
      }
      patients: {
        Row: {
          id: string
          clinic_id: string
          name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          gender: string | null
          address: string | null
          notes: string | null
          preferred_language: Database["public"]["Enums"]["language_code"]
          total_appointments: number
          last_appointment_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          notes?: string | null
          preferred_language?: Database["public"]["Enums"]["language_code"]
          total_appointments?: number
          last_appointment_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          notes?: string | null
          preferred_language?: Database["public"]["Enums"]["language_code"]
          total_appointments?: number
          last_appointment_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          }
        ]
      }
      rag_documents: {
        Row: {
          id: string
          clinic_id: string
          title: string
          content: string
          source_type: 'manual' | 'upload' | 'auto_generated'
          file_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          title: string
          content: string
          source_type?: 'manual' | 'upload' | 'auto_generated'
          file_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          title?: string
          content?: string
          source_type?: 'manual' | 'upload' | 'auto_generated'
          file_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_documents_clinic_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          }
        ]
      }
      rag_chunks: {
        Row: {
          id: string
          clinic_id: string
          document_id: string
          content: string
          embedding: string | null
          token_count: number | null
          chunk_index: number | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          document_id: string
          content: string
          embedding?: number[] | null
          token_count?: number | null
          chunk_index?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          document_id?: string
          content?: string
          embedding?: number[] | null
          token_count?: number | null
          chunk_index?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_chunks_clinic_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rag_chunks_document_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "rag_documents"
            referencedColumns: ["id"]
          }
        ]
      }
      voice_call_logs: {
        Row: {
          id: string
          clinic_id: string
          session_id: string
          duration_seconds: number | null
          transcript: string | null
          intent_detected: string | null
          booking_completed: boolean
          language_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          session_id: string
          duration_seconds?: number | null
          transcript?: string | null
          intent_detected?: string | null
          booking_completed?: boolean
          language_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          session_id?: string
          duration_seconds?: number | null
          transcript?: string | null
          intent_detected?: string | null
          booking_completed?: boolean
          language_used?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_call_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          }
        ]
      }
      voice_settings: {
        Row: {
          id: string
          clinic_id: string
          is_enabled: boolean
          default_language: string
          auto_detect_language: boolean
          voice_gender: string
          speech_rate: number
          noise_cancellation: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          is_enabled?: boolean
          default_language?: string
          auto_detect_language?: boolean
          voice_gender?: string
          speech_rate?: number
          noise_cancellation?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          is_enabled?: boolean
          default_language?: string
          auto_detect_language?: boolean
          voice_gender?: string
          speech_rate?: number
          noise_cancellation?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          clinic_id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number | null
          currency: string
          is_active: boolean
          sort_order: number
          name_hi: string | null
          description_hi: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          name: string
          description?: string | null
          duration_minutes?: number
          price?: number | null
          currency?: string
          is_active?: boolean
          sort_order?: number
          name_hi?: string | null
          description_hi?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          price?: number | null
          currency?: string
          is_active?: boolean
          sort_order?: number
          name_hi?: string | null
          description_hi?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_rag_chunks: {
        Args: {
          p_clinic_id: string
          p_embedding: number[]
          p_match_count: number
          p_similarity_threshold: number
        }
        Returns: {
          id: string
          content: string
          similarity: number
        }[]
      }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
      language_code: "en" | "hi"
      notification_channel: "email" | "whatsapp" | "both"
      subscription_plan: "free" | "pro"
      subscription_status: "active" | "inactive" | "trial" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
    Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
    Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof Database["public"]["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never