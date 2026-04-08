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
      className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-all duration-150 active:scale-[0.96] disabled:opacity-50"
      style={
        hasVoted
          ? {
              background: "#C05A44",
              border: "0.5px solid #C05A44",
            }
          : {
              background: "transparent",
              border: "0.5px solid rgba(15,15,15,0.18)",
            }
      }
      title={hasVoted ? "Remove upvote" : "Upvote this product"}
    >
      <ChevronUp
        className="h-3.5 w-3.5"
        style={{ color: hasVoted ? "#FFFFFF" : "#6B6860" }}
      />
      <span
        className="text-[11px] font-semibold leading-none"
        style={{ color: hasVoted ? "#FFFFFF" : "#6B6860" }}
      >
        {count}
      </span>
    </button>
  );
}
