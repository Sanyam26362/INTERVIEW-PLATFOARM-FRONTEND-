"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FileText, Upload, X, Loader2, Play,
  CheckCircle, Briefcase, GraduationCap,
  MessageSquare, Mic, Sparkles
} from "lucide-react";
import { toast } from "sonner";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  "https://ai-mock-interview-platform-backend.onrender.com/api/v1";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
  { value: "mr", label: "Marathi" },
];

interface ResumeData {
  name: string;
  skills: string[];
  experience_years: number;
  education: string;
  previous_roles: string[];
  suggested_questions: string[];
}

type Step = "upload" | "preview" | "loading";

export function ResumeInterviewCard() {
  const router = useRouter();
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [language, setLanguage] = useState("en");
  const [mode, setMode] = useState("text");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setFile(f);
    parseResume(f);
  };

  const parseResume = async (f: File) => {
    setIsParsing(true);
    setStep("loading");
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("resume", f);

      const res = await axios.post(`${BASE_URL}/resume/parse`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      });

      setResumeData(res.data.data);
      setStep("preview");
      toast.success("Resume parsed successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to parse resume");
      setStep("upload");
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartInterview = async () => {
    if (!file) return;
    setIsStarting(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("domain", getDomainFromResume());
      formData.append("language", language);
      formData.append("mode", mode);

      const res = await axios.post(`${BASE_URL}/resume/start-interview`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      });

      const sessionId = res.data.data.session._id;
      router.push(`/interview/${sessionId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to start interview");
      setIsStarting(false);
    }
  };

  // Guess domain from job roles in resume
  const getDomainFromResume = (): string => {
    if (!resumeData) return "sde";
    const roles = resumeData.previous_roles.join(" ").toLowerCase();
    const skills = resumeData.skills.join(" ").toLowerCase();
    if (roles.includes("data") || skills.includes("sql") || skills.includes("pandas")) return "data_analyst";
    if (roles.includes("hr") || roles.includes("recruit")) return "hr";
    if (roles.includes("product") || roles.includes("pm ")) return "product";
    if (roles.includes("finance") || skills.includes("excel") || skills.includes("accounting")) return "finance";
    if (roles.includes("market")) return "marketing";
    return "sde";
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setResumeData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-border bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Resume-Based Interview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload your resume and the AI will ask questions tailored specifically to your background
        </p>
      </CardHeader>
      <CardContent>

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer py-12 transition-all ${
              dragOver
                ? "border-purple-500 bg-purple-500/5"
                : "border-border hover:border-purple-500/50 hover:bg-white/[0.02]"
            }`}
          >
            <div className="rounded-full bg-purple-500/10 p-4">
              <Upload className="h-8 w-8 text-purple-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Drop your resume here</p>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse • PDF only • max 5MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {/* STEP 2: Loading / Parsing */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-purple-500/20" />
              <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-purple-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Analysing your resume...</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Extracting skills, experience, and generating tailored questions
              </p>
            </div>
            {file && (
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-muted-foreground">{file.name}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Preview parsed data */}
        {step === "preview" && resumeData && (
          <div className="space-y-5">
            {/* Resume summary */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{resumeData.name || file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {resumeData.experience_years} yr experience · {resumeData.education}
                  </p>
                </div>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Skills */}
            {resumeData.skills?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5" /> Detected skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.slice(0, 10).map((skill) => (
                    <Badge key={skill} className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {resumeData.skills.length > 10 && (
                    <Badge className="bg-white/5 text-muted-foreground text-xs">
                      +{resumeData.skills.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Previous roles */}
            {resumeData.previous_roles?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" /> Previous roles
                </p>
                <div className="flex flex-wrap gap-2">
                  {resumeData.previous_roles.slice(0, 3).map((role) => (
                    <span key={role} className="text-xs text-foreground bg-white/5 rounded-md px-2 py-1">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested questions preview */}
            {resumeData.suggested_questions?.length > 0 && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-purple-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  {resumeData.suggested_questions.length} tailored questions generated
                </p>
                <div className="space-y-2">
                  {resumeData.suggested_questions.slice(0, 3).map((q, i) => (
                    <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="text-purple-400 font-medium shrink-0">{i + 1}.</span>
                      <span>{q}</span>
                    </div>
                  ))}
                  {resumeData.suggested_questions.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-4">
                      + {resumeData.suggested_questions.length - 3} more questions in the interview
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Interview settings */}
            <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="border-border bg-secondary/50 text-foreground h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover">
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Mode</label>
                <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v)} className="justify-start gap-1">
                  <ToggleGroupItem value="text" className="gap-1.5 h-9 text-xs border border-border bg-secondary/50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    <MessageSquare className="h-3.5 w-3.5" /> Text
                  </ToggleGroupItem>
                  <ToggleGroupItem value="voice" className="gap-1.5 h-9 text-xs border border-border bg-secondary/50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    <Mic className="h-3.5 w-3.5" /> Voice
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleStartInterview}
                  disabled={isStarting}
                  className="w-full h-9 gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm"
                >
                  {isStarting
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Starting...</>
                    : <><Play className="h-3.5 w-3.5" /> Start Interview</>
                  }
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
