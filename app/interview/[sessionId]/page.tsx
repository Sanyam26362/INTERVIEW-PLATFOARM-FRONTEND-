"use client";

import { use, useState, useRef, useCallback, useEffect } from "react";
import { ChatPanel } from "@/components/interview/chat-panel";
import { InfoPanel } from "@/components/interview/info-panel";
import { CodeEditorPanel } from "@/components/interview/code-editor-panel";
import type { Socket } from "socket.io-client";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default function InterviewPage({ params }: Props) {
  const { sessionId } = use(params);

  // ─── GLOBAL ERROR SUPPRESSOR ──────────────────────────────────────────────
  // This intercepts third-party libraries (like Clerk) throwing raw objects
  // in the background and stops the Next.js Red Screen of Death.
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === "object" && !(event.reason instanceof Error)) {
        console.warn("Suppressed background object rejection:", event.reason);
        event.preventDefault(); // <-- This blocks the Next.js error overlay
      }
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  const [liveTranscript, setLiveTranscript] = useState<any[]>([]);
  const [mode, setMode] = useState<"text" | "voice" | "live">("text");
  
  const socketRef = useRef<Socket | null>(null);
  const [isSocketReady, setIsSocketReady] = useState(false);

  // FIX: Memoize this function so it doesn't cause infinite re-renders in ChatPanel
  const handleSocketReady = useCallback((s: Socket) => {
    socketRef.current = s;
    setIsSocketReady(true);
  }, []);

  const isLive = mode === "live";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Chat + video — narrower in live mode to make room for the editor */}
      <div
        className={[
          "flex flex-col border-r border-white/10 transition-all duration-300",
          isLive ? "w-[52%]" : "w-[60%]",
        ].join(" ")}
      >
        <ChatPanel
          sessionId={sessionId}
          onTranscriptChange={setLiveTranscript}
          onModeChange={setMode}
          onSocketReady={handleSocketReady}
        />
      </div>

      {/* Right panel — code editor in live mode, info panel otherwise */}
      <div className={[
        "flex flex-col transition-all duration-300",
        isLive ? "w-[48%]" : "w-[40%]",
      ].join(" ")}>
        {isLive ? (
          <CodeEditorPanel socket={socketRef.current} sessionId={sessionId} />
        ) : (
          <InfoPanel sessionId={sessionId} liveTranscript={liveTranscript} />
        )}
      </div>
    </div>
  );
}