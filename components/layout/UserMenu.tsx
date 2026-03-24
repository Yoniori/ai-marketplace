"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, PlusSquare, ShoppingBag, Settings, LogOut, ChevronDown, Loader2, User } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { getInitials } from "@/lib/utils";

interface UserMenuProps {
  displayName: string;
  username:    string;
  avatarUrl:   string | null;
  role:        string;
}

// Items rendered in fixed order
const NAV_ITEMS = (username: string, role: string) => [
  { href: "/dashboard",             icon: LayoutDashboard, label: "Dashboard",   show: true                                     },
  { href: `/profile/${username}`,   icon: User,            label: "View profile", show: true                                    },
  { href: "/dashboard/listings/new",icon: PlusSquare,      label: "New listing", show: role === "creator" || role === "admin"   },
  { href: "/dashboard/purchases",   icon: ShoppingBag,     label: "My purchases", show: true                                   },
  { href: "/dashboard/settings",    icon: Settings,        label: "Settings",    show: true                                     },
];

/**
 * Client-side user avatar dropdown in the Navbar.
 * Receives profile data from the server (Navbar.tsx).
 */
export function UserMenu({ displayName, username, avatarUrl, role }: UserMenuProps) {
  const [open, setOpen]           = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef                   = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleSignOut() {
    setOpen(false);
    startTransition(() => {
      signOut();
    });
  }

  const initials = getInitials(displayName || username);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || username}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </span>
          )}
        </span>

        <span className="hidden max-w-[120px] truncate font-medium sm:block">
          {displayName || username}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-enter rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          {/* User info header */}
          <div className="px-3 py-2.5 border-b border-border mb-1">
            <p className="truncate text-sm font-medium">{displayName || username}</p>
            <p className="truncate text-xs text-muted-foreground">@{username}</p>
          </div>

          {/* Nav items */}
          {NAV_ITEMS(username, role)
            .filter((item) => item.show)
            .map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </Link>
            ))}

          <div className="my-1 border-t border-border" />

          {/* Sign out */}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={isPending}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
