/**
 * QualityBadge — Displays Gatekeeper AI quality scores.
 *
 * Two variants:
 *   compact — circular score badge for cards/hero
 *   full    — full breakdown card for listing detail page
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
  if (score >= 8) return "#00e6e6";
  if (score >= 6) return "#f59e0b";
  return "#ef4444";
}

function ScoreCircle({ score, size = 44 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  const radius = (size - 4) / 2; // subtract border width
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 10, 1);
  const dash = circumference * pct;
  const gap = circumference - dash;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-0.5">
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
            strokeWidth={2}
          />
          {/* Fill */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={2}
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
            className="font-mono font-bold"
            style={{ fontSize: size >= 44 ? "0.65rem" : "0.55rem", color }}
          >
            {score.toFixed(score % 1 === 0 ? 0 : 1)}
          </span>
        </div>
      </div>
      <span
        className="font-mono uppercase tracking-widest"
        style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.40)" }}
      >
        AI Checked
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
        <span className="font-mono text-[10px] text-white/50 uppercase tracking-wider">{label}</span>
        <span className="font-mono text-[10px] font-semibold" style={{ color }}>
          {score}/10
        </span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 4, background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
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
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Shield icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00e6e6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-white/70">
            Gatekeeper Quality Report
          </span>
        </div>
        <ScoreCircle score={overallScore} size={44} />
      </div>

      {/* Score breakdown */}
      <div className="flex flex-col gap-3">
        <ScoreBar label="Security" score={securityScore} />
        <ScoreBar label="Completeness" score={completenessScore} />
        <ScoreBar label="Clarity" score={clarityScore} />
      </div>

      {/* Disclaimer */}
      <p
        className="font-mono text-[10px] text-center"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        Automated analysis · Not a security audit
      </p>
    </div>
  );
}
