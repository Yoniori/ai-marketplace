import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

        {/* Ambient violet glow — top center */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full"
          style={{
            background:
              "radial-gradient(ellipse 90% 55% at 50% -5%, hsl(256 70% 55% / 0.18) 0%, transparent 70%)",
          }}
        />

        {/* Subtle grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100% / 0.03) 1px, transparent 1px), " +
              "linear-gradient(90deg, hsl(0 0% 100% / 0.03) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        <div className="container relative py-32 md:py-44">
          <div className="max-w-[46rem]">

            {/* Pill overline */}
            <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
                Marketplace
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[3.25rem] font-bold leading-[1.0] tracking-[-0.04em] text-white md:text-[5.75rem]">
              The marketplace<br />
              for{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(256 90% 82%) 0%, hsl(270 80% 70%) 100%)",
                }}
              >
                AI-built
              </span>{" "}
              products.
            </h1>

            {/* Sub-copy */}
            <p className="mt-8 max-w-[30rem] text-base leading-relaxed text-white/45">
              Buy and sell apps, automations, and tools built with Claude Code,
              Cursor, Lovable, and more.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/browse"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Browse products
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-white/15 px-5 text-sm font-medium text-white/80 transition-colors hover:border-white/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                Start selling
              </Link>
            </div>

            {/* Mono data row */}
            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/[0.07] pt-8">
              {[
                { label: "Platform fee", value: "10%" },
                { label: "Listing",      value: "Free" },
                { label: "Payouts",      value: "Stripe Connect" },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className="flex items-center gap-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/25">
                      {label}
                    </p>
                    <p className="mt-0.5 font-mono text-sm text-white/60">
                      {value}
                    </p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="h-7 w-px bg-white/[0.08]" />
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Browse by category ─────────────────────────────────────────────── */}
      <section className="border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="container py-20 md:py-28">

          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
                Categories
              </p>
              <h2 className="text-2xl font-bold tracking-[-0.03em] text-white">
                Browse by category
              </h2>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-sm text-white/35 transition-colors hover:text-white/65"
            >
              All products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Grid — gap-px trick creates hairline borders on dark surface */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.06] md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/browse?category=${cat.slug}`}
                className="group flex flex-col justify-between bg-[#0a0a0a] px-6 py-6 transition-colors hover:bg-white/[0.03]"
              >
                <div>
                  <span className="text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                    {cat.label}
                  </span>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-white/25">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <div className="h-px w-6 bg-white/[0.12] transition-all duration-300 group-hover:w-10 group-hover:bg-primary/50" />
                  <ArrowRight className="h-3 w-3 text-white/15 transition-colors group-hover:text-white/45" />
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

              {/* Pill overline */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
                  For creators
                </span>
              </div>

              {/* Giant stat */}
              <div
                className="mb-3 font-bold leading-[0.85] tracking-[-0.05em] bg-clip-text text-transparent"
                style={{
                  fontSize: "clamp(4.5rem, 12vw, 8rem)",
                  backgroundImage:
                    "linear-gradient(135deg, hsl(256 90% 82%) 0%, hsl(270 80% 70%) 100%)",
                }}
              >
                90%
              </div>

              <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] leading-[1.1] text-white md:text-[2.25rem]">
                of every sale.<br />Yours to keep.
              </h2>

              <p className="mt-5 max-w-[24rem] text-base text-white/40 leading-relaxed">
                List your app, automation, or tool in minutes. No upfront fees,
                no approval queue. Ship and earn.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  Start selling free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/browse"
                  className="text-sm text-white/40 transition-colors hover:text-white/70"
                >
                  Browse products
                </Link>
              </div>
            </div>

            {/* Right — terminal pricing panel */}
            <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">

              {/* Terminal chrome */}
              <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                </div>
                <span className="font-mono text-[10px] text-white/20">creator_terms.json</span>
              </div>

              {/* Rows */}
              <div className="px-6 py-2">
                <dl className="divide-y divide-white/[0.05]">
                  {CREATOR_TERMS.map(({ term, detail }) => (
                    <div key={term} className="flex items-center justify-between py-4">
                      <dt className="font-mono text-xs text-white/30">{term}</dt>
                      <dd className="font-mono text-xs font-medium text-white/65">{detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Terminal footer prompt */}
              <div className="border-t border-white/[0.05] px-6 py-4">
                <p className="font-mono text-[10px] text-white/20">
                  <span className="text-primary/60">▸</span>{" "}
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
