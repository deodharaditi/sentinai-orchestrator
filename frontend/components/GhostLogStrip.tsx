"use client";

import { useState } from "react";
import { SuppressedEntry } from "@/app/page";

type Props = { entries: SuppressedEntry[] };

export default function GhostLogStrip({ entries }: Props) {
  const [selected, setSelected] = useState<SuppressedEntry | null>(null);

  const toggle = (e: SuppressedEntry) =>
    setSelected((prev) =>
      prev?.ticket_id === e.ticket_id && prev?.timestamp === e.timestamp ? null : e
    );

  return (
    <>
      {/* Popover — floats above the strip */}
      {selected && (
        <div
          style={{
            position: "fixed",
            bottom: "56px",
            right: "24px",
            width: "420px",
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "8px",
            zIndex: 100,
            boxShadow: "0 -4px 24px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{ borderBottom: "1px solid #30363d" }}
            className="px-4 py-3 flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-white">{selected.ticket_id}</span>
              <span style={{ color: "#8b949e" }} className="text-xs ml-2">
                {selected.alert_id} · {selected.timestamp}
              </span>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{ color: "#8b949e", background: "none", border: "none", cursor: "pointer" }}
              className="text-sm hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Before: raw alert */}
          <div style={{ borderBottom: "1px solid #30363d" }} className="px-4 py-3">
            <p style={{ color: "#f85149" }} className="text-xs uppercase tracking-wider font-semibold mb-2">
              Raw Alert — suppressed email
            </p>
            <p
              style={{
                backgroundColor: "rgba(248,81,73,0.06)",
                borderLeft: "3px solid #f85149",
                color: "#e6edf3",
                fontFamily: "monospace",
              }}
              className="text-xs px-3 py-2 rounded leading-relaxed"
            >
              {selected.raw_alert || selected.preview}
            </p>
          </div>

          {/* After: agent SITREP */}
          <div className="px-4 py-3">
            <p style={{ color: "#3fb950" }} className="text-xs uppercase tracking-wider font-semibold mb-2">
              Agent SITREP — written to worknote instead
            </p>
            {selected.sitrep ? (
              <p
                style={{
                  backgroundColor: "rgba(63,185,80,0.06)",
                  borderLeft: "3px solid #3fb950",
                  color: "#e6edf3",
                  fontFamily: "monospace",
                }}
                className="text-xs px-3 py-2 rounded leading-relaxed"
              >
                {selected.sitrep}
              </p>
            ) : (
              <p style={{ color: "#8b949e" }} className="text-xs italic">
                No SITREP generated for this entry.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Ghost log strip */}
      <div
        style={{ backgroundColor: "#161b22", borderTop: "1px solid #30363d", height: "48px" }}
        className="shrink-0 flex items-center px-4 gap-2 overflow-hidden"
      >
        <span style={{ color: "#8b949e", whiteSpace: "nowrap" }} className="text-xs font-semibold uppercase tracking-wider">
          Ghost Log ({entries.length} suppressed):
        </span>

        {entries.length === 0 ? (
          <span style={{ color: "#30363d" }} className="text-xs">
            No suppressed emails yet — trigger a duplicate alert to see this.
          </span>
        ) : (
          <div className="flex gap-3 overflow-x-auto">
            {[...entries].reverse().map((e, i) => (
              <button
                key={i}
                onClick={() => toggle(e)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  backgroundColor:
                    selected?.ticket_id === e.ticket_id && selected?.timestamp === e.timestamp
                      ? "rgba(88,166,255,0.1)"
                      : "transparent",
                }}
                className="animate-fade-in shrink-0"
              >
                <span style={{ color: "#484f58", whiteSpace: "nowrap" }} className="text-xs line-through">
                  [{e.timestamp}] {e.ticket_id} — {e.preview}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
