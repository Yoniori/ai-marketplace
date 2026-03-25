import Link from "next/link";

const TOOL_LINKS = [
  { label: "Claude Code", href: "/browse?tag=claude-code" },
  { label: "Cursor",      href: "/browse?tag=cursor"      },
  { label: "Lovable",     href: "/browse?tag=lovable"     },
  { label: "Bolt",        href: "/browse?tag=bolt"        },
  { label: "Replit",      href: "/browse?tag=replit"      },
  { label: "v0",          href: "/browse?tag=v0"          },
];

const MARKETPLACE_LINKS = [
  { label: "Browse products", href: "/browse" },
  { label: "Start selling",   href: "/signup" },
];

const LEGAL_LINKS = [
  { label: "Terms",   href: "/terms"   },
  { label: "Privacy", href: "/privacy" },
  { label: "Refunds", href: "/refunds" },
];

export function Footer() {
  return (
    <footer className="relative" style={{ background: "#050505" }}>

      {/* Gradient top border — centered violet bloom */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsl(256 60% 52% / 0.40) 28%, hsl(256 60% 52% / 0.40) 72%, transparent 100%)",
        }}
      />

      <div className="container py-14 md:py-18">

        {/* Main grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 text-sm font-semibold text-white/75">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded border font-mono text-[10px] font-bold leading-none select-none"
                style={{
                  borderColor: "hsl(256 60% 52% / 0.32)",
                  background: "hsl(256 60% 52% / 0.08)",
                  color: "hsl(256 80% 70%)",
                }}
              >
                ▸
              </span>
              Vibe Code Market
            </Link>
            <p className="mt-4 max-w-[180px] text-xs leading-relaxed text-white/30">
              Apps, tools, and automations built with AI coding tools.
            </p>
          </div>

          {/* Built with */}
          <div>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
              Built with
            </p>
            <ul className="space-y-3.5">
              {TOOL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-white/40 transition-colors hover:text-white/70"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplace */}
          <div>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
              Marketplace
            </p>
            <ul className="space-y-3.5">
              {MARKETPLACE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-white/40 transition-colors hover:text-white/70"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
              Legal
            </p>
            <ul className="space-y-3.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-white/40 transition-colors hover:text-white/70"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex items-center justify-between border-t border-white/[0.10] pt-6">
          <p className="font-mono text-[10px] text-white/40">
            © {new Date().getFullYear()} Vibe Code Market
          </p>
          <p className="font-mono text-[10px] text-white/30">
            10% fee · free to list
          </p>
        </div>

      </div>
    </footer>
  );
}
