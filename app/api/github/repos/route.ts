import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/github/crypto";
import type { EncryptedToken } from "@/lib/github/crypto";

/**
 * GET /api/github/repos
 *
 * Returns the authenticated user's GitHub repositories using their
 * stored (and decrypted) access token from github_connections.
 *
 * Requires: user is authenticated + has a github_connections row.
 * Returns:  { repos: Repo[] }
 */

const GITHUB_API_BASE = "https://api.github.com";
const USER_AGENT      = "VibecodeMarket/1.0 (https://vibecodemarket.com)";

export interface GitHubRepo {
  id:          number;
  name:        string;
  full_name:   string;
  description: string | null;
  html_url:    string;
  stars:       number;
  language:    string | null;
  private:     boolean;
  pushed_at:   string;
}

export async function GET() {
  // ── Auth ─────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Read & decrypt token ──────────────────────────────────────
  const admin = await createAdminClient();
  const { data: conn } = await (admin as any)
    .from("github_connections")
    .select("encrypted_access_token, token_iv, token_auth_tag")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 404 });
  }

  const token = decryptToken({
    ciphertext: conn.encrypted_access_token,
    iv:         conn.token_iv,
    authTag:    conn.token_auth_tag,
  } as EncryptedToken);

  if (!token) {
    return NextResponse.json(
      { error: "Token decryption failed — please reconnect GitHub" },
      { status: 400 }
    );
  }

  // ── Fetch repos from GitHub ───────────────────────────────────
  // owner affiliation only, sorted by latest push, up to 50 repos.
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/user/repos?sort=pushed&per_page=50&affiliation=owner`,
      {
        headers: {
          Authorization:          `Bearer ${token}`,
          Accept:                 "application/vnd.github+json",
          "User-Agent":           USER_AGENT,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`GitHub API returned HTTP ${res.status}`);
    }

    const raw = (await res.json()) as Array<{
      id:               number;
      name:             string;
      full_name:        string;
      description:      string | null;
      html_url:         string;
      stargazers_count: number;
      language:         string | null;
      private:          boolean;
      pushed_at:        string;
    }>;

    const repos: GitHubRepo[] = raw.map((r) => ({
      id:          r.id,
      name:        r.name,
      full_name:   r.full_name,
      description: r.description,
      html_url:    r.html_url,
      stars:       r.stargazers_count,
      language:    r.language,
      private:     r.private,
      pushed_at:   r.pushed_at,
    }));

    return NextResponse.json({ repos });
  } catch (err) {
    console.error("[GitHub Repos] Fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 });
  }
}
