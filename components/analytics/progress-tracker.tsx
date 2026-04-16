"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthApi } from "@/hooks/use-auth-api";
import { TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface WeekData { week: string; count: number; avgScore: number | null; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {d.avgScore != null
        ? <p className="text-purple-400">Avg score: <span className="font-bold">{d.avgScore}/10</span></p>
        : <p className="text-muted-foreground">No interviews</p>}
      <p className="text-muted-foreground">{d.count} interview{d.count !== 1 ? "s" : ""}</p>
    </div>
  );
};

export function ProgressTracker() {
  const { get } = useAuthApi();
  const [data, setData] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get("/analytics/weekly")
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hasData = data.some((d) => d.count > 0);
  const totalThisMonth = data.slice(-4).reduce((s, d) => s + d.count, 0);
  const avgLast4 = (() => {
    const w = data.slice(-4).filter((d) => d.avgScore != null);
    if (!w.length) return null;
    return (w.reduce((s, d) => s + (d.avgScore ?? 0), 0) / w.length).toFixed(1);
  })();

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <TrendingUp className="h-4 w-4 text-purple-400" />
          Weekly progress
        </CardTitle>
        <div className="flex gap-4 mt-1">
          <div>
            <p className="text-xs text-muted-foreground">This month</p>
            <p className="text-lg font-bold text-foreground">{loading ? "—" : totalThisMonth} interviews</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg score (4 weeks)</p>
            <p className="text-lg font-bold text-purple-400">{loading ? "—" : avgLast4 ? `${avgLast4}/10` : "—"}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="h-48 animate-pulse rounded-lg bg-white/5" />
        ) : !hasData ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-muted-foreground">Complete interviews to see your progress chart</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={7} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="avgScore"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ fill: "#a78bfa", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#7c3aed" }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Dashed line = target score (7/10)
        </p>
      </CardContent>
    </Card>
  );
}
