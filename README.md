# 🛡️ SentinAI: State-Driven Incident Orchestrator

**"Eliminating Alert Fatigue through Intelligent Contextual Management."**

SentinAI is an AIOps orchestration agent built with **LangChain** and **Streamlit**. It solves the "Email Storm" problem in large-scale enterprise monitoring by shifting from repetitive, time-based notifications to a single, state-aware "Source of Truth" in ServiceNow.

---

## 🚀 The Problem: Alert Fatigue
In multinational infrastructures, a single system anomaly often triggers a "notification loop" (e.g., an email every 15 minutes until resolution). This leads to:
* **Operational Noise:** Critical signals are lost in a sea of repetitive emails.
* **Inefficiency:** Multiple engineers may start working on the same issue without a central sync.
* **Fragmented Data:** RCA (Root Cause Analysis) data is scattered across thread replies rather than the ITSM ticket.

## ✨ The Solution: SentinAI
SentinAI acts as an intelligent "Gatekeeper" between your Observation layer (Splunk/Grafana) and your Action layer (ServiceNow).

### Key Features
* **State-Aware Deduplication:** The agent queries the ServiceNow API to check for existing open incidents before acting.
* **Intelligent Suppression:** It triggers exactly **two** emails—one for the initial alert and one for the final resolution.
* **Contextual Worknotes:** All intermediate anomalies and technical logs are automatically summarized by the LLM and appended to the existing ticket worknotes, keeping the inbox clean.
* **Human-Readable Summaries:** Uses LangChain to translate complex JSON error logs into plain-English status updates.

---

## 🛠️ Project Structure
```text
sentinai-orchestrator/
├── app.py                 # Streamlit Dashboard (The Demo UI)
├── orchestrator/
│   ├── agent.py           # LangChain Logic & Tool Definitions
│   └── state_manager.py   # Mock ServiceNow Database Logic
├── requirements.txt       # Dependencies (langchain, streamlit, openai)
├── .env                   # API Keys
└── .gitignore             # Standard Python Ignores
