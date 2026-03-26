import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://ai-mock-interview-platform-backend.onrender.com/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30s — Render free tier can be slow on cold start
});

// Attach Clerk JWT to every request automatically
api.interceptors.request.use(async (config) => {
  try {
    const token = await (window as any).Clerk?.session?.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — Clerk will handle re-auth
      console.warn("Unauthorized — token may have expired");
    }
    return Promise.reject(error);
  }
);

// ─── User ─────────────────────────────────────────────────
export const getMe = () => api.get("/users/me");
export const updateMe = (data: object) => api.put("/users/me", data);
export const getMyStats = () => api.get("/users/me/stats");

// ─── Sessions ─────────────────────────────────────────────
export const createSession = (data: {
  domain: string;
  language: string;
  mode: string;
}) => api.post("/sessions", data);

export const getSessions = () => api.get("/sessions");
export const getSession = (id: string) => api.get(`/sessions/${id}`);

export const addTurn = (
  sessionId: string,
  data: { speaker: "ai" | "user"; text: string; language: string }
) => api.post(`/sessions/${sessionId}/turn`, data);

export const completeSession = (sessionId: string) =>
  api.patch(`/sessions/${sessionId}/complete`);

// ─── Questions ────────────────────────────────────────────
export const getQuestions = (params: {
  domain?: string;
  difficulty?: string;
  limit?: number;
}) => api.get("/questions", { params });

// ─── Evaluation ───────────────────────────────────────────
export const evaluateSession = (sessionId: string) =>
  api.post(`/evaluation/${sessionId}`);

export const getReport = (reportId: string) =>
  api.get(`/evaluation/report/${reportId}`);

export default api;
