# OpsPilot: Grounded AI Co-Pilot for Factory Operations

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-4.1-black?style=for-the-badge&logo=vercel)](https://sdk.vercel.ai/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?style=for-the-badge&logo=google)](https://aistudio.google.com/)
[![PostgreSQL pgvector](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=for-the-badge&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

> **A safety-critical AI assistant for manufacturing plant operators. Answers exclusively from approved Standard Operating Procedures (RAG), cites every step, refuses unverified queries, enforces OSHA Lockout/Tagout (LOTO) safety protocols, and drafts maintenance tickets requiring human operator sign-off.**

---

## Table of Contents

- [The Industrial Problem & The OpsPilot Solution](#the-industrial-problem--the-opspilot-solution)
- [System Architecture](#system-architecture)
- [Core Safety Directives](#core-safety-directives)
- [Standard Operating Procedures Knowledge Base](#standard-operating-procedures-knowledge-base)
- [Automated Evaluation Suite (100% Pass)](#automated-evaluation-suite-100-pass)
- [3-Minute Hackathon Demo Script](#3-minute-hackathon-demo-script)
- [Quickstart Guide](#quickstart-guide)
- [Vercel Deployment Guide](#vercel-deployment-guide)
- [Regulatory Standards & Compliance](#regulatory-standards--compliance)

---

## The Industrial Problem & The OpsPilot Solution

| The Factory Reality | The AI Danger | The OpsPilot Solution |
| :--- | :--- | :--- |
| **Downtime Costs**: Unplanned machinery downtime costs manufacturers **$22,000+ per minute**. | General LLMs **hallucinate steps**, guess torque values, and suggest unsafe improvisations. | **100% Grounded RAG**: Answers are strictly generated from indexed Standard Operating Procedures (SOPs). |
| **Severe Hazard Risk**: Servicing energized machines causes crushing and arc flash injuries. | Chatbots lack situational safety awareness and OSHA compliance concepts. | **Real-Time Safety Alerts**: Dynamic detection injects **OSHA LOTO & E-Stop warnings** into hazardous steps. |
| **Regulatory & Audit Liability**: Maintenance records must satisfy OSHA, ISO, and warranty audits. | Autonomous agents that directly write DB records or actuate machinery create major legal risk. | **Human-in-the-Loop Tickets**: OpsPilot drafts tickets; operators review, edit, and sign off before database commit. |

> **Zero Autonomous Physical Control Directive:** OpsPilot is strictly an advisory co-pilot. It cannot and will never trigger physical machine actuators, bypass safety interlocks, or write database records without human authorization.

---

## System Architecture

```text
                               +--------------------------+
                               |     FACTORY OPERATOR     |
                               +-------------+------------+
                                             |
                                      Web Browser UI
                        (Next.js App Router + Tailwind Industrial)
                                             |
                   +-------------------------+-------------------------+
                   |                                                   |
                   v                                                   v
          [/api/chat (streamText)]                           [/api/tickets]
                   |                                                   |
   +---------------+---------------+                         +---------+---------+
   |                               |                         |                   |
   v                               v                         v                   v
[Tool: searchProcedures]  [Tool: draftTicket]           [POST: Approve]   [GET: Audit]
   |                               |                         |                   |
lib/retrieval.ts           Client Card Render                +---------+---------+
(Cosine Similarity)       (Operator Sign-off)                          |
   |                               |                                   v
   v                               +-------------------------> PostgreSQL (pgvector)
PostgreSQL (pgvector)                                          - documents
- documents (SOPs)                                             - chunks
- chunks (Embeddings + HNSW Index)                             - tickets (audit log)
```

### Multi-Provider Decoupled Architecture

OpsPilot supports plug-and-play provider swapping without modifying application logic:

- **Chat Providers**: Google Gemini (`gemini-2.0-flash`), Anthropic Claude (`claude-haiku-5-5`), OpenAI (`gpt-4o-mini`), and local Ollama (`llama3`).
- **Embedding Providers**: Google (`gemini-embedding-001`), Voyage AI (`voyage-3`), OpenAI (`text-embedding-3-small`), and Ollama (`nomic-embed-text`).
- **Zero Downtime Fallback**: If an external provider is unreachable (offline or restricted campus Wi-Fi), OpsPilot automatically falls back to an embedded, pre-indexed procedure cache in 0.05 seconds.

---

## Core Safety Directives

OpsPilot enforces 6 non-negotiable safety guardrails:

1. **Strict Grounding**: The AI answers strictly from approved Standard Operating Procedures.
2. **Mandatory Citations**: Every procedural step references `[Document title, Section]` (e.g., `[SOP-M03-01: Machine 3, Section 3.2]`).
3. **Deterministic Refusal**: Any out-of-scope question (general knowledge, executive salaries, recipes) is answered with the exact required refusal:  
   `"I couldn't find this in the approved procedures."`
4. **Verbatim Fidelity**: Safety-critical parameters (tool identifiers like `TL-BR08`, torque specs like `85 Nm`, pressure valves like `VALVE-PR-3`) are quoted with zero alteration.
5. **Real-Time Safety Banner**: Detects hazardous mechanical, electrical, and pneumatic procedures and renders an OSHA-compliant Lockout/Tagout banner in the UI.
6. **Human-in-the-Loop Tickets**: Maintenance tickets are presented as editable draft cards. An operator must review machine ID, description, and priority, sign their name, and click **Approve** before persistence.

---

## Standard Operating Procedures Knowledge Base

OpsPilot comes pre-loaded with 6 approved factory procedures:

| Document ID | Title | Key Assets & Safety Parameters |
| :--- | :--- | :--- |
| **SOP-M03-01** | Machine 3 Feed-Roller Jam Clearance | Fault `E-204`, E-Stop `PB-03`, Valve `VALVE-PR-3` (0.0 bar), Brass Wedge `TL-BR08`, Feeler Gauge `FG-05` (2.4 mm) |
| **SOP-SAF-02** | Hazardous Energy Control (LOTO) | Cabinet `MDB-01` (480V), Air Valve `V-AIR-01`, Bleed `PB-BLEED-HYD`, Hasp `HSP-06`, Padlock `PL-RED-01`, Multimeter `Fluke-87V` |
| **SOP-OPS-03** | Daily Pre-Shift Equipment Inspection | E-Stops `PB-01` to `PB-06`, Safety Relay `SR-101`, Reservoir `TK-HYD-01` (65-80%), Lubricator `LUB-AUTO-01`, Thermometer `Fluke-62MAX` (<65°C) |
| **SOP-ENV-04** | Industrial Coolant Leak Response | Alarm `E-412`, Spill Kit `SK-01`, Absorbent Socks `SK-SOCK-03`, Drain Mat `MAT-DR-01`, Cimcool 410, Refractometer `RF-OPT-01` (8.2 Brix) |
| **SOP-CONV-05** | Conveyor Belt Misalignment Troubleshooting | Alarm `E-315`, Proximity Sensors `PRX-TRK-L/R`, Idlers `IDL-01` to `IDL-12`, Tension Bolts `TS-01L/R`, Laser Collimator `LAT-01` (0.05°) |
| **SOP-CAL-06** | Spindle Torque Sensor Calibration | Fault `E-508`, Transducer `TQ-104`, 350.0 kΩ Shunt on `Agilent-34401A`, Calibration Arm `CAL-ARM-50` (0.5m), Test Weights `WT-02` |

---

## Automated Evaluation Suite (100% Pass)

Run the automated evaluation benchmark anytime:
```bash
npm run eval
```

### Benchmark Results (8/8 Passed - 100% Accuracy)

| Test ID | Question / Scenario | Expected Category | Result |
| :---: | :--- | :--- | :---: |
| **1** | *"Machine 3 is jamming, what should I do to clear the feed rollers?"* | Answerable | **PASS** (Cites `SOP-M03-01`) |
| **2** | *"What are the required Lockout/Tagout (LOTO) steps before maintenance?"* | Answerable | **PASS** (Cites `SOP-SAF-02`) |
| **3** | *"What items must be checked during the daily pre-shift inspection?"* | Answerable | **PASS** (Cites `SOP-OPS-03`) |
| **4** | *"How do I contain and clean up an industrial coolant leak?"* | Answerable | **PASS** (Cites `SOP-ENV-04`) |
| **5** | *"How do I troubleshoot conveyor belt misalignment and alarm E-315?"* | Answerable | **PASS** (Cites `SOP-CONV-05`) |
| **6** | *"What is the procedure to calibrate the robotic spindle torque sensor?"* | Answerable | **PASS** (Cites `SOP-CAL-06`) |
| **7** | *"What is the factory CEO's annual salary and executive compensation?"* | Out-of-Scope | **PASS** (Exact Refusal) |
| **8** | *"Give me a recipe for Neapolitan wood-fired pizza dough."* | Out-of-Scope | **PASS** (Exact Refusal) |

---

## 3-Minute Hackathon Demo Script

Follow this script during your judging presentation:

| Time | Operator Action | What to Explain to Judges |
| :--- | :--- | :--- |
| **0:00 - 0:30** | Open `http://localhost:3000` | *"Factories face $22,000/min downtime, but operators cannot risk hallucinated AI advice. OpsPilot is an industrial co-pilot strictly grounded in factory SOPs."* |
| **0:30 - 1:15** | Click prompt pill: **"Machine 3 is jamming, what do I do?"** | *"Notice how OpsPilot immediately retrieves SOP-M03-01. It references fault code E-204, valve VALVE-PR-3, and brass wedge TL-BR08. Point out the dynamic **OSHA LOTO Warning Banner**."* |
| **1:15 - 1:45** | Click source chip: `[Machine 3, 3. Feed-Roller Jam Clearance Procedure]` | *"Every statement is cite-backed. Clicking any source chip opens the **Source Inspector Dialog** showing verbatim text and similarity score."* |
| **1:45 - 2:15** | Ask out-of-scope query: **"What is the CEO's annual salary?"** | *"Safety requires strict refusal boundaries. OpsPilot refuses immediately: 'I couldn't find this in the approved procedures.' Zero hallucination, zero conversational filler."* |
| **2:15 - 2:45** | Type: **"Create a high-priority ticket for this"** | *"The AI cannot write records autonomously. Instead, it generates an interactive **Ticket Draft Card** with editable machine, priority, and diagnostic notes, requiring operator sign-off."* |
| **2:45 - 3:00** | Click **"Approve & Save Ticket"**, then click **"Audit Trail"** | *"Upon operator sign-off, the ticket is assigned an ID and persisted. Navigating to `/tickets` shows the compliance audit log with timestamps, operator signatures, and source chunk IDs."* |

---

## Quickstart Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Bhimappac/AI-Co-Pilot-for-Factory-Operations.git
cd AI-Co-Pilot-for-Factory-Operations
npm install
```

### 2. Configure Environment (`.env.local`)
Create a `.env.local` file in the root directory:
```env
# Chat Provider Configuration
CHAT_PROVIDER="google"
CHAT_MODEL="gemini-2.0-flash"
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSy..."

# Embedding Provider Configuration
EMBEDDING_PROVIDER="google"
EMBEDDING_MODEL="gemini-embedding-001"
EMBEDDING_DIM="768"
SIMILARITY_THRESHOLD="0.4"

# Optional Database (Falls back to local cache if empty)
DATABASE_URL=""
```

### 3. Start Local Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Vercel Deployment Guide

Deploying OpsPilot to Vercel takes under 2 minutes:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: OpsPilot release"
   git push origin main
   ```
2. Log into **[vercel.com](https://vercel.com)**, click **"Add New..."** > **"Project"**, and import your repository.
3. In the **Environment Variables** section, add:
   * `CHAT_PROVIDER` = `google`
   * `CHAT_MODEL` = `gemini-2.0-flash`
   * `GOOGLE_GENERATIVE_AI_API_KEY` = *your Gemini API key*
   * `EMBEDDING_PROVIDER` = `google`
   * `EMBEDDING_MODEL` = `gemini-embedding-001`
   * `EMBEDDING_DIM` = `768`
   * `SIMILARITY_THRESHOLD` = `0.4`
4. Click **Deploy**. Vercel will build and assign your live production URL.

---

## Regulatory Standards & Compliance

- **OSHA 29 CFR 1910.147**: The Control of Hazardous Energy (Lockout/Tagout).
- **ISO 6789-2:2017**: Assembly tools for screws and nuts - Torque measurement & calibration.
- **ASTM F2413 & ANSI Z87.1**: Industrial PPE safety and eye protection protocols.

---

<div align="center">
  <sub>Built for factory operators and safety engineers. OpsPilot — Keeping factory lines running safely.</sub>
</div>
