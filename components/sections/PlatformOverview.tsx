// ─── PlatformOverview ─────────────────────────────────────────────────────────
// Dark Cyber-Tech design: dark cards, indigo/teal/green accents, sharp typography.

const FEATURES = [
  {
    index: "01",
    title: "Discover ready-to-use tools",
    desc:  "Browse apps, automations, agents, and extensions built by real creators. Filter by category, buy instantly, and start using right away.",
    accent: "#6366F1",
    accentMuted: "rgba(99,102,241,0.12)",
  },
  {
    index: "02",
    title: "List without friction",
    desc:  "No approval queue. No listing fees. Add your product, connect Stripe, and start earning the same day you ship.",
    accent: "#00F5FF",
    accentMuted: "rgba(0,245,255,0.10)",
  },
  {
    index: "03",
    title: "Keep 90% of every sale",
    desc:  "A flat 10% platform fee. Every payout goes directly to your Stripe account — no monthly costs, no hidden cuts.",
    accent: "#22C55E",
    accentMuted: "rgba(34,197,94,0.10)",
  },
  {
    index: "04",
    title: "Built for the AI coding era",
    desc:  "Whether you used Claude Code, Cursor, or Lovable to build it — if it solves a real problem, it belongs here.",
    accent: "#6366F1",
    accentMuted: "rgba(99,102,241,0.12)",
  },
] as const;

export function PlatformOverview() {
  return (
    <section
      style={{
        background: "#000000",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="container py-20 md:py-28">

        {/* ── Header ── */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-end md:gap-16">
          <div>
            <p
              className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] font-mono"
              style={{ color: "#3F3F46" }}
            >
              Platform
            </p>
            <h2 className="font-headline text-[2.25rem] font-bold tracking-tight leading-[1.05] text-white md:text-[2.75rem]">
              Turn ideas into products
            </h2>
          </div>
          <p className="text-base leading-relaxed md:max-w-[26rem]" style={{ color: "#71717A" }}>
            A focused marketplace for apps, automations, agents, and tools built
            with AI coding tools. Discover what others have shipped. List what
            you&apos;ve built. No gatekeeping, no upfront costs.
          </p>
        </div>

        {/* ── Feature grid ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.index}
              className="group relative flex flex-col gap-5 rounded-xl p-8 card-glow"
              style={{
                background: "#0A0A0A",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Index with expanding rule */}
              <div className="flex items-center gap-3">
                <div
                  className="h-px w-7 flex-none transition-all duration-300 group-hover:w-11"
                  style={{ background: f.accent }}
                />
                <span
                  className="font-mono text-[10px] tracking-[0.2em]"
                  style={{ color: f.accent }}
                >
                  {f.index}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-headline text-base font-semibold text-white">
                {f.title}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed" style={{ color: "#71717A" }}>
                {f.desc}
              </p>

              {/* Bottom accent bar */}
              <div
                className="mt-1 h-px w-7 transition-all duration-300 group-hover:w-14"
                style={{ background: f.accent, opacity: 0.4 }}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
