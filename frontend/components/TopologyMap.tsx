"use client";

import { useMemo } from "react";
import ReactFlow, { Node, Edge, Background, Handle, Position, NodeProps } from "reactflow";
import "reactflow/dist/style.css";
import { Ticket } from "@/app/page";

// Which nodes are downstream of each alert ID (blast radius)
const DOWNSTREAM: Record<string, string[]> = {
  "GW-NYC-001":     ["SRV-BOSTON-001", "SRV-BOS-STORM"],
  "SRV-BOSTON-001": ["DB-PROD-002", "FILE-SRV-003"],
  "SRV-BOS-STORM":  ["DB-PROD-002", "FILE-SRV-003"],
};

const NODE_META: Record<string, { label: string; sub: string }> = {
  internet:          { label: "Internet",      sub: "Inbound Traffic" },
  "GW-NYC-001":      { label: "NYC Gateway",   sub: "Primary Uplink" },
  "SRV-BOSTON-001":  { label: "Boston Node 4", sub: "Compute" },
  "SRV-BOS-STORM":   { label: "BOS Cluster",   sub: "SRV-01/02/03" },
  "DB-PROD-002":     { label: "DB Server",     sub: "PostgreSQL" },
  "FILE-SRV-003":    { label: "File Server",   sub: "/var/log" },
};

const BASE_POSITIONS: Record<string, { x: number; y: number }> = {
  internet:          { x: 20,  y: 130 },
  "GW-NYC-001":      { x: 155, y: 130 },
  "SRV-BOSTON-001":  { x: 290, y: 55  },
  "SRV-BOS-STORM":   { x: 290, y: 205 },
  "DB-PROD-002":     { x: 430, y: 15  },
  "FILE-SRV-003":    { x: 430, y: 105 },
};

const STATIC_EDGES: Edge[] = [
  { id: "e-int-gw",    source: "internet",        target: "GW-NYC-001"      },
  { id: "e-gw-bos",    source: "GW-NYC-001",       target: "SRV-BOSTON-001"  },
  { id: "e-gw-storm",  source: "GW-NYC-001",       target: "SRV-BOS-STORM"   },
  { id: "e-bos-db",    source: "SRV-BOSTON-001",   target: "DB-PROD-002"     },
  { id: "e-bos-file",  source: "SRV-BOSTON-001",   target: "FILE-SRV-003"    },
  { id: "e-storm-file",source: "SRV-BOS-STORM",    target: "FILE-SRV-003"    },
];

type NodeStatus = "active" | "resolved" | "at-risk" | "normal";

const STATUS_COLOR: Record<NodeStatus, string> = {
  active:    "#f85149",
  resolved:  "#3fb950",
  "at-risk": "#d29922",
  normal:    "#30363d",
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  active:    "ACTIVE",
  resolved:  "RESOLVED",
  "at-risk": "AT RISK",
  normal:    "",
};

function TopoNode({ data }: NodeProps) {
  const status = (data.status as NodeStatus) ?? "normal";
  const color = STATUS_COLOR[status];
  const meta = NODE_META[data.nodeId as string];

  return (
    <>
      <Handle type="target" position={Position.Left} style={{ background: color, border: "none", width: 6, height: 6 }} />
      <div
        style={{
          backgroundColor: "#161b22",
          border: `1px solid ${color}`,
          borderLeft: `3px solid ${color}`,
          boxShadow: status === "active" ? `0 0 10px ${color}50` : "none",
          minWidth: "88px",
          padding: "5px 8px",
          borderRadius: "4px",
        }}
      >
        <div style={{ color: "#8b949e", fontSize: "8px", fontFamily: "monospace", letterSpacing: "0.02em" }}>
          {data.nodeId as string}
        </div>
        <div style={{ color: "#e6edf3", fontSize: "11px", fontWeight: 600, marginTop: "1px" }}>
          {meta?.label ?? (data.nodeId as string)}
        </div>
        {meta?.sub && (
          <div style={{ color: "#8b949e", fontSize: "9px" }}>{meta.sub}</div>
        )}
        {status !== "normal" && (
          <div style={{ color, fontSize: "8px", marginTop: "3px", fontWeight: 700, letterSpacing: "0.05em" }}>
            {STATUS_LABEL[status]}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: color, border: "none", width: 6, height: 6 }} />
    </>
  );
}

// Must be defined outside component to avoid React Flow re-mount warning
const nodeTypes = { topoNode: TopoNode };

type Props = {
  tickets: Record<string, Ticket>;
};

export default function TopologyMap({ tickets }: Props) {
  const { nodes, edges } = useMemo(() => {
    const statusMap: Record<string, NodeStatus> = {};
    const atRisk = new Set<string>();

    for (const [alertId, ticket] of Object.entries(tickets)) {
      if (ticket.status !== "Resolved") {
        statusMap[alertId] = "active";
        (DOWNSTREAM[alertId] ?? []).forEach((id) => atRisk.add(id));
      } else {
        statusMap[alertId] = "resolved";
      }
    }

    atRisk.forEach((id) => {
      if (!statusMap[id]) statusMap[id] = "at-risk";
    });

    const nodes: Node[] = Object.keys(BASE_POSITIONS).map((id) => ({
      id,
      type: "topoNode",
      position: BASE_POSITIONS[id],
      data: { nodeId: id, status: statusMap[id] ?? "normal" },
      draggable: false,
    }));

    const edges: Edge[] = STATIC_EDGES.map((e) => {
      const srcStatus = statusMap[e.source];
      const isHot = srcStatus === "active";
      return {
        ...e,
        animated: isHot,
        style: {
          stroke: isHot ? "#f85149" : "#30363d",
          strokeWidth: isHot ? 2 : 1,
        },
      };
    });

    return { nodes, edges };
  }, [tickets]);

  const hasActiveIncident = Object.values(tickets).some(
    (t) => t.status !== "Resolved"
  );

  return (
    <div
      style={{ backgroundColor: "#161b22", borderRight: "1px solid #30363d", width: "288px" }}
      className="shrink-0 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div
        style={{ borderBottom: "1px solid #30363d" }}
        className="px-4 py-2 flex items-center gap-2 shrink-0"
      >
        <span style={{ color: "#8b949e" }} className="text-xs uppercase tracking-wider font-semibold">
          Service Topology
        </span>
        {hasActiveIncident && (
          <span
            style={{ color: "#f85149" }}
            className="text-xs ml-auto font-semibold animate-pulse"
          >
            INCIDENT ACTIVE
          </span>
        )}
      </div>

      {/* React Flow canvas */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          style={{ background: "#0d1117" }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1c2128" gap={20} />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div
        style={{ borderTop: "1px solid #30363d" }}
        className="px-3 py-2 flex gap-4 shrink-0"
      >
        {(["active", "at-risk", "resolved"] as NodeStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <span style={{ color: STATUS_COLOR[s], fontSize: "8px" }}>●</span>
            <span style={{ color: "#8b949e", fontSize: "10px", textTransform: "capitalize" }}>
              {s === "at-risk" ? "At Risk" : s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
