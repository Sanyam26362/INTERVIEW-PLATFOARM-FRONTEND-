"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, BarChart2, BookOpen, Star } from "lucide-react";
import { useAuthApi } from "@/hooks/use-auth-api";
import type { Stats } from "@/lib/types";

export function StatsCards() {
  const { get } = useAuthApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get("/users/me/stats")
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Interviews", value: loading ? "—" : String(stats?.totalInterviews ?? 0), icon: BookOpen, color: "text-blue-400" },
    { label: "Current Streak", value: loading ? "—" : `${stats?.streak ?? 0} days`, icon: Flame, color: "text-orange-400" },
    { label: "Plan", value: loading ? "—" : (stats?.plan ?? "free"), icon: Star, color: "text-yellow-400" },
    { label: "Avg Score", value: "—", icon: BarChart2, color: "text-green-400" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-border bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground capitalize">{card.value}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
