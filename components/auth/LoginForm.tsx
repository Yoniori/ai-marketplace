"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { signInWithEmail } from "@/app/actions/auth";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { GitHubLoginButton } from "@/components/auth/GitHubLoginButton";

interface LoginFormProps {
  defaultEmail?: string;
  redirectTo?:   string;
  urlError?:     string;
}

const INPUT_CLASS =
  "flex h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/40 disabled:opacity-40";

export function LoginForm({ defaultEmail, redirectTo, urlError }: LoginFormProps) {
  const [isPending,    setIsPending]    = useState(false);
  const [error,        setError]        = useState<string | null>(urlError ?? null);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => { if (urlError) setError(urlError); }, [urlError]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (redirectTo) formData.set("redirectTo", redirectTo);
    const result = await signInWithEmail(null, formData);
    if (result && !result.success) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm">

      {/* Card */}
      <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">

        {/* Card header */}
        <div className="border-b border-white/[0.06] px-8 py-6">
          <h1 className="text-xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-white/35">
            Sign in to Vibe Code Market
          </p>
        </div>

        <div className="px-8 py-7 space-y-5">

          {/* OAuth providers */}
          <div className="space-y-2">
            <OAuthButton next={redirectTo ?? "/dashboard"} />
            <GitHubLoginButton next={redirectTo ?? "/dashboard"} />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/20">or</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-500/20 bg-red-500/[0.06] px-3.5 py-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                Email
              </label>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={defaultEmail}
                required
                placeholder="you@example.com"
                disabled={isPending}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-mono text-[10px] text-white/25 transition-colors hover:text-white/50"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  disabled={isPending}
                  className={`${INPUT_CLASS} pr-10`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/55"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 mt-1"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Signing in…" : "Sign in"}
            </button>

          </form>
        </div>
      </div>

      {/* Switch */}
      <p className="mt-5 text-center font-mono text-[11px] text-white/25">
        No account?{" "}
        <Link href="/signup" className="text-white/50 transition-colors hover:text-white/80">
          Create one free
        </Link>
      </p>

    </div>
  );
}
