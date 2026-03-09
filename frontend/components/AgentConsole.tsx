"use client";

import { useEffect, useState } from "react";

type Props = { output: unknown; loading: boolean };

function toStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map(toStr).join(" ");
  if (val && typeof val === "object" && "text" in val) return (val as { text: string }).text;
  if (val) return JSON.stringify(val);
  return "";
}

function renderInline(text: string, keyOffset = 0): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`|\*(.+?)\*/g;
  let last = 0, k = keyOffset;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={k++} style={{ color: "#e6edf3" }}>{m[1]}</strong>);
    else if (m[2]) parts.push(<code key={k++} style={{ background: "#0d1117", color: "#58a6ff", padding: "1px 5px", borderRadius: 3 }}>{m[2]}</code>);
    else if (m[3]) parts.push(<em key={k++} style={{ color: "#8b949e" }}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MiniMd({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let buf: string[] = [];
  let k = 0;

  const flush = () => {
    if (!buf.length) return;
    nodes.push(
      <ul key={k++} style={{ margin: "4px 0", paddingLeft: 18 }}>
        {buf.map((s, i) => <li key={i} style={{ color: "#3fb950", margin: "2px 0" }}>{renderInline(s, i * 100)}</li>)}
      </ul>
    );
    buf = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw;
    if (/^### /.test(line))      { flush(); nodes.push(<p key={k++} style={{ color: "#58a6ff", fontWeight: 600, margin: "6px 0 3px" }}>{renderInline(line.slice(4))}</p>); }
    else if (/^## /.test(line))  { flush(); nodes.push(<p key={k++} style={{ color: "#e6edf3", fontWeight: 700, fontSize: 12, margin: "8px 0 3px" }}>{renderInline(line.slice(3))}</p>); }
    else if (/^# /.test(line))   { flush(); nodes.push(<p key={k++} style={{ color: "#e6edf3", fontWeight: 700, fontSize: 13, margin: "10px 0 4px" }}>{renderInline(line.slice(2))}</p>); }
    else if (/^---+$/.test(line.trim())) { flush(); nodes.push(<hr key={k++} style={{ border: "none", borderTop: "1px solid #30363d", margin: "8px 0" }} />); }
    else if (/^[-*] /.test(line)) buf.push(line.slice(2));
    else if (line.trim() === "")  flush();
    else { flush(); nodes.push(<p key={k++} style={{ color: "#3fb950", margin: "0 0 6px 0", lineHeight: 1.6 }}>{renderInline(line)}</p>); }
  }
  flush();
  return <>{nodes}</>;
}

export default function AgentConsole({ output, loading }: Props) {
  const [displayed, setDisplayed] = useState("");
  const text = toStr(output);

  useEffect(() => {
    if (!text) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => { setDisplayed(text.slice(0, ++i)); if (i > text.length) clearInterval(id); }, 10);
    return () => clearInterval(id);
  }, [text]);

  return (
    <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }} className="rounded-lg flex flex-col overflow-hidden flex-1 min-h-0">
      <div style={{ borderBottom: "1px solid #30363d" }} className="px-4 py-2 flex items-center gap-2 shrink-0">
        <span className="text-xs">🤖</span>
        <span style={{ color: "#8b949e" }} className="text-xs uppercase tracking-wider font-semibold">Agent Reasoning</span>
        {loading && <span style={{ color: "#58a6ff" }} className="text-xs ml-auto animate-pulse">Processing...</span>}
      </div>
      <div style={{ backgroundColor: "#0d1117", fontFamily: "monospace" }} className="flex-1 p-3 text-xs overflow-y-auto leading-relaxed min-h-30">
        {loading && !displayed
          ? <span style={{ color: "#3fb950" }} className="animate-pulse">Invoking SentinAI agent...</span>
          : displayed
          ? <MiniMd text={displayed} />
          : <span style={{ color: "#30363d" }}>{">"} Awaiting alert...</span>}
      </div>
    </div>
  );
}
