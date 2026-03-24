"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Globe, Github, Twitter, Loader2, CheckCircle2 } from "lucide-react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { updateProfile, promoteToCreator } from "@/app/actions/profile";
import type { Tables } from "@/types/supabase";

type Profile = Tables<"profiles">;

interface ProfileFormProps {
  profile: Profile;
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  icon,
  type = "text",
  maxLength,
  textarea,
}: {
  label:         string;
  name:          string;
  defaultValue?: string | null;
  placeholder?:  string;
  hint?:         string;
  icon?:         React.ReactNode;
  type?:         string;
  maxLength?:    number;
  textarea?:     boolean;
}) {
  const [len, setLen] = useState((defaultValue ?? "").length);
  const sharedClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>

      <div className={icon ? "relative" : undefined}>
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        {textarea ? (
          <textarea
            id={name}
            name={name}
            defaultValue={defaultValue ?? ""}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={3}
            onChange={(e) => setLen(e.target.value.length)}
            className={`${sharedClass} resize-none`}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            defaultValue={defaultValue ?? ""}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`${sharedClass} ${icon ? "pl-9" : ""}`}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {textarea && maxLength && (
          <p className="ml-auto text-xs text-muted-foreground">
            {len}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function ProfileForm({ profile }: ProfileFormProps) {
  const [status, setStatus]          = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setServerError(null);

    const formData = new FormData(e.currentTarget);
    const result   = await updateProfile(null, formData);

    if (result.success) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
      setServerError(result.error);
    }
  }

  // ── Promote to creator ────────────────────────────────────────────────────
  const [promoting, setPromoting]       = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoted, setPromoted]         = useState(false);

  function handlePromote() {
    setPromoting(true);
    setPromoteError(null);
    startTransition(async () => {
      const result = await promoteToCreator();
      if (result.success) {
        setPromoted(true);
        // Page will re-render from revalidation
      } else {
        setPromoteError(result.error);
      }
      setPromoting(false);
    });
  }

  return (
    <div className="space-y-10">

      {/* ── Profile fields form ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Avatar */}
        <AvatarUpload
          userId={profile.id}
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name ?? profile.username}
        />

        {/* Read-only username */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Username</label>
          <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground select-none">
            @{profile.username}
          </div>
          <p className="text-xs text-muted-foreground">
            Your username is permanent and cannot be changed.
          </p>
        </div>

        <Field
          label="Display name"
          name="display_name"
          defaultValue={profile.display_name}
          placeholder="Your public name"
          maxLength={60}
        />

        <Field
          label="Bio"
          name="bio"
          defaultValue={profile.bio}
          placeholder="A short description about you or your work…"
          maxLength={300}
          textarea
          hint="Shown on your public profile."
        />

        <div className="space-y-4">
          <p className="text-sm font-medium">Links</p>

          <Field
            name="website_url"
            label="Website"
            defaultValue={profile.website_url}
            placeholder="https://yoursite.com"
            icon={<Globe className="h-4 w-4" />}
          />
          <Field
            name="twitter_url"
            label="Twitter / X"
            defaultValue={profile.twitter_url}
            placeholder="https://twitter.com/yourhandle"
            icon={<Twitter className="h-4 w-4" />}
          />
          <Field
            name="github_url"
            label="GitHub"
            defaultValue={profile.github_url}
            placeholder="https://github.com/yourhandle"
            icon={<Github className="h-4 w-4" />}
          />
        </div>

        {/* Server error */}
        {serverError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === "saving"}
            className="btn-primary"
          >
            {status === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>

          {status === "saved" && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Saved
            </span>
          )}
        </div>
      </form>

      {/* ── Creator upgrade ──────────────────────────────────────────────── */}
      {profile.role === "buyer" && !promoted && (
        <div className="rounded-xl border border-border p-6">
          <p className="overline mb-3">Become a creator</p>
          <h3 className="text-base font-semibold">Start selling your AI-built products</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
            Creators can publish listings, earn revenue, and connect Stripe for
            instant payouts. Free to start — we take 10% only when you make a sale.
          </p>

          {promoteError && (
            <p className="mt-3 text-sm text-destructive">{promoteError}</p>
          )}

          <button
            type="button"
            onClick={handlePromote}
            disabled={promoting || isPending}
            className="btn-primary mt-5"
          >
            {promoting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Upgrading…
              </>
            ) : (
              <>
                Upgrade to creator
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}

      {(profile.role === "creator" || promoted) && (
        <div className="rounded-xl border border-border p-6">
          <p className="overline mb-3">Creator account</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
              Creator
            </span>
            <span className="text-sm text-muted-foreground">
              You can publish listings from your dashboard.
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
