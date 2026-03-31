"use client";

import { useState, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Copy, RotateCcw, Play, CheckCheck, Loader2, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import { useCollabCode, LANGUAGE_META, type CodeLanguage } from "@/hooks/use-collab-code";

// ─── safe in-browser JS execution ───────────────────────────────────────────
function runJavaScript(code: string): { output: string; isError: boolean } {
  const logs: string[] = [];
  const orig = {
    log:   console.log,
    error: console.error,
    warn:  console.warn,
    info:  console.info,
  };

  const capture =
    (prefix = "") =>
    (...args: unknown[]) => {
      const line = args
        .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
        .join(" ");
      logs.push(prefix + line);
    };

  console.log   = capture();
  console.info  = capture("[info] ");
  console.warn  = capture("[warn] ");
  console.error = capture("[error] ");

  try {
    // eslint-disable-next-line no-new-func
    new Function(code)();
    Object.assign(console, orig);
    return { output: logs.join("\n") || "(no output)", isError: false };
  } catch (e: unknown) {
    Object.assign(console, orig);
    const errMsg = e instanceof Error ? e.message : String(e);
    return {
      output: [...logs, errMsg].join("\n"),
      isError: true,
    };
  }
}

// ─── component ──────────────────────────────────────────────────────────────
interface Props {
  socket: Socket | null;
  sessionId: string;
}

export function CodeEditorPanel({ socket, sessionId }: Props) {
  const { code, language, syncStatus, handleCodeChange, handleLanguageChange } =
    useCollabCode(socket, sessionId);

  // FIX 1: Changed { text: string } to { output: string } to match runJavaScript
  const [output, setOutput]   = useState<{ output: string; isError: boolean } | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied]   = useState(false);
  const editorMounted         = useRef(false);

  // FIX 2: Use the monaco instance directly from onMount to avoid React lifecycle crashes
  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    if (editorMounted.current) return;
    editorMounted.current = true;
    
    try {
      monaco.editor.defineTheme("interview-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background":              "#09090f",
          "editor.lineHighlightBackground": "#ffffff08",
          "editorLineNumber.foreground":    "#ffffff25",
          "editorLineNumber.activeForeground": "#ffffff60",
          "editor.selectionBackground":     "#7f77dd33",
          "editorCursor.foreground":        "#a78bfa",
        },
      });
      monaco.editor.setTheme("interview-dark");
    } catch (e) {
      // This catches the harmless cancellation object if the user closes the panel instantly
      console.warn("Monaco theme initialization gracefully skipped during unmount", e);
    }
  }, []);

  const handleRun = useCallback(() => {
    if (language !== "javascript" && language !== "typescript") {
      toast.info(
        `Browser execution is only available for JavaScript.\nCopy your ${LANGUAGE_META[language].label} code and run it locally.`
      );
      return;
    }
    setRunning(true);
    // Yield to the event loop so the UI updates before the (potentially blocking) eval
    setTimeout(() => {
      const result = runJavaScript(code);
      setOutput(result);
      setRunning(false);
    }, 30);
  }, [code, language]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const handleReset = useCallback(() => {
    handleLanguageChange(language);
    setOutput(null);
  }, [language, handleLanguageChange]);

  return (
    <div className="flex h-full flex-col" style={{ background: "#09090f" }}>

      {/* ── top bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 border-b border-white/10 px-3 py-2">

        {/* language tabs */}
        <div className="flex items-center gap-0.5 flex-wrap">
          {(Object.keys(LANGUAGE_META) as CodeLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={[
                "px-2.5 py-1 text-xs rounded-md transition-all",
                language === lang
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5",
              ].join(" ")}
            >
              {LANGUAGE_META[lang].label}
            </button>
          ))}
        </div>

        {/* sync status */}
        <div className="flex items-center gap-3 pl-2 shrink-0">
          <span
            className={[
              "flex items-center gap-1.5 text-xs",
              syncStatus === "synced" ? "text-green-400" : "text-yellow-400",
            ].join(" ")}
          >
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                syncStatus === "synced"
                  ? "bg-green-400"
                  : "bg-yellow-400 animate-pulse",
              ].join(" ")}
            />
            {syncStatus === "synced" ? "Synced" : "Syncing…"}
          </span>

          <div className="flex items-center gap-1">
            <Code2 className="h-3.5 w-3.5 text-white/20" />
            <span className="text-xs text-white/20">Collaborative</span>
          </div>
        </div>
      </div>

      {/* ── Monaco editor ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={LANGUAGE_META[language].monaco}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          theme="interview-dark"
          options={{
            fontSize: 13,
            fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "line",
            tabSize: 2,
            wordWrap: "on",
            automaticLayout: true,
            padding: { top: 14, bottom: 14 },
            bracketPairColorization: { enabled: true },
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            formatOnPaste: true,
            scrollbar: {
              verticalScrollbarSize: 4,
              horizontalScrollbarSize: 4,
            },
          }}
          loading={
            <div className="flex h-full items-center justify-center gap-2 text-white/40 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading editor…
            </div>
          }
        />
      </div>

      {/* ── output panel ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/10">

        {/* output toolbar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-white/5">
          <span className="text-xs font-medium text-white/30 uppercase tracking-wider">
            Output
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="h-6 gap-1 text-xs text-white/40 hover:text-white/80 px-2"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-6 gap-1 text-xs text-white/40 hover:text-white/80 px-2"
            >
              {copied ? (
                <CheckCheck className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              size="sm"
              onClick={handleRun}
              disabled={running}
              className="h-6 gap-1.5 text-xs px-3 bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 disabled:opacity-50"
            >
              {running ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3 fill-current" />
              )}
              Run
            </Button>
          </div>
        </div>

        {/* output text */}
        <div
          className="px-4 py-3 font-mono text-xs overflow-y-auto"
          style={{ minHeight: "72px", maxHeight: "160px" }}
        >
          {output ? (
            <pre
              className={[
                "whitespace-pre-wrap break-all leading-relaxed",
                output.isError ? "text-red-400" : "text-green-300",
              ].join(" ")}
            >
              {/* FIX 3: Display output.output instead of output.text */}
              {output.output}
            </pre>
          ) : (
            <span className="text-white/15">
              Press Run to execute JavaScript in the browser…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}