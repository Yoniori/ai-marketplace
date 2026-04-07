import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/profiles/me
 * Updates the authenticated user's own profile.
 *
 * Allowed fields: display_name, bio, website_url, twitter_url, github_url,
 *   avatar_url, username.
 *
 * Explicitly NOT allowed: id, role, stripe_account_id, stripe_onboarded
 * (those are set by admin/system only).
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Whitelist editable fields
  const ALLOWED: Record<string, (v: unknown) => string | null> = {
    display_name: (v) => {
      if (v === null) return null; // allow clearing
      if (typeof v !== "string") return "display_name must be a string";
      if (v.trim().length > 60) return "display_name must be 60 characters or fewer";
      return null;
    },
    bio: (v) => {
      if (v === null) return null;
      if (typeof v !== "string") return "bio must be a string";
      if (v.trim().length > 500) return "bio must be 500 characters or fewer";
      return null;
    },
    website_url: (v) => {
      if (v === null) return null;
      if (typeof v !== "string") return "website_url must be a string";
      if (v && !/^https?:\/\/.+/.test(v)) return "website_url must start with http:// or https://";
      return null;
    },
    twitter_url: (v) => {
      if (v === null) return null;
      if (typeof v !== "string") return "twitter_url must be a string";
      if (v && !/^https?:\/\/.+/.test(v)) return "twitter_url must start with http:// or https://";
      return null;
    },
    github_url: (v) => {
      if (v === null) return null;
      if (typeof v !== "string") return "github_url must be a string";
      if (v && !/^https?:\/\/.+/.test(v)) return "github_url must start with http:// or https://";
      return null;
    },
    avatar_url: (v) => {
      if (v === null) return null;
      if (typeof v !== "string") return "avatar_url must be a string";
      if (v && !/^https?:\/\/.+/.test(v)) return "avatar_url must start with http:// or https://";
      return null;
    },
    username: (v) => {
      if (typeof v !== "string") return "username must be a string";
      if (!/^[a-z0-9_-]{3,30}$/.test(v)) {
        return "username must be 3-30 characters and contain only lowercase letters, numbers, hyphens, or underscores";
      }
      return null;
    },
  };

  const update: Record<string, unknown> = {};
  for (const [key, validate] of Object.entries(ALLOWED)) {
    if (key in body) {
      const err = validate(body[key]);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
      // Trim strings (except null)
      update[key] = typeof body[key] === "string" ? (body[key] as string).trim() || null : body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateError } = await (supabase as any)
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select(
      "id, username, display_name, bio, avatar_url, website_url, twitter_url, github_url, updated_at"
    )
    .single();

  if (updateError) {
    // Handle unique constraint violation on username
    if (updateError.code === "23505" && updateError.message.includes("username")) {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }
    console.error("[PATCH /api/profiles/me] Update error:", updateError.message);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ data: updated });
}
