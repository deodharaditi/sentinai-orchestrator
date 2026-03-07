"use client";

import { useState } from "react";

type Props = {
  onFireAlert: (alertId: string, message: string) => void;
  loading: boolean;
};

export default function AlertPanel({ onFireAlert, loading }: Props) {
  const [alertId, setAlertId] = useState("SRV-BOSTON-001");
  const [message, setMessage] = useState("High CPU usage detected on Node 4 (98%).");

  return (
    <aside
      style={{ backgroundColor: "#161b22", borderRight: "1px solid #30363d", width: "220px" }}
      className="shrink-0 p-4 flex flex-col gap-4 overflow-y-auto"
    >
      <p style={{ color: "#8b949e" }} className="text-xs uppercase tracking-wider font-semibold">Custom Alert</p>

      <div className="flex flex-col gap-2">
        <label style={{ color: "#8b949e" }} className="text-xs">Alert ID</label>
        <input
          value={alertId}
          onChange={(e) => setAlertId(e.target.value)}
          style={{ backgroundColor: "#0d1117", border: "1px solid #30363d", color: "#e6edf3" }}
          className="rounded px-3 py-2 text-sm w-full outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label style={{ color: "#8b949e" }} className="text-xs">Anomaly Details</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          style={{ backgroundColor: "#0d1117", border: "1px solid #30363d", color: "#e6edf3", resize: "none" }}
          className="rounded px-3 py-2 text-sm w-full outline-none focus:border-blue-500"
        />
      </div>

      <button
        onClick={() => onFireAlert(alertId, message)}
        disabled={loading || !alertId || !message}
        style={{ backgroundColor: "#238636", border: "none" }}
        className="w-full py-2 rounded text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
      >
        {loading ? "Processing..." : "Trigger Alert"}
      </button>
    </aside>
  );
}
