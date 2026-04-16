"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthApi } from "@/hooks/use-auth-api";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";

const DOMAIN_LABELS: Record<string, string> = {
  sde: "SDE", data_analyst: "Data Analyst", hr: "HR",
  marketing: "Marketing", finance: "Finance", product: "Product",
  all: "All domains",
};

const scoreColor = (s: number) =>
  s >= 8 ? "text-green-400" : s >= 6 ? "text-yellow-400" : "text-red-400";

const scoreBg = (s: number) =>
  s >= 8 ? "bg-green-500/10 text-green-400" : s >= 6 ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400";

interface Report {
  _id: string;
  scores: Record<string, number>;
  feedback: string;
  createdAt: string;
  sessionId: { domain: string; language: string; mode: string } | null;
}

export function ReportsTable() {
  const { get } = useAuthApi();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReports = (d: string, p: number) => {
    setLoading(true);
    const params: Record<string, any> = { page: p, limit: 8 };
    if (d !== "all") params.domain = d;

    get("/analytics/reports", params)
      .then((r) => {
        setReports(r.data.data.reports);
        setTotalPages(r.data.data.pages);
        setTotal(r.data.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports(domain, page);
  }, [domain, page]);

  const handleDomainChange = (v: string) => {
    setDomain(v);
    setPage(1);
  };

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base text-foreground">All reports</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{total} total reports</p>
          </div>
          <Select value={domain} onValueChange={handleDomainChange}>
            <SelectTrigger className="w-44 border-border bg-secondary/50 text-foreground h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover">
              {["all", "sde", "data_analyst", "hr", "marketing", "finance", "product"].map((d) => (
                <SelectItem key={d} value={d}>{DOMAIN_LABELS[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">No reports found for this filter</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Domain</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Overall</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Communication</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Technical</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Confidence</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((r) => (
                    <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs">
                            {DOMAIN_LABELS[r.sessionId?.domain || ""] || r.sessionId?.domain || "—"}
                          </Badge>
                          {r.sessionId?.mode === "voice" && (
                            <span className="text-xs text-green-400">🎙</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`font-bold text-sm ${scoreColor(r.scores.overall)}`}>
                          {r.scores.overall}<span className="text-xs font-normal text-muted-foreground">/10</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell text-muted-foreground text-xs">
                        {r.scores.communication}/10
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell text-muted-foreground text-xs">
                        {r.scores.technicalAccuracy}/10
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell text-muted-foreground text-xs">
                        {r.scores.confidence}/10
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3">
                        <Link href={`/report/${r._id}`}>
                          <Button size="sm" variant="outline" className="h-7 gap-1 border-border text-xs px-2">
                            <FileText className="h-3 w-3" /> View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm" variant="outline"
                    className="h-8 w-8 p-0 border-border"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-8 w-8 p-0 border-border"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
