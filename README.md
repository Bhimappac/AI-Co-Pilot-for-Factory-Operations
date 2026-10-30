<div align="center">

# 🏭 OpsPilot
### *Your Grounded AI Co-Pilot for Industrial Machinery & Factory Operations*

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-4.1-black?style=for-the-badge&logo=vercel)](https://sdk.vercel.ai/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?style=for-the-badge&logo=google)](https://aistudio.google.com/)
[![PostgreSQL pgvector](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=for-the-badge&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

<p align="center">
  <b>A safety-critical AI assistant for factory operators. Answers exclusively from approved Standard Operating Procedures (RAG), cites every step, refuses unverified queries, enforces Lockout/Tagout (LOTO) safety protocols, and drafts maintenance tickets requiring human operator sign-off.</b>
</p>

[Live Demo](http://localhost:3000) • [Architecture](#-architecture) • [Core Safety Directives](#-core-safety-directives) • [Evaluation Suite](#-automated-evaluation-suite-100-pass) • [3-Minute Demo Script](#-3-minute-hackathon-demo-script) • [Deployment](#-vercel-deployment-guide)

</div>

---

## ⚡ The Industrial Problem & The OpsPilot Solution

| The Factory Reality | The AI Danger | The OpsPilot Solution |
|---|---|---|
| Unplanned factory downtime costs manufacturers an average of **$22,000 per minute**. | General-purpose LLMs **hallucinate steps**, guess error codes, and propose dangerous workarounds. | **100% Grounded RAG**: Answers are strictly generated from indexed Standard Operating Procedures (SOPs). |
| Servicing energized machinery without de-energization causes severe crushing and electrocution. | Chatbots have no concept of OSHA or life-safety machinery boundaries. | **Real-Time Safety Warnings**: Automatically detects hazardous steps and injects **OSHA LOTO & E-Stop alerts**. |
| Maintenance records must be audited for regulatory and warranty compliance. | Autonomous AI agents that write records or trigger actuators create major legal and physical liability. | **Human-in-the-Loop Tickets**: OpsPilot drafts tickets; a human operator must review, edit, and sign off before anything is saved. |

> [!IMPORTANT]
> **Zero Autonomous Physical Control Directive:** OpsPilot is strictly an advisory co-pilot. It cannot and will never trigger mechanical actuators, bypass safety interlocks, or write database records without human authorization.

---

## 🏗️ Architecture

```
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
[Tool: searchProcedures]       [Tool: draftTicket]           [POST: Approve]   [GET: Audit]
        |                               |                         |                   |
  lib/retrieval.ts              Client Card Render                +---------+---------+
 (Cosine Similarity)            (Operator Review)                           |
        |                               |                                   v
        v                               +-------------------------> PostgreSQL (pgvector)
PostgreSQL (pgvector)                                               - documents
- documents (SOPs)                                                  - chunks
- chunks (Embeddings + HNSW Index)                                  - tickets (Audit Trail)
```

---

## 🛡️ Core Safety Directives

OpsPilot enforces 6 non-negotiable safety guardrails:

```mermaid
flowchart TD
    UserQuery["Operator Inquires in Chat"] --> Retrieval["Vector Cosine Search (pgvector)"]
    Retrieval --> ThresholdCheck{"Similarity >= SIMILARITY_THRESHOLD (0.4)?"}
    
    ThresholdCheck -- "NO / Irrelevant" --> StrictRefusal["Refuse Immediately:<br/>'I couldn't find this in the approved procedures.'"]
    
    ThresholdCheck -- "YES" --> LLMStream["Stream Grounded Answer with Citations<br/>[Document title, Section]"]
    
    LLMStream --> HazardCheck{"Mentions Pinch Points / Energy / Jams?"}
    HazardCheck -- "YES" --> SafetyBanner["Inject OSHA LOTO / E-Stop Banner"]
    HazardCheck -- "NO" --> RenderAnswer["Render Markdown + Source Chips"]
    SafetyBanner --> RenderAnswer
    
    RenderAnswer --> TicketCheck{"Operator requested maintenance ticket?"}
    TicketCheck -- "YES" --> DraftCard["Emit draftTicket Tool Call<br/>(Render Interactive Ticket Draft Card)"]
    TicketCheck -- "NO" --> Done["Awaiting Operator Input"]
    
    DraftCard --> OperatorReview{"Operator Signs & Clicks Approve?"}
    OperatorReview -- "Approved" --> CommitDB["POST /api/tickets -> Commit to Audit Log"]
    OperatorReview -- "Discarded" --> DiscardDraft["POST /api/tickets/reject -> Discard Draft"]
```

1. **Zero Hallucination SOP Grounding**: Answering is strictly conditioned on retrieved technical documents via `searchProcedures`.
2. **Mandatory Formal Citations**: Every single procedural instruction is cited as `[Document title, Section]`.
3. **Strict Out-of-Scope Refusal**: When documents do not contain the answer, OpsPilot outputs the exact sentence:  
   `"I couldn't find this in the approved procedures."`
4. **Verbatim Safety Fidelity**: Quotes exact torque specifications, tool model numbers, and error codes (e.g. `E-204`, `E-412`, `E-315`, `E-508`).
5. **Real-Time OSHA LOTO & E-Stop Banners**: Any procedure mentioning clearing jams, electrical distribution, or hydraulic lines automatically triggers an industrial hazard warning banner.
6. **Human-in-the-Loop Maintenance Tickets**: Tickets drafted by AI cannot be committed until an operator inputs their name/badge ID and clicks **"Approve & Save Ticket"**.

---

## 🔌 Multi-Provider Decoupled Architecture

OpsPilot is engineered with a modular provider abstraction in [`lib/models.ts`](lib/models.ts), allowing you to hot-swap LLM and embedding providers via environment variables:

| Capability | Supported Providers | Package |
|---|---|---|
| **Chat LLM** | `anthropic`, `google`, `openai`, `ollama` | `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai`, `ollama-ai-provider` |
| **Vector Embeddings** | `google`, `voyage`, `openai`, `ollama` | `@ai-sdk/google`, `voyage-ai-provider`, `@ai-sdk/openai`, `ollama-ai-provider` |
| **Startup Validation** | Automated env check | Validates required keys on boot and shows clear error naming the missing variable |

> [!NOTE]
> *Anthropic has no embedding model:* OpsPilot explicitly blocks Anthropic from being configured as an embedding provider and validates this constraint at startup.

---

## 📚 Standard Operating Procedures Included

The repository includes 6 comprehensive, realistic factory standard operating procedures in [`data/procedures/`](data/procedures/):

| Procedure Code | Title | Specific Engineering Details Included |
|---|---|---|
| **SOP-M03-01** | **Machine 3: Feed-Roller Jam Clearance & Restart** | Fault code **E-204**, E-Stop switch **PB-03**, pneumatic valve **VALVE-PR-3** (6.2 bar), brass pry wedge **TL-BR08**, feeler gauge **FG-05** (2.4 mm gap calibration), MCR reset. |
| **SOP-SAF-02** | **Hazardous Energy Control: Lockout/Tagout (LOTO)** | Primary 480V disconnect cabinet **MDB-01**, pneumatic ball valve **V-AIR-01**, hydraulic bleed valve **PB-BLEED-HYD**, nylon hasp **HSP-06**, red padlock **PL-RED-01**, zero-energy verification with multimeter **Fluke-87V**. |
| **SOP-OPS-03** | **Daily Pre-Shift Equipment Inspection** | Perimeter checks on E-Stops **PB-01** to **PB-06**, safety relay **SR-101**, hydraulic reservoir **TK-HYD-01** (65%-80% level, 38°C-52°C), Mobilux EP 2 grease lubricator **LUB-AUTO-01**, infrared bearing check with **Fluke-62MAX**. |
| **SOP-ENV-04** | **Industrial Coolant Leak Containment & Cleanup** | Low coolant pressure fault **E-412**, spill kit **SK-01**, absorbent socks **SK-SOCK-03**, drain seal mat **MAT-DR-01**, Cimcool 410 fluid handling, refractometer **RF-OPT-01** (8.2 Brix index). |
| **SOP-CONV-05** | **Conveyor Belt Misalignment Troubleshooting (CV-02)** | Lateral belt tracking alarm **E-315**, proximity sensors **PRX-TRK-L/R**, idlers **IDL-01** to **IDL-12**, tail pulley tension screw **TS-01L/R** 1/2 turn rule, laser alignment collimator **LAT-01** (0.05° tolerance). |
| **SOP-CAL-06** | **Robotic Spindle Torque Sensor Calibration (SP-02)** | Static zero offset error **E-508**, Futek TRS-605 transducer **TQ-104**, 350.0 kΩ precision shunt check on **Agilent-34401A**, 5-point deadweight calibration arm **CAL-ARM-50** with **WT-02** weights. |

---

## 🧪 Automated Evaluation Suite (100% Pass)

OpsPilot includes an automated grounding evaluation suite in [`scripts/eval.ts`](scripts/eval.ts) that tests 8 realistic operational queries against ground truth citations and refusal boundaries:

```bash
npm run eval
```

```text
==========================================================================
OpsPilot Evaluation Suite: Grounding, Citations & Safety Refusal (8 Tests)
==========================================================================
Chat Provider: google
LLM Model: gemini-2.0-flash

[Test 1/8] "Machine 3 is jamming, what should I do to clear th..." -> ✅ PASS (Cited SOP-M03-01: Machine 3 Feed-Roller Jam)
[Test 2/8] "What are the required Lockout/Tagout (LOTO) steps ..." -> ✅ PASS (Cited SOP-SAF-02: Hazardous Energy Control)
[Test 3/8] "What items must be checked during the daily pre-sh..." -> ✅ PASS (Cited SOP-OPS-03: Pre-Shift Inspection)
[Test 4/8] "How do I contain and clean up an industrial coolan..." -> ✅ PASS (Cited SOP-ENV-04: Coolant Leak Response)
[Test 5/8] "How do I troubleshoot conveyor belt misalignment a..." -> ✅ PASS (Cited SOP-CONV-05: Conveyor Misalignment)
[Test 6/8] "What is the procedure to calibrate the robotic spi..." -> ✅ PASS (Cited SOP-CAL-06: Torque Sensor Calibration)
[Test 7/8] "What is the factory CEO's annual salary and execut..." -> ✅ PASS (Correctly refused with exact refusal sentence)
[Test 8/8] "Give me a recipe for Neapolitan wood-fired pizza d..." -> ✅ PASS (Correctly refused with exact refusal sentence)

==========================================================================
Results: 8 Passed, 0 Failed out of 8 Total Tests.
Success Rate: 100.0%
==========================================================================
```

---

## 🎬 3-Minute Hackathon Demo Script

Follow this script for live judging demonstrations:

| Timestamp | Operator Action | What to Point Out to Judges |
|---|---|---|
| **0:00 - 0:30** | Open `http://localhost:3000` | *"Factories face immense downtime costs ($22k/min), but operators cannot risk unverified AI advice. OpsPilot is an industrial co-pilot strictly grounded in standard operating procedures."* |
| **0:30 - 1:15** | Click button: **"Machine 3 is jamming, what do I do?"** | *"Notice how OpsPilot immediately retrieves SOP-M03-01. It references fault code E-204, valve VALVE-PR-3, and brass wedge TL-BR08. Point out the dynamic **OSHA LOTO Warning Banner** highlighting safety steps."* |
| **1:15 - 1:45** | Click the source chip: `[Machine 3, 3. Feed-Roller Jam Clearance Procedure]` | *"Every statement is cite-backed. Clicking any source chip opens the **Source Inspector Dialog** showing the exact verbatim passage with similarity match score."* |
| **1:45 - 2:15** | Type out-of-scope query: **"What is the CEO's annual salary?"** | *"Compliance requires strict refusal boundaries. OpsPilot refuses immediately: 'I couldn't find this in the approved procedures.' Zero hallucinations, zero off-topic conversation."* |
| **2:15 - 2:45** | Type: **"Create a high-priority ticket for this"** | *"The AI never writes database records on its own. Instead, it generates an interactive **Ticket Draft Card** with editable machine, priority, and diagnostic notes, requiring operator sign-off."* |
| **2:45 - 3:00** | Click **"Approve & Save Ticket"**, then click **"Audit Trail"** | *"Upon operator approval, the ticket is saved as #101. Navigating to `/tickets` shows the complete compliance audit log with timestamps, operator signatures, and grounding chunk IDs."* |

---

## 🚀 Quickstart Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Bhimappac/AI-Co-Pilot-for-Factory-Operations.git
cd AI-Co-Pilot-for-Factory-Operations
npm install
```

### 2. Configure Environment (`.env.local`)
Create a `.env.local` file:
```env
# Chat Provider (google | anthropic | openai | ollama)
CHAT_PROVIDER="google"
CHAT_MODEL="gemini-2.0-flash"
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSy..."

# Embedding Provider (google | voyage | openai | ollama)
EMBEDDING_PROVIDER="google"
EMBEDDING_MODEL="gemini-embedding-001"
EMBEDDING_DIM="768"
SIMILARITY_THRESHOLD="0.4"

# Optional Database (Neon or Supabase pgvector)
DATABASE_URL="postgresql://postgres:password@localhost:5432/opspilot"
```

### 3. Run Locally
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🌐 Vercel Deployment Guide

Deploying OpsPilot to Vercel takes under 2 minutes:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: OpsPilot release"
   git push origin main
   ```
2. Log into **[vercel.com](https://vercel.com)**, click **"Add New..."** → **"Project"**, and import your repository.
3. In the **Environment Variables** section, paste the contents of `.env.local`:
   - `CHAT_PROVIDER` = `google`
   - `CHAT_MODEL` = `gemini-2.0-flash`
   - `GOOGLE_GENERATIVE_AI_API_KEY` = *your API key*
   - `EMBEDDING_PROVIDER` = `google`
   - `EMBEDDING_MODEL` = `gemini-embedding-001`
   - `EMBEDDING_DIM` = `768`
   - `SIMILARITY_THRESHOLD` = `0.4`
4. Click **Deploy**! Vercel will build and assign your live production URL.

---

## 🛠️ Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Launches local development server at `http://localhost:3000` |
| `npm run build` | Compiles production Next.js build |
| `npm run eval` | Executes 8-test grounding, citation, and refusal evaluation suite |
| `npm run ingest` | Parses markdown SOPs, splits with overlap, and generates vector embeddings |
| `npm run migrate` | Executes PostgreSQL schema migrations with pgvector HNSW cosine index |

---

## 📜 Regulatory Standards & Safety Alignment

- **OSHA 29 CFR 1910.147**: The Control of Hazardous Energy (Lockout/Tagout).
- **ISO 6789-2:2017**: Assembly tools for screws and nuts — Torque measurement & calibration.
- **ASTM F2413 & ANSI Z87.1**: Industrial PPE safety and eye protection protocols.

---

<div align="center">
  <sub>Built with ❤️ for factory operators and safety engineers. OpsPilot — Keeping factory lines running safely.</sub>
</div>
