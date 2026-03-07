"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import AlertPanel from "@/components/AlertPanel";
import IncidentBoard from "@/components/IncidentBoard";
import AgentConsole from "@/components/AgentConsole";
import RcaPanel from "@/components/RcaPanel";
import GhostLogStrip from "@/components/GhostLogStrip";

const API = "http://localhost:8000";

export type Ticket = {
  ticket_id: string;
  status: "In Progress" | "Resolved" | "Re-opened";
  created_at: string;
  updates: number;
  logs: string[];
  exec_summary: string;
};

export type SuppressedEntry = {
  ticket_id: string;
  alert_id: string;
  timestamp: string;
  preview: string;
};

export type RcaMatch = {
  incident_id: string;
  root_cause: string;
  fix: string;
} | null;

export default function Dashboard() {
  const [tickets, setTickets] = useState<Record<string, Ticket>>({});
  const [suppressed, setSuppressed] = useState<SuppressedEntry[]>([]);
  const [rca, setRca] = useState<RcaMatch>(null);
  const [agentOutput, setAgentOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const [t, s, r] = await Promise.all([
      fetch(`${API}/api/tickets`).then((x) => x.json()),
      fetch(`${API}/api/suppressed`).then((x) => x.json()),
      fetch(`${API}/api/rca`).then((x) => x.json()),
    ]);
    setTickets(t);
    setSuppressed(s);
    setRca(r);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const fireAlert = async (alertId: string, message: string) => {
    setLoading(true);
    setAgentOutput("");
    try {
      const res = await fetch(`${API}/api/alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId, message }),
      });
      const data = await res.json();
      setAgentOutput(data.output);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const resolveTicket = async (alertId: string) => {
    await fetch(`${API}/api/resolve/${alertId}`, { method: "POST" });
    await refresh();
  };

  const reset = async () => {
    await fetch(`${API}/api/reset`, { method: "POST" });
    setTickets({});
    setSuppressed([]);
    setRca(null);
    setAgentOutput("");
  };

  const totalUpdates = Object.values(tickets).reduce((s, t) => s + t.updates, 0);
  const emailsSent = Object.keys(tickets).length;
  const emailsSuppressed = Math.max(0, totalUpdates - emailsSent);
  const noisePct = totalUpdates > 0 ? Math.round((emailsSuppressed / totalUpdates) * 100) : 0;
  const activeIncidents = Object.values(tickets).filter((t) => t.status !== "Resolved").length;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        activeIncidents={activeIncidents}
        emailsSent={emailsSent}
        emailsSuppressed={emailsSuppressed}
        noisePct={noisePct}
        onFireAlert={fireAlert}
        onReset={reset}
        loading={loading}
      />

      <div className="flex flex-1 overflow-hidden">
        <AlertPanel onFireAlert={fireAlert} loading={loading} />

        <main className="flex flex-1 gap-4 p-4 overflow-hidden">
          <IncidentBoard
            tickets={tickets}
            onResolve={resolveTicket}
          />
          <div className="flex flex-col gap-4 w-80 shrink-0">
            <AgentConsole output={agentOutput} loading={loading} />
            <RcaPanel rca={rca} />
          </div>
        </main>
      </div>

      <GhostLogStrip entries={suppressed} />
    </div>
  );
}
