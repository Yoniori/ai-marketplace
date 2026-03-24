"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { signUpWithEmail } from "@/app/actions/auth";
import { OAuthButton } from "@/components/auth/OAuthButton";

// ─── Password strength ────────────────────────────────────────────────────────

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8     },
  { label: "One uppercase letter",  test: (p: string) => /[A-Z]/.test(p)   },
  { label: "One number",            test: (p: string) => /\d/.test(p)       },
];

const STRENGTH_COLORS = [
  "bg-white/[0.08]",
  "bg-red-500/70",
  "bg-white/30",
  "bg-green-500/70",
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {PASSWORD_RULES.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-colors ${
              i < passed ? STRENGTH_COLORS[passed] : "bg-white/[0.08]"
            }`}
          />
        ))}
      </div>
      {passed < PASSWORD_RULES.length && (
        <p className="font-mono text-[10px] text-white/25">
          {PASSWORD_RULES.find((r) => !r.test(password))?.label}
        </p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const INPUT_CLASS =
  "flex h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/40 disabled:opacity-40";

export function SignupForm() {
  const [isPending,    setIsPending]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password,     setPassword]     = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await signUpWithEmail(null, formData);
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
          <h1 className="text-xl font-bold tracking-tight text-white">Create your account</h1>
          <p className="mt-1 text-sm text-white/35">
            Free forever · No credit card needed
          </p>
        </div>

        <div className="px-8 py-7 space-y-5">

          {/* Google OAuth */}
          <OAuthButton next="/dashboard" />

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

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <label htmlFor="name" className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                Full name
              </label>
              <input
                ref={nameRef}
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                disabled={isPending}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                disabled={isPending}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  disabled={isPending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <PasswordStrength password={password} />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 mt-1"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Creating account…" : "Create free account"}
            </button>

            <p className="font-mono text-[10px] text-white/20 leading-relaxed">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="text-white/35 transition-colors hover:text-white/55 underline underline-offset-2">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-white/35 transition-colors hover:text-white/55 underline underline-offset-2">
                Privacy Policy
              </Link>.
            </p>

          </form>
        </div>
      </div>

      {/* Switch */}
      <p className="mt-5 text-center font-mono text-[11px] text-white/25">
        Already have an account?{" "}
        <Link href="/login" className="text-white/50 transition-colors hover:text-white/80">
          Sign in
        </Link>
      </p>

    </div>
  );
}
