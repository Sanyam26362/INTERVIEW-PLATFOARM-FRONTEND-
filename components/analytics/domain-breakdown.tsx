"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthApi } from "@/hooks/use-auth-api";
import { Layers } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

const DOMAIN_LABELS: Record<string, string> = {
  sde: "SDE", data_analyst: "Data Analyst", hr: "HR",
  marketing: "Marketing", finance: "Finance", product: "Product",
};

interface DomainData {
  domain: string;
  count: number;
  averageScores: Record<string, number>;
  topStrengths: { text: string; count: number }[];
  topWeaknesses: { text: string; count: number }[];
}

const scoreColor = (s: number) =>
  s >= 8 ? "text-green-400" : s >= 6 ? "text-yellow-400" : "text-red-400";

const scoreBg = (s: number) =>
  s >= 8 ? "bg-green-500/10 border-green-500/20" : s >= 6 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-red-500/10 border-red-500/20";

export function DomainBreakdown() {
  const { get } = useAuthApi();
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get("/analytics/by-domain")
      .then((r) => {
        const d = r.data.data as DomainData[];
        setDomains(d);
        if (d.length > 0) setSelected(d[0].domain);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = domains.find((d) => d.domain === selected);

  const radarData = active
    ? [
        { subject: "Communication", score: active.averageScores.communication },
        { subject: "Technical", score: active.averageScores.technicalAccuracy },
        { subject: "Confidence", score: active.averageScores.confidence },
        { subject: "Clarity", score: active.averageScores.clarity },
      ]
    : [];

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <Layers className="h-4 w-4 text-purple-400" />
          Performance by domain
        </CardTitle>

        {!loading && domains.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {domains.map((d) => (
              <button
                key={d.domain}
                onClick={() => setSelected(d.domain)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border ${
                  selected === d.domain
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    : "bg-white/5 text-muted-foreground border-border hover:border-purple-500/30 hover:text-foreground"
                }`}
              >
                {DOMAIN_LABELS[d.domain] || d.domain}
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                  selected === d.domain ? "bg-purple-500/30" : "bg-white/10"
                }`}>
                  {d.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-white/5" />
        ) : domains.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">Complete interviews to see domain breakdown</p>
          </div>
        ) : active ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Radar chart */}
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} />
                  <Tooltip
                    formatter={(v: number) => [`${v}/10`, ""]}
                    contentStyle={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Radar dataKey="score" stroke="#a78bfa" fill="#7c3aed" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Scores + strengths/weaknesses */}
            <div className="space-y-4">
              {/* Score pills */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(active.averageScores).filter(([k]) => k !== "overall").map(([key, val]) => (
                  <div key={key} className={`rounded-lg border p-2 ${scoreBg(val)}`}>
                    <p className="text-xs text-muted-foreground capitalize">
                      {key === "technicalAccuracy" ? "Technical" : key}
                    </p>
                    <p className={`text-lg font-bold ${scoreColor(val)}`}>{val}<span className="text-xs font-normal">/10</span></p>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {active.topStrengths.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-400 mb-1.5">Top strengths</p>
                  <div className="space-y-1">
                    {active.topStrengths.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                        <span className="text-muted-foreground">{s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {active.topWeaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-400 mb-1.5">Focus areas</p>
                  <div className="space-y-1">
                    {active.topWeaknesses.map((w, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                        <span className="text-muted-foreground">{w.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
