"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState("");
  const [isPending, setIsPending] = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const INPUT =
    "flex h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/40 disabled:opacity-40";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const supabase = createClient();
    const redirectTo =
      (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin) +
      "/auth/callback?next=/dashboard";

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );

    if (resetError) {
      setError(resetError.message);
      setIsPending(false);
      return;
    }

    setSent(true);
    setIsPending(false);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">

        <div className="border-b border-white/[0.06] px-8 py-6">
          <h1 className="text-xl font-bold tracking-tight text-white">Reset password</h1>
          <p className="mt-1 text-sm text-white/35">
            We&apos;ll email you a link to reset your password.
          </p>
        </div>

        <div className="px-8 py-7">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm font-medium text-white/80">Check your inbox</p>
              <p className="text-xs text-white/35">
                If an account exists for <strong className="text-white/60">{email}</strong>,
                you&apos;ll receive a reset link shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isPending}
                  className={INPUT}
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-500/20 bg-red-500/[0.06] px-3.5 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="mt-5 text-center font-mono text-[11px] text-white/25">
        Remember it?{" "}
        <Link href="/login" className="text-white/50 transition-colors hover:text-white/80">
          Sign in
        </Link>
      </p>
    </div>
  );
}
