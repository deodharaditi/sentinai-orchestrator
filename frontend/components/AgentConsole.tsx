"use client";

import { useEffect, useState } from "react";

type Props = {
  output: unknown;
  loading: boolean;
};

function toStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map(toStr).join(" ");
  if (val && typeof val === "object" && "text" in val) return (val as { text: string }).text;
  if (val) return JSON.stringify(val);
  return "";
}

export default function AgentConsole({ output, loading }: Props) {
  const [displayed, setDisplayed] = useState("");
  const text = toStr(output);

  useEffect(() => {
    if (!text) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div
      style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
      className="rounded-lg flex flex-col overflow-hidden flex-1 min-h-0"
    >
      <div style={{ borderBottom: "1px solid #30363d" }} className="px-4 py-2 flex items-center gap-2 shrink-0">
        <span className="text-xs">🤖</span>
        <span style={{ color: "#8b949e" }} className="text-xs uppercase tracking-wider font-semibold">Agent Reasoning</span>
        {loading && (
          <span style={{ color: "#58a6ff" }} className="text-xs ml-auto animate-pulse">Processing...</span>
        )}
      </div>

      <div
        style={{ backgroundColor: "#0d1117", fontFamily: "monospace", color: "#3fb950" }}
        className="flex-1 p-3 text-xs overflow-y-auto leading-relaxed whitespace-pre-wrap min-h-[120px]"
      >
        {loading && !displayed ? (
          <span className="animate-pulse">Invoking SentinAI agent...</span>
        ) : displayed ? (
          displayed
        ) : (
          <span style={{ color: "#30363d" }}>{">"} Awaiting alert...</span>
        )}
      </div>
    </div>
  );
}
