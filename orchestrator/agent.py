import os
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from langchain_core.messages import HumanMessage
from .state_manager import state

load_dotenv()

llm = ChatAnthropic(model="claude-sonnet-4-5", temperature=0)


def extract_text(content) -> str:
    """Normalise LLM content to a plain string regardless of langchain-anthropic version."""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        return " ".join(
            block.get("text", "") for block in content if isinstance(block, dict)
        ).strip()
    if isinstance(content, dict):
        return content.get("text", str(content)).strip()
    return str(content).strip()


@tool
def check_incident_status(alert_id: str) -> str:
    """Check the current status of a ServiceNow ticket for this Alert ID."""
    ticket = state.get_ticket(alert_id)
    if ticket:
        return f"EXISTS: Ticket {ticket['ticket_id']} is currently {ticket['status']}."
    return "NONE: No ticket found for this alert ID."

@tool
def create_new_incident(alert_id: str, summary: str) -> str:
    """Create a new ServiceNow ticket. ONLY call this if check_incident_status returns NONE."""
    new_ticket = state.create_ticket(alert_id, summary)
    return f"CREATED: {new_ticket['ticket_id']}. ACTION: Triggered Initial Email to Team."

@tool
def process_incident_update(alert_id: str, log_data: str) -> str:
    """
    Updates an existing ticket with an AI-generated SITREP.
    If the ticket was 'Resolved', it triggers a Re-open and an email.
    If the ticket is 'In Progress', it suppresses the email and writes a situation report.
    """
    ticket = state.get_ticket(alert_id)
    if not ticket:
        return "ERROR: Could not find ticket to update."

    if ticket["status"] == "Resolved":
        state.add_worknote(alert_id, log_data)
        return f"ACTION: Re-opened {ticket['ticket_id']}. SENT: Critical Recurrence Email."

    history = state.get_history_text(alert_id)
    sitrep_prompt = (
        f"You are an AIOps analyst writing a ServiceNow worknote.\n"
        f"Ticket: {ticket['ticket_id']} | Update #{ticket['updates'] + 1}\n\n"
        f"Full Alert History:\n{history}\n\n"
        f"New Incoming Alert: {log_data}\n\n"
        f"Write ONE sentence: a situation report (SITREP) summarising the CURRENT state of the incident, "
        f"not just the new alert. Start with 'SITREP Update #{ticket['updates'] + 1}:'"
    )
    sitrep = extract_text(llm.invoke([HumanMessage(content=sitrep_prompt)]).content)

    state.add_worknote(alert_id, log_data, exec_summary=sitrep)
    return f"ACTION: Updated {ticket['ticket_id']} worknotes. EMAIL: Suppressed. SITREP: {sitrep}"


@tool
def request_human_intervention(alert_id: str, reason: str) -> str:
    """
    Escalate to the on-call engineer via high-priority page.
    Use this when a ticket has 3 or more updates with no resolution — automation is not working.
    """
    ticket = state.get_ticket(alert_id)
    if not ticket:
        return "ERROR: No ticket found."
    updates = ticket["updates"]
    if updates >= 3:
        return (
            f"ESCALATED: {ticket['ticket_id']} — High-priority page sent to on-call engineer. "
            f"Reason: {reason}. This incident has had {updates} automated updates with no resolution."
        )
    return f"NOT_ESCALATED: Only {updates} update(s) recorded. Threshold is 3."


@tool
def query_knowledge_base(alert_text: str) -> str:
    """
    Search historical incidents for similar issues and return a suggested fix.
    Always call this when creating a new incident or when an incident has 2+ updates.
    """
    match = state.query_knowledge_base(alert_text)
    if match:
        return (
            f"RCA MATCH — Past Incident: {match['incident_id']} | "
            f"Root Cause: {match['root_cause']} | "
            f"Suggested Fix: {match['fix']}"
        )
    return "NO_MATCH: No similar historical incidents found."


tools = [
    check_incident_status,
    create_new_incident,
    process_incident_update,
    request_human_intervention,
    query_knowledge_base,
]

prompt = ChatPromptTemplate.from_messages([
    ("system",
     "You are SentinAI, an AIOps Orchestrator. Your mission is to eliminate alert fatigue. "
     "Follow this logic strictly:\n"
     "1. Always call check_incident_status first.\n"
     "2. If NONE: call query_knowledge_base, then create_new_incident.\n"
     "3. If EXISTS and In Progress: call process_incident_update (suppresses email, writes SITREP). "
        "If the ticket has 3+ updates, also call request_human_intervention.\n"
     "4. If EXISTS and Resolved: call process_incident_update to re-open.\n"
     "Never send duplicate emails. All intermediate alerts go to worknotes only.\n\n"
     "FINAL RESPONSE: Write a brief incident status report (under 100 words) covering only: "
     "what action was taken, the current ticket status, and what was suppressed or escalated. "
     "Do NOT include root cause, suggested fix, or knowledge base findings — those are shown in a dedicated RCA panel. "
     "Use markdown bold for labels."),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
sentinai_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
