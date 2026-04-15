import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/github/crypto";
import type { EncryptedToken } from "@/lib/github/crypto";

/**
 * POST /api/github/import
 *
 * Creates a draft listing from a selected GitHub repository.
 *
 * Steps:
 *  1. Verify user is authenticated.
 *  2. Reject if the repo has already been imported by this user (409).
 *  3. Fetch the repo's README via GitHub API (best-effort — optional).
 *  4. Insert a draft listing: title from repo name, description from README.
 *  5. Record the import in github_imported_repos.
 *  6. Return { listing_id }.
 *
 * Body: { repo_id, repo_full_name, repo_name, description }
 * Returns: { listing_id } on 201, or { error, listing_id? } on 4xx/5xx.
 */

const GITHUB_API_BASE = "https://api.github.com";
const USER_AGENT      = "VibecodeMarket/1.0 (https://vibecodemarket.com)";

interface ImportBody {
  repo_id:       number;
  repo_full_name: string; // e.g. "alice/my-project"
  repo_name:     string;  // e.g. "my-project"
  description:   string | null;
}

export async function POST(request: Request) {
  // ── Auth ─────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ───────────────────────────────────────────────
  let body: ImportBody;
  try {
    body = (await request.json()) as ImportBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.repo_id || !body.repo_full_name || !body.repo_name) {
    return NextResponse.json(
      { error: "Missing required fields: repo_id, repo_full_name, repo_name" },
      { status: 400 }
    );
  }

  const admin = await createAdminClient();
  const db    = admin as any;

  // ── Duplicate check ──────────────────────────────────────────
  const { data: existing } = await db
    .from("github_imported_repos")
    .select("listing_id")
    .eq("user_id",        user.id)
    .eq("github_repo_id", body.repo_id)
    .maybeSingle();

  if (existing?.listing_id) {
    // Already imported — return the existing listing id so the UI can navigate.
    return NextResponse.json(
      { error: "Repository already imported", listing_id: existing.listing_id },
      { status: 409 }
    );
  }

  // ── Fetch README (best-effort) ────────────────────────────────
  // We need the decrypted token to call the GitHub API.
  // If anything fails here we simply proceed without a README.
  let readme = "";

  const { data: conn } = await db
    .from("github_connections")
    .select("encrypted_access_token, token_iv, token_auth_tag")
    .eq("user_id", user.id)
    .maybeSingle();

  if (conn) {
    const token = decryptToken({
      ciphertext: conn.encrypted_access_token,
      iv:         conn.token_iv,
      authTag:    conn.token_auth_tag,
    } as EncryptedToken);

    if (token) {
      try {
        const readmeRes = await fetch(
          `${GITHUB_API_BASE}/repos/${body.repo_full_name}/readme`,
          {
            headers: {
              Authorization:          `Bearer ${token}`,
              // raw+json returns the decoded file content directly.
              Accept:                 "application/vnd.github.raw+json",
              "User-Agent":           USER_AGENT,
              "X-GitHub-Api-Version": "2022-11-28",
            },
            cache: "no-store",
          }
        );
        if (readmeRes.ok) {
          const raw = await readmeRes.text();
          // Trim markdown to a readable length for the description field.
          readme = raw.slice(0, 2000).trim();
        }
      } catch {
        // README is optional — swallow and proceed.
      }
    }
  }

  // ── Build listing fields ─────────────────────────────────────
  // Title: repo name with hyphens/underscores replaced, words capitalised.
  const title = body.repo_name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Slug: lowercase repo name, hyphens only, unique suffix to avoid collisions.
  const slugBase = body.repo_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const description =
    readme ||
    body.description ||
    `Imported from GitHub: ${body.repo_full_name}`;

  // Tagline must be 10–120 chars (DB constraint).
  const rawTagline = body.description || `Imported from GitHub: ${body.repo_full_name}`;
  const tagline = rawTagline.length < 10
    ? rawTagline.padEnd(10, " ")
    : rawTagline.slice(0, 120);

  // ── Insert draft listing ─────────────────────────────────────
  const { data: listing, error: listingError } = await db
    .from("listings")
    .insert({
      creator_id:  user.id,
      title,
      slug,
      tagline,
      description,
      price_type:  "free",
      price_cents: 0,
      status:      "draft",
    })
    .select("id")
    .single();

  if (listingError || !listing) {
    console.error("[GitHub Import] Listing insert failed:", listingError?.message);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }

  // ── Record import ────────────────────────────────────────────
  const { error: importError } = await db
    .from("github_imported_repos")
    .insert({
      user_id:                user.id,
      listing_id:             listing.id,
      github_repo_id:         body.repo_id,
      github_repo_full_name:  body.repo_full_name,
    });

  if (importError) {
    // The listing was created — don't fail the request, just log.
    console.warn("[GitHub Import] Failed to record import row:", importError.message);
  }

  return NextResponse.json({ listing_id: listing.id }, { status: 201 });
}
