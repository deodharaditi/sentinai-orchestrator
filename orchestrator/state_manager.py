import datetime

KNOWLEDGE_BASE = [
    {
        "incident_id": "INC-4022",
        "root_cause": "Memory leak in Java application server causing CPU starvation",
        "fix": "Restart the application service: `systemctl restart app-server`",
        "keywords": ["cpu", "high", "98", "99", "node", "server", "spike"],
    },
    {
        "incident_id": "INC-3891",
        "root_cause": "Unclosed database connections exhausting memory pool",
        "fix": "Run `db_conn_flush.sh` and recycle the DB connection pool",
        "keywords": ["memory", "ram", "leak", "database", "connection", "pool"],
    },
    {
        "incident_id": "INC-3754",
        "root_cause": "Log rotation misconfigured — /var/log filled to capacity",
        "fix": "Run `logrotate -f /etc/logrotate.conf` and archive old logs",
        "keywords": ["disk", "storage", "space", "log", "full", "capacity"],
    },
    {
        "incident_id": "INC-3612",
        "root_cause": "BGP route flap on primary uplink causing packet loss",
        "fix": "Failover to secondary uplink and raise P1 with ISP for BGP investigation",
        "keywords": ["network", "packet", "loss", "latency", "timeout", "connectivity"],
    },
]


class IncidentState:
    def __init__(self):
        # This acts as our mock ServiceNow database
        self.db = {}
        # Every suppressed email is recorded here for the Ghost Log UI
        self.suppressed_log = []
        # Last RCA lookup result — read by the UI to show a Suggested Fix
        self.last_rca = None

    def get_ticket(self, alert_id):
        return self.db.get(alert_id)

    def create_ticket(self, alert_id, summary):
        ticket_id = f"INC-{len(self.db) + 7001}"
        self.db[alert_id] = {
            "ticket_id": ticket_id,
            "status": "In Progress",
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            "updates": 1,
            "logs": [summary],
            "exec_summary": summary,
        }
        return self.db[alert_id]

    def add_worknote(self, alert_id, note, exec_summary=None):
        if alert_id in self.db:
            # REAL-WORLD LOGIC: Handling Recurrence
            if self.db[alert_id]["status"] == "Resolved":
                self.db[alert_id]["status"] = "Re-opened"
                self.db[alert_id]["logs"].append(f"⚠️ RE-OPENED: {note}")
                return "REOPENED"

            # STANDARD UPDATE: Log without emailing, record suppression
            self.db[alert_id]["updates"] += 1
            self.db[alert_id]["logs"].append(note)
            if exec_summary:
                self.db[alert_id]["exec_summary"] = exec_summary
            self.suppressed_log.append({
                "ticket_id": self.db[alert_id]["ticket_id"],
                "alert_id": alert_id,
                "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
                "preview": note[:80] + ("..." if len(note) > 80 else ""),
            })
            return "UPDATED"
        return "NOT_FOUND"

    def manual_resolve(self, alert_id):
        """Simulates a human engineer fixing the issue via the ServiceNow UI."""
        if alert_id in self.db:
            self.db[alert_id]["status"] = "Resolved"
            self.db[alert_id]["logs"].append("✅ Ticket marked RESOLVED by Human Engineer.")

    def get_history_text(self, alert_id):
        """Returns all worknotes as a numbered string for SITREP context."""
        ticket = self.db.get(alert_id)
        if not ticket:
            return ""
        return "\n".join(
            f"[Update {i + 1}]: {log}" for i, log in enumerate(ticket["logs"])
        )

    def query_knowledge_base(self, alert_text: str) -> dict | None:
        """Fuzzy keyword match against historical incidents."""
        alert_lower = alert_text.lower()
        best_match, best_score = None, 0
        for entry in KNOWLEDGE_BASE:
            score = sum(1 for kw in entry["keywords"] if kw in alert_lower)
            if score > best_score:
                best_score, best_match = score, entry
        result = best_match if best_score > 0 else None
        self.last_rca = result
        return result


# --- CRITICAL: SINGLETON INSTANCE ---
# This ensures the Agent and the UI share the same memory
state = IncidentState()