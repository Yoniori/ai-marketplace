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
    <footer className="border-t border-white/[0.06] bg-[#050505]">
      <div className="container py-14 md:py-16">

        {/* Main grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/75">
              <span className="font-mono text-xs font-bold text-primary select-none leading-none">▸</span>
              Vibe Code Market
            </Link>
            <p className="mt-4 max-w-[180px] text-xs leading-relaxed text-white/25">
              Apps, tools, and automations built with AI coding tools.
            </p>
          </div>

          {/* Built with */}
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white/20">
              Built with
            </p>
            <ul className="space-y-3">
              {TOOL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-white/30 transition-colors hover:text-white/55"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplace */}
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white/20">
              Marketplace
            </p>
            <ul className="space-y-3">
              {MARKETPLACE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-white/30 transition-colors hover:text-white/55"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white/20">
              Legal
            </p>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-white/30 transition-colors hover:text-white/55"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex items-center justify-between border-t border-white/[0.05] pt-6">
          <p className="font-mono text-[10px] text-white/20">
            © {new Date().getFullYear()} Vibe Code Market
          </p>
          <p className="font-mono text-[10px] text-white/15">
            10% fee · free to list
          </p>
        </div>

      </div>
    </footer>
  );
}
