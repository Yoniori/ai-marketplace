
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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: number
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      listing_tags: {
        Row: {
          listing_id: string
          tag_id: number
        }
        Insert: {
          listing_id: string
          tag_id: number
        }
        Update: {
          listing_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_listing_tags_listing"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          avg_rating: number
          category_id: number | null
          created_at: string
          creator_id: string
          currency: string
          demo_url: string | null
          description: string
          featured_until: string | null
          gallery_urls: string[]
          id: string
          is_featured: boolean
          price_cents: number
          price_type: Database["public"]["Enums"]["price_type"]
          product_url: string | null
          published_at: string | null
          purchase_count: number
          review_count: number
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          tagline: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          avg_rating?: number
          category_id?: number | null
          created_at?: string
          creator_id: string
          currency?: string
          demo_url?: string | null
          description: string
          featured_until?: string | null
          gallery_urls?: string[]
          id?: string
          is_featured?: boolean
          price_cents?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          product_url?: string | null
          published_at?: string | null
          purchase_count?: number
          review_count?: number
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          tagline: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          avg_rating?: number
          category_id?: number | null
          created_at?: string
          creator_id?: string
          currency?: string
          demo_url?: string | null
          description?: string
          featured_until?: string | null
          gallery_urls?: string[]
          id?: string
          is_featured?: boolean
          price_cents?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          product_url?: string | null
          published_at?: string | null
          purchase_count?: number
          review_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          tagline?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          github_url: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          stripe_account_id: string | null
          stripe_onboarded: boolean
          twitter_url: string | null
          updated_at: string
          username: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          github_url?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          twitter_url?: string | null
          updated_at?: string
          username: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          github_url?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          twitter_url?: string | null
          updated_at?: string
          username?: string
          website_url?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          access_granted: boolean
          access_granted_at: string | null
          amount_cents: number
          buyer_id: string
          created_at: string
          creator_payout_cents: number
          currency: string
          id: string
          listing_id: string
          platform_fee_cents: number
          status: Database["public"]["Enums"]["purchase_status"]
          stripe_charge_id: string | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          access_granted?: boolean
          access_granted_at?: string | null
          amount_cents: number
          buyer_id: string
          created_at?: string
          creator_payout_cents: number
          currency?: string
          id?: string
          listing_id: string
          platform_fee_cents: number
          status?: Database["public"]["Enums"]["purchase_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          access_granted?: boolean
          access_granted_at?: string | null
          amount_cents?: number
          buyer_id?: string
          created_at?: string
          creator_payout_cents?: number
          currency?: string
          id?: string
          listing_id?: string
          platform_fee_cents?: number
          status?: Database["public"]["Enums"]["purchase_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          flagged: boolean
          id: string
          is_visible: boolean
          listing_id: string
          purchase_id: string
          rating: number
          reviewer_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          is_visible?: boolean
          listing_id: string
          purchase_id: string
          rating: number
          reviewer_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          is_visible?: boolean
          listing_id?: string
          purchase_id?: string
          rating?: number
          reviewer_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: true
            referencedRelation: "buyer_access"
            referencedColumns: ["purchase_id"]
          },
          {
            foreignKeyName: "reviews_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: true
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: number
          name: string
          slug: string
          tag_type: Database["public"]["Enums"]["tag_type"]
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          slug: string
          tag_type?: Database["public"]["Enums"]["tag_type"]
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          slug?: string
          tag_type?: Database["public"]["Enums"]["tag_type"]
        }
        Relationships: []
      }
    }
    Views: {
      buyer_access: {
        Row: {
          buyer_id: string | null
          listing_id: string | null
          purchase_id: string | null
          purchased_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          listing_id?: string | null
          purchase_id?: string | null
          purchased_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          listing_id?: string | null
          purchase_id?: string | null
          purchased_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      listing_status: "draft" | "published" | "archived" | "suspended"
      price_type: "free" | "paid" | "contact"
      purchase_status: "pending" | "completed" | "refunded" | "disputed"
      tag_type: "built_with" | "general" | "technology"
      user_role: "buyer" | "creator" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      listing_status: ["draft", "published", "archived", "suspended"],
      price_type: ["free", "paid", "contact"],
      purchase_status: ["pending", "completed", "refunded", "disputed"],
      tag_type: ["built_with", "general", "technology"],
      user_role: ["buyer", "creator", "admin"],
    },
  },
} as const
