import streamlit as st
import time
from orchestrator.agent import sentinai_executor, state

# --- UI CONFIGURATION ---
st.set_page_config(page_title="SentinAI Orchestrator", layout="wide")

st.title("🛡️ SentinAI: AIOps Incident Command")
st.markdown("---")

# --- SIDEBAR: SIMULATION CONTROLS ---
with st.sidebar:
    st.header("🛠️ Simulation Center")
    st.info("Trigger anomalies to test the state-aware logic.")
    
    alert_id = st.text_input("Alert ID", value="SRV-BOSTON-001")
    alert_msg = st.text_area("Anomaly Details", value="High CPU usage detected on Node 4 (98%).")
    
    if st.button("🚀 Trigger Anomaly"):
        with st.spinner("SentinAI is analyzing..."):
            # The Magic: Calling your LangChain Agent
            response = sentinai_executor.invoke({"input": f"ID: {alert_id}, Log: {alert_msg}"})
            st.success("Analysis Complete")
            st.session_state.last_log = response["output"]

# --- MAIN DASHBOARD ---
col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("📬 Incoming Signals (Observe)")
    if "last_log" in st.session_state:
        st.code(st.session_state.last_log, language="text")
    else:
        st.write("Waiting for incoming telemetry...")

with col2:
    st.subheader("🎫 ServiceNow State (Act)")
    if not state.db:
        st.warning("No active tickets.")
    else:
        for aid, ticket in state.db.items():
            with st.expander(f"📌 {ticket['ticket_id']} - {aid}", expanded=True):
                st.write(f"**Status:** {ticket['status']}")
                st.write(f"**Last Updated:** {ticket['created_at']}")
                st.write(f"**Update Count:** {ticket['updates']}")
                st.write("**Worknotes (Internal):**")
                for log in ticket['logs']:
                    st.caption(f"- {log}")

# --- METRIC TRACKING ---
st.markdown("---")
m1, m2, m3 = st.columns(3)
total_updates = sum(t['updates'] for t in state.db.values())
emails_suppressed = max(0, total_updates - len(state.db))

m1.metric("Active Incidents", len(state.db))
m2.metric("Total Logs Processed", total_updates)
m3.metric("Emails Suppressed 🚫", emails_suppressed, delta=f"{emails_suppressed} saved", delta_color="normal")