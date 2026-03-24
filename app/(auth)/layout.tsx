import Link from "next/link";

/**
 * Shared layout for /login and /signup.
 * Dark glass shell — matches the homepage visual system.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#080808]">

      {/* Ambient violet glow — centered behind the form */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, hsl(256 70% 55% / 0.12) 0%, transparent 70%)",
        }}
      />

      {/* Header — identical to marketing Navbar chrome */}
      <header className="relative flex h-14 items-center border-b border-white/[0.06] px-6">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-white/80">
          <span className="font-mono text-xs font-bold text-primary select-none leading-none">▸</span>
          Vibe Code Market
        </Link>
      </header>

      {/* Page content */}
      <main className="relative flex flex-1 items-center justify-center p-6">
        {children}
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
