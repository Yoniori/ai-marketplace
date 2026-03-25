"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ProfileResult =
  | { success: true; message?: string }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────
// Update profile fields
// ─────────────────────────────────────────────────────────────

export async function updateProfile(
  _prevState: ProfileResult | null,
  formData: FormData
): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated." };

  const display_name = (formData.get("display_name") as string)?.trim() || null;
  const bio          = (formData.get("bio")          as string)?.trim() || null;
  const website_url  = (formData.get("website_url")  as string)?.trim() || null;
  const twitter_url  = (formData.get("twitter_url")  as string)?.trim() || null;
  const github_url   = (formData.get("github_url")   as string)?.trim() || null;
  const avatar_url   = (formData.get("avatar_url")   as string)?.trim() || null;

  // Basic URL validation
  const urlFields: [string, string | null][] = [
    ["Website URL", website_url],
    ["Twitter URL", twitter_url],
    ["GitHub URL",  github_url],
  ];
  for (const [label, url] of urlFields) {
    if (url && !/^https?:\/\//i.test(url)) {
      return { success: false, error: `${label} must start with https://` };
    }
  }

  // Bio limit
  if (bio && bio.length > 300) {
    return { success: false, error: "Bio must be 300 characters or fewer." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      display_name,
      bio,
      website_url,
      twitter_url,
      github_url,
      ...(avatar_url ? { avatar_url } : {}),
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  // Revalidate both the settings page and the public profile
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRow } = await (supabase as any)
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (profileRow?.username) {
    revalidatePath(`/profile/${profileRow.username}`);
  }

  return { success: true, message: "Profile updated." };
}

// ─────────────────────────────────────────────────────────────
// Promote buyer → creator
// Uses admin client so the role update bypasses any RLS
// restriction on the role column. Server validates the user
// is currently a buyer before writing.
// ─────────────────────────────────────────────────────────────

export async function promoteToCreator(): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated." };

  // Verify the user is currently a buyer
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (fetchError || !profile) {
    return { success: false, error: "Profile not found." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentRole = (profile as any).role as string;
  if (currentRole !== "buyer") {
    return { success: false, error: "Only buyer accounts can be upgraded." };
  }

  // Use admin client to bypass RLS on the role column.
  // createAdminClient() throws if SUPABASE_SERVICE_ROLE_KEY is absent —
  // catch it so the action returns a readable error instead of crashing.
  let admin: Awaited<ReturnType<typeof createAdminClient>>;
  try {
    admin = await createAdminClient();
  } catch (err) {
    console.error("[promoteToCreator] admin client unavailable:", err);
    return { success: false, error: "Upgrade temporarily unavailable. Please try again later." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("profiles")
    .update({ role: "creator" })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return { success: true, message: "You're now a creator. Welcome!" };
}
