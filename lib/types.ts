export interface User {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  role: "candidate" | "hr" | "admin";
  preferredLanguage: string;
  domain: string;
  streak: number;
  plan: "free" | "pro" | "enterprise";
  interviewsUsed: number;
  interviewsLimit: number;
}

export interface Session {
  _id: string;
  userId: string;
  domain: string;
  language: string;
  status: "active" | "completed" | "abandoned";
  mode: "text" | "voice" | "live";
  transcript: Turn[];
  reportId?: string;
  duration?: number;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface Turn {
  speaker: "ai" | "user";
  text: string;
  language: string;
  timestamp: string;
}

export interface Report {
  _id: string;
  sessionId: string;
  scores: {
    communication: number;
    technicalAccuracy: number;
    confidence: number;
    clarity: number;
    overall: number;
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
  fillerWords: { count: number; words: string[] };
  language: string;
  generatedAt: string;
}

export interface Stats {
  totalInterviews: number;
  streak: number;
  plan: string;
}

export const DOMAIN_LABELS: Record<string, string> = {
  sde: "SDE",
  data_analyst: "Data Analyst",
  hr: "HR",
  marketing: "Marketing",
  finance: "Finance",
  product: "Product",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  hi: "Hindi",
};
