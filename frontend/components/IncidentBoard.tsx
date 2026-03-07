"use client";

import { useState } from "react";
import { Ticket } from "@/app/page";

type Props = {
  tickets: Record<string, Ticket>;
  onResolve: (alertId: string) => void;
};

const STATUS_COLORS: Record<string, string> = {
  "In Progress": "#f85149",
  "Resolved":    "#3fb950",
  "Re-opened":   "#d29922",
};

const STATUS_BG: Record<string, string> = {
  "In Progress": "rgba(248,81,73,0.12)",
  "Resolved":    "rgba(63,185,80,0.12)",
  "Re-opened":   "rgba(210,153,34,0.12)",
};

// Safely convert any value (including Anthropic content block objects) to a string
function asStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "text" in val) return (val as { text: string }).text;
  return JSON.stringify(val);
}

export default function IncidentBoard({ tickets, onResolve }: Props) {
  const entries = Object.entries(tickets);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <p style={{ color: "#8b949e" }} className="text-xs uppercase tracking-wider font-semibold mb-3 shrink-0">
        ServiceNow Tickets ({entries.length})
      </p>

      {entries.length === 0 ? (
        <div style={{ border: "1px dashed #30363d", color: "#8b949e" }} className="flex-1 flex items-center justify-center rounded-lg text-sm">
          No tickets yet — fire a preset from the header to start.
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {entries.map(([alertId, ticket]) => (
            <TicketCard key={alertId} alertId={alertId} ticket={ticket} onResolve={onResolve} />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({ alertId, ticket, onResolve }: { alertId: string; ticket: Ticket; onResolve: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLORS[ticket.status] ?? "#8b949e";
  const bg = STATUS_BG[ticket.status] ?? "transparent";
  const isPulsing = ticket.status === "In Progress";

  return (
    <div
      className={`rounded-lg animate-fade-in ${isPulsing ? "animate-pulse-ring" : ""}`}
      style={{ backgroundColor: "#161b22", border: `1px solid ${color}40`, borderLeft: `3px solid ${color}` }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-semibold text-white">{ticket.ticket_id}</span>
          <span style={{ color: "#8b949e" }} className="text-xs">{alertId}</span>
          <span style={{ backgroundColor: bg, color, border: `1px solid ${color}40` }} className="text-xs px-2 py-0.5 rounded-full font-semibold">
            {ticket.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: "#8b949e" }} className="text-xs">{ticket.updates} update{ticket.updates !== 1 ? "s" : ""}</span>
          <span style={{ color: "#8b949e" }} className="text-xs">{ticket.created_at}</span>
          <span style={{ color: "#8b949e" }} className="text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #30363d" }} className="px-4 py-3 flex flex-col gap-3">
          {ticket.exec_summary && (
            <div style={{ backgroundColor: "rgba(88,166,255,0.08)", borderLeft: "3px solid #58a6ff" }} className="px-3 py-2 rounded text-sm text-blue-200">
              <span className="font-semibold text-blue-400">SITREP: </span>{asStr(ticket.exec_summary)}
            </div>
          )}

          {ticket.status !== "Resolved" && (
            <button
              onClick={() => onResolve(alertId)}
              style={{ backgroundColor: "transparent", border: "1px solid #3fb950", color: "#3fb950" }}
              className="self-start px-3 py-1.5 rounded text-xs font-semibold cursor-pointer hover:bg-green-900/20"
            >
              Mark Resolved
            </button>
          )}

          <div>
            <p style={{ color: "#8b949e" }} className="text-xs uppercase tracking-wider mb-2">Worknotes</p>
            <div className="flex flex-col gap-1">
              {ticket.logs.map((log, i) => (
                <p key={i} style={{ color: "#8b949e", borderLeft: "2px solid #30363d" }} className="text-xs pl-2 py-0.5 font-mono">
                  [{i + 1}] {asStr(log)}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
