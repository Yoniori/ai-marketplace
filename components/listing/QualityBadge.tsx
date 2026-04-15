/**
 * QualityBadge — Gatekeeper quality scores as a HUD element.
 *
 * Two variants:
 *   compact — arc dial for cards (indigo/green/red on dark)
 *   full    — HUD panel with score breakdown + pulsing status dot
 *
 * Design: feels like a system monitor / mission-critical dashboard.
 * Monospace font, sharp corners, thin glowing border, pulsing status indicator.
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
  if (score >= 8) return "#22C55E";   // green — excellent
  if (score >= 6) return "#F59E0B";   // amber — acceptable
  return "#EF4444";                    // red — needs work
}

function scoreLabel(score: number): string {
  if (score >= 8) return "OK";
  if (score >= 6) return "WARN";
  return "FAIL";
}

function ScoreArc({ score, size = 44 }: { score: number; size?: number }) {
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
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
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
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            {score.toFixed(score % 1 === 0 ? 0 : 1)}
          </span>
        </div>
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.45rem",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#3F3F46",
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
  const status = scoreLabel(score);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.6rem",
            fontWeight: 500,
            color: "#71717A",
            textTransform: "uppercase",
            letterSpacing: "0.10em",
          }}
        >
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.5rem",
              fontWeight: 600,
              color,
              border: `1px solid ${color}40`,
              background: `${color}12`,
              padding: "1px 5px",
              borderRadius: "2px",
              letterSpacing: "0.08em",
            }}
          >
            {status}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color,
            }}
          >
            {score}/10
          </span>
        </div>
      </div>
      {/* Track */}
      <div
        style={{
          height: 2,
          borderRadius: 1,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 1,
            background: color,
            transition: "width 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
            boxShadow: `0 0 6px ${color}60`,
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
  outcome,
  variant,
}: QualityBadgeProps) {
  if (variant === "compact") {
    return <ScoreArc score={overallScore} size={44} />;
  }

  // Outcome → status dot color
  const dotColor =
    outcome === "approved" ? "#22C55E" :
    outcome === "flagged"  ? "#EF4444" :
    "#F59E0B";

  // Full variant — HUD panel
  return (
    <div
      className="flex flex-col gap-5 rounded-xl p-5"
      style={{
        background: "#0A0A0A",
        border: "1px solid rgba(99,102,241,0.20)",
        boxShadow: "0 0 0 1px rgba(99,102,241,0.06), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {/* Pulsing status dot */}
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: dotColor,
              boxShadow: `0 0 6px ${dotColor}`,
              animation: "pulse-dot 1.8s ease-in-out infinite",
            }}
          />
          {/* Shield icon */}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366F1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.6rem",
              fontWeight: 600,
              color: "#6366F1",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Quality Report
          </span>
        </div>
        <ScoreArc score={overallScore} size={52} />
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

      {/* Score breakdown */}
      <div className="flex flex-col gap-4">
        <ScoreBar label="Security" score={securityScore} />
        <ScoreBar label="Completeness" score={completenessScore} />
        <ScoreBar label="Clarity" score={clarityScore} />
      </div>

      {/* Disclaimer */}
      <p
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.55rem",
          color: "#3F3F46",
          textAlign: "center",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Automated analysis — not a security audit
      </p>
    </div>
  );
}
