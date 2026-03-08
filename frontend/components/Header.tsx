"use client";

import { useState } from "react";

type Props = {
  activeIncidents: number;
  emailsSent: number;
  emailsSuppressed: number;
  noisePct: number;
  onFireAlert: (alertId: string, message: string) => void;
  onReset: () => void;
  loading: boolean;
};

const PRESETS = [
  { label: "CPU Spike — Boston Node 4",    id: "SRV-BOSTON-001", msg: "Critical: CPU at 98% for 5 minutes on Node 4. Threshold: 80%." },
  { label: "Memory Leak — DB Server",       id: "DB-PROD-002",    msg: "Memory utilisation at 91% and climbing. Possible connection pool leak." },
  { label: "Disk Full — File Server",       id: "FILE-SRV-003",   msg: "Disk usage at 98% on /var/log. I/O operations degraded." },
  { label: "Network Timeout — NYC Gateway", id: "GW-NYC-001",     msg: "Packet loss 34% on primary uplink. Latency spikes to 800ms." },
  { label: "Alert Storm (3x Connection Refused)", id: "STORM",    msg: "STORM" },
];

export default function Header({ activeIncidents, emailsSent, emailsSuppressed, noisePct, onFireAlert, onReset, loading }: Props) {
  const [open, setOpen] = useState(false);

  const fire = (preset: typeof PRESETS[0]) => {
    setOpen(false);
    if (preset.id === "STORM") {
      onFireAlert("SRV-BOS-STORM", `Multiple Alerts Detected: [{"id":"SRV-BOS-01","msg":"Connection Refused"},{"id":"SRV-BOS-02","msg":"Connection Refused"},{"id":"SRV-BOS-03","msg":"Connection Refused"}]. Are these related?`);
    } else {
      onFireAlert(preset.id, preset.msg);
    }
  };

  return (
    <header style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }} className="px-6 py-3 flex items-center gap-6 shrink-0">
      <div className="flex items-center gap-2 mr-4">
        <span className="text-lg">🛡️</span>
        <span className="font-bold text-white tracking-tight">SentinAI</span>
        <span style={{ color: "#8b949e" }} className="text-xs font-normal ml-1">Autonomous Incident Response</span>
      </div>

      <div className="flex gap-6 flex-1">
        <Metric label="Active Incidents" value={activeIncidents} valueColor={activeIncidents > 0 ? "#f85149" : "#3fb950"} />
        <Metric label="Emails Sent" value={emailsSent} />
        <Metric label="Suppressed" value={emailsSuppressed} valueColor="#3fb950" />
        <Metric label="Noise Reduction" value={`${noisePct}%`} valueColor="#58a6ff" />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            disabled={loading}
            style={{ backgroundColor: "#f85149", border: "none" }}
            className="px-4 py-2 rounded text-white text-sm font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Processing..." : "Fire Alert ▾"}
          </button>
          {open && (
            <div
              style={{ backgroundColor: "#1c2128", border: "1px solid #30363d", top: "calc(100% + 6px)", right: 0, zIndex: 50 }}
              className="absolute rounded w-72 shadow-xl"
            >
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => fire(p)}
                  style={{ borderBottom: "1px solid #30363d" }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 text-gray-200 last:border-0"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onReset}
          style={{ backgroundColor: "transparent", border: "1px solid #30363d", color: "#8b949e" }}
          className="px-3 py-2 rounded text-sm cursor-pointer hover:border-gray-500"
        >
          Reset
        </button>
      </div>
    </header>
  );
}

function Metric({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div className="flex flex-col">
      <span style={{ color: "#8b949e" }} className="text-xs uppercase tracking-wider">{label}</span>
      <span style={{ color: valueColor ?? "#e6edf3" }} className="text-xl font-bold leading-tight">{value}</span>
    </div>
  );
}
