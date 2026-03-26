"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuthApi } from "@/hooks/use-auth-api";
import { Button } from "@/components/ui/button";
import { ScoreCircle } from "@/components/report/score-circle";
import { ScoreBreakdown } from "@/components/report/score-breakdown";
import { FeedbackCards } from "@/components/report/feedback-cards";
import { AIFeedback } from "@/components/report/ai-feedback";
import { Transcript } from "@/components/report/transcript";
import type { Report } from "@/lib/types";
import { ArrowLeft, RotateCcw, Loader2 } from "lucide-react";

interface Props { params: Promise<{ reportId: string }> }

export default function ReportPage({ params }: Props) {
  const { get } = useAuthApi();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const { reportId } = use(params);

  useEffect(() => {
    get(`/evaluation/report/${reportId}`)
      .then((res) => setReport(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your report...</p>
      </div>
    </div>
  );

  if (!report) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Report not found.</p>
        <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Interview Report</h1>
          <Link href="/dashboard">
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <RotateCcw className="h-4 w-4" /> New Interview
            </Button>
          </Link>
        </div>
        <div className="space-y-8">
          <ScoreCircle overall={report.scores.overall} />
          <ScoreBreakdown scores={report.scores} />
          <FeedbackCards strengths={report.strengths} improvements={report.improvements} />
          <AIFeedback feedback={report.feedback} fillerWords={report.fillerWords} />
          <Transcript sessionId={typeof report.sessionId === "string" ? report.sessionId : (report.sessionId as any)?._id} />
        </div>
      </div>
    </div>
  );
}
