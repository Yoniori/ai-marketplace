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
    <div className="bg-[#FDFCFB]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ borderBottom: "0.5px solid rgba(15,15,15,0.09)" }}
      >
        {/* Warm ambient — very subtle, paper-like */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 50% at 70% 0%, rgba(192,90,68,0.05) 0%, transparent 65%), " +
              "radial-gradient(ellipse 40% 40% at 0% 100%, rgba(45,71,57,0.04) 0%, transparent 60%)",
          }}
        />

        <div className="container relative py-24 md:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] lg:gap-16 xl:gap-24 lg:items-center">

            {/* ── Left: hero content ──────────────────────────────────── */}
            <div>

              {/* Overline */}
              <p className="mb-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B9690]">
                Marketplace
              </p>

              {/* Headline — Playfair Display serif */}
              <h1
                className="font-headline font-bold leading-[0.95] tracking-[-0.02em] text-[#0F0F0F]"
                style={{ fontSize: "clamp(3rem, 6.5vw, 5.5rem)" }}
              >
                The marketplace<br />
                for{" "}
                <span className="italic text-[#C05A44]">
                  AI&#8209;built
                </span>{" "}
                products.
              </h1>

              {/* Sub-copy */}
              <p className="mt-7 max-w-[32rem] text-[1.0625rem] leading-relaxed text-[#6B6860]">
                Buy and sell apps, automations, and tools built with Claude Code,
                Cursor, Lovable, and more.
              </p>

              {/* Tool tags (mobile only) */}
              <div className="mt-5 flex flex-wrap gap-1.5 lg:hidden">
                {TOOLS.map((tool) => (
                  <span
                    key={tool}
                    className="rounded px-2.5 py-1 text-[11px] text-[#6B6860]"
                    style={{ border: "0.5px solid rgba(15,15,15,0.15)" }}
                  >
                    {tool}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/browse"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-7 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#A84D39] active:scale-[0.98] focus-visible:outline-none"
                  style={{ background: "#C05A44" }}
                >
                  Browse products
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md px-7 text-sm font-semibold text-[#0F0F0F] transition-all duration-150 hover:bg-[#F5F3F0] active:scale-[0.98] focus-visible:outline-none"
                  style={{ border: "0.5px solid rgba(15,15,15,0.20)" }}
                >
                  Start selling
                </Link>
              </div>

              {/* Stat bar */}
              <div
                className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-xl"
                style={{ border: "0.5px solid rgba(15,15,15,0.10)", background: "rgba(15,15,15,0.07)" }}
              >
                {[
                  { label: "Platform fee", value: "10%" },
                  { label: "Listing",      value: "Free" },
                  { label: "Payouts",      value: "Direct" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#FDFCFB] px-5 py-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#9B9690]">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#0F0F0F]">{value}</p>
                  </div>
                ))}
              </div>

            </div>

            {/* ── Right: info panels (desktop) ────────────────────────── */}
            <div className="hidden lg:flex flex-col gap-3">

              {/* Panel 1: Build with any tool */}
              <div
                className="overflow-hidden rounded-xl bg-white"
                style={{ border: "0.5px solid rgba(15,15,15,0.09)" }}
              >
                <div
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: "0.5px solid rgba(15,15,15,0.09)" }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B9690]">
                    Build with any tool
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2D4739]" />
                    <span className="text-[9px] font-medium uppercase tracking-widest text-[#9B9690]">
                      open
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-4">
                  {TOOLS.map((tool) => (
                    <div
                      key={tool}
                      className="rounded-lg px-3 py-2.5"
                      style={{ background: "#F5F3F0", border: "0.5px solid rgba(15,15,15,0.07)" }}
                    >
                      <span className="text-xs font-medium text-[#6B6860]">{tool}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 2: What ships here */}
              <div
                className="overflow-hidden rounded-xl bg-white"
                style={{ border: "0.5px solid rgba(15,15,15,0.09)" }}
              >
                <div
                  className="px-5 py-3.5"
                  style={{ borderBottom: "0.5px solid rgba(15,15,15,0.09)" }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B9690]">
                    What ships here
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 p-4">
                  {CATEGORIES.map(({ label }) => (
                    <span
                      key={label}
                      className="rounded px-2 py-1 text-[10px] text-[#6B6860]"
                      style={{ background: "#F5F3F0", border: "0.5px solid rgba(15,15,15,0.09)" }}
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
        className="bg-[#FDFCFB]"
        style={{ borderBottom: "0.5px solid rgba(15,15,15,0.09)" }}
      >
        <div className="container py-20 md:py-28">

          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B9690]">
                Categories
              </p>
              <h2 className="font-headline text-[1.875rem] font-bold tracking-tight text-[#0F0F0F] md:text-[2.5rem]">
                Browse by category
              </h2>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1.5 text-sm text-[#6B6860] transition-colors duration-150 hover:text-[#0F0F0F]"
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
                className="group flex flex-col rounded-xl bg-white px-6 py-5 transition-all duration-150 hover:shadow-card-hover"
                style={{ border: "0.5px solid rgba(15,15,15,0.09)" }}
              >
                <span className="text-sm font-semibold text-[#0F0F0F] transition-colors duration-150 group-hover:text-[#C05A44]">
                  {cat.label}
                </span>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-[#9B9690]">
                  {cat.desc}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <div
                    className="h-px w-5 transition-all duration-200 group-hover:w-8"
                    style={{ background: "rgba(15,15,15,0.18)" }}
                  />
                  <ArrowRight className="h-3 w-3 text-[#9B9690] transition-colors duration-150 group-hover:text-[#C05A44]" />
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ── Creator section ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-[#F5F3F0]"
        style={{ borderBottom: "0.5px solid rgba(15,15,15,0.09)" }}
      >
        <div className="container relative py-24 md:py-36">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:items-center md:gap-24">

            {/* Left */}
            <div>
              <p className="mb-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B9690]">
                For creators
              </p>
              <div
                className="mb-3 font-headline font-bold leading-[0.85] tracking-[-0.04em] text-[#C05A44]"
                style={{ fontSize: "clamp(5rem, 14vw, 9rem)" }}
              >
                90%
              </div>
              <h2 className="font-headline text-[1.75rem] font-bold tracking-tight leading-[1.1] text-[#0F0F0F] md:text-[2.25rem]">
                of every sale.<br />Yours to keep.
              </h2>
              <p className="mt-5 max-w-[24rem] text-base text-[#6B6860] leading-relaxed">
                List your app, automation, or tool in minutes. No upfront fees,
                no approval queue. Ship and earn.
              </p>
              <div className="mt-8 flex items-center gap-5">
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-6 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#A84D39] active:scale-[0.98] focus-visible:outline-none"
                  style={{ background: "#C05A44" }}
                >
                  Start selling free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/browse"
                  className="text-sm text-[#6B6860] transition-colors duration-150 hover:text-[#0F0F0F]"
                >
                  Browse products
                </Link>
              </div>
            </div>

            {/* Right — pricing panel */}
            <div
              className="overflow-hidden rounded-xl bg-white"
              style={{ border: "0.5px solid rgba(15,15,15,0.09)", boxShadow: "0 2px 12px rgba(15,15,15,0.06)" }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "0.5px solid rgba(15,15,15,0.09)" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B9690]">
                  creator_terms
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2D4739]" />
                  <span className="text-[9px] font-medium uppercase tracking-widest text-[#9B9690]">live</span>
                </div>
              </div>
              <div className="px-6 py-1">
                <dl>
                  {CREATOR_TERMS.map(({ term, detail }, i) => (
                    <div
                      key={term}
                      className="flex items-center justify-between py-4"
                      style={{ borderTop: i > 0 ? "0.5px solid rgba(15,15,15,0.07)" : undefined }}
                    >
                      <dt className="text-sm text-[#6B6860]">{term}</dt>
                      <dd className="text-sm font-semibold text-[#0F0F0F]">{detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div
                className="px-6 py-4"
                style={{ borderTop: "0.5px solid rgba(15,15,15,0.09)" }}
              >
                <p className="text-[10px] italic text-[#9B9690]">
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
