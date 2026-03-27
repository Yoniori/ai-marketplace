"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type ListingResult =
  | { success: true; listingId: string }
  | { success: false; error: string };

/**
 * createListing — Server action called from /dashboard/listings/new.
 *
 * Creates a draft listing for the authenticated creator and redirects
 * to the listing detail page so the AI quality check can run immediately.
 */
export async function createListing(
  _prevState: ListingResult | null,
  formData: FormData
): Promise<ListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated." };

  // Verify creator role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "creator" && profile.role !== "admin")) {
    return { success: false, error: "Only creator accounts can create listings." };
  }

  // Parse form fields
  const title      = (formData.get("title")       as string)?.trim();
  const tagline    = (formData.get("tagline")      as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const priceType  = (formData.get("price_type")   as string) || "free";
  const priceRaw   = (formData.get("price_cents")  as string) || "0";

  if (!title) return { success: false, error: "Title is required." };
  if (title.length > 120) return { success: false, error: "Title must be 120 characters or fewer." };
  if (tagline && tagline.length > 200) return { success: false, error: "Tagline must be 200 characters or fewer." };

  const priceCents =
    priceType === "paid"
      ? Math.max(0, Math.round(parseFloat(priceRaw) * 100))
      : 0;

  // Use admin client for the insert to bypass RLS on status column
  let db: Awaited<ReturnType<typeof createAdminClient>>;
  try {
    db = await createAdminClient();
  } catch {
    // Fall back to regular client if service key is unavailable
    db = supabase as unknown as Awaited<ReturnType<typeof createAdminClient>>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing, error } = await (db as any)
    .from("listings")
    .insert({
      creator_id:  user.id,
      title,
      tagline,
      description: description || `Draft listing: ${title}`,
      price_type:  priceType,
      price_cents: priceCents,
      status:      "draft",
    })
    .select("id")
    .single();

  if (error || !listing) {
    console.error("[createListing] insert failed:", error?.message);
    return { success: false, error: "Failed to create listing. Please try again." };
  }

  // Redirect happens outside the return — redirect() throws internally in Next.js
  redirect(`/dashboard/listings/${listing.id}`);
}
