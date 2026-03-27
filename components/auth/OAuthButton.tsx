"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

interface OAuthButtonProps {
  next?: string;
}

export function OAuthButton({ next = "/dashboard" }: OAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Use the explicit app URL env var so production always redirects to the
    // correct domain. Falls back to window.location.origin for local dev
    // when NEXT_PUBLIC_APP_URL is not set.
    //
    // ⚠️  Do NOT append query params (e.g. ?next=...) to redirectTo.
    // Supabase stores the full redirectTo URL inside the OAuth state token.
    // When the state is looked up on the way back, the query string causes
    // the URL to fail allowlist matching and produces "bad_oauth_state".
    // The /auth/callback route defaults to /dashboard, so omitting ?next is fine.
    const baseUrl  = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const callback = `${baseUrl}/auth/callback`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (oauthError) {
      console.error("[OAuth] signInWithOAuth error:", oauthError.message);
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-white/[0.10] bg-white/[0.04] text-sm font-medium text-white/65 transition-colors hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white/40" />
        ) : (
          <GoogleIcon />
        )}
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
