import { useState, useEffect, useRef, useCallback } from "react";
import type { Socket } from "socket.io-client";

export type CodeLanguage = "javascript" | "typescript" | "python" | "java" | "cpp" | "go";

export const LANGUAGE_META: Record<CodeLanguage, { label: string; monaco: string }> = {
  javascript: { label: "JavaScript", monaco: "javascript" },
  typescript: { label: "TypeScript", monaco: "typescript" },
  python:     { label: "Python",     monaco: "python" },
  java:       { label: "Java",       monaco: "java" },
  cpp:        { label: "C++",        monaco: "cpp" },
  go:         { label: "Go",         monaco: "go" },
};

export const STARTER_CODE: Record<CodeLanguage, string> = {
  javascript: `// JavaScript\nfunction solution(nums, target) {\n  // write your solution here\n}\n\nconsole.log(solution([2, 7, 11, 15], 9));\n`,
  typescript: `// TypeScript\nfunction solution(nums: number[], target: number): number[] {\n  // write your solution here\n  return [];\n}\n\nconsole.log(solution([2, 7, 11, 15], 9));\n`,
  python:     `# Python\ndef solution(nums: list[int], target: int) -> list[int]:\n    # write your solution here\n    pass\n\nprint(solution([2, 7, 11, 15], 9))\n`,
  java:       `// Java\nclass Solution {\n    public int[] solution(int[] nums, int target) {\n        // write your solution here\n        return new int[]{};\n    }\n}\n`,
  cpp:        `// C++\n#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> solution(vector<int>& nums, int target) {\n    // write your solution here\n    return {};\n}\n`,
  go:         `// Go\npackage main\n\nimport "fmt"\n\nfunc solution(nums []int, target int) []int {\n    // write your solution here\n    return nil\n}\n\nfunc main() {\n    fmt.Println(solution([]int{2, 7, 11, 15}, 9))\n}\n`,
};

export type SyncStatus = "synced" | "syncing";

export function useCollabCode(socket: Socket | null, sessionId: string) {
  const [code, setCode]             = useState(STARTER_CODE.javascript);
  const [language, setLanguage]     = useState<CodeLanguage>("javascript");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

  // Prevents echoing a remote change back to the peer.
  // Timeline: remote arrives → suppressEmitRef = true → setCode() triggers
  // re-render → Monaco calls onChange → we see the flag and skip the emit.
  const suppressEmitRef = useRef(false);
  const emitTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onRemoteCode = ({
      code: remoteCode,
      language: remoteLang,
    }: {
      code: string;
      language: CodeLanguage;
    }) => {
      suppressEmitRef.current = true;
      if (remoteLang) setLanguage(remoteLang);
      setCode(remoteCode);
      setSyncStatus("synced");
    };

    const onRemoteLang = ({ language: remoteLang }: { language: CodeLanguage }) => {
      suppressEmitRef.current = true;
      setLanguage(remoteLang);
      setCode(STARTER_CODE[remoteLang] ?? "");
    };

    socket.on("code_change", onRemoteCode);
    socket.on("code_language_change", onRemoteLang);

    return () => {
      socket.off("code_change", onRemoteCode);
      socket.off("code_language_change", onRemoteLang);
    };
  }, [socket]);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newCode = value ?? "";

      // This onChange fired because we set code remotely — skip the emit.
      if (suppressEmitRef.current) {
        suppressEmitRef.current = false;
        return;
      }

      setCode(newCode);
      setSyncStatus("syncing");

      if (emitTimerRef.current) clearTimeout(emitTimerRef.current);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

      emitTimerRef.current = setTimeout(() => {
        socket?.emit("code_change", { sessionId, code: newCode, language });
        // Give the peer a moment to ack before showing "synced"
        syncTimerRef.current = setTimeout(() => setSyncStatus("synced"), 300);
      }, 150);
    },
    [socket, sessionId, language]
  );

  const handleLanguageChange = useCallback(
    (newLang: CodeLanguage) => {
      const starter = STARTER_CODE[newLang] ?? "";
      setLanguage(newLang);
      setCode(starter);
      // Emit language first so peer sets up Monaco language mode, then code
      socket?.emit("code_language_change", { sessionId, language: newLang });
      socket?.emit("code_change", { sessionId, code: starter, language: newLang });
    },
    [socket, sessionId]
  );

  return { code, language, syncStatus, handleCodeChange, handleLanguageChange };
}