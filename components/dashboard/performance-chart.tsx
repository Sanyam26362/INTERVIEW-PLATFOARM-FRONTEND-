"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { session: "Session 1", score: 6.2 },
  { session: "Session 2", score: 5.8 },
  { session: "Session 3", score: 7.1 },
  { session: "Session 4", score: 6.8 },
  { session: "Session 5", score: 7.9 },
  { session: "Session 6", score: 7.5 },
  { session: "Session 7", score: 8.2 },
];

export function PerformanceChart() {
  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BarChart3 className="h-5 w-5 text-primary" />
          Performance Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis
                dataKey="session"
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fafafa",
                }}
                labelStyle={{ color: "#a1a1aa" }}
                formatter={(value: number) => [`${value}/10`, "Score"]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{ fill: "#7c3aed", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#7c3aed" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
