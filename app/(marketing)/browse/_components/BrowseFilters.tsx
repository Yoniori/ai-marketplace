"use client";

/**
 * BrowseFilters — Dark Cyber-Tech filter sidebar.
 * Active state: indigo glow. Idle: dark surface with subtle border.
 */

import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  useCallback,
  useTransition,
  useState,
  useEffect,
  useRef,
} from "react";

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

interface BrowseFiltersProps {
  categories: CategoryItem[];
  activeCategorySlug: string | null;
  activeBuiltWith: string | null;
  searchQuery: string;
  totalCount: number;
}

const TOOLS = [
  { label: "Claude Code", icon: "◆" },
  { label: "Cursor",      icon: "⌫" },
  { label: "Lovable",     icon: "♥" },
  { label: "Bolt",        icon: "⚡" },
  { label: "v0",          icon: "▲" },
  { label: "Replit",      icon: "⬡" },
];

const tagActive: React.CSSProperties = {
  background: "rgba(99,102,241,0.12)",
  border: "1px solid rgba(99,102,241,0.40)",
  color: "#818CF8",
};

const tagIdle: React.CSSProperties = {
  background: "#0A0A0A",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#71717A",
};

export function BrowseFilters({
  categories,
  activeCategorySlug,
  activeBuiltWith,
  searchQuery,
  totalCount,
}: BrowseFiltersProps) {
  const router    = useRouter();
  const pathname  = usePathname();
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue]  = useState(searchQuery);
  const isFirstRender = useRef(true);

  useEffect(() => { setInputValue(searchQuery); }, [searchQuery]);

  const buildHref = useCallback(
    (q: string | undefined, category: string | null, builtWith: string | null) => {
      const sp = new URLSearchParams();
      if (q?.trim())   sp.set("q", q.trim());
      if (category)    sp.set("category", category);
      if (builtWith)   sp.set("built_with", builtWith);
      const qs = sp.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname],
  );

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(buildHref(inputValue, activeCategorySlug, activeBuiltWith));
      });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const handleCategory = (slug: string | null) => {
    startTransition(() => {
      router.push(buildHref(inputValue, slug, activeBuiltWith));
    });
  };

  const handleBuiltWith = (tool: string | null) => {
    startTransition(() => {
      router.push(buildHref(inputValue, activeCategorySlug, tool));
    });
  };

  return (
    <div
      className="flex flex-col gap-6"
      style={{ opacity: isPending ? 0.60 : 1, transition: "opacity 0.15s ease" }}
    >
      {/* ── Search ── */}
      <div
        className="flex items-center gap-3 rounded-lg px-3.5 py-2.5"
        style={{
          background: "#0A0A0A",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "#3F3F46" }} />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search products…"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-[#3F3F46] outline-none font-mono"
        />
        {inputValue && (
          <button onClick={() => setInputValue("")} aria-label="Clear search">
            <X
              className="h-3.5 w-3.5 transition-colors"
              style={{ color: "#3F3F46" }}
            />
          </button>
        )}
      </div>

      {/* ── Category ── */}
      <div>
        <p
          className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] font-mono"
          style={{ color: "#3F3F46" }}
        >
          Category
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleCategory(null)}
            className="rounded px-3 py-1.5 text-[11px] font-medium transition-all duration-150 font-mono"
            style={activeCategorySlug === null ? tagActive : tagIdle}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategory(cat.slug)}
              className="rounded px-3 py-1.5 text-[11px] font-medium transition-all duration-150 font-mono"
              style={activeCategorySlug === cat.slug ? tagActive : tagIdle}
            >
              {cat.icon ? `${cat.icon} ` : ""}{cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Built With ── */}
      <div>
        <p
          className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] font-mono"
          style={{ color: "#3F3F46" }}
        >
          Built With
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TOOLS.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => handleBuiltWith(activeBuiltWith === label ? null : label)}
              className="rounded px-3 py-1.5 text-[11px] font-medium transition-all duration-150 font-mono"
              style={activeBuiltWith === label ? tagActive : tagIdle}
            >
              <span className="mr-1 opacity-50">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Count ── */}
      <p className="text-[11px] font-mono" style={{ color: "#3F3F46" }}>
        {totalCount === 0 ? (
          "No products found"
        ) : (
          <>
            <span className="font-semibold" style={{ color: "#6366F1" }}>{totalCount}</span>
            {` product${totalCount === 1 ? "" : "s"}`}
            {searchQuery && (
              <> for &ldquo;<span className="text-white">{searchQuery}</span>&rdquo;</>
            )}
          </>
        )}
      </p>
    </div>
  );
}
