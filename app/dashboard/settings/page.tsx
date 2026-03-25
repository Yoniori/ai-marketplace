import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { GitHubSection } from "@/components/github/GitHubSection";
import type { Tables } from "@/types/supabase";

export const metadata = {
  title: "Settings — Vibe Code Market",
};

/**
 * /dashboard/settings — Edit profile + GitHub integration.
 *
 * Reads the github_connections row server-side and passes the GitHub
 * username (or null) to GitHubSection — no client-side auth needed.
 *
 * searchParams:
 *   github_connected=true  — shown after a successful connect flow
 *   github_error=<reason>  — shown when /api/github/callback errors
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { github_connected?: string; github_error?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawProfile } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = rawProfile as Tables<"profiles"> | null;
  if (!profile) redirect("/");

  // ── GitHub connection status (server-read, no client fetch needed) ─
  const admin = await createAdminClient();
  const { data: ghConn } = await (admin as any)
    .from("github_connections")
    .select("github_username")
    .eq("user_id", user.id)
    .maybeSingle();

  const githubUsername: string | null = ghConn?.github_username ?? null;

  return (
    <div className="max-w-xl space-y-10">

      {/* ── GitHub callback flash messages ── */}
      {searchParams.github_connected === "true" && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-400">
          GitHub connected successfully.
        </div>
      )}
      {searchParams.github_error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
          GitHub connection failed:{" "}
          {searchParams.github_error.replace(/_/g, " ")}
        </div>
      )}

      {/* ── Profile section ── */}
      <div>
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight">Profile settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your public profile and account preferences.
          </p>
          <Link
            href={`/profile/${profile.username}`}
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            View public profile
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="border-t border-border pt-8">
          <ProfileForm profile={profile} />
        </div>
      </div>

      {/* ── GitHub section ── */}
      <div>
        <div className="mb-5 border-t border-border pt-8">
          <h2 className="text-base font-semibold tracking-tight">GitHub</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your account to import repositories as listings.
          </p>
        </div>
        <GitHubSection githubUsername={githubUsername} />
      </div>

    </div>
  );
}
