import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PlatformOverview } from "@/components/sections/PlatformOverview";
import { LaunchedToday } from "@/components/launch/LaunchedToday";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: "AI Agents",         desc: "Autonomous task runners",  slug: "ai-agent"         },
  { label: "Automations",       desc: "Workflows & scripts",      slug: "automation"       },
  { label: "SaaS Templates",    desc: "Full-stack starters",      slug: "saas-template"    },
  { label: "Chrome Extensions", desc: "Browser tools",            slug: "chrome-extension" },
  { label: "API Tools",         desc: "Integrations & wrappers",  slug: "api-tool"         },
  { label: "Prompt Packs",      desc: "Curated libraries",        slug: "prompt-pack"      },
  { label: "Dashboards",        desc: "Data views & UIs",         slug: "dashboard"        },
  { label: "CLI Tools",         desc: "Terminal utilities",       slug: "cli-tool"         },
];

const CREATOR_TERMS = [
  { term: "Platform fee",  detail: "10% per sale"      },
  { term: "Listing",       detail: "Free"              },
  { term: "Payouts",       detail: "Stripe Connect"    },
  { term: "Approval",      detail: "None — ship today" },
];

const TOOLS = ["Claude Code", "Cursor", "Lovable", "Bolt", "Replit", "v0"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={{ background: "#000000" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Radial indigo glow — subtle ambient light */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 70% 0%, rgba(99,102,241,0.08) 0%, transparent 65%), " +
              "radial-gradient(ellipse 40% 40% at 0% 100%, rgba(0,245,255,0.04) 0%, transparent 60%)",
          }}
        />

        <div className="container relative py-24 md:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] lg:gap-16 xl:gap-24 lg:items-center">

            {/* ── Left: hero content ──────────────────────────────────── */}
            <div>

              {/* Overline */}
              <p
                className="mb-7 text-[11px] font-semibold uppercase tracking-[0.18em] font-mono"
                style={{ color: "#3F3F46" }}
              >
                Marketplace
              </p>

              {/* Headline — Space Grotesk */}
              <h1
                className="font-headline font-bold leading-[0.95] tracking-[-0.02em] text-white"
                style={{ fontSize: "clamp(3rem, 6.5vw, 5.5rem)" }}
              >
                The marketplace<br />
                for{" "}
                <span style={{ color: "#6366F1" }}>
                  AI&#8209;built
                </span>{" "}
                products.
              </h1>

              {/* Sub-copy */}
              <p
                className="mt-7 max-w-[32rem] text-[1.0625rem] leading-relaxed"
                style={{ color: "#71717A" }}
              >
                Buy and sell apps, automations, and tools built with Claude Code,
                Cursor, Lovable, and more.
              </p>

              {/* Tool tags (mobile only) */}
              <div className="mt-5 flex flex-wrap gap-1.5 lg:hidden">
                {TOOLS.map((tool) => (
                  <span
                    key={tool}
                    className="rounded px-2.5 py-1 text-[11px] font-mono"
                    style={{
                      color: "#71717A",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    {tool}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/browse"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-7 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#4F46E5] hover:shadow-glow-sm active:scale-[0.98] focus-visible:outline-none"
                  style={{ background: "#6366F1" }}
                >
                  Browse products
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-7 text-sm font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none hover:border-white/20"
                  style={{
                    color: "#A1A1AA",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  Start selling
                </Link>
              </div>

              {/* Stat bar */}
              <div
                className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-xl"
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {[
                  { label: "Platform fee", value: "10%" },
                  { label: "Listing",      value: "Free" },
                  { label: "Payouts",      value: "Direct" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#0A0A0A" }} className="px-5 py-4">
                    <p
                      className="text-[10px] font-medium uppercase tracking-[0.12em] font-mono"
                      style={{ color: "#3F3F46" }}
                    >
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

            </div>

            {/* ── Right: info panels (desktop) ────────────────────────── */}
            <div className="hidden lg:flex flex-col gap-3">

              {/* Panel 1: Build with any tool */}
              <div
                className="overflow-hidden rounded-xl"
                style={{
                  background: "#0A0A0A",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.14em] font-mono"
                    style={{ color: "#3F3F46" }}
                  >
                    Build with any tool
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "#22C55E", boxShadow: "0 0 4px rgba(34,197,94,0.6)" }}
                    />
                    <span
                      className="text-[9px] font-medium uppercase tracking-widest font-mono"
                      style={{ color: "#3F3F46" }}
                    >
                      open
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-4">
                  {TOOLS.map((tool) => (
                    <div
                      key={tool}
                      className="rounded-lg px-3 py-2.5"
                      style={{
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span className="text-xs font-medium font-mono" style={{ color: "#71717A" }}>{tool}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 2: What ships here */}
              <div
                className="overflow-hidden rounded-xl"
                style={{
                  background: "#0A0A0A",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="px-5 py-3.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.14em] font-mono"
                    style={{ color: "#3F3F46" }}
                  >
                    What ships here
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 p-4">
                  {CATEGORIES.map(({ label }) => (
                    <span
                      key={label}
                      className="rounded px-2 py-1 text-[10px] font-mono"
                      style={{
                        color: "#71717A",
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── Platform overview ──────────────────────────────────────────────── */}
      <PlatformOverview />

      {/* ── Launched today ─────────────────────────────────────────────────── */}
      <LaunchedToday />

      {/* ── Browse by category ─────────────────────────────────────────────── */}
      <section
        style={{
          background: "#000000",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="container py-20 md:py-28">

          <div className="flex items-end justify-between mb-10">
            <div>
              <p
                className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] font-mono"
                style={{ color: "#3F3F46" }}
              >
                Categories
              </p>
              <h2 className="font-headline text-[1.875rem] font-bold tracking-tight text-white md:text-[2.5rem]">
                Browse by category
              </h2>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-sm transition-colors duration-150 hover:text-white font-mono"
              style={{ color: "#71717A" }}
            >
              All products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/browse?category=${cat.slug}`}
                className="group flex flex-col rounded-xl px-6 py-5 card-glow"
                style={{
                  background: "#0A0A0A",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <span
                  className="text-sm font-semibold transition-colors duration-150 group-hover:text-[#818CF8]"
                  style={{ color: "#FFFFFF" }}
                >
                  {cat.label}
                </span>
                <p
                  className="mt-1 text-[10px] font-medium uppercase tracking-widest font-mono"
                  style={{ color: "#3F3F46" }}
                >
                  {cat.desc}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <div
                    className="h-px w-5 transition-all duration-200 group-hover:w-8"
                    style={{ background: "rgba(99,102,241,0.4)" }}
                  />
                  <ArrowRight
                    className="h-3 w-3 transition-colors duration-150 group-hover:text-[#818CF8]"
                    style={{ color: "#3F3F46" }}
                  />
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ── Creator section ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "#050505",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Subtle indigo ambient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 0% 50%, rgba(99,102,241,0.05) 0%, transparent 60%)",
          }}
        />
        <div className="container relative py-24 md:py-36">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center md:gap-24">

            {/* Left */}
            <div>
              <p
                className="mb-7 text-[11px] font-semibold uppercase tracking-[0.18em] font-mono"
                style={{ color: "#3F3F46" }}
              >
                For creators
              </p>
              <div
                className="mb-3 font-headline font-bold leading-[0.85] tracking-[-0.04em]"
                style={{ fontSize: "clamp(5rem, 14vw, 9rem)", color: "#6366F1" }}
              >
                90%
              </div>
              <h2 className="font-headline text-[1.75rem] font-bold tracking-tight leading-[1.1] text-white md:text-[2.25rem]">
                of every sale.<br />Yours to keep.
              </h2>
              <p
                className="mt-5 max-w-[24rem] text-base leading-relaxed"
                style={{ color: "#71717A" }}
              >
                List your app, automation, or tool in minutes. No upfront fees,
                no approval queue. Ship and earn.
              </p>
              <div className="mt-8 flex items-center gap-5">
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-6 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#4F46E5] hover:shadow-glow-sm active:scale-[0.98] focus-visible:outline-none"
                  style={{ background: "#6366F1" }}
                >
                  Start selling free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/browse"
                  className="text-sm transition-colors duration-150 hover:text-white"
                  style={{ color: "#71717A" }}
                >
                  Browse products
                </Link>
              </div>
            </div>

            {/* Right — pricing panel */}
            <div
              className="overflow-hidden rounded-xl"
              style={{
                background: "#0A0A0A",
                border: "1px solid rgba(99,102,241,0.20)",
                boxShadow: "0 0 0 1px rgba(99,102,241,0.06)",
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] font-mono"
                  style={{ color: "#6366F1" }}
                >
                  creator_terms
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: "#6366F1",
                      boxShadow: "0 0 6px rgba(99,102,241,0.8)",
                      animation: "pulse-dot 1.8s ease-in-out infinite",
                    }}
                  />
                  <span
                    className="text-[9px] font-medium uppercase tracking-widest font-mono"
                    style={{ color: "#6366F1" }}
                  >
                    live
                  </span>
                </div>
              </div>
              <div className="px-6 py-1">
                <dl>
                  {CREATOR_TERMS.map(({ term, detail }, i) => (
                    <div
                      key={term}
                      className="flex items-center justify-between py-4"
                      style={{
                        borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                      }}
                    >
                      <dt className="text-sm font-mono" style={{ color: "#71717A" }}>{term}</dt>
                      <dd className="text-sm font-semibold font-mono text-white">{detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div
                className="px-6 py-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                <p
                  className="text-[10px] font-mono uppercase tracking-[0.08em]"
                  style={{ color: "#3F3F46" }}
                >
                  Ready to publish your first listing
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
