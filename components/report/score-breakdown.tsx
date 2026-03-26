interface Scores {
  communication: number;
  technicalAccuracy: number;
  confidence: number;
  clarity: number;
  overall: number;
}
interface Props { scores: Scores; }

export function ScoreBreakdown({ scores }: Props) {
  const items = [
    { label: "Communication", value: scores.communication },
    { label: "Technical accuracy", value: scores.technicalAccuracy },
    { label: "Confidence", value: scores.confidence },
    { label: "Clarity", value: scores.clarity },
  ];
  const color = (v: number) =>
    v >= 8 ? "bg-green-500" : v >= 6 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-card/50 p-5">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{item.value.toFixed(1)}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full ${color(item.value)}`} style={{ width: `${item.value * 10}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
