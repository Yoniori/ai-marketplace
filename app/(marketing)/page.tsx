import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PlatformOverview } from "@/components/sections/PlatformOverview";

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
  { term: "platform_fee",  detail: "10% per sale"          },
  { term: "listing_fee",   detail: "free"                  },
  { term: "payouts",       detail: "Stripe Connect"        },
  { term: "approval",      detail: "none — ship directly"  },
];

const TOOLS = ["Claude Code", "Cursor", "Lovable", "Bolt", "Replit", "v0"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="bg-[#0e0e10]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-cyan-400/10 bg-[#0e0e10]">

        {/* Dual ambient glow — cyan top-right, violet bottom-left */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 70% -10%, rgba(0,255,255,0.10) 0%, transparent 60%), " +
              "radial-gradient(ellipse 55% 50% at -5% 100%, rgba(119,1,208,0.12) 0%, transparent 65%)",
          }}
        />

        {/* Subtle grid overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(193,255,254,0.035) 1px, transparent 1px), " +
              "linear-gradient(90deg, rgba(193,255,254,0.035) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Bottom fade into next section */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{ background: "linear-gradient(to bottom, transparent, #0e0e10)" }}
        />

        <div className="container relative py-28 md:py-44">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] lg:gap-14 xl:gap-20 lg:items-center">

            {/* ── Left: hero content ──────────────────────────────────── */}
            <div>

              {/* Pill badge */}
              <div
                className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1"
                style={{
                  background: "rgba(0,255,255,0.06)",
                  border: "1px solid rgba(0,255,255,0.22)",
                }}
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-400/80">
                  Marketplace
                </span>
              </div>

              {/* Headline — Space Grotesk */}
              <h1 className="font-headline text-[3.5rem] font-bold leading-[0.95] tracking-[-0.04em] text-white md:text-[7rem]">
                The marketplace<br />
                for{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #c1fffe 0%, #bf81ff 100%)",
                  }}
                >
                  AI-built
                </span>{" "}
                products.
              </h1>

              {/* Sub-copy */}
              <p className="mt-8 max-w-[34rem] text-[1.0625rem] leading-relaxed text-on-surface-variant">
                Buy and sell apps, automations, and tools built with Claude Code,
                Cursor, Lovable, and more.
              </p>

              {/* Mobile-only tool strip */}
              <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
                {TOOLS.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full font-mono text-[10px] text-on-surface-variant px-2.5 py-1"
                    style={{
                      background: "rgba(193,255,254,0.04)",
                      border: "1px solid rgba(193,255,254,0.10)",
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
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 text-sm font-bold tracking-tight text-[#0e0e10] transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none"
                  style={{
                    background: "linear-gradient(135deg, #00e6e6, #9c42f4)",
                    boxShadow: "0 0 24px rgba(0,230,230,0.30)",
                  }}
                >
                  Browse products
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 text-sm font-bold tracking-tight text-white transition-all duration-200 hover:bg-cyan-400/5 focus-visible:outline-none"
                  style={{
                    border: "1px solid rgba(0,255,255,0.20)",
                    background: "rgba(0,255,255,0.03)",
                  }}
                >
                  Start selling
                </Link>
              </div>

              {/* Stat cards */}
              <div className="mt-10 grid grid-cols-3 gap-3 border-t border-cyan-400/10 pt-8">
                {[
                  { label: "Platform fee", value: "10%"            },
                  { label: "Listing",      value: "Free"           },
                  { label: "Payouts",      value: "Stripe Connect" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="glass-card rounded-xl border border-outline-variant/20 px-4 py-3.5"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {label}
                    </p>
                    <p className="mt-1.5 font-mono text-sm font-semibold text-cyan-400">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

            </div>

            {/* ── Right: info panels (desktop only) ───────────────────── */}
            <div className="hidden lg:flex flex-col gap-3">

              {/* Panel 1: Build with any tool */}
              <div className="glass-card overflow-hidden rounded-xl border border-outline-variant/20">
                <div
                  className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-3.5"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
                    Build with any tool
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-tertiary"
                      style={{ boxShadow: "0 0 6px rgba(105,253,93,0.55)" }}
                    />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant/60">
                      open
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-4">
                  {TOOLS.map((tool) => (
                    <div
                      key={tool}
                      className="rounded-lg px-3 py-2.5"
                      style={{
                        background: "rgba(193,255,254,0.03)",
                        border: "1px solid rgba(193,255,254,0.08)",
                      }}
                    >
                      <span className="text-xs font-medium text-on-surface-variant">{tool}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 2: What ships here */}
              <div className="glass-card overflow-hidden rounded-xl border border-outline-variant/20">
                <div
                  className="border-b border-outline-variant/20 px-5 py-3.5"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
                    What ships here
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 p-4">
                  {CATEGORIES.map(({ label }) => (
                    <span
                      key={label}
                      className="rounded-full px-2.5 py-1 font-mono text-[10px] text-on-surface-variant"
                      style={{
                        background: "rgba(193,255,254,0.04)",
                        border: "1px solid rgba(193,255,254,0.10)",
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

      {/* ── Browse by category ─────────────────────────────────────────────── */}
      <section className="border-b border-cyan-400/10 bg-[#0e0e10]">
        <div className="container py-20 md:py-28">

          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                Categories
              </p>
              <h2 className="font-headline text-[1.875rem] font-bold tracking-[-0.03em] text-white md:text-[2.5rem]">
                Browse by category
              </h2>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant transition-colors hover:text-cyan-400"
            >
              All products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Grid — individual glass cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/browse?category=${cat.slug}`}
                className="group glass-card flex flex-col rounded-xl border border-outline-variant/20 px-6 py-5 transition-all duration-200 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(0,255,255,0.08)]"
              >
                <span className="font-headline text-sm font-semibold text-on-surface transition-colors group-hover:text-cyan-400">
                  {cat.label}
                </span>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {cat.desc}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <div className="h-px w-6 bg-outline-variant/40 transition-all duration-300 group-hover:w-10 group-hover:bg-cyan-400/50" />
                  <ArrowRight className="h-3 w-3 text-on-surface-variant/40 transition-colors group-hover:text-cyan-400/70" />
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ── Creator section ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-cyan-400/10 bg-[#0e0e10]">

        {/* Ambient left glow — violet */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 0% 50%, rgba(119,1,208,0.10) 0%, transparent 70%)",
          }}
        />

        <div className="container relative py-28 md:py-40">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center md:gap-24">

            {/* Left — value proposition */}
            <div>

              {/* Pill overline */}
              <div
                className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1"
                style={{
                  background: "rgba(191,129,255,0.08)",
                  border: "1px solid rgba(191,129,255,0.22)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#bf81ff]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#bf81ff]/80">
                  For creators
                </span>
              </div>

              {/* Giant stat — cyan-to-violet gradient */}
              <div
                className="mb-3 font-headline font-bold leading-[0.85] tracking-[-0.05em] bg-clip-text text-transparent"
                style={{
                  fontSize: "clamp(5.5rem, 15vw, 10rem)",
                  backgroundImage: "linear-gradient(135deg, #c1fffe 0%, #bf81ff 100%)",
                }}
              >
                90%
              </div>

              <h2 className="font-headline text-[1.75rem] font-bold tracking-[-0.03em] leading-[1.1] text-white md:text-[2.25rem]">
                of every sale.<br />Yours to keep.
              </h2>

              <p className="mt-5 max-w-[24rem] text-base text-on-surface-variant leading-relaxed">
                List your app, automation, or tool in minutes. No upfront fees,
                no approval queue. Ship and earn.
              </p>

              <div className="mt-8 flex items-center gap-5">
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-6 text-sm font-bold tracking-tight text-[#0e0e10] transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none"
                  style={{
                    background: "linear-gradient(135deg, #00e6e6, #9c42f4)",
                    boxShadow: "0 0 20px rgba(0,230,230,0.25)",
                  }}
                >
                  Start selling free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/browse"
                  className="text-sm text-on-surface-variant transition-colors hover:text-cyan-400"
                >
                  Browse products
                </Link>
              </div>
            </div>

            {/* Right — terminal pricing panel */}
            <div className="glass-card overflow-hidden rounded-xl border border-outline-variant/20">

              {/* Terminal chrome bar */}
              <div
                className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-3.5"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {/* Traffic lights using Stitch error/tertiary/primary colors */}
                    <span className="h-2.5 w-2.5 rounded-full bg-error/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-tertiary/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-primary-fixed/50" />
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant/40">
                    creator_terms.json
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-tertiary"
                    style={{ boxShadow: "0 0 6px rgba(105,253,93,0.70)" }}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant/40">
                    live
                  </span>
                </div>
              </div>

              {/* Key-value rows */}
              <div className="px-6 py-1">
                <dl className="divide-y divide-outline-variant/20">
                  {CREATOR_TERMS.map(({ term, detail }) => (
                    <div key={term} className="flex items-center justify-between py-4">
                      <dt className="font-mono text-xs text-on-surface-variant/60">{term}</dt>
                      <dd className="font-mono text-xs font-semibold text-cyan-400">{detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Terminal footer prompt */}
              <div className="border-t border-outline-variant/20 px-6 py-4">
                <p className="font-mono text-[10px] text-on-surface-variant/40">
                  <span className="text-[#bf81ff]">▸</span>{" "}
                  ready to publish your first listing
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
