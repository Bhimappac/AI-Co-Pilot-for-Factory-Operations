# OpsPilot: Your AI Co-Pilot for Factory Operations

OpsPilot is a high-reliability, grounded chat assistant built for factory and manufacturing plant operators. It answers operational questions **strictly from approved procedure documents (RAG)**, cites every source, refuses when documents do not cover the question, automatically detects and surfaces critical **Lockout/Tagout (LOTO)** safety protocols, and drafts maintenance tickets that a human operator must review and approve before any record is committed.

**Core Safety Directive:** OpsPilot never executes physical actions, overrides safety circuits, or writes database records autonomously.

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------------+
|                                     FACTORY OPERATOR                                    |
+--------------------------------------------+--------------------------------------------+
                                             |
                                  Next.js App Router (UI)
                      - Chat Interface with AI SDK (useChat)
                      - Real-time LOTO / E-Stop Safety Warning Banner
                      - Clickable Verbatim Source Chips & Passage Modal
                      - Interactive Ticket Draft Card (Human-in-the-Loop)
                      - Maintenance Compliance Audit Trail (/tickets)
                                             |
                        +--------------------+--------------------+
                        |                                         |
                        v                                         v
              [/api/chat (streamText)]                    [/api/tickets]
                        |                                         |
            +-----------+-----------+                    +--------+--------+
            |                       |                    |                 |
            v                       v                    v                 v
   [Tool: searchProcedures]  [Tool: draftTicket]   [POST: Approve]  [GET: Audit Log]
            |                       |                    |                 |
     lib/retrieval.ts        Client Card Render          +--------+--------+
     (Cosine Similarity)     (Operator Review)                    |
            |                       |                             |
            v                       +---------------------------->+
  PostgreSQL + pgvector                                           |
  - documents (Title, Type)                                       v
  - chunks (Vector 768, HNSW Cosine Index)            PostgreSQL Audit Table
  - 6 Standard Operating Procedures (SOPs)            - tickets (Status, Sign-off)
```

---

## Key Features

1. **Strict Procedure-Only Grounding (RAG)**: Answers are generated strictly from indexed Standard Operating Procedures (SOPs).
2. **Mandatory Citations**: Every procedural statement is cited as `[Document title, Section]`.
3. **Exact Refusal on Out-of-Scope Queries**: If a question is not covered by approved plant procedures, OpsPilot responds with the exact sentence: `"I couldn't find this in the approved procedures."` No hallucinations, no guessing.
4. **Automated LOTO & E-Stop Safety Banners**: Detects hazardous mechanical, electrical, and pneumatic steps in real time, displaying high-visibility OSHA LOTO alerts.
5. **Human-in-the-Loop Ticket Approval**: When maintenance is requested, OpsPilot calls the `draftTicket` tool without executing it. The UI renders an editable Ticket Draft Card requiring operator signature and explicit approval before saving.
6. **Immutable Audit Trail (`/tickets`)**: Full compliance logging showing ticket ID, machine, issue, priority, operator sign-off, and grounding chunks.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS with industrial hazard aesthetic + Dark/Light mode
- **AI Engine & Providers**: Configurable via `lib/models.ts` using official Vercel AI SDK provider packages:
  - **Chat Providers**: Anthropic (`@ai-sdk/anthropic`), Google (`@ai-sdk/google`), OpenAI (`@ai-sdk/openai`), Ollama (`ollama-ai-provider`)
  - **Embedding Providers**: Google (`@ai-sdk/google`), Voyage AI (`voyage-ai-provider`), OpenAI (`@ai-sdk/openai`), Ollama (`ollama-ai-provider`)
  - *(Note: Anthropic has no embedding model and is blocked from embedding use).*
- **Database**: PostgreSQL with `pgvector` (compatible with Neon, Supabase, or Docker pgvector)
- **Validation**: Zod schema validation
- **Deployment**: Vercel-ready

---

## Environment Variables

OpsPilot supports multi-provider LLM chat and embeddings configured via `.env.local`:

```bash
# Chat Provider: "anthropic" | "google" | "openai" | "ollama"
CHAT_PROVIDER="anthropic"
CHAT_MODEL="claude-haiku-5-5"
ANTHROPIC_API_KEY="sk-ant-..."

# Embedding Provider: "google" | "voyage" | "openai" | "ollama"
# (Anthropic does not offer embeddings)
EMBEDDING_PROVIDER="google"
EMBEDDING_MODEL="gemini-embedding-001"
EMBEDDING_DIM="768"
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSy..."

# Alternative provider keys (if selected)
OPENAI_API_KEY="sk-..."
VOYAGE_API_KEY="pa-..."
OLLAMA_BASE_URL="http://localhost:11434/api"

# PostgreSQL with pgvector (Neon, Supabase, or local Docker)
DATABASE_URL="postgresql://postgres:password@localhost:5432/opspilot"
SIMILARITY_THRESHOLD="0.4"
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup (Neon or Supabase)
OpsPilot requires PostgreSQL with the `pgvector` extension.
- Create a free serverless PostgreSQL database at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
- Copy the connection string into `DATABASE_URL` in `.env.local`.
- Run the automated schema migration:
```bash
npm run migrate
```
This applies `db/schema.sql`, enables `vector`, sets up `documents`, `chunks` with an HNSW cosine index, and creates the `tickets` table.

