import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { Tables } from "@/types/supabase";

export const metadata = {
  title: "Settings — Vibe Code Market",
};

/**
 * /dashboard/settings — Edit profile page.
 * Protected by DashboardLayout; no extra auth check needed.
 */
export default async function SettingsPage() {
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

  return (
    <div className="max-w-xl">

      {/* ── Header ── */}
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
  );
}
