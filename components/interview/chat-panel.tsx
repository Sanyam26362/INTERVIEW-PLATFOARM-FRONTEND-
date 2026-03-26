"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Send, PhoneOff, Loader2, Video, Languages, Copy } from "lucide-react";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useAuthApi } from "@/hooks/use-auth-api";
import { DOMAIN_LABELS, LANGUAGE_LABELS } from "@/lib/types";
import { toast } from "sonner";
import { useWebRTC } from "@/hooks/use-webrtc";
import { VideoStream } from "./video-stream";

interface Message {
  id: string;
  role: "ai" | "user" | "peer";
  content: string;
  translatedContent?: string;
}

interface Props {
  sessionId: string;
}

const LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
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
  const [activeSocket, setActiveSocket] = useState<any>(null);
  const [peerConnected, setPeerConnected] = useState(false);

  // ✅ FIX 1: Destructured initLocalStream from useWebRTC
  const { localStream, remoteStream, startCall, stopCall, initLocalStream } = useWebRTC(activeSocket, sessionId);

  // ─── REFS ────
  const modeRef = useRef<"text" | "voice" | "live">("text");
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
  
  // ✅ FIX 2: Added pendingPeerJoinedRef to handle the timing race condition
  const pendingPeerJoinedRef = useRef(false);

  const startCallRef = useRef(startCall);
  useEffect(() => {
    startCallRef.current = startCall;
  }, [startCall]);

  const [domain, setDomain] = useState("sde");
  const [language, setLanguage] = useState("en");
  const [mode, setMode] = useState<"text" | "voice" | "live">("text");

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) &&
      "speechSynthesis" in window;
    setVoiceSupported(supported);
    if (supported) {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () =>
        window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTimer((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    get(`/sessions/${sessionId}`)
      .then((res) => {
        const session = res.data.data;
        const m =
          session.mode === "live"
            ? "live"
            : session.mode === "voice"
            ? "voice"
            : "text";
        const l = session.language;
        const d = session.domain;

        setMode(m);
        modeRef.current = m;
        setLanguage(l);
        languageRef.current = l;
        setDomain(d);
        domainRef.current = d;

        const restored: Message[] = session.transcript.map(
          (t: any, i: number) => ({
            id: String(i),
            role: t.speaker,
            content: t.text,
          })
        );
        setMessages(restored);

        historyRef.current = session.transcript.map((t: any) => ({
          role: t.speaker === "ai" ? "assistant" : "user",
          content: t.text,
        }));

        setSessionLoaded(true);

        // ✅ FIX 2: Pre-warm the camera for live mode so it's ready when the offer arrives.
        if (m === "live" && initLocalStream) {
          initLocalStream();
        }

        // ✅ FIX 2: Replay peer_joined if it fired before we knew the mode.
        if (m === "live" && pendingPeerJoinedRef.current) {
          pendingPeerJoinedRef.current = false;
          console.log("[Chat] replaying deferred peer_joined → startCall");
          toast.info("Peer already here! Starting video...");
          setTimeout(() => { startCallRef.current(); }, 500);
        }

        if (
          session.transcript.length === 0 &&
          !initialTriggerDone.current &&
          m !== "live"
        ) {
          initialTriggerDone.current = true;
          setTimeout(() => triggerAIStart(d, l, []), 600);
        }
      })
      .catch(() => toast.error("Could not load session. Please refresh."));
  }, [sessionId, initLocalStream, get]);

  useEffect(() => {
    if (socketInitialized.current) return;
    socketInitialized.current = true;

    const setupSocket = async () => {
      const token = await getToken();
      const socket = connectSocket(token || "");
      setActiveSocket(socket);
      socket.emit("join_session", { sessionId });

      socket.on("peer_message", ({ message }: { message: string }) => {
        const peerMsg: Message = {
          id: Date.now().toString(),
          role: "peer",
          content: message,
        };
        setMessages((prev) => [...prev, peerMsg]);
      });

      socket.on("translation_result", ({ original, translated }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.content === original ? { ...m, translatedContent: translated } : m
          )
        );
      });

      socket.on("ai_response", async ({ text }: { text: string }) => {
        setIsTypingBoth(false);
        const aiMsg: Message = {
          id: Date.now().toString(),
          role: "ai",
          content: text,
        };
        setMessages((prev) => [...prev, aiMsg]);
        historyRef.current = [
          ...historyRef.current,
          { role: "assistant", content: text },
        ];

        post(`/sessions/${sessionId}/turn`, {
          speaker: "ai",
          text,
          language: languageRef.current,
        }).catch(() => {});

        if (modeRef.current === "voice") speakTextWithRef(text);
      });

      // ✅ FIX 2: Handle deferred peer_joined if session is still loading
      socket.on("peer_joined", async () => {
        setPeerConnected(true);
        if (modeRef.current !== "live") {
          // Session data hasn't loaded yet — remember this event and handle it
          // in the session load effect once we know the mode.
          console.log("[Chat] peer_joined fired before session loaded, deferring startCall");
          pendingPeerJoinedRef.current = true;
          return;
        }
        console.log("[Chat] peer_joined: starting call");
        toast.info("Peer joined! Starting video...");
        setTimeout(() => { startCallRef.current(); }, 500);
      });

      socket.on("room_size", async ({ size }: { size: number }) => {
        if (modeRef.current !== "live") return;
        if (size >= 2) {
          setPeerConnected(true);
        }
      });

      socket.on("peer_left", () => {
        setPeerConnected(false);
        toast.warning("Peer disconnected.");
      });

      socket.on("connect_error", () =>
        toast.error("Connection lost. Retrying...")
      );
      socket.on("error", () => {
        setIsTypingBoth(false);
        toast.error("An error occurred with the stream.");
      });
    };

    setupSocket();

    return () => {
      const s = connectSocket();
      s.off("peer_message");
      s.off("ai_response");
      s.off("translation_result");
      s.off("peer_joined");
      s.off("room_size");
      s.off("peer_left");
      s.off("error");
      s.off("connect_error");
    };
  }, [sessionId, getToken, post]);

  const setIsListeningBoth = (v: boolean) => {
    setIsListening(v);
    isListeningRef.current = v;
  };
  const setIsTypingBoth = (v: boolean) => {
    setIsTyping(v);
    isTypingRef.current = v;
  };
  const setIsSpeakingBoth = (v: boolean) => {
    setIsSpeaking(v);
    isSpeakingRef.current = v;
  };

  const speakTextWithRef = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    const langCode = LANG_MAP[languageRef.current] || "en-IN";
    utterance.lang = langCode;

    const voices = synthRef.current.getVoices();
    const match =
      voices.find((v) => v.lang === langCode) ||
      voices.find((v) => v.lang.startsWith(langCode.split("-")[0]));
    if (match) utterance.voice = match;

    utterance.onstart = () => setIsSpeakingBoth(true);
    utterance.onend = () => {
      setIsSpeakingBoth(false);
      if (modeRef.current === "voice")
        setTimeout(() => startListeningWithRef(), 500);
    };
    utterance.onerror = () => {
      setIsSpeakingBoth(false);
      if (modeRef.current === "voice")
        setTimeout(() => startListeningWithRef(), 500);
    };
    synthRef.current.speak(utterance);
  };

  const startListeningWithRef = () => {
    if (!voiceSupported) return;
    if (isListeningRef.current || isSpeakingRef.current || isTypingRef.current)
      return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = LANG_MAP[languageRef.current] || "en-IN";
    recognition.continuous = false;

    let shouldRestart = false;

    recognition.onstart = () => setIsListeningBoth(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      setIsListeningBoth(false);
      shouldRestart = false;
      if (!transcript) return;
      setInput(transcript);
      if (modeRef.current === "voice") sendMessageWithRef(transcript);
    };
    recognition.onerror = (event: any) => {
      setIsListeningBoth(false);
      if (event.error === "no-speech") shouldRestart = true;
    };
    recognition.onend = () => {
      setIsListeningBoth(false);
      if (
        shouldRestart &&
        modeRef.current === "voice" &&
        !isTypingRef.current &&
        !isSpeakingRef.current
      ) {
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

  const sendMessageWithRef = async (text: string) => {
    if (!text.trim() || isTypingRef.current) return;
    if (synthRef.current?.speaking) synthRef.current.cancel();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);

    const newHistory = [
      ...historyRef.current,
      { role: "user", content: text },
    ];
    historyRef.current = newHistory;
    setInput("");

    if (modeRef.current === "live") {
      const socket = connectSocket();
      socket.emit("peer_message", { sessionId, message: text });
      socket.emit("translate_message", {
        sessionId,
        text,
        targetLanguage: languageRef.current === "en" ? "hi" : "en",
      });
      return;
    }

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

  const handleSend = () => {
    const text = input.trim();
    if (text) sendMessageWithRef(text);
  };

  const triggerAIStart = (
    d: string,
    l: string,
    h: { role: string; content: string }[]
  ) => {
    setIsTypingBoth(true);
    const socket = connectSocket();
    socket.emit("user_message", {
      sessionId,
      message:
        "Please start the interview with a warm welcome and your first question.",
      domain: d,
      language: l,
      history: h,
    });
  };

  const handleEnd = async () => {
    setIsEnding(true);
    synthRef.current?.cancel();
    stopListening();
    stopCall();
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
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60)
      .toString()
      .padStart(2, "0")}`;

  const isVoiceMode = mode === "voice";
  const isLiveMode = mode === "live";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
            {DOMAIN_LABELS[domain] || domain} Interview
          </Badge>
          <Badge
            variant="outline"
            className="border-white/20 text-muted-foreground"
          >
            {LANGUAGE_LABELS[language] || language}
          </Badge>
          <Badge
            variant="outline"
            className={`border-white/20 ${
              isVoiceMode
                ? "text-green-400 border-green-500/30"
                : isLiveMode
                ? "text-blue-400 border-blue-500/30"
                : "text-muted-foreground"
            }`}
          >
            {isLiveMode
              ? "🎥 Live Peer"
              : isVoiceMode
              ? "🎙 Voice AI"
              : "⌨ Text AI"}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-sm text-foreground">
              {formatTime(timer)}
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={handleEnd}
            disabled={isEnding}
          >
            {isEnding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PhoneOff className="h-4 w-4" />
            )}
            {isEnding ? "Generating report..." : "End Interview"}
          </Button>
        </div>
      </div>

      {/* WebRTC Live Video Grid */}
      {isLiveMode && (
        <div className="p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between max-w-4xl mx-auto mb-4 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className={`h-2 w-2 rounded-full ${
                  remoteStream
                    ? "bg-green-500"
                    : peerConnected
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-blue-500 animate-pulse"
                }`}
              />
              <p className="text-sm text-blue-100">
                {remoteStream
                  ? "Peer connected — video live."
                  : peerConnected
                  ? "Peer joined — establishing video..."
                  : "Waiting for peer. Share this session link for them to join."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Invite link copied! Send it to your peer.");
              }}
              className="gap-2 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition-colors"
            >
              <Copy className="h-4 w-4" />
              Copy Invite Link
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10">
              <VideoStream stream={localStream} muted={true} label="Camera" />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium rounded-md text-white flex items-center gap-2">
                <Video className="h-3 w-3" /> You
              </div>
            </div>
            <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10">
              <VideoStream stream={remoteStream} label="Peer" />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-medium rounded-md text-white flex items-center gap-2">
                <Video className="h-3 w-3" /> Peer
              </div>
            </div>
          </div>

          {/* ✅ FIX 3: Changed onClick from startCall to initLocalStream to prevent offer glare */}
          {!localStream && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={initLocalStream}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Video className="h-4 w-4" /> Start Camera
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-foreground"
                }`}
              >
                {message.role === "ai" && (
                  <p className="text-xs font-medium text-purple-400 mb-1">
                    AI Interviewer
                  </p>
                )}
                {message.role === "peer" && (
                  <p className="text-xs font-medium text-blue-400 mb-1">
                    Peer
                  </p>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.translatedContent && (
                  <div className="mt-2 pt-2 border-t border-white/20 flex items-start gap-2 text-yellow-300">
                    <Languages className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-sm italic">{message.translatedContent}</p>
                  </div>
                )}
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
              <p className="text-xs text-muted-foreground transition-all">
                {isListening
                  ? "🔴 Listening — speak your answer..."
                  : isSpeaking
                  ? "🔵 AI is speaking, please wait..."
                  : isTyping
                  ? "⏳ AI is thinking..."
                  : "Tap the mic to speak, or type below"}
              </p>
              <div className="flex items-center gap-4 w-full">
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
                  {isListening ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
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
                  ⚠ Voice not supported in this browser. Please use Chrome for
                  voice mode.
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Press Enter to send {isLiveMode && "and translate"}
              </p>
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
                  className={`h-12 w-12 shrink-0 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 ${
                    isListening ? "border-red-500 bg-red-500/10" : ""
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5 text-red-400" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
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