### 3. Ingest Approved Factory Procedures
Ingest the 6 realistic plant procedures into PostgreSQL:
```bash
npm run ingest
```
This script reads markdown files from `data/procedures/`, parses `##` headings, chunks sections with overlap, generates vector embeddings with Google Gemini, and inserts them idempotently.

### 4. Run the Quality & Grounding Evaluation Suite
Execute the 8 automated grounding tests (6 answerable, 2 out-of-scope):
```bash
npm run eval
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
opspilot/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # Chat API with streamText, searchProcedures & draftTicket
│   │   ├── tickets/route.ts     # GET /api/tickets (audit) & POST /api/tickets (approved)
│   │   └── tickets/reject/      # POST /api/tickets/reject (discarded)
│   ├── tickets/page.tsx         # /tickets audit trail compliance table
│   ├── globals.css              # Industrial theme & hazard styling
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main chat page
├── components/
│   ├── chat-view.tsx            # Main chat interface with useChat & quick prompts
│   ├── safety-banner.tsx        # Real-time LOTO & emergency stop banner
│   ├── source-chip.tsx          # Clickable procedure citation chip
│   ├── source-inspector-dialog.tsx # Verbatim source passage inspector modal
│   └── ticket-draft-card.tsx    # Interactive human-in-the-loop approval card
├── data/
│   ├── procedures/              # 6 realistic factory SOP markdown documents
│   │   ├── machine-3-feed-roller-jam.md
│   │   ├── lockout-tagout-loto-procedure.md
│   │   ├── daily-preshift-inspection.md
│   │   ├── coolant-leak-response.md
│   │   ├── conveyor-belt-misalignment.md
│   │   └── torque-sensor-calibration.md
├── db/
│   ├── schema.sql               # pgvector schema + HNSW cosine index + tickets table
│   └── migrate.ts               # Migration runner script
├── lib/
│   ├── db.ts                    # PostgreSQL pool connection & fallback
│   ├── models.ts                # Configurable getChatModel() & getEmbeddingModel()
│   ├── retrieval.ts             # Cosine similarity vector search with SIMILARITY_THRESHOLD
│   └── tickets-store.ts         # Ticket persistence & audit storage
├── scripts/
│   ├── ingest.ts                # Markdown heading parser & embedMany vector ingest
│   └── eval.ts                  # 8 test-case grounding & refusal validation suite
└── README.md
```

---

## Vercel Deployment

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your OpsPilot GitHub repository.
4. Under **Environment Variables**, add:
   - `DATABASE_URL` (your Neon or Supabase pgvector connection string)
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `CHAT_MODEL` (`gemini-2.0-flash`)
   - `EMBEDDING_MODEL` (`text-embedding-004`)
   - `EMBEDDING_DIM` (`768`)
   - `SIMILARITY_THRESHOLD` (`0.4`)
5. Click **Deploy**. Vercel will automatically build the Next.js App Router project and deploy it worldwide with serverless streaming.

---

## 3-Minute Live Demo Script

Follow this script during your hackathon demonstration:

| Time | Action | What to Say / Observe |
|------|--------|-----------------------|
| **0:00 - 0:30** | Open `http://localhost:3000` | *"Welcome to OpsPilot. In high-speed factories, operators face machine downtime, complex error codes, and severe safety risks. OpsPilot is an AI co-pilot that answers exclusively from approved plant procedures."* |
| **0:30 - 1:15** | Click suggested button: **"Machine 3 is jamming, what do I do?"** | *"Notice how OpsPilot immediately retrieves SOP-M03-01. It references active fault code E-204, valve VALVE-PR-3, and brass pry wedge TL-BR08. Notice the prominent LOTO Safety Warning Banner that appeared automatically."* |
| **1:15 - 1:45** | Click the source chip: `[Machine 3, 3. Feed-Roller Jam Clearance Procedure]` | *"Every single recommendation is cite-backed. Clicking any source chip opens the verbatim passage inspector with exact matching chunks from the approved SOP."* |
| **1:45 - 2:15** | Type out-of-scope query: **"What is the CEO's annual salary?"** | *"Safety and compliance require strict hallucination boundaries. OpsPilot refuses immediately: 'I couldn't find this in the approved procedures.' It never guesses or offers irrelevant chat."* |
| **2:15 - 2:45** | Type: **"Create a high-priority ticket for this"** | *"OpsPilot never writes records or actuates machinery on its own. Instead, it generates an interactive Ticket Draft Card. The operator can edit the machine, priority, and diagnostic notes, and signs with their badge ID."* |
| **2:45 - 3:00** | Click **"Approve & Save Ticket"**, then click **"View in Audit Trail"** | *"Upon approval, the ticket is saved as #101. Navigating to /tickets reveals the immutable audit trail, complete with timestamp, operator sign-off, and procedure grounding tags."* |
#   O p s P i l o t - Y o u r - A I - C o - P i l o t - f o r - F a c t o r y - O p e r a t i o n s  
 