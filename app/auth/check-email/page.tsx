import Link from "next/link";

/**
 * Shown after email/password sign-up while the user
 * awaits the Supabase confirmation email.
 * Self-contained dark layout — URL must stay at /auth/check-email.
 */
export default function CheckEmailPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#080808]">

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, hsl(256 70% 55% / 0.12) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="relative flex h-14 items-center border-b border-white/[0.06] px-6">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-white/80">
          <span className="font-mono text-xs font-bold text-primary select-none leading-none">▸</span>
          Vibe Code Market
        </Link>
      </header>

      {/* Content */}
      <main className="relative flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">

          <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">

            {/* Header */}
            <div className="border-b border-white/[0.06] px-8 py-6">
              <h1 className="text-xl font-bold tracking-tight text-white">Check your email</h1>
              <p className="mt-1 text-sm text-white/35">
                We sent a confirmation link to your inbox.
              </p>
            </div>

            <div className="px-8 py-7 space-y-5">

              {/* Hint */}
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="font-mono text-[11px] text-white/30 leading-relaxed">
                  Didn&apos;t receive it? Check your spam folder, or{" "}
                  <Link
                    href="/signup"
                    className="text-white/50 underline underline-offset-2 transition-colors hover:text-white/70"
                  >
                    try a different email
                  </Link>.
                </p>
              </div>

              {/* Back to sign in */}
              <Link
                href="/login"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/[0.10] bg-white/[0.04] text-sm font-medium text-white/65 transition-colors hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Back to sign in
              </Link>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.05] py-4 text-center">
        <p className="font-mono text-[10px] text-white/20">
          © {new Date().getFullYear()} Vibe Code Market ·{" "}
          <Link href="/terms" className="transition-colors hover:text-white/40">Terms</Link>
          {" "}·{" "}
          <Link href="/privacy" className="transition-colors hover:text-white/40">Privacy</Link>
        </p>
      </footer>

    </div>
  );
}
