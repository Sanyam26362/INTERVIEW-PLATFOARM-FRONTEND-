"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthApi } from "@/hooks/use-auth-api";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface Item { text: string; count: number; }
interface Overview { topStrengths: Item[]; topWeaknesses: Item[]; totalInterviews: number; }

function Bar({ count, max, color }: { count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 mt-1">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StrengthWeaknessTracker() {
  const { get } = useAuthApi();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"strengths" | "weaknesses">("weaknesses");

  useEffect(() => {
    get("/analytics/overview")
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items = tab === "strengths" ? (data?.topStrengths ?? []) : (data?.topWeaknesses ?? []);
  const maxCount = items.length > 0 ? Math.max(...items.map((i) => i.count)) : 1;

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-foreground">Recurring patterns</CardTitle>
        <p className="text-xs text-muted-foreground">
          Most frequent feedback across {data?.totalInterviews ?? 0} interviews
        </p>
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => setTab("weaknesses")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              tab === "weaknesses"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "text-muted-foreground hover:text-foreground bg-white/5"
            }`}
          >
            <AlertCircle className="h-3 w-3" /> Weak areas
          </button>
          <button
            onClick={() => setTab("strengths")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              tab === "strengths"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "text-muted-foreground hover:text-foreground bg-white/5"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" /> Strong areas
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded bg-white/5" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Complete more interviews to see your recurring patterns
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-1">
            {items.map((item, i) => (
              <div key={i}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className={`mt-0.5 text-xs font-bold shrink-0 ${
                      tab === "weaknesses" ? "text-red-400" : "text-green-400"
                    }`}>
                      {i + 1}
                    </span>
                    <p className="text-sm text-foreground leading-tight">{item.text}</p>
                  </div>
                  <span className={`text-xs shrink-0 font-medium px-2 py-0.5 rounded-full ${
                    tab === "weaknesses"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-green-500/10 text-green-400"
                  }`}>
                    {item.count}×
                  </span>
                </div>
                <Bar
                  count={item.count}
                  max={maxCount}
                  color={tab === "weaknesses" ? "bg-red-500" : "bg-green-500"}
                />
              </div>
            ))}

            {tab === "weaknesses" && items.length > 0 && (
              <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <p className="text-xs text-yellow-400 font-medium mb-1">Suggested focus</p>
                <p className="text-xs text-muted-foreground">
                  Your most common issue: <span className="text-foreground font-medium">"{items[0].text}"</span>.
                  Try dedicating your next 2-3 sessions specifically to improving this area.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
