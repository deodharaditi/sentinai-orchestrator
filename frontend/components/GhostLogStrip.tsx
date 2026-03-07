import { SuppressedEntry } from "@/app/page";

type Props = { entries: SuppressedEntry[] };

export default function GhostLogStrip({ entries }: Props) {
  return (
    <div
      style={{ backgroundColor: "#161b22", borderTop: "1px solid #30363d", height: "48px" }}
      className="shrink-0 flex items-center px-4 gap-2 overflow-hidden"
    >
      <span style={{ color: "#8b949e", whiteSpace: "nowrap" }} className="text-xs font-semibold uppercase tracking-wider">
        Ghost Log ({entries.length} suppressed):
      </span>

      {entries.length === 0 ? (
        <span style={{ color: "#30363d" }} className="text-xs">No suppressed emails yet — trigger a duplicate alert to see this.</span>
      ) : (
        <div className="flex gap-4 overflow-x-auto">
          {[...entries].reverse().map((e, i) => (
            <span
              key={i}
              style={{ color: "#8b949e", whiteSpace: "nowrap" }}
              className="text-xs animate-fade-in"
            >
              <span style={{ color: "#30363d" }} className="line-through">
                📧 [{e.timestamp}] {e.ticket_id} — {e.preview}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
