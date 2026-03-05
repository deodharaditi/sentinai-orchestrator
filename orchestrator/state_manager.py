import datetime

class IncidentState:
    def __init__(self):
        # Dictionary to store tickets. Key = Alert ID, Value = Ticket Data
        self.db = {}

    def get_ticket(self, alert_id):
        return self.db.get(alert_id)

    def create_ticket(self, alert_id, summary):
        ticket_id = f"INC-{len(self.db) + 7001}"
        self.db[alert_id] = {
            "ticket_id": ticket_id,
            "status": "In Progress",
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            "updates": 1,
            "logs": [summary]
        }
        return self.db[alert_id]

    def add_worknote(self, alert_id, note):
        if alert_id in self.db:
            self.db[alert_id]["updates"] += 1
            self.db[alert_id]["logs"].append(note)
            return True
        return False