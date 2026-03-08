"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

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

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p:      ({ children }) => <p style={{ color: "#3fb950", margin: "0 0 6px 0", lineHeight: "1.6" }}>{children}</p>,
  h1:     ({ children }) => <p style={{ color: "#e6edf3", fontWeight: 700, fontSize: "13px", margin: "10px 0 4px" }}>{children}</p>,
  h2:     ({ children }) => <p style={{ color: "#e6edf3", fontWeight: 700, fontSize: "12px", margin: "8px 0 3px" }}>{children}</p>,
  h3:     ({ children }) => <p style={{ color: "#58a6ff", fontWeight: 600, margin: "6px 0 3px" }}>{children}</p>,
  strong: ({ children }) => <strong style={{ color: "#e6edf3" }}>{children}</strong>,
  em:     ({ children }) => <em style={{ color: "#8b949e" }}>{children}</em>,
  code:   ({ children }) => (
    <code style={{ backgroundColor: "#0d1117", color: "#58a6ff", padding: "1px 5px", borderRadius: "3px", fontFamily: "monospace" }}>
      {children}
    </code>
  ),
  ul: ({ children }) => <ul style={{ margin: "4px 0", paddingLeft: "18px" }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: "4px 0", paddingLeft: "18px" }}>{children}</ol>,
  li: ({ children }) => <li style={{ color: "#3fb950", margin: "2px 0" }}>{children}</li>,
  hr: () => <hr style={{ border: "none", borderTop: "1px solid #30363d", margin: "8px 0" }} />,
};

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
    }, 10);
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
        style={{ backgroundColor: "#0d1117", fontFamily: "monospace" }}
        className="flex-1 p-3 text-xs overflow-y-auto leading-relaxed min-h-30"
      >
        {loading && !displayed ? (
          <span style={{ color: "#3fb950" }} className="animate-pulse">Invoking SentinAI agent...</span>
        ) : displayed ? (
          <ReactMarkdown components={mdComponents}>{displayed}</ReactMarkdown>
        ) : (
          <span style={{ color: "#30363d" }}>{">"} Awaiting alert...</span>
        )}
      </div>
    </div>
  );
}
