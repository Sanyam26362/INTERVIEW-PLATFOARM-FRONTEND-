"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthApi } from "@/hooks/use-auth-api";
import { DOMAIN_LABELS, LANGUAGE_LABELS, type Session } from "@/lib/types";
import { FileText } from "lucide-react";

const statusColor: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  active: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  abandoned: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function RecentSessions() {
  const { get } = useAuthApi();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get("/sessions")
      .then((res) => setSessions(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <CardTitle className="text-foreground">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No interviews yet. Start your first one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Domain</th>
                  <th className="pb-3 font-medium">Language</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((s) => (
                  <tr key={s._id}>
                    <td className="py-3 font-medium text-foreground">{DOMAIN_LABELS[s.domain] || s.domain}</td>
                    <td className="py-3 text-muted-foreground">{LANGUAGE_LABELS[s.language] || s.language}</td>
                    <td className="py-3">
                      <Badge className={statusColor[s.status] || ""}>{s.status}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="py-3">
                      {s.reportId ? (
                        <Link href={`/report/${s.reportId}`}>
                          <Button size="sm" variant="outline" className="gap-1 border-border text-xs">
                            <FileText className="h-3 w-3" /> View Report
                          </Button>
                        </Link>
                      ) : s.status === "active" ? (
                        <Link href={`/interview/${s._id}`}>
                          <Button size="sm" className="bg-primary text-xs text-primary-foreground">Resume</Button>
                        </Link>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
