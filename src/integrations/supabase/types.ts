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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          metadata: Json | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_reads: {
        Row: {
          communication_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          communication_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          communication_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_reads_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          created_at: string
          from_admin_id: string
          id: string
          message: string
          message_type: Database["public"]["Enums"]["message_type"]
          metadata: Json | null
          scheduled_send_at: string | null
          sent_at: string | null
          target_group_id: string | null
          target_type: Database["public"]["Enums"]["target_type"]
          target_user_id: string | null
          title: string
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          from_admin_id: string
          id?: string
          message: string
          message_type: Database["public"]["Enums"]["message_type"]
          metadata?: Json | null
          scheduled_send_at?: string | null
          sent_at?: string | null
          target_group_id?: string | null
          target_type: Database["public"]["Enums"]["target_type"]
          target_user_id?: string | null
          title: string
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          from_admin_id?: string
          id?: string
          message?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          metadata?: Json | null
          scheduled_send_at?: string | null
          sent_at?: string | null
          target_group_id?: string | null
          target_type?: Database["public"]["Enums"]["target_type"]
          target_user_id?: string | null
          title?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_from_admin_id_fkey"
            columns: ["from_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_target_group_id_fkey"
            columns: ["target_group_id"]
            isOneToOne: false
            referencedRelation: "tourist_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          conversation_type: Database["public"]["Enums"]["conversation_type"]
          created_at: string
          group_id: string | null
          id: string
          metadata: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          conversation_type: Database["public"]["Enums"]["conversation_type"]
          created_at?: string
          group_id?: string | null
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          conversation_type?: Database["public"]["Enums"]["conversation_type"]
          created_at?: string
          group_id?: string | null
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tourist_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          descriere: string | null
          document_category: Database["public"]["Enums"]["document_category"]
          expiry_date: string | null
          file_size: number
          file_type: string
          file_url: string
          id: string
          is_mandatory: boolean
          is_offline_priority: boolean
          metadata: Json | null
          nume: string
          target_user_id: string | null
          trip_id: string
          upload_date: string
          uploaded_by_admin_id: string
          visibility_type: Database["public"]["Enums"]["visibility_type"]
        }
        Insert: {
          descriere?: string | null
          document_category: Database["public"]["Enums"]["document_category"]
          expiry_date?: string | null
          file_size: number
          file_type: string
          file_url: string
          id?: string
          is_mandatory?: boolean
          is_offline_priority?: boolean
          metadata?: Json | null
          nume: string
          target_user_id?: string | null
          trip_id: string
          upload_date?: string
          uploaded_by_admin_id: string
          visibility_type: Database["public"]["Enums"]["visibility_type"]
        }
        Update: {
          descriere?: string | null
          document_category?: Database["public"]["Enums"]["document_category"]
          expiry_date?: string | null
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          is_mandatory?: boolean
          is_offline_priority?: boolean
          metadata?: Json | null
          nume?: string
          target_user_id?: string | null
          trip_id?: string
          upload_date?: string
          uploaded_by_admin_id?: string
          visibility_type?: Database["public"]["Enums"]["visibility_type"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_admin_id_fkey"
            columns: ["uploaded_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          role_in_group: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          role_in_group?: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          role_in_group?: Database["public"]["Enums"]["group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tourist_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          address: string | null
          booking_reference: string | null
          cost_estimate: number | null
          day_id: string
          description: string | null
          display_order: number
          end_time: string | null
          id: string
          images: string[] | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          metadata: Json | null
          start_time: string | null
          tips_and_notes: string | null
          title: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          address?: string | null
          booking_reference?: string | null
          cost_estimate?: number | null
          day_id: string
          description?: string | null
          display_order?: number
          end_time?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          metadata?: Json | null
          start_time?: string | null
          tips_and_notes?: string | null
          title: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          address?: string | null
          booking_reference?: string | null
          cost_estimate?: number | null
          day_id?: string
          description?: string | null
          display_order?: number
          end_time?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          metadata?: Json | null
          start_time?: string | null
          tips_and_notes?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_activities_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_days: {
        Row: {
          date: string
          day_number: number
          id: string
          overview: string | null
          title: string
          trip_id: string
        }
        Insert: {
          date: string
          day_number: number
          id?: string
          overview?: string | null
          title: string
          trip_id: string
        }
        Update: {
          date?: string
          day_number?: number
          id?: string
          overview?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_cache_status: {
        Row: {
          cache_size: number
          cached_at: string
          resource_id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          trip_id: string
          user_id: string
        }
        Insert: {
          cache_size?: number
          cached_at?: string
          resource_id: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          trip_id: string
          user_id: string
        }
        Update: {
          cache_size?: number
          cached_at?: string
          resource_id?: string
          resource_type?: Database["public"]["Enums"]["resource_type"]
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_cache_status_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offline_cache_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          metadata: Json | null
          nume: string
          prenume: string
          role: Database["public"]["Enums"]["user_role"]
          telefon: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          metadata?: Json | null
          nume: string
          prenume: string
          role?: Database["public"]["Enums"]["user_role"]
          telefon?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          nume?: string
          prenume?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefon?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tourist_groups: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          invite_code: string
          is_active: boolean
          metadata: Json | null
          nume_grup: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          invite_code: string
          is_active?: boolean
          metadata?: Json | null
          nume_grup: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          invite_code?: string
          is_active?: boolean
          metadata?: Json | null
          nume_grup?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tourist_groups_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget_estimat: number | null
          cover_image_url: string | null
          created_at: string
          created_by_admin_id: string
          descriere: string | null
          destinatie: string
          end_date: string
          group_id: string | null
          id: string
          metadata: Json | null
          nume: string
          oras: string | null
          start_date: string
          status: Database["public"]["Enums"]["trip_status"]
          tara: string
          updated_at: string
        }
        Insert: {
          budget_estimat?: number | null
          cover_image_url?: string | null
          created_at?: string
          created_by_admin_id: string
          descriere?: string | null
          destinatie: string
          end_date: string
          group_id?: string | null
          id?: string
          metadata?: Json | null
          nume: string
          oras?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["trip_status"]
          tara: string
          updated_at?: string
        }
        Update: {
          budget_estimat?: number | null
          cover_image_url?: string | null
          created_at?: string
          created_by_admin_id?: string
          descriere?: string | null
          destinatie?: string
          end_date?: string
          group_id?: string | null
          id?: string
          metadata?: Json | null
          nume?: string
          oras?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["trip_status"]
          tara?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "tourist_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_in_group: {
        Args: { group_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "transport"
        | "meal"
        | "attraction"
        | "accommodation"
        | "free_time"
        | "custom"
      conversation_type: "direct" | "group" | "broadcast"
      document_category:
        | "identity"
        | "transport"
        | "accommodation"
        | "insurance"
        | "itinerary"
        | "custom"
      group_role: "primary" | "member"
      message_type: "info" | "urgent" | "reminder" | "update"
      resource_type: "documents" | "itinerary" | "maps" | "images"
      target_type: "broadcast" | "group" | "individual"
      trip_status: "draft" | "confirmed" | "active" | "completed" | "cancelled"
      user_role: "admin" | "tourist"
      visibility_type: "group" | "individual"
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
      activity_type: [
        "transport",
        "meal",
        "attraction",
        "accommodation",
        "free_time",
        "custom",
      ],
      conversation_type: ["direct", "group", "broadcast"],
      document_category: [
        "identity",
        "transport",
        "accommodation",
        "insurance",
        "itinerary",
        "custom",
      ],
      group_role: ["primary", "member"],
      message_type: ["info", "urgent", "reminder", "update"],
      resource_type: ["documents", "itinerary", "maps", "images"],
      target_type: ["broadcast", "group", "individual"],
      trip_status: ["draft", "confirmed", "active", "completed", "cancelled"],
      user_role: ["admin", "tourist"],
      visibility_type: ["group", "individual"],
    },
  },
} as const
