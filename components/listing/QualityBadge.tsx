/**
 * QualityBadge — Gatekeeper quality scores in editorial style.
 *
 * Two variants:
 *   compact — physical dial arc (terracotta/forest/ink) for cards
 *   full    — score breakdown panel for listing detail page
 *
 * Design: feels like a physical instrument dial, not a neon HUD.
 * No glows, no gradients — clean ink + earthy accent palette.
 */

interface QualityBadgeProps {
  overallScore: number;
  securityScore: number;
  completenessScore: number;
  clarityScore: number;
  outcome: string;
  variant: "compact" | "full";
}

function scoreColor(score: number): string {
  if (score >= 8) return "#2D4739";   // forest — excellent
  if (score >= 6) return "#B89F6E";   // gold — acceptable
  return "#C05A44";                    // terracotta — needs work
}

function ScoreCircle({ score, size = 44 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  const strokeWidth = size >= 64 ? 3 : 2;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const dash = circumference * pct;
  const gap = circumference - dash;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ position: "relative", width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
        >
          {/* Track — warm paper tone */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(15,15,15,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Fill — earthy color */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: size >= 56 ? "0.75rem" : "0.6rem",
              fontWeight: 700,
              color: "#0F0F0F",
              lineHeight: 1,
            }}
          >
            {score.toFixed(score % 1 === 0 ? 0 : 1)}
          </span>
        </div>
      </div>
      <span
        style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: "0.5rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#9B9690",
        }}
      >
        Score
      </span>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = scoreColor(score);
  const pct = Math.min((score / 10) * 100, 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: "0.6875rem",
            color: "#6B6860",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            color,
          }}
        >
          {score}/10
        </span>
      </div>
      {/* Track */}
      <div
        style={{
          height: 3,
          borderRadius: 2,
          background: "rgba(15,15,15,0.07)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 2,
            background: color,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

export function QualityBadge({
  overallScore,
  securityScore,
  completenessScore,
  clarityScore,
  variant,
}: QualityBadgeProps) {
  if (variant === "compact") {
    return <ScoreCircle score={overallScore} size={44} />;
  }

  // Full variant
  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Verification mark — clean ink shield */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B6860"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "#6B6860",
              textTransform: "uppercase",
              letterSpacing: "0.10em",
            }}
          >
            Quality Report
          </span>
        </div>
        <ScoreCircle score={overallScore} size={52} />
      </div>

      {/* Divider */}
      <div style={{ height: "0.5px", background: "rgba(15,15,15,0.09)" }} />

      {/* Score breakdown */}
      <div className="flex flex-col gap-3.5">
        <ScoreBar label="Security" score={securityScore} />
        <ScoreBar label="Completeness" score={completenessScore} />
        <ScoreBar label="Clarity" score={clarityScore} />
      </div>

      {/* Disclaimer */}
      <p
        style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: "0.625rem",
          color: "#9B9690",
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        Automated analysis — not a security audit
      </p>
    </div>
  );
}
