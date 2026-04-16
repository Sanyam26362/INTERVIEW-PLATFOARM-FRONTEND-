"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthApi } from "@/hooks/use-auth-api";
import { TrendingUp, Award, Target, Zap } from "lucide-react";

interface Overview {
  totalInterviews: number;
  averageScores: Record<string, number> | null;
  bestScore: number | null;
}

export function OverviewCards() {
  const { get } = useAuthApi();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get("/analytics/overview")
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = (s: number) =>
    s >= 8 ? "text-green-400" : s >= 6 ? "text-yellow-400" : "text-red-400";

  const cards = [
    {
      label: "Total interviews",
      value: loading ? "—" : String(data?.totalInterviews ?? 0),
      sub: "sessions completed",
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Overall avg score",
      value: loading ? "—" : data?.averageScores ? `${data.averageScores.overall}/10` : "—",
      sub: "across all sessions",
      icon: TrendingUp,
      color: !loading && data?.averageScores ? scoreColor(data.averageScores.overall) : "text-muted-foreground",
      bg: "bg-purple-500/10",
    },
    {
      label: "Best score",
      value: loading ? "—" : data?.bestScore != null ? `${data.bestScore}/10` : "—",
      sub: "personal record",
      icon: Award,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Avg confidence",
      value: loading ? "—" : data?.averageScores ? `${data.averageScores.confidence}/10` : "—",
      sub: "across all sessions",
      icon: Zap,
      color: !loading && data?.averageScores ? scoreColor(data.averageScores.confidence) : "text-muted-foreground",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="border-border bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className={`mt-1 text-3xl font-bold ${c.color}`}>{c.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.sub}</p>
              </div>
              <div className={`rounded-lg p-2 ${c.bg}`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
