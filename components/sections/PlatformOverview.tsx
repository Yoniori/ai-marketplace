// ─── PlatformOverview ─────────────────────────────────────────────────────────
//
// Server Component — no 'use client' needed.
// Hover colours are driven by CSS custom properties (--tile-glow, --tile-border)
// injected as inline styles, then read by the .feature-tile:hover rule in
// globals.css. This avoids onMouseEnter/onMouseLeave JS handlers entirely.

const FEATURES = [
  {
    index:  "01",
    title:  "Discover ready-to-use tools",
    desc:   "Browse apps, automations, agents, and extensions built by real creators. Filter by category, buy instantly, and start using right away.",
    // Cyan accent
    accentLine:   "linear-gradient(90deg, transparent, rgba(0,255,255,0.55), transparent)",
    accentRule:   "rgba(0,255,255,0.55)",
    accentIndex:  "rgba(0,255,255,0.90)",
    tileGlow:     "rgba(0,255,255,0.08)",
    tileBorder:   "rgba(0,255,255,0.30)",
    badgeDot:     "#00e6e6",
  },
  {
    index:  "02",
    title:  "List without friction",
    desc:   "No approval queue. No listing fees. Add your product, connect Stripe, and start earning the same day you ship.",
    // Violet accent
    accentLine:   "linear-gradient(90deg, transparent, rgba(156,66,244,0.55), transparent)",
    accentRule:   "rgba(156,66,244,0.55)",
    accentIndex:  "rgba(156,66,244,0.90)",
    tileGlow:     "rgba(156,66,244,0.08)",
    tileBorder:   "rgba(156,66,244,0.30)",
    badgeDot:     "#9c42f4",
  },
  {
    index:  "03",
    title:  "Keep 90% of every sale",
    desc:   "A flat 10% platform fee. Every payout goes directly to your Stripe account — no monthly costs, no hidden cuts.",
    // Green accent
    accentLine:   "linear-gradient(90deg, transparent, rgba(105,253,93,0.55), transparent)",
    accentRule:   "rgba(105,253,93,0.55)",
    accentIndex:  "rgba(105,253,93,0.90)",
    tileGlow:     "rgba(105,253,93,0.08)",
    tileBorder:   "rgba(105,253,93,0.30)",
    badgeDot:     "#69fd5d",
  },
  {
    index:  "04",
    title:  "Built for the AI coding era",
    desc:   "Whether you used Claude Code, Cursor, or Lovable to build it — if it solves a real problem, it belongs here.",
    // Cyan accent
    accentLine:   "linear-gradient(90deg, transparent, rgba(0,255,255,0.55), transparent)",
    accentRule:   "rgba(0,255,255,0.55)",
    accentIndex:  "rgba(0,255,255,0.90)",
    tileGlow:     "rgba(0,255,255,0.08)",
    tileBorder:   "rgba(0,255,255,0.30)",
    badgeDot:     "#00e6e6",
  },
] as const;

export function PlatformOverview() {
  return (
    <section
      className="border-b"
      style={{
        background:   "#0e0e10",
        borderColor:  "rgba(0,255,255,0.08)",
      }}
    >
      <div className="container py-20 md:py-28">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-end md:gap-16">

          <div>
            {/* Pill badge */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1"
              style={{
                background: "rgba(0,255,255,0.06)",
                border:     "1px solid rgba(0,255,255,0.20)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ background: "#00e6e6", boxShadow: "0 0 6px rgba(0,230,230,0.6)" }}
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-400/80">
                Platform
              </span>
            </div>

            <h2 className="font-headline text-[2.25rem] font-bold tracking-[-0.035em] leading-[1.05] text-white md:text-[2.75rem]">
              Turn ideas into products
            </h2>
          </div>

          <p className="text-base text-on-surface-variant leading-relaxed md:max-w-[26rem]">
            A focused marketplace for apps, automations, agents, and tools built
            with AI coding tools. Discover what others have shipped. List what
            you've built. No gatekeeping, no upfront costs.
          </p>

        </div>

        {/* ── Feature grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            /*
             * CSS custom properties on the element are read by .feature-tile:hover
             * in globals.css — zero JS needed, stays a pure Server Component.
             */
            <div
              key={f.index}
              className="feature-tile group relative flex flex-col gap-5 rounded-xl p-8"
              style={{
                "--tile-glow":   f.tileGlow,
                "--tile-border": f.tileBorder,
                background:      "rgba(25, 25, 28, 0.70)",
                backdropFilter:  "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border:          "1px solid rgba(72,71,74,0.50)",
              } as React.CSSProperties}
            >
              {/* Top accent line — shown by CSS via group-hover */}
              <div
                aria-hidden
                className="feature-tile-top-line absolute inset-x-0 top-0 h-px rounded-t-xl opacity-0 transition-opacity duration-300"
                style={{ background: f.accentLine }}
              />

              {/* Index with expanding rule */}
              <div className="flex items-center gap-3">
                <div
                  className="h-px w-8 flex-none transition-all duration-300 group-hover:w-12"
                  style={{ background: f.accentRule }}
                />
                <span
                  className="font-mono text-[10px] tracking-[0.2em]"
                  style={{ color: f.accentIndex }}
                >
                  {f.index}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-headline text-base font-semibold text-white/80 transition-colors duration-200 group-hover:text-white">
                {f.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {f.desc}
              </p>

              {/* Bottom rule */}
              <div
                className="mt-2 h-px w-8 transition-all duration-300 group-hover:w-16"
                style={{ background: f.accentRule }}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
