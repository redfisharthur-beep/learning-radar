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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      curriculum_units: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          parent_unit_id: string | null
          sort_order: number
          textbook_edition_id: string
          title: string
          unit_code: string
          unit_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parent_unit_id?: string | null
          sort_order?: number
          textbook_edition_id: string
          title: string
          unit_code: string
          unit_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parent_unit_id?: string | null
          sort_order?: number
          textbook_edition_id?: string
          title?: string
          unit_code?: string
          unit_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_units_parent_unit_id_fkey"
            columns: ["parent_unit_id"]
            isOneToOne: false
            referencedRelation: "curriculum_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_units_textbook_edition_id_fkey"
            columns: ["textbook_edition_id"]
            isOneToOne: false
            referencedRelation: "textbook_editions"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_point_tags: {
        Row: {
          knowledge_point_id: string
          tag_id: string
        }
        Insert: {
          knowledge_point_id: string
          tag_id: string
        }
        Update: {
          knowledge_point_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_point_tags_knowledge_point_id_fkey"
            columns: ["knowledge_point_id"]
            isOneToOne: false
            referencedRelation: "knowledge_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_point_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "learning_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_points: {
        Row: {
          code: string
          cognitive_level: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          education_stage: string
          grade: number
          id: string
          is_active: boolean
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          cognitive_level?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          education_stage: string
          grade: number
          id?: string
          is_active?: boolean
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          cognitive_level?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          education_stage?: string
          grade?: number
          id?: string
          is_active?: boolean
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_points_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          tag_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          tag_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          tag_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          academic_year: number | null
          address: string | null
          city: string | null
          created_at: string
          data_source: string | null
          district: string | null
          id: string
          is_active: boolean
          name: string
          ownership: string | null
          phone: string | null
          school_code: string | null
          school_level: string
          source_updated_at: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          academic_year?: number | null
          address?: string | null
          city?: string | null
          created_at?: string
          data_source?: string | null
          district?: string | null
          id?: string
          is_active?: boolean
          name: string
          ownership?: string | null
          phone?: string | null
          school_code?: string | null
          school_level: string
          source_updated_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          academic_year?: number | null
          address?: string | null
          city?: string | null
          created_at?: string
          data_source?: string | null
          district?: string | null
          id?: string
          is_active?: boolean
          name?: string
          ownership?: string | null
          phone?: string | null
          school_code?: string | null
          school_level?: string
          source_updated_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          created_at: string
          education_stage: string | null
          grade: number | null
          school_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          education_stage?: string | null
          grade?: number | null
          school_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          education_stage?: string | null
          grade?: number | null
          school_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      school_textbook_adoptions: {
        Row: {
          academic_year: number
          confidence: number
          created_at: string
          education_stage: string
          grade: number
          id: string
          is_active: boolean
          school_id: string
          semester: number
          source_published_at: string | null
          source_title: string
          source_type: string
          source_url: string
          subject_id: string
          textbook_edition_id: string
          updated_at: string
          verified_at: string
        }
        Insert: {
          academic_year: number
          confidence?: number
          created_at?: string
          education_stage: string
          grade: number
          id?: string
          is_active?: boolean
          school_id: string
          semester: number
          source_published_at?: string | null
          source_title: string
          source_type: string
          source_url: string
          subject_id: string
          textbook_edition_id: string
          updated_at?: string
          verified_at?: string
        }
        Update: {
          academic_year?: number
          confidence?: number
          created_at?: string
          education_stage?: string
          grade?: number
          id?: string
          is_active?: boolean
          school_id?: string
          semester?: number
          source_published_at?: string | null
          source_title?: string
          source_type?: string
          source_url?: string
          subject_id?: string
          textbook_edition_id?: string
          updated_at?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_textbook_adoptions_edition_subject_fkey"
            columns: ["textbook_edition_id", "subject_id"]
            isOneToOne: false
            referencedRelation: "textbook_editions"
            referencedColumns: ["id", "subject_id"]
          },
          {
            foreignKeyName: "school_textbook_adoptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_textbook_adoptions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_textbook_selections: {
        Row: {
          academic_year: number
          created_at: string
          id: string
          semester: number
          subject_id: string
          textbook_edition_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_year: number
          created_at?: string
          id?: string
          semester: number
          subject_id: string
          textbook_edition_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_year?: number
          created_at?: string
          id?: string
          semester?: number
          subject_id?: string
          textbook_edition_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_textbook_edition_subject_fkey"
            columns: ["textbook_edition_id", "subject_id"]
            isOneToOne: false
            referencedRelation: "textbook_editions"
            referencedColumns: ["id", "subject_id"]
          },
          {
            foreignKeyName: "student_textbook_selections_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_textbook_selections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          id: string
          is_active?: boolean
          name: string
          sort_order: number
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      textbook_editions: {
        Row: {
          academic_year: number
          created_at: string
          edition_name: string
          education_stage: string
          grade: number
          id: string
          is_active: boolean
          isbn: string | null
          publisher_id: string
          series_name: string | null
          subject_id: string
          updated_at: string
          volume_no: number
        }
        Insert: {
          academic_year: number
          created_at?: string
          edition_name?: string
          education_stage: string
          grade: number
          id?: string
          is_active?: boolean
          isbn?: string | null
          publisher_id: string
          series_name?: string | null
          subject_id: string
          updated_at?: string
          volume_no?: number
        }
        Update: {
          academic_year?: number
          created_at?: string
          edition_name?: string
          education_stage?: string
          grade?: number
          id?: string
          is_active?: boolean
          isbn?: string | null
          publisher_id?: string
          series_name?: string | null
          subject_id?: string
          updated_at?: string
          volume_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "textbook_editions_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "textbook_publishers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textbook_editions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      textbook_publishers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      unit_knowledge_points: {
        Row: {
          created_at: string
          is_primary: boolean
          knowledge_point_id: string
          sort_order: number
          unit_id: string
        }
        Insert: {
          created_at?: string
          is_primary?: boolean
          knowledge_point_id: string
          sort_order?: number
          unit_id: string
        }
        Update: {
          created_at?: string
          is_primary?: boolean
          knowledge_point_id?: string
          sort_order?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_knowledge_points_knowledge_point_id_fkey"
            columns: ["knowledge_point_id"]
            isOneToOne: false
            referencedRelation: "knowledge_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_knowledge_points_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "curriculum_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
    Enums: {},
  },
} as const
