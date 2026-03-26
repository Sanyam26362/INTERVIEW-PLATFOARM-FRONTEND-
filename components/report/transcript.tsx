"use client";
import { useState } from "react";
import { useAuthApi } from "@/hooks/use-auth-api";
import type { Turn } from "@/lib/types";

interface Props { sessionId: string }
export function Transcript({ sessionId }: Props) {
  const { get } = useAuthApi();
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && transcript.length === 0 && sessionId) {
      setLoading(true);
      get(`/sessions/${sessionId}`)
        .then((r) => setTranscript(r.data.data.transcript))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    setOpen(!open);
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 p-6">
      <button className="flex w-full items-center justify-between text-left" onClick={toggle}>
        <h3 className="font-semibold text-foreground">Full Transcript</h3>
        <span className="text-muted-foreground text-sm">{open ? "Hide ▲" : "Show ▼"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="h-24 animate-pulse rounded bg-white/5" />
          ) : transcript.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No transcript available</p>
          ) : transcript.map((t, i) => (
            <div key={i} className={`flex ${t.speaker === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                t.speaker === "user" ? "bg-purple-600/20 text-foreground" : "bg-white/5 text-muted-foreground"
              }`}>
                <span className="block text-xs font-medium mb-1 opacity-60">
                  {t.speaker === "ai" ? "AI Interviewer" : "You"}
                </span>
                {t.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
