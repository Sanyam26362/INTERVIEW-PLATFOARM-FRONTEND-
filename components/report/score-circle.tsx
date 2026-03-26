interface Props { overall: number; }
export function ScoreCircle({ overall }: Props) {
  const pct = (overall / 10) * 100;
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color = overall >= 8 ? "#22c55e" : overall >= 6 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center py-6">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="70" y="66" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">{overall.toFixed(1)}</text>
        <text x="70" y="84" textAnchor="middle" fill="#9ca3af" fontSize="11">/10</text>
      </svg>
      <p className="mt-2 text-lg font-semibold text-foreground">
        {overall >= 8 ? "Excellent" : overall >= 6 ? "Good" : "Needs Work"}
      </p>
    </div>
  );
}
