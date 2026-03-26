import { CheckCircle, AlertCircle } from "lucide-react";
interface Props { strengths: string[]; improvements: string[]; }

export function FeedbackCards({ strengths, improvements }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-green-400">
          <CheckCircle className="h-5 w-5" /> Strengths
        </h3>
        <ul className="space-y-2">
          {strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />{s}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-orange-400">
          <AlertCircle className="h-5 w-5" /> Improve
        </h3>
        <ul className="space-y-2">
          {improvements.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />{s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
