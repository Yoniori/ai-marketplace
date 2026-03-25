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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="bg-[#080808]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.06] bg-[#080808]">

        {/* Primary ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% -5%, hsl(256 80% 58% / 0.42) 0%, transparent 65%)",
          }}
        />

        {/* Secondary depth glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 40% 40% at 85% 80%, hsl(256 70% 50% / 0.10) 0%, transparent 60%)",
          }}
        />

        {/* Visible grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100% / 0.05) 1px, transparent 1px), " +
              "linear-gradient(90deg, hsl(0 0% 100% / 0.05) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Bottom fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{
            background: "linear-gradient(to bottom, transparent, #080808)",
          }}
        />

        <div className="container relative py-28 md:py-44">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] lg:gap-14 xl:gap-20 lg:items-center">

            {/* ── Left: hero content ──────────────────────────────────── */}
            <div>

              {/* Pill overline */}
              <div
                className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1"
                style={{
                  background: "hsl(256 60% 52% / 0.12)",
                  border: "1px solid hsl(256 60% 52% / 0.32)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "hsl(256 80% 72%)" }}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
                  Marketplace
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[3.5rem] font-bold leading-[0.95] tracking-[-0.04em] text-white md:text-[7rem]">
                The marketplace<br />
                for{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, hsl(256 100% 92%) 0%, hsl(278 90% 82%) 100%)",
                  }}
                >
                  AI-built
                </span>{" "}
                products.
              </h1>

              {/* Sub-copy — /70 is standard, replaces failing /72 */}
              <p className="mt-8 max-w-[34rem] text-[1.0625rem] leading-relaxed text-white/70">
                Buy and sell apps, automations, and tools built with Claude Code,
                Cursor, Lovable, and more.
              </p>

              {/* Mobile-only tool strip — /60 replaces failing /65 */}
              <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
                {["Claude Code", "Cursor", "Lovable", "Bolt", "Replit", "v0"].map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full font-mono text-[10px] text-white/60 px-2.5 py-1"
                    style={{
                      background: "hsl(0 0% 100% / 0.055)",
                      border: "1px solid hsl(0 0% 100% / 0.12)",
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
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none"
                  style={{
                    background: "linear-gradient(135deg, hsl(256 72% 58%), hsl(280 65% 52%))",
                    boxShadow: "0 0 0 1px hsl(256 60% 50% / 0.40), 0 0 32px hsl(256 72% 56% / 0.35)",
                  }}
                >
                  Browse products
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none"
                  style={{
                    background: "linear-gradient(#080808, #080808) padding-box, linear-gradient(135deg, hsl(256 60% 50% / 0.70), hsl(0 0% 100% / 0.14)) border-box",
                    border: "1px solid transparent",
                  }}
                >
                  Start selling
                </Link>
              </div>

              {/* Stat cards — /60 and /90 are both standard */}
              <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-8">
                {[
                  { label: "Platform fee", value: "10%"            },
                  { label: "Listing",      value: "Free"           },
                  { label: "Payouts",      value: "Stripe Connect" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-lg px-4 py-3.5"
                    style={{
                      background: "hsl(0 0% 100% / 0.055)",
                      border: "1px solid hsl(0 0% 100% / 0.13)",
                    }}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                      {label}
                    </p>
                    <p className="mt-1.5 font-mono text-sm font-semibold text-white/90">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

            </div>

            {/* ── Right: info panels (desktop only) ───────────────────── */}
            <div className="hidden lg:flex flex-col gap-3">

              {/* Panel 1: Built with */}
              <div
                className="overflow-hidden rounded-xl"
                style={{
                  background: "hsl(0 0% 100% / 0.04)",
                  border: "1px solid hsl(0 0% 100% / 0.10)",
                }}
              >
                <div
                  className="flex items-center justify-between border-b px-5 py-3.5"
                  style={{ borderColor: "hsl(0 0% 100% / 0.07)" }}
                >
                  {/* /50 replaces failing /48 */}
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                    Build with any tool
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "hsl(142 65% 52%)", boxShadow: "0 0 6px hsl(142 65% 52% / 0.55)" }}
                    />
                    {/* /40 replaces failing /38 */}
                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">open</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 p-4">
                  {["Claude Code", "Cursor", "Lovable", "Bolt", "Replit", "v0"].map((tool) => (
                    <div
                      key={tool}
                      className="rounded-md px-3 py-2.5"
                      style={{
                        background: "hsl(0 0% 100% / 0.04)",
                        border: "1px solid hsl(0 0% 100% / 0.08)",
                      }}
                    >
                      {/* /70 replaces failing /72 */}
                      <span className="text-xs font-medium text-white/70">{tool}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 2: What ships here */}
              <div
                className="overflow-hidden rounded-xl"
                style={{
                  background: "hsl(0 0% 100% / 0.04)",
                  border: "1px solid hsl(0 0% 100% / 0.10)",
                }}
              >
                <div
                  className="border-b px-5 py-3.5"
                  style={{ borderColor: "hsl(0 0% 100% / 0.07)" }}
                >
                  {/* /50 replaces failing /48 */}
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                    What ships here
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 p-4">
                  {["AI Agents", "Automations", "SaaS Templates", "Chrome Extensions", "API Tools", "Prompt Packs", "Dashboards", "CLI Tools"].map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full px-2.5 py-1 font-mono text-[10px] text-white/60"
                      style={{
                        background: "hsl(0 0% 100% / 0.04)",
                        border: "1px solid hsl(0 0% 100% / 0.10)",
                      }}
                    >
                      {cat}
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
      <section className="border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="container py-20 md:py-28">

          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              {/* /40 replaces failing /35 */}
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                Categories
              </p>
              <h2 className="text-[1.875rem] font-bold tracking-[-0.03em] text-white md:text-[2.5rem]">
                Browse by category
              </h2>
            </div>
            {/* /40 and /60 replace failing /35 and /65 */}
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
            >
              All products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.06] md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/browse?category=${cat.slug}`}
                className="group flex flex-col bg-[#0a0a0a] px-7 py-6 transition-colors hover:bg-white/[0.05]"
              >
                <div>
                  <span className="text-sm font-medium text-white/75 transition-colors group-hover:text-white">
                    {cat.label}
                  </span>
                  {/* /40 replaces failing /35 */}
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div className="h-px w-6 bg-white/[0.12] transition-all duration-300 group-hover:w-10 group-hover:bg-primary/50" />
                  <ArrowRight className="h-3 w-3 text-white/20 transition-colors group-hover:text-white/50" />
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ── Creator section ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.06] bg-[#080808]">

        {/* Ambient left glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 0% 50%, hsl(256 70% 55% / 0.10) 0%, transparent 70%)",
          }}
        />

        <div className="container relative py-28 md:py-40">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center md:gap-24">

            {/* Left — value proposition */}
            <div>

              {/* Pill overline — /50 replaces failing /45 */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
                  For creators
                </span>
              </div>

              {/* Giant stat */}
              <div
                className="mb-3 font-bold leading-[0.85] tracking-[-0.05em] bg-clip-text text-transparent"
                style={{
                  fontSize: "clamp(5.5rem, 15vw, 10rem)",
                  backgroundImage:
                    "linear-gradient(135deg, hsl(256 95% 88%) 0%, hsl(278 82% 74%) 100%)",
                }}
              >
                90%
              </div>

              <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] leading-[1.1] text-white md:text-[2.25rem]">
                of every sale.<br />Yours to keep.
              </h2>

              {/* /60 replaces failing /55 */}
              <p className="mt-5 max-w-[24rem] text-base text-white/60 leading-relaxed">
                List your app, automation, or tool in minutes. No upfront fees,
                no approval queue. Ship and earn.
              </p>

              <div className="mt-8 flex items-center gap-5">
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none"
                  style={{
                    background: "linear-gradient(135deg, hsl(256 72% 56%), hsl(280 62% 50%))",
                    boxShadow: "0 0 0 1px hsl(256 60% 50% / 0.35), 0 0 20px hsl(256 72% 56% / 0.25)",
                  }}
                >
                  Start selling free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/browse"
                  className="text-sm text-white/50 transition-colors hover:text-white/75"
                >
                  Browse products
                </Link>
              </div>
            </div>

            {/* Right — terminal pricing panel */}
            <div
              className="overflow-hidden rounded-xl"
              style={{
                background: "hsl(0 0% 100% / 0.025)",
                border: "1px solid hsl(0 0% 100% / 0.09)",
                boxShadow: "0 0 0 1px hsl(0 0% 0% / 0.3), inset 0 1px 0 hsl(0 0% 100% / 0.04)",
              }}
            >
              {/* Terminal chrome */}
              <div
                className="flex items-center justify-between border-b px-5 py-3.5"
                style={{ borderColor: "hsl(0 0% 100% / 0.07)", background: "hsl(0 0% 100% / 0.02)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/[0.15]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/[0.09]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/[0.06]" />
                  </div>
                  {/* /25 replaces failing /22 */}
                  <span className="font-mono text-[10px] text-white/25">creator_terms.json</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "hsl(142 70% 50%)", boxShadow: "0 0 6px hsl(142 70% 50% / 0.7)" }}
                  />
                  {/* /20 is standard */}
                  <span className="font-mono text-[9px] uppercase tracking-widest text-white/20">live</span>
                </div>
              </div>

              {/* Rows */}
              <div className="px-6 py-1">
                <dl className="divide-y divide-white/[0.05]">
                  {CREATOR_TERMS.map(({ term, detail }) => (
                    <div key={term} className="flex items-center justify-between py-4">
                      {/* /30 replaces failing /32 */}
                      <dt className="font-mono text-xs text-white/30">{term}</dt>
                      <dd
                        className="font-mono text-xs font-semibold"
                        style={{ color: "hsl(256 80% 78%)" }}
                      >
                        {detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Terminal footer prompt */}
              <div
                className="border-t px-6 py-4"
                style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
              >
                {/* /25 replaces failing /22 */}
                <p className="font-mono text-[10px] text-white/25">
                  <span style={{ color: "hsl(256 75% 65%)" }}>▸</span>{" "}
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
