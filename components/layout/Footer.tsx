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
    <footer
      className="relative"
      style={{ background: "#0a0a0c" }}
    >
      {/* Cyan + violet gradient top border */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.30) 25%, rgba(156,66,244,0.30) 75%, transparent 100%)",
        }}
      />

      <div className="container py-14 md:py-18">

        {/* Main grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-lg font-mono text-[11px] font-bold leading-none select-none transition-all duration-300 group-hover:shadow-[0_0_10px_rgba(0,255,255,0.35)]"
                style={{
                  border: "1px solid rgba(0,255,255,0.25)",
                  background: "rgba(0,255,255,0.06)",
                  color: "#00e6e6",
                }}
              >
                ▸
              </span>
              <span
                className="font-headline text-sm font-bold tracking-tight bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #c1fffe 0%, #bf81ff 100%)",
                }}
              >
                Vibe Code Market
              </span>
            </Link>
            <p className="mt-4 max-w-[180px] font-mono text-xs leading-relaxed text-on-surface-variant/50">
              Apps, tools, and automations built with AI coding tools.
            </p>
          </div>

          {/* Built with */}
          <div>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              Built with
            </p>
            <ul className="space-y-3.5">
              {TOOL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-xs text-on-surface-variant/50 transition-colors hover:text-cyan-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplace */}
          <div>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              Marketplace
            </p>
            <ul className="space-y-3.5">
              {MARKETPLACE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-xs text-on-surface-variant/50 transition-colors hover:text-cyan-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
              Legal
            </p>
            <ul className="space-y-3.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-xs text-on-surface-variant/50 transition-colors hover:text-cyan-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 flex items-center justify-between border-t pt-6"
          style={{ borderColor: "rgba(0,255,255,0.08)" }}
        >
          <p className="font-mono text-[10px] text-on-surface-variant/40">
            © {new Date().getFullYear()} Vibe Code Market
          </p>
          <p className="font-mono text-[10px] text-on-surface-variant/30">
            10% fee · free to list
          </p>
        </div>

      </div>
    </footer>
  );
}
