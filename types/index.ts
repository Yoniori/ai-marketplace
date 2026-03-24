/**
 * Vibe Code Market — Shared TypeScript Types
 *
 * These are the core domain types used across the app.
 * The full auto-generated Supabase types live in types/supabase.ts
 * (generated via: npm run db:types)
 */

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type UserRole = "buyer" | "creator" | "admin";

export type ListingStatus = "draft" | "published" | "archived" | "suspended";

export type PriceType = "free" | "paid" | "contact";

export type PurchaseStatus = "pending" | "completed" | "refunded" | "disputed";

export type TagType = "built_with" | "general" | "technology";

// ─────────────────────────────────────────────
// Core Entities
// ─────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  role: UserRole;
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  tag_type: TagType;
  created_at: string;
}

export interface Listing {
  id: string;
  creator_id: string;
  category_id: number | null;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  demo_url: string | null;
  product_url: string | null;
  thumbnail_url: string | null;
  gallery_urls: string[];
  price_type: PriceType;
  price_cents: number;
  currency: string;
  status: ListingStatus;
  is_featured: boolean;
  featured_until: string | null;
  review_count: number;
  avg_rating: number;
  purchase_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: Profile;
  category?: Category;
  tags?: Tag[];
}

export interface Purchase {
  id: string;
  buyer_id: string;
  listing_id: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  stripe_charge_id: string | null;
  amount_cents: number;
  platform_fee_cents: number;
  creator_payout_cents: number;
  currency: string;
  status: PurchaseStatus;
  access_granted: boolean;
  access_granted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  listing?: Listing;
  buyer?: Profile;
}

export interface Review {
  id: string;
  listing_id: string;
  reviewer_id: string;
  purchase_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string | null;
  body: string | null;
  is_visible: boolean;
  flagged: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  reviewer?: Profile;
}

// ─────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
}

// ─────────────────────────────────────────────
// Form / Input Types
// ─────────────────────────────────────────────

export interface ListingFormData {
  title: string;
  tagline: string;
  description: string;
  category_id: number | null;
  price_type: PriceType;
  price_cents: number;
  demo_url: string;
  product_url: string;
  tag_ids: number[];
  status: ListingStatus;
}

export interface ProfileFormData {
  display_name: string;
  username: string;
  bio: string;
  website_url: string;
  twitter_url: string;
  github_url: string;
  role: UserRole;
}

// ─────────────────────────────────────────────
// Browse / Search Types
// ─────────────────────────────────────────────

export interface ListingFilters {
  q?: string;
  category?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "rating" | "price_asc" | "price_desc" | "popular";
  page?: number;
  pageSize?: number;
}
