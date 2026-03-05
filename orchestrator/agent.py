from dotenv import load_dotenv
load_dotenv()

from langchain_anthropic import ChatAnthropic
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from .state_manager import IncidentState

# Initialize the mock database
state = IncidentState()

@tool
def check_incident_exists(alert_id: str) -> str:
    """Check if there is already an open ServiceNow ticket for this specific Alert ID."""
    ticket = state.get_ticket(alert_id)
    if ticket:
        return f"EXISTS: Ticket {ticket['ticket_id']} is already open."
    return "NONE: No ticket found for this alert ID."

@tool
def create_new_incident(alert_id: str, summary: str) -> str:
    """Create a new ServiceNow ticket. ONLY call this if check_incident_exists returns NONE."""
    new_ticket = state.create_ticket(alert_id, summary)
    return f"CREATED: {new_ticket['ticket_id']}. ACTION: Triggered Initial Email to Team."

@tool
def update_existing_incident(alert_id: str, log_data: str) -> str:
    """Update worknotes of an existing ticket. This action DOES NOT send an email."""
    success = state.add_worknote(alert_id, log_data)
    if success:
        ticket_id = state.get_ticket(alert_id)['ticket_id']
        return f"UPDATED: {ticket_id}. ACTION: Email Suppressed (Redundant notification)."
    return "ERROR: Could not find ticket to update."

# --- Agent Configuration ---
llm = ChatAnthropic(model="claude-sonnet-4-5", temperature=0)
tools = [check_incident_exists, create_new_incident, update_existing_incident]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are SentinAI, an AIOps Orchestrator. Your mission is to minimize email noise. "
               "When an anomaly arrives: "
               "1. Always check if a ticket exists first. "
               "2. If it exists, update it but DO NOT email. "
               "3. If it is new, create it and send exactly ONE email."),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
sentinai_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)