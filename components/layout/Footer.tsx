import Link from "next/link";

const TOOL_LINKS = [
  { label: "Claude Code", href: "/browse?built_with=Claude+Code" },
  { label: "Cursor",      href: "/browse?built_with=Cursor"      },
  { label: "Lovable",     href: "/browse?built_with=Lovable"     },
  { label: "Bolt",        href: "/browse?built_with=Bolt"        },
  { label: "Replit",      href: "/browse?built_with=Replit"      },
  { label: "v0",          href: "/browse?built_with=v0"          },
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
    <footer className="bg-[#F5F3F0]" style={{ borderTop: "0.5px solid rgba(15,15,15,0.09)" }}>
      <div className="container py-14 md:py-16">

        {/* Main grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded font-mono text-[11px] font-bold leading-none select-none"
                style={{ background: "#C05A44", color: "#FFFFFF" }}
              >
                ▸
              </span>
              <span className="font-headline text-sm font-semibold tracking-tight text-[#0F0F0F]">
                Vibe Code Market
              </span>
            </Link>
            <p className="mt-4 max-w-[180px] text-xs leading-relaxed text-[#9B9690]">
              Apps, tools, and automations built with AI coding tools.
            </p>
          </div>

          {/* Built with */}
          <div>
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B9690]">
              Built with
            </p>
            <ul className="space-y-3">
              {TOOL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-[#6B6860] transition-colors duration-150 hover:text-[#0F0F0F]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketplace */}
          <div>
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B9690]">
              Marketplace
            </p>
            <ul className="space-y-3">
              {MARKETPLACE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-[#6B6860] transition-colors duration-150 hover:text-[#0F0F0F]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B9690]">
              Legal
            </p>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-[#6B6860] transition-colors duration-150 hover:text-[#0F0F0F]"
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
          className="mt-14 flex items-center justify-between pt-6"
          style={{ borderTop: "0.5px solid rgba(15,15,15,0.09)" }}
        >
          <p className="text-[11px] text-[#9B9690]">
            © {new Date().getFullYear()} Vibe Code Market
          </p>
          <p className="text-[11px] text-[#9B9690]">
            10% fee · free to list
          </p>
        </div>

      </div>
    </footer>
  );
}
