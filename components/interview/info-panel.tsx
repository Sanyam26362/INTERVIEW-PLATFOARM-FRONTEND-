"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthApi } from "@/hooks/use-auth-api";
import { DOMAIN_LABELS, LANGUAGE_LABELS } from "@/lib/types";
import { Lightbulb, Info } from "lucide-react";

interface Props { sessionId: string }

export function InfoPanel({ sessionId }: Props) {
  const { get } = useAuthApi();
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    get(`/sessions/${sessionId}`)
      .then((r) => setSession(r.data.data))
      .catch(() => setError(true));
  }, [sessionId]);

  const tips = [
    "Take your time before answering",
    "Use the STAR method for behavioural questions",
    "Ask for clarification if unsure",
    "Be specific with examples",
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-foreground">
            <Info className="h-4 w-4 text-primary" /> Session Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {error ? (
            <p className="text-xs text-muted-foreground">Session details unavailable</p>
          ) : session ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Domain</span>
                <span className="font-medium text-foreground">{DOMAIN_LABELS[session.domain] || session.domain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="font-medium text-foreground">{LANGUAGE_LABELS[session.language] || session.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium text-foreground capitalize">{session.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Questions asked</span>
                <span className="font-medium text-foreground">
                  {session.transcript.filter((t: any) => t.speaker === "ai").length}
                </span>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-4 animate-pulse rounded bg-white/5" />)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-foreground">
            <Lightbulb className="h-4 w-4 text-yellow-400" /> Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />{tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
