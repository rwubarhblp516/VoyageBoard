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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      expense_participants: {
        Row: {
          calculated_amount: number
          expense_id: string
          id: string
          member_id: string
          share_type: string | null
        }
        Insert: {
          calculated_amount: number
          expense_id: string
          id?: string
          member_id: string
          share_type?: string | null
        }
        Update: {
          calculated_amount?: number
          expense_id?: string
          id?: string
          member_id?: string
          share_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_participants_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_participants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          expense_date: string
          id: string
          payer_member_id: string
          timeline_entry_id: string | null
          title: string
          trip_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          expense_date?: string
          id?: string
          payer_member_id: string
          timeline_entry_id?: string | null
          title: string
          trip_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          expense_date?: string
          id?: string
          payer_member_id?: string
          timeline_entry_id?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_payer_member_id_fkey"
            columns: ["payer_member_id"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_timeline_entry_id_fkey"
            columns: ["timeline_entry_id"]
            isOneToOne: false
            referencedRelation: "timeline_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklist_confirmations: {
        Row: {
          checklist_id: string
          confirmed_at: string | null
          id: string
          member_id: string
          trip_id: string
        }
        Insert: {
          checklist_id: string
          confirmed_at?: string | null
          id?: string
          member_id: string
          trip_id: string
        }
        Update: {
          checklist_id?: string
          confirmed_at?: string | null
          id?: string
          member_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checklist_confirmations_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "trip_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_checklist_confirmations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_checklist_confirmations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_entry_images: {
        Row: {
          created_at: string | null
          created_by_member_id: string | null
          day_id: string
          height: number | null
          id: string
          mime_type: string
          original_name: string | null
          size_bytes: number | null
          sort_order: number
          storage_path: string
          timeline_entry_id: string
          trip_id: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          created_by_member_id?: string | null
          day_id: string
          height?: number | null
          id?: string
          mime_type?: string
          original_name?: string | null
          size_bytes?: number | null
          sort_order?: number
          storage_path: string
          timeline_entry_id: string
          trip_id: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          created_by_member_id?: string | null
          day_id?: string
          height?: number | null
          id?: string
          mime_type?: string
          original_name?: string | null
          size_bytes?: number | null
          sort_order?: number
          storage_path?: string
          timeline_entry_id?: string
          trip_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_entry_images_created_by_member_id_fkey"
            columns: ["created_by_member_id"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_entry_images_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "trip_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_entry_images_timeline_entry_id_fkey"
            columns: ["timeline_entry_id"]
            isOneToOne: false
            referencedRelation: "timeline_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_entry_images_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_entry_comments: {
        Row: {
          content: string
          created_at: string | null
          created_by_member_id: string | null
          day_id: string
          id: string
          timeline_entry_id: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by_member_id?: string | null
          day_id: string
          id?: string
          timeline_entry_id: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by_member_id?: string | null
          day_id?: string
          id?: string
          timeline_entry_id?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_entry_comments_created_by_member_id_fkey"
            columns: ["created_by_member_id"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_entry_comments_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "trip_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_entry_comments_timeline_entry_id_fkey"
            columns: ["timeline_entry_id"]
            isOneToOne: false
            referencedRelation: "timeline_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_entry_comments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_entries: {
        Row: {
          address: string | null
          content: string | null
          created_at: string | null
          created_by_member_id: string | null
          day_id: string
          duration_minutes: number | null
          end_time: string | null
          id: string
          include_in_guide: boolean
          latitude: number | null
          longitude: number | null
          place_name: string | null
          rating: number | null
          recommend_level: string | null
          sort_order: number
          start_time: string | null
          tags: string[] | null
          title: string
          trip_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          content?: string | null
          created_at?: string | null
          created_by_member_id?: string | null
          day_id: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          include_in_guide?: boolean
          latitude?: number | null
          longitude?: number | null
          place_name?: string | null
          rating?: number | null
          recommend_level?: string | null
          sort_order?: number
          start_time?: string | null
          tags?: string[] | null
          title: string
          trip_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          content?: string | null
          created_at?: string | null
          created_by_member_id?: string | null
          day_id?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          include_in_guide?: boolean
          latitude?: number | null
          longitude?: number | null
          place_name?: string | null
          rating?: number | null
          recommend_level?: string | null
          sort_order?: number
          start_time?: string | null
          tags?: string[] | null
          title?: string
          trip_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_entries_created_by_member_id_fkey"
            columns: ["created_by_member_id"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_entries_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "trip_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_entries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_segments: {
        Row: {
          arrival_time: string | null
          created_at: string | null
          day_id: string
          departure_time: string | null
          destination_address: string | null
          destination_latitude: number | null
          destination_longitude: number | null
          destination_name: string
          distance_km: number | null
          distance_source: string
          duration_minutes: number | null
          id: string
          note: string | null
          origin_address: string | null
          origin_latitude: number | null
          origin_longitude: number | null
          origin_name: string
          route_polyline: string | null
          sort_order: number
          timeline_entry_id: string | null
          transport_mode: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string | null
          day_id: string
          departure_time?: string | null
          destination_address?: string | null
          destination_latitude?: number | null
          destination_longitude?: number | null
          destination_name: string
          distance_km?: number | null
          distance_source?: string
          duration_minutes?: number | null
          id?: string
          note?: string | null
          origin_address?: string | null
          origin_latitude?: number | null
          origin_longitude?: number | null
          origin_name: string
          route_polyline?: string | null
          sort_order?: number
          timeline_entry_id?: string | null
          transport_mode: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string | null
          created_at?: string | null
          day_id?: string
          departure_time?: string | null
          destination_address?: string | null
          destination_latitude?: number | null
          destination_longitude?: number | null
          destination_name?: string
          distance_km?: number | null
          distance_source?: string
          duration_minutes?: number | null
          id?: string
          note?: string | null
          origin_address?: string | null
          origin_latitude?: number | null
          origin_longitude?: number | null
          origin_name?: string
          route_polyline?: string | null
          sort_order?: number
          timeline_entry_id?: string | null
          transport_mode?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_segments_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "trip_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_segments_timeline_entry_id_fkey"
            columns: ["timeline_entry_id"]
            isOneToOne: false
            referencedRelation: "timeline_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_segments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_days: {
        Row: {
          city: string | null
          created_at: string | null
          date: string
          day_index: number
          id: string
          summary: string | null
          title: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          date: string
          day_index: number
          id?: string
          summary?: string | null
          title?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          date?: string
          day_index?: number
          id?: string
          summary?: string | null
          title?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          display_name: string
          id: string
          joined_at: string | null
          role: string | null
          trip_id: string
          user_id: string | null
        }
        Insert: {
          display_name: string
          id?: string
          joined_at?: string | null
          role?: string | null
          trip_id: string
          user_id?: string | null
        }
        Update: {
          display_name?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklists: {
        Row: {
          category: string | null
          completed_by_member_id: string | null
          created_at: string | null
          created_by_member_id: string | null
          id: string
          is_completed: boolean | null
          item_kind: string
          parent_id: string | null
          title: string
          trip_id: string
        }
        Insert: {
          category?: string | null
          completed_by_member_id?: string | null
          created_at?: string | null
          created_by_member_id?: string | null
          id?: string
          is_completed?: boolean | null
          item_kind?: string
          parent_id?: string | null
          title: string
          trip_id: string
        }
        Update: {
          category?: string | null
          completed_by_member_id?: string | null
          created_at?: string | null
          created_by_member_id?: string | null
          id?: string
          is_completed?: boolean | null
          item_kind?: string
          parent_id?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checklists_completed_by_member_id_fkey"
            columns: ["completed_by_member_id"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_checklists_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "trip_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_checklists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string | null
          cover_url: string | null
          currency: string | null
          destination: string
          end_date: string
          id: string
          owner_id: string
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string | null
          cover_url?: string | null
          currency?: string | null
          destination: string
          end_date: string
          id?: string
          owner_id: string
          start_date: string
          title: string
        }
        Update: {
          created_at?: string | null
          cover_url?: string | null
          currency?: string | null
          destination?: string
          end_date?: string
          id?: string
          owner_id?: string
          start_date?: string
          title?: string
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
