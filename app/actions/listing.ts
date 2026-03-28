"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

// ── Slug helpers ──────────────────────────────────────────────────────────────

/**
 * Convert a listing title to a URL-safe slug.
 * "My Cool Project!!" → "my-cool-project"
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")                     // decompose accented chars
    .replace(/[\u0300-\u036f]/g, "")      // strip accent marks
    .replace(/[^a-z0-9\s-]/g, "")        // remove non-alphanumeric (keep spaces + hyphens)
    .trim()
    .replace(/\s+/g, "-")                 // spaces → hyphens
    .replace(/-+/g, "-")                  // collapse multiple hyphens
    .slice(0, 80);                        // cap at 80 chars so suffix fits in the column
}

/** 6-char alphanumeric suffix for collision resistance, e.g. "a3f9kz". */
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Full slug: "my-cool-project-a3f9kz" */
function generateSlug(title: string): string {
  const base   = slugify(title) || "listing"; // fallback if title is all symbols
  const suffix = randomSuffix();
  return `${base}-${suffix}`;
}

export type ListingResult =
  | { success: true; listingId: string }
  | { success: false; error: string };

export type UploadResult =
  | { success: true; filesPath: string }
  | { success: false; error: string };

/**
 * createListing — Phase 1 of the "New listing" flow.
 *
 * Creates a draft listing from text fields and returns the new listing's ID.
 * The caller (page component) is responsible for navigation after this
 * returns — we do NOT call redirect() here so the page can optionally run
 * Phase 2 (ZIP upload) before pushing to the detail route.
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
  const title       = (formData.get("title")       as string)?.trim();
  const tagline     = (formData.get("tagline")      as string)?.trim() || null;
  const description = (formData.get("description")  as string)?.trim() || null;
  const priceType   = (formData.get("price_type")   as string) || "free";
  const priceRaw    = (formData.get("price_cents")  as string) || "0";

  if (!title) return { success: false, error: "Title is required." };
  if (title.length > 120) return { success: false, error: "Title must be 120 characters or fewer." };
  if (tagline && tagline.length > 200) return { success: false, error: "Tagline must be 200 characters or fewer." };

  const priceCents =
    priceType === "paid"
      ? Math.max(0, Math.round(parseFloat(priceRaw) * 100))
      : 0;

  // Use admin client for the insert (bypasses RLS on status column)
  let db: Awaited<ReturnType<typeof createAdminClient>>;
  try {
    db = await createAdminClient();
  } catch {
    db = supabase as unknown as Awaited<ReturnType<typeof createAdminClient>>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing, error } = await (db as any)
    .from("listings")
    .insert({
      creator_id:  user.id,
      slug:        generateSlug(title),   // e.g. "my-project-a3f9kz"
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

  return { success: true, listingId: listing.id };
}

/**
 * uploadListingZip — Phase 2 of the "New listing" flow.
 *
 * Receives a single ZIP file from a FormData object, uploads it to the
 * `listing-files` Supabase Storage bucket, and writes the storage path to
 * listings.files_path.
 *
 * Design decisions:
 *   • Uses adminClient for Storage so no Storage RLS policy is required on
 *     the bucket — the ownership check is enforced in this action instead.
 *   • Stored path format: `{listingId}/product.zip` (within the bucket).
 *   • Existing files are overwritten (upsert: true) so re-uploads work.
 *   • File validation (type + size) is double-checked server-side even
 *     though the form already validates client-side.
 *   • A failed upload is non-fatal: the caller still navigates to the
 *     listing detail page and the Gatekeeper will scan description-only.
 *
 * Body size: next.config.mjs sets serverActions.bodySizeLimit = '50mb'.
 */
export async function uploadListingZip(
  listingId: string,
  formData: FormData
): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated." };

  // Ownership guard — use regular client (RLS scoped to authenticated user)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase as any)
    .from("listings")
    .select("creator_id")
    .eq("id", listingId)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (!listing) {
    return { success: false, error: "Listing not found or access denied." };
  }

  // Extract and validate file
  const file = formData.get("product_zip") as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: "No file received." };
  }
  if (!file.name.toLowerCase().endsWith(".zip")) {
    return { success: false, error: "Only .zip files are accepted." };
  }
  const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_BYTES) {
    return {
      success: false,
      error: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — maximum is 50 MB.`,
    };
  }

  // Upload via admin client (bypasses Storage RLS)
  let admin: Awaited<ReturnType<typeof createAdminClient>>;
  try {
    admin = await createAdminClient();
  } catch {
    // Fall back to user client — upload may fail if Storage RLS is strict
    admin = supabase as unknown as Awaited<ReturnType<typeof createAdminClient>>;
  }

  const storagePath = `${listingId}/product.zip`;

  const { error: uploadError } = await admin.storage
    .from("listing-files")
    .upload(storagePath, file, {
      upsert:      true,           // overwrite on re-upload
      contentType: "application/zip",
    });

  if (uploadError) {
    console.error("[uploadListingZip] Storage upload failed:", uploadError.message);

    // Surface a friendly message for the most common cause
    const msg = uploadError.message.toLowerCase().includes("bucket")
      ? "Storage bucket not found. Ask your admin to create the 'listing-files' bucket in Supabase."
      : `Upload failed: ${uploadError.message}`;

    return { success: false, error: msg };
  }

  // Persist the path on the listing row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from("listings")
    .update({ files_path: storagePath })
    .eq("id", listingId);

  if (updateError) {
    console.error("[uploadListingZip] files_path update failed:", updateError.message);
    // Upload succeeded but DB write failed — not worth blocking the user
    return {
      success: false,
      error: "File uploaded but path could not be saved. Run the check anyway — it will skip file analysis.",
    };
  }

  return { success: true, filesPath: storagePath };
}
