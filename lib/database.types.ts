// Generated file, do not edit. Regenerate with the Supabase MCP `generate_typescript_types` or `supabase gen types typescript --project-id bylkrfekrtbbsubhdbfb`.
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
      faq: {
        Row: {
          answer: string
          id: number
          link_label: string | null
          link_url: string | null
          question: string
          sort: number | null
        }
        Insert: {
          answer: string
          id?: number
          link_label?: string | null
          link_url?: string | null
          question: string
          sort?: number | null
        }
        Update: {
          answer?: string
          id?: number
          link_label?: string | null
          link_url?: string | null
          question?: string
          sort?: number | null
        }
        Relationships: []
      }
      games: {
        Row: {
          away_ref: string | null
          awayscore: number | null
          awayteam: string | null
          class: Database["public"]["Enums"]["class"]
          eventname: string | null
          home_ref: string | null
          homescore: number | null
          hometeam: string | null
          id: number
          label: string | null
          location: string
          number: number | null
          scorer: string | null
          scorer_class: Database["public"]["Enums"]["class"] | null
          stage: string | null
          time: string
        }
        Insert: {
          away_ref?: string | null
          awayscore?: number | null
          awayteam?: string | null
          class: Database["public"]["Enums"]["class"]
          eventname?: string | null
          home_ref?: string | null
          homescore?: number | null
          hometeam?: string | null
          id?: number
          label?: string | null
          location: string
          number?: number | null
          scorer?: string | null
          scorer_class?: Database["public"]["Enums"]["class"] | null
          stage?: string | null
          time: string
        }
        Update: {
          away_ref?: string | null
          awayscore?: number | null
          awayteam?: string | null
          class?: Database["public"]["Enums"]["class"]
          eventname?: string | null
          home_ref?: string | null
          homescore?: number | null
          hometeam?: string | null
          id?: number
          label?: string | null
          location?: string
          number?: number | null
          scorer?: string | null
          scorer_class?: Database["public"]["Enums"]["class"] | null
          stage?: string | null
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_awayteam_fkey"
            columns: ["awayteam", "class"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["name", "class"]
          },
          {
            foreignKeyName: "games_hometeam_fkey"
            columns: ["hometeam", "class"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["name", "class"]
          },
          {
            foreignKeyName: "games_location_fkey"
            columns: ["location"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "games_scorer_fkey"
            columns: ["scorer", "scorer_class"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["name", "class"]
          },
        ]
      }
      halls: {
        Row: {
          name: string
          sort: number
        }
        Insert: {
          name: string
          sort: number
        }
        Update: {
          name?: string
          sort?: number
        }
        Relationships: []
      }
      items: {
        Row: {
          category: string
          id: number
          item: string
          price: number
          soldOut: boolean
        }
        Insert: {
          category: string
          id?: number
          item: string
          price: number
          soldOut?: boolean
        }
        Update: {
          category?: string
          id?: number
          item?: string
          price?: number
          soldOut?: boolean
        }
        Relationships: []
      }
      standings: {
        Row: {
          class: Database["public"]["Enums"]["class"]
          diff: number
          id: number
          losses: number
          position: string
          team: Database["public"]["Enums"]["team"]
          wins: number
        }
        Insert: {
          class: Database["public"]["Enums"]["class"]
          diff?: number
          id?: number
          losses?: number
          position?: string
          team: Database["public"]["Enums"]["team"]
          wins?: number
        }
        Update: {
          class?: Database["public"]["Enums"]["class"]
          diff?: number
          id?: number
          losses?: number
          position?: string
          team?: Database["public"]["Enums"]["team"]
          wins?: number
        }
        Relationships: []
      }
      teams: {
        Row: {
          class: Database["public"]["Enums"]["class"]
          group_name: string | null
          name: string
        }
        Insert: {
          class: Database["public"]["Enums"]["class"]
          group_name?: string | null
          name: string
        }
        Update: {
          class?: Database["public"]["Enums"]["class"]
          group_name?: string | null
          name?: string
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
      class: "Schüler" | "T-Ball" | "Jugend"
      team:
        | "Karlsruhe"
        | "Darmstadt 1"
        | "Darmstadt 2"
        | "Remchingen"
        | "Bretten"
        | "Bretten 1"
        | "Bretten 2"
        | "Stuttgart 1"
        | "Stuttgart 2"
        | "Nagold"
        | "Mannheim"
        | "Schriesheim"
        | "Herrenberg"
        | "Heidelberg"
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
      class: ["Schüler", "T-Ball", "Jugend"],
      team: [
        "Karlsruhe",
        "Darmstadt 1",
        "Darmstadt 2",
        "Remchingen",
        "Bretten",
        "Bretten 1",
        "Bretten 2",
        "Stuttgart 1",
        "Stuttgart 2",
        "Nagold",
        "Mannheim",
        "Schriesheim",
        "Herrenberg",
        "Heidelberg",
      ],
    },
  },
} as const
