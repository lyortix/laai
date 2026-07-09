import { cn, scoreLabel } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

function ringColor(score: number) {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}

/** Animated circular score gauge, SVG-only (no JS on the client). */
export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  className,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div
      className={cn("animate-score-pop relative inline-flex items-center justify-center", className)}
      role="img"
      aria-label={`Score: ${score} out of 100 — ${scoreLabel(score)}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-1000 ease-out", ringColor(score))}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-bold tabular-nums" style={{ fontSize: size / 4 }}>
          {score}
        </span>
        {showLabel && (
          <span className="text-xs text-muted-foreground">{scoreLabel(score)}</span>
        )}
      </div>
    </div>
  );
}
