// ─── PlatformOverview ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    index: "01",
    title: "Discover ready-to-use tools",
    desc: "Browse apps, automations, agents, and extensions built by real creators. Filter by category, buy instantly, and start using right away.",
  },
  {
    index: "02",
    title: "List without friction",
    desc: "No approval queue. No listing fees. Add your product, connect Stripe, and start earning the same day you ship.",
  },
  {
    index: "03",
    title: "Keep 90% of every sale",
    desc: "A flat 10% platform fee. Every payout goes directly to your Stripe account — no monthly costs, no hidden cuts.",
  },
  {
    index: "04",
    title: "Built for the AI coding era",
    desc: "Whether you used Claude Code, Cursor, or Lovable to build it — if it solves a real problem, it belongs here.",
  },
] as const;

export function PlatformOverview() {
  return (
    <section
      className="border-b border-white/[0.06]"
      style={{ background: "#0a0a0a" }}
    >
      {/* Tightened: was py-24 md:py-32, mb-16 — too much dead space */}
      <div className="container py-18 md:py-24">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-end md:gap-16">

          {/* Left — headline */}
          <div>
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1"
              style={{
                background: "hsl(256 60% 52% / 0.1)",
                border: "1px solid hsl(256 60% 52% / 0.25)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "hsl(256 80% 70%)" }}
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
                Platform
              </span>
            </div>

            <h2 className="text-[2.25rem] font-bold tracking-[-0.035em] leading-[1.05] text-white md:text-[2.75rem]">
              Turn ideas into products
            </h2>
          </div>

          {/* Right — paragraph: raised from /42 to /58 */}
          <p className="text-base text-white/60 leading-relaxed md:max-w-[26rem]">
            A focused marketplace for apps, automations, agents, and tools built
            with AI coding tools. Discover what others have shipped. List what
            you've built. No gatekeeping, no upfront costs.
          </p>

        </div>

        {/* ── Feature grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-px bg-white/[0.06] sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.index}
              className="group relative flex flex-col gap-5 bg-[#0a0a0a] px-8 py-8 transition-colors duration-200 hover:bg-white/[0.035]"
            >
              {/* Top accent line */}
              <div
                className="absolute inset-x-0 top-0 h-px transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "linear-gradient(90deg, hsl(256 70% 60% / 0.5), transparent 60%)",
                  opacity: 0.25,
                }}
              />

              {/* Index with expanding accent rule */}
              <div className="flex items-center gap-3">
                <div
                  className="h-px w-8 flex-none transition-all duration-300 group-hover:w-12"
                  style={{ background: "hsl(256 70% 60% / 0.5)" }}
                />
                <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: "hsl(256 72% 70%)" }}>
                  {f.index}
                </span>
              </div>

              {/* Title — raised from /72 to /85 */}
              <h3 className="text-base font-semibold text-white/80 transition-colors duration-200 group-hover:text-white">
                {f.title}
              </h3>

              {/* Description — raised from /38 to /55 */}
              <p className="text-sm text-white/60 leading-relaxed">
                {f.desc}
              </p>

              {/* Bottom rule */}
              <div
                className="mt-2 h-px w-8 transition-all duration-300 group-hover:w-16"
                style={{ background: "hsl(256 70% 60% / 0.32)" }}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
