"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Send, PhoneOff, Loader2, Volume2 } from "lucide-react";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useAuthApi } from "@/hooks/use-auth-api";
import { DOMAIN_LABELS, LANGUAGE_LABELS } from "@/lib/types";
import { toast } from "sonner";

interface Message { id: string; role: "ai" | "user"; content: string; }
interface Props { sessionId: string; }

const LANG_MAP: Record<string, string> = {
  en: "en-IN", hi: "hi-IN",
};

export function ChatPanel({ sessionId }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { get, post, patch } = useAuthApi();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // ─── REFS (always current value, safe inside closures) ────
  const modeRef = useRef<"text" | "voice">("text");
  const languageRef = useRef("en");
  const domainRef = useRef("sde");
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isListeningRef = useRef(false);
  const isTypingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const socketInitialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialTriggerDone = useRef(false);

  // Keep state + ref in sync
  const setIsListeningBoth = (v: boolean) => { setIsListening(v); isListeningRef.current = v; };
  const setIsTypingBoth = (v: boolean) => { setIsTyping(v); isTypingRef.current = v; };
  const setIsSpeakingBoth = (v: boolean) => { setIsSpeaking(v); isSpeakingRef.current = v; };

  // Display state (only for render)
  const [domain, setDomain] = useState("sde");
  const [language, setLanguage] = useState("en");
  const [mode, setMode] = useState<"text" | "voice">("text");

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  // Check voice support
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) &&
      "speechSynthesis" in window;
    setVoiceSupported(supported);
    if (supported) {
      synthRef.current = window.speechSynthesis;
      // Pre-load voices (Chrome loads them async)
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices(); // cache them
      };
    }
  }, []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setTimer((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Load session ─────────────────────────────────────────
  useEffect(() => {
    get(`/sessions/${sessionId}`)
      .then((res) => {
        const session = res.data.data;

        // Update both state (for display) and refs (for closures)
        const m = session.mode === "voice" ? "voice" : "text";
        const l = session.language;
        const d = session.domain;

        setMode(m); modeRef.current = m;
        setLanguage(l); languageRef.current = l;
        setDomain(d); domainRef.current = d;

        const restored: Message[] = session.transcript.map((t: any, i: number) => ({
          id: String(i), role: t.speaker, content: t.text,
        }));
        setMessages(restored);

        historyRef.current = session.transcript.map((t: any) => ({
          role: t.speaker === "ai" ? "assistant" : "user",
          content: t.text,
        }));

        setSessionLoaded(true);

        if (session.transcript.length === 0 && !initialTriggerDone.current) {
          initialTriggerDone.current = true;
          setTimeout(() => triggerAIStart(d, l, []), 600);
        }
      })
      .catch(() => toast.error("Could not load session. Please refresh."));
  }, [sessionId]);

  // ─── Socket setup (runs once, uses refs — no stale closures) ──
  useEffect(() => {
    if (socketInitialized.current) return;
    socketInitialized.current = true;

    const setupSocket = async () => {
      const token = await getToken();
      const socket = connectSocket(token || "");
      socket.emit("join_session", { sessionId });

      socket.on("ai_response", async ({ text }: { text: string }) => {
        setIsTypingBoth(false);

        const aiMsg: Message = {
          id: Date.now().toString(),
          role: "ai",
          content: text,
        };
        setMessages((prev) => [...prev, aiMsg]);
        historyRef.current = [...historyRef.current, { role: "assistant", content: text }];

        // Save to DB
        post(`/sessions/${sessionId}/turn`, {
          speaker: "ai",
          text,
          language: languageRef.current,  // ✅ ref — always current
        }).catch(() => {});

        // ✅ Use ref here — this is the fix. modeRef.current is always fresh
        if (modeRef.current === "voice") {
          speakTextWithRef(text);
        }
      });

      socket.on("connect_error", () => toast.error("Connection lost. Retrying..."));
      socket.on("error", () => {
        setIsTypingBoth(false);
        toast.error("AI response failed. Try again.");
      });
    };

    setupSocket();

    return () => {
      const s = connectSocket();
      s.off("ai_response");
      s.off("error");
      s.off("connect_error");
    };
  }, [sessionId]);

  // ─── TTS using refs (no stale closure) ─────────────────────
  // This is defined as a plain function (not useCallback) so it always
  // reads the latest refs — no closure trap
  const speakTextWithRef = (text: string) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Prevents Chrome Garbage Collection bug!
    const langCode = LANG_MAP[languageRef.current] || "en-IN";
    utterance.lang = langCode;
    utterance.rate = 0.92;
    utterance.pitch = 1;

    // Try to find a matching voice
    const voices = synthRef.current.getVoices();
    const langPrefix = langCode.split("-")[0];
    const match =
      voices.find((v) => v.lang === langCode) ||
      voices.find((v) => v.lang.startsWith(langPrefix));
    if (match) utterance.voice = match;

    utterance.onstart = () => setIsSpeakingBoth(true);

    utterance.onend = () => {
      setIsSpeakingBoth(false);
      // ✅ ref — always current, no stale closure
      if (modeRef.current === "voice") {
        setTimeout(() => startListeningWithRef(), 500);
      }
    };

    utterance.onerror = () => {
      setIsSpeakingBoth(false);
      // Even if TTS fails, auto-listen in voice mode
      if (modeRef.current === "voice") {
        setTimeout(() => startListeningWithRef(), 500);
      }
    };

    synthRef.current.speak(utterance);
  };

  // ─── STT using refs ────────────────────────────────────────
  const startListeningWithRef = () => {
    if (!voiceSupported) return;
    if (isListeningRef.current || isSpeakingRef.current || isTypingRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = LANG_MAP[languageRef.current] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let shouldRestart = false;

    recognition.onstart = () => setIsListeningBoth(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      setIsListeningBoth(false);
      shouldRestart = false; // Prevent restart since we got input
      if (!transcript) return;

      setInput(transcript);

      // ✅ ref — auto-send in voice mode
      if (modeRef.current === "voice") {
        sendMessageWithRef(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListeningBoth(false);
      if (event.error === "not-allowed") {
        toast.error("Microphone permission denied. Please allow mic access.");
      } else if (event.error === "no-speech") {
        shouldRestart = true; // Auto-restart on silent timeout
      } else if (event.error !== "aborted") {
        toast.error(`Mic error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListeningBoth(false);
      // Restart seamlessly if simply timed out
      if (shouldRestart && modeRef.current === "voice" && !isTypingRef.current && !isSpeakingRef.current) {
        setTimeout(() => startListeningWithRef(), 250);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setIsListeningBoth(false);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListeningBoth(false);
  };

  const toggleMic = () => {
    if (isListeningRef.current) stopListening();
    else startListeningWithRef();
  };

  // ─── Send message using refs ──────────────────────────────
  const sendMessageWithRef = async (text: string) => {
    if (!text.trim() || isTypingRef.current) return;
    if (synthRef.current?.speaking) synthRef.current.cancel();

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const newHistory = [...historyRef.current, { role: "user", content: text }];
    historyRef.current = newHistory;
    setInput("");

    await post(`/sessions/${sessionId}/turn`, {
      speaker: "user",
      text,
      language: languageRef.current,
    }).catch(() => {});

    setIsTypingBoth(true);
    const socket = connectSocket();
    socket.emit("user_message", {
      sessionId,
      message: text,
      domain: domainRef.current,
      language: languageRef.current,
      history: newHistory,
    });
  };

  // Wrapper for button click (uses current input state)
  const handleSend = () => {
    const text = input.trim();
    if (text) sendMessageWithRef(text);
  };

  const triggerAIStart = (d: string, l: string, h: { role: string; content: string }[]) => {
    setIsTypingBoth(true);
    const socket = connectSocket();
    socket.emit("user_message", {
      sessionId,
      message: "Please start the interview with a warm welcome and your first question.",
      domain: d,
      language: l,
      history: h,
    });
  };

  // ─── End Interview ────────────────────────────────────────
  const handleEnd = async () => {
    setIsEnding(true);
    synthRef.current?.cancel();
    stopListening();
    try {
      await patch(`/sessions/${sessionId}/complete`);
      toast.success("Generating your report...");
      const evalRes = await post(`/evaluation/${sessionId}`);
      const reportId = evalRes.data.data._id;
      disconnectSocket();
      router.push(`/report/${reportId}`);
    } catch {
      toast.error("Failed to end interview. Try again.");
      setIsEnding(false);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const isVoiceMode = mode === "voice";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
            {DOMAIN_LABELS[domain] || domain} Interview
          </Badge>
          <Badge variant="outline" className="border-white/20 text-muted-foreground">
            {LANGUAGE_LABELS[language] || language}
          </Badge>
          <Badge variant="outline" className={`border-white/20 ${isVoiceMode ? "text-green-400 border-green-500/30" : "text-muted-foreground"}`}>
            {isVoiceMode ? "🎙 Voice" : "⌨ Text"}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-sm text-foreground">{formatTime(timer)}</span>
          </div>
          <Button variant="destructive" size="sm" className="gap-2" onClick={handleEnd} disabled={isEnding}>
            {isEnding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}
            {isEnding ? "Generating report..." : "End Interview"}
          </Button>
        </div>
      </div>

      {/* Voice status bar */}
      {isVoiceMode && (
        <div className={`flex items-center justify-center gap-2 py-2 text-xs font-medium transition-all ${
          isListening ? "bg-red-500/10 text-red-400" :
          isSpeaking ? "bg-blue-500/10 text-blue-400" :
          "bg-white/5 text-muted-foreground"
        }`}>
          {isListening && <><span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> Listening — speak now...</>}
          {isSpeaking && <><Volume2 className="h-3 w-3 animate-pulse" /> AI is speaking...</>}
          {!isListening && !isSpeaking && !isTyping && "Voice mode active — AI will speak and listen automatically"}
          {isTyping && !isSpeaking && <><span className="h-2 w-2 animate-bounce rounded-full bg-purple-400" /> AI is thinking...</>}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && !isTyping && sessionLoaded && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <p className="text-muted-foreground text-sm">Starting your interview...</p>
            </div>
          )}
          {messages.length === 0 && !isTyping && !sessionLoaded && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-transparent" />
              <p className="text-muted-foreground text-sm">Loading session...</p>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user" ? "bg-purple-600 text-white" : "bg-white/10 text-foreground"
              }`}>
                {message.role === "ai" && (
                  <p className="text-xs font-medium text-purple-400 mb-1">AI Interviewer</p>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 p-4">
        <div className="mx-auto max-w-3xl">
          {isVoiceMode ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground">
                {isListening ? "🔴 Listening — speak your answer..." :
                 isSpeaking ? "🔵 AI is speaking, please wait..." :
                 isTyping ? "⏳ AI is thinking..." :
                 "Tap the mic to speak, or type below"}
              </p>
              <div className="flex items-center gap-4 w-full">
                {/* Big mic button */}
                <Button
                  onClick={toggleMic}
                  disabled={isTyping || isSpeaking || isEnding}
                  size="lg"
                  className={`h-16 w-16 shrink-0 rounded-full transition-all duration-200 ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 scale-110 ring-4 ring-red-500/30"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                {/* Text fallback */}
                <div className="flex flex-1 gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Or type your answer..."
                    disabled={isTyping || isEnding}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                  />
                  <Button
                    onClick={handleSend}
                    size="icon"
                    disabled={isTyping || isEnding || !input.trim()}
                    className="h-12 w-12 shrink-0 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              {!voiceSupported && (
                <p className="text-xs text-yellow-400">
                  ⚠ Voice not supported in this browser. Please use Chrome for voice mode.
                </p>
              )}
            </div>
          ) : (
            // Text mode
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Press Enter to send</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your answer..."
                  disabled={isTyping || isEnding}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50"
                />
                <Button
                  onClick={toggleMic}
                  variant="outline"
                  size="icon"
                  title="Click to dictate"
                  className={`h-12 w-12 shrink-0 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 ${
                    isListening ? "border-red-500 bg-red-500/10" : ""
                  }`}
                >
                  {isListening
                    ? <MicOff className="h-5 w-5 text-red-400" />
                    : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  onClick={handleSend}
                  size="icon"
                  disabled={isTyping || isEnding || !input.trim()}
                  className="h-12 w-12 shrink-0 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}