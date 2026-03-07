from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from orchestrator.agent import sentinai_executor
from orchestrator.state_manager import state

app = FastAPI(title="SentinAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AlertRequest(BaseModel):
    alert_id: str
    message: str


def sanitize(obj):
    """Recursively convert any Anthropic content block objects to plain strings."""
    if isinstance(obj, str):
        return obj
    if isinstance(obj, (int, float, bool)) or obj is None:
        return obj
    if isinstance(obj, list):
        return [sanitize(item) for item in obj]
    if isinstance(obj, dict):
        if "text" in obj and "type" in obj:
            return obj.get("text", "")
        return {k: sanitize(v) for k, v in obj.items()}
    return str(obj)


@app.post("/api/alert")
def trigger_alert(body: AlertRequest):
    try:
        response = sentinai_executor.invoke({
            "input": f"ID: {body.alert_id}, Log: {body.message}"
        })
        return {"output": sanitize(response["output"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tickets")
def get_tickets():
    return sanitize(dict(state.db))


@app.get("/api/suppressed")
def get_suppressed():
    return sanitize(list(state.suppressed_log))


@app.get("/api/rca")
def get_rca():
    return sanitize(state.last_rca)


@app.post("/api/resolve/{alert_id}")
def resolve_ticket(alert_id: str):
    if alert_id not in state.db:
        raise HTTPException(status_code=404, detail="Ticket not found")
    state.manual_resolve(alert_id)
    return {"status": "resolved"}


@app.post("/api/reset")
def reset_state():
    state.db.clear()
    state.suppressed_log.clear()
    state.last_rca = None
    return {"status": "reset"}
