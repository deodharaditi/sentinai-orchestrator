import { RcaMatch } from "@/app/page";

type Props = { rca: RcaMatch };

export default function RcaPanel({ rca }: Props) {
  return (
    <div
      style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
      className="rounded-lg flex flex-col overflow-hidden shrink-0"
    >
      <div style={{ borderBottom: "1px solid #30363d" }} className="px-4 py-2 flex items-center gap-2">
        <span className="text-xs">🔍</span>
        <span style={{ color: "#8b949e" }} className="text-xs uppercase tracking-wider font-semibold">RCA & Suggested Fix</span>
      </div>

      <div className="p-3">
        {rca ? (
          <div className="flex flex-col gap-2 animate-fade-in">
            <p style={{ color: "#d29922" }} className="text-xs font-semibold">
              Based on past incident {rca.incident_id}
            </p>
            <div>
              <p style={{ color: "#8b949e" }} className="text-xs uppercase tracking-wider mb-1">Root Cause</p>
              <p className="text-xs text-gray-300">{rca.root_cause}</p>
            </div>
            <div>
              <p style={{ color: "#8b949e" }} className="text-xs uppercase tracking-wider mb-1">Recommended Fix</p>
              <code
                style={{ backgroundColor: "#0d1117", border: "1px solid #30363d", color: "#3fb950" }}
                className="block text-xs p-2 rounded font-mono whitespace-pre-wrap"
              >
                {rca.fix}
              </code>
            </div>
          </div>
        ) : (
          <p style={{ color: "#30363d" }} className="text-xs">No RCA match yet.</p>
        )}
      </div>
    </div>
  );
}
