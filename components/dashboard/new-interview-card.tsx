"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Play, MessageSquare, Mic, Video, Loader2 } from "lucide-react";
import { useAuthApi } from "@/hooks/use-auth-api";
import { toast } from "sonner";

const DOMAINS = [
  { value: "sde", label: "SDE" },
  { value: "data_analyst", label: "Data Analyst" },
  { value: "hr", label: "HR" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finance" },
  { value: "product", label: "Product" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
];

export function NewInterviewCard() {
  const router = useRouter();
  const { post } = useAuthApi();
  const [domain, setDomain] = useState("");
  const [language, setLanguage] = useState("en");
  const [mode, setMode] = useState("text");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!domain) { toast.error("Please select a domain"); return; }
    setLoading(true);
    try {
      const res = await post("/sessions", { domain, language, mode });
      const sessionId = res.data.data._id;
      router.push(`/interview/${sessionId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start interview. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Play className="h-5 w-5 text-primary" />
          Start New Interview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Domain</label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger className="border-border bg-secondary/50 text-foreground">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                {DOMAINS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="border-border bg-secondary/50 text-foreground">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Mode</label>
            <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v)} className="justify-start gap-2">
              <ToggleGroupItem value="text" className="gap-2 border border-border bg-secondary/50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <MessageSquare className="h-4 w-4" /> Text
              </ToggleGroupItem>
              <ToggleGroupItem value="voice" className="gap-2 border border-border bg-secondary/50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <Mic className="h-4 w-4" /> Voice
              </ToggleGroupItem>
              <ToggleGroupItem value="live" className="gap-2 border border-border bg-secondary/50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <Video className="h-4 w-4" /> Live
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex items-end">
            <Button size="lg" className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleStart} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {loading ? "Starting..." : "Start Interview"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
