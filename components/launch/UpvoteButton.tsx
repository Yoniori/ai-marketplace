"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";

interface UpvoteButtonProps {
  listingId: string;
  initialCount: number;
  initialHasVoted: boolean;
  isAuthenticated: boolean;
}

export function UpvoteButton({
  listingId,
  initialCount,
  initialHasVoted,
  isAuthenticated,
}: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!isAuthenticated) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setLoading(true);
    try {
      const method = hasVoted ? "DELETE" : "POST";
      const res = await fetch(`/api/listings/${listingId}/upvote`, { method });
      if (res.ok) {
        const data = await res.json() as { count: number; hasVoted: boolean };
        setCount(data.count);
        setHasVoted(data.hasVoted);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
      style={
        hasVoted
          ? {
              background: "rgba(0,255,255,0.10)",
              border: "1px solid rgba(0,255,255,0.35)",
              boxShadow: "0 0 12px rgba(0,255,255,0.08)",
            }
          : {
              background: "rgba(25,25,28,0.70)",
              border: "1px solid rgba(72,71,74,0.40)",
            }
      }
      title={hasVoted ? "Remove upvote" : "Upvote this product"}
    >
      <ChevronUp
        className="h-4 w-4 transition-colors"
        style={{ color: hasVoted ? "#c1fffe" : "#adaaad" }}
      />
      <span
        className="font-mono text-[11px] font-semibold leading-none"
        style={{ color: hasVoted ? "#c1fffe" : "#adaaad" }}
      >
        {count}
      </span>
    </button>
  );
}
