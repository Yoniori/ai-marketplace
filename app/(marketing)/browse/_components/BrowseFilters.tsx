"use client";

/**
 * BrowseFilters
 *
 * Client component that owns:
 *   • Debounced search input  (350 ms) → pushes ?q= to the URL
 *   • Category pill buttons   → pushes ?category= to the URL
 *
 * Data is received as props from the parent Server Component so we never
 * call useSearchParams() here, which means no <Suspense> boundary is needed.
 */

import { useRouter, usePathname } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
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
  searchQuery: string;
  totalCount: number;
}

// ── Style helpers ────────────────────────────────────────────────────────────

const pillActive = {
  background: "rgba(0,255,255,0.10)",
  border: "1px solid rgba(0,255,255,0.35)",
  color: "#c1fffe",
  boxShadow: "0 0 12px rgba(0,255,255,0.08)",
} as React.CSSProperties;

const pillIdle = {
  background: "rgba(25,25,28,0.70)",
  border: "1px solid rgba(72,71,74,0.40)",
  color: "#adaaad",
} as React.CSSProperties;

// ── Component ────────────────────────────────────────────────────────────────

export function BrowseFilters({
  categories,
  activeCategorySlug,
  searchQuery,
  totalCount,
}: BrowseFiltersProps) {
  const router    = useRouter();
  const pathname  = usePathname();
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue]  = useState(searchQuery);
  const isFirstRender = useRef(true);

  // Keep input in sync if the user navigates back/forward
  useEffect(() => { setInputValue(searchQuery); }, [searchQuery]);

  // Build a clean href from the two filter dimensions
  const buildHref = useCallback(
    (q: string | undefined, category: string | null) => {
      const sp = new URLSearchParams();
      if (q?.trim())  sp.set("q", q.trim());
      if (category)   sp.set("category", category);
      const qs = sp.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname],
  );

  // Debounced search — skip the very first render to avoid a spurious push
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(buildHref(inputValue, activeCategorySlug));
      });
    }, 350);
    return () => clearTimeout(timer);
    // activeCategorySlug intentionally omitted — category changes are instant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const handleCategory = (slug: string | null) => {
    startTransition(() => {
      router.push(buildHref(inputValue, slug));
    });
  };

  return (
    <div
      className="flex flex-col gap-5"
      style={{ opacity: isPending ? 0.65 : 1, transition: "opacity 0.15s ease" }}
    >
      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{
          background:          "rgba(25,25,28,0.80)",
          backdropFilter:      "blur(12px)",
          WebkitBackdropFilter:"blur(12px)",
          border:              "1px solid rgba(72,71,74,0.50)",
        }}
      >
        <Search className="h-4 w-4 shrink-0 text-cyan-400/40" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search products…"
          className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-on-surface-variant/40 outline-none font-body"
        />
        {inputValue && (
          <button
            onClick={() => setInputValue("")}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5 text-on-surface-variant/50 hover:text-white/80 transition-colors" />
          </button>
        )}
      </div>

      {/* ── Category pills ──────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal className="h-3 w-3 text-on-surface-variant/40" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant/50">
            Category
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* "All" pill */}
          <button
            onClick={() => handleCategory(null)}
            className="rounded-full px-3.5 py-1.5 font-mono text-[11px] font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
            style={activeCategorySlug === null ? pillActive : pillIdle}
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategory(cat.slug)}
              className="rounded-full px-3.5 py-1.5 font-mono text-[11px] font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={activeCategorySlug === cat.slug ? pillActive : pillIdle}
            >
              {cat.icon ? `${cat.icon} ` : ""}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Result count ────────────────────────────────────────────────── */}
      <p className="font-mono text-[11px] text-on-surface-variant/45 leading-relaxed">
        {totalCount === 0 ? (
          "No products found"
        ) : (
          <>
            <span className="text-cyan-400/70">{totalCount}</span>
            {` product${totalCount === 1 ? "" : "s"}`}
            {searchQuery && (
              <> for{" "}
                <span className="text-cyan-400/60">"{searchQuery}"</span>
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}
