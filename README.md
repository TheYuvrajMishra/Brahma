# 🕉️ Brahma — Multi-Platform Agentic AI Runtime

Brahma is a state-of-the-art **multi-platform agentic AI runtime** designed to act as a structured cognitive pipeline rather than a simple wrapper. It establishes a robust, sandboxed environment for execution, persistent memory Management, planning, intent routing, and real-time self-reflection.

For the full detailed design documentation, please check the [Brahma_Workflow.md](file:///H:/Brahma/documentation/Brahma_Workflow.md).

---

## 🏗️ Architecture & Pipeline Flow

Brahma uses a clean, decoupled, layered pipeline where each step has a single, bounded responsibility. All stages eventually converge before sending the formatted output back to the user.

```
                  Incoming Message
                         │
                         ▼
                  [ Platform Adapter ]  ← (Discord, Email, Web Playground...)
                         │
                         ▼
                  [ Observer ]          ← Tone detection & context update (`moment.md`)
                         │
                         ▼
                  [ Router ]            ← Intent classification (greeting / simple / complex)
                         │
        ┌────────────────┴────────────────┐
        │ Fast Lane                       │ Planner Lane
        ▼                                 ▼
   [ Composer ]                    [ Researcher ]       ← Context collection via search
        │                                 │
        │                                 ▼
        │                          [ Planner ]          ← Goal decomposition into dependency steps
        │                                 │
        │                                 ▼
        │                          [ Executor ]         ← Safe parallel/sequential tool calls
        │                                 │
        └────────────────┬────────────────┘
                         ▼
                  [ Composer ]          ← Tone adjustment & soul identity injection
                         │
                         ▼
               [ Platform Adapter ]     ← Converts response to platform format (Markdown / Text)
                         │
                         ▼
                   Outgoing Reply
```

---

## 🧠 Core Cognitive Layer

Brahma’s mind is divided into distinct files located in the [Brahma Brain folder](file:///H:/Brahma/backend/brahma%20[brain]/core):

1. **Atman (The Soul — Immutable)**: Located at [atman.md](file:///H:/Brahma/backend/brahma%20[brain]/core/atman.md). Sets Brahma's personality traits, communication guidelines (including English/Hinglish preferences), and ethical boundaries. **It is never updated at runtime**.
2. **Zehn (Long-Term Memory — Persistent)**: Located at [zehn.md](file:///H:/Brahma/backend/brahma%20[brain]/core/zehn.md). Stores user preferences, project facts, and historical lessons learned from past tasks. Compressed over time.
3. **Moment (Session Context — Ephemeral)**: Located at [moment.md](file:///H:/Brahma/backend/brahma%20[brain]/core/moment.md). Holds temporary conversation turns, detected mood, and current topic. Reset at the end of the session.
4. **Hunar (Skill Index — Modular)**: Located at [hunar.md](file:///H:/Brahma/backend/brahma%20[brain]/core/hunar.md). Contains pluggable templates and boundaries for modular capabilities.

---

## 📁 Repository Structure

### 🎛️ Backend: [backend/](file:///H:/Brahma/backend)

Contains the core orchestrator, pipeline stages, memory stores, and integration adapters:

*   **Entry Point**: [backend/index.ts](file:///H:/Brahma/backend/index.ts) bootstrap process and cron schedules.
*   **Orchestration & Core Stages**:
    *   [PipelineOrchestrator](file:///H:/Brahma/backend/src/pipeline/Orchestrator.ts): Sequence controller driving the message queue.
    *   [Observer](file:///H:/Brahma/backend/src/pipeline/Observer.ts): Context, tone, and memory logger.
    *   [Router](file:///H:/Brahma/backend/src/pipeline/Router.ts): Rule-based and LLM-fallback intent classifier.
    *   [Researcher](file:///H:/Brahma/backend/src/pipeline/Researcher.ts): Search-and-Consolidate Research Protocol (SCRP).
    *   [Planner](file:///H:/Brahma/backend/src/pipeline/Planner.ts): Decomposes goals into a deterministic DAG/JSON plan.
    *   [Executor](file:///H:/Brahma/backend/src/pipeline/Executor.ts): Executes planned steps, supports step parallelization, retry logic, and timeouts.
    *   [Composer](file:///H:/Brahma/backend/src/pipeline/Composer.ts): Final response generator using context files and adapter targets.
*   **System Core Services**:
    *   [MemoryManager](file:///H:/Brahma/backend/src/core/MemoryManager.ts): Handles CRUD operations and filters on memory assets.
    *   [ReflectionEngine](file:///H:/Brahma/backend/src/core/ReflectionEngine.ts): Evaluates executor logs and compiles/compresses long-term context.
    *   [SkillRegistry](file:///H:/Brahma/backend/src/core/SkillRegistry.ts): Manages hot-loadable capabilities.
    *   [EventBus](file:///H:/Brahma/backend/src/core/EventBus.ts): Internal publish/subscribe event engine.
    *   [HealthServer](file:///H:/Brahma/backend/src/core/HealthServer.ts): Express-based monitoring and telemetry endpoints.
    *   [Logger](file:///H:/Brahma/backend/src/core/Logger.ts): Structured log implementation.
    *   [ContextStoreManager](file:///H:/Brahma/backend/src/core/ContextStoreManager.ts): Manages runtime data stores.
*   **Platform Adapters**:
    *   [Adapter](file:///H:/Brahma/backend/src/adapters/Adapter.ts): Base interface contract.
    *   [PlaygroundAdapter](file:///H:/Brahma/backend/src/adapters/PlaygroundAdapter.ts): Serves the Socket.io WebSocket playground endpoint.
    *   [DiscordAdapter](file:///H:/Brahma/backend/src/adapters/DiscordAdapter.ts): Integration with Discord channels and commands.
    *   [EmailAdapter](file:///H:/Brahma/backend/src/adapters/EmailAdapter.ts): Connects via SMTP/IMAP to read and reply to emails.
*   **Custom Executable Skills**:
    *   [DiscordCreateChannel](file:///H:/Brahma/backend/src/skills/DiscordCreateChannel.ts) - Automates channel creation in Guilds.
    *   [DiscordReply](file:///H:/Brahma/backend/src/skills/DiscordReply.ts) - Direct message formatting.
    *   [GetEmails](file:///H:/Brahma/backend/src/skills/GetEmails.ts) - Interacts with Gmail inbox.
    *   [GoogleSheets](file:///H:/Brahma/backend/src/skills/GoogleSheets.ts) - Connects and operates Google Spreadsheets.
    *   [LlmCall](file:///H:/Brahma/backend/src/skills/LlmCall.ts) - Raw model invocations.
    *   [SendEmail](file:///H:/Brahma/backend/src/skills/SendEmail.ts) - Dispatches outbound messages.
    *   [SetPersona](file:///H:/Brahma/backend/src/skills/SetPersona.ts) - Sets dynamic overrides for the agent's persona.
    *   [WebSearch](file:///H:/Brahma/backend/src/skills/WebSearch.ts) - Connects search APIs or crawls pages.
    *   [Writers](file:///H:/Brahma/backend/src/skills/Writers.ts) - Output formatting tools.

---

### 🎨 Frontend: [frontend/](file:///H:/Brahma/frontend)

A premium browser dashboard built using React, Vite, Framer Motion, and Tailwind CSS. It is configured to run on the [Vite Configuration File](file:///H:/Brahma/frontend/vite.config.ts).

*   **Entry Points**: [main.tsx](file:///H:/Brahma/frontend/src/main.tsx) and [App.tsx](file:///H:/Brahma/frontend/src/App.tsx)
*   **Pages**:
    *   [PlaygroundPage.tsx](file:///H:/Brahma/frontend/src/pages/PlaygroundPage.tsx): Chat window to interact with Brahma directly over WebSockets.
    *   [ContextCorePage.tsx](file:///H:/Brahma/frontend/src/pages/ContextCorePage.tsx): View and edit `atman.md` (the Soul), `zehn.md` (the memory), and session moments.
    *   [AuditTelemetryPage.tsx](file:///H:/Brahma/frontend/src/pages/AuditTelemetryPage.tsx): Real-time event logging, metrics dashboards, queue size monitoring, and active runs tracing.

---

## 🛠️ Installation & Setup

### Prerequisites

1.  **Node.js** (v18 or higher recommended)
2.  **MongoDB Instance** (Local default: `mongodb://localhost:27017/brahma`)
3.  **Environment Setup**:
    Configure environment files matching the keys defined in [backend/package.json](file:///H:/Brahma/backend/package.json) dependencies:
    *   Fill out the `.env` template inside the `backend/` directory.

### Quick Start

#### 1. Start the Backend Service
```bash
# Navigate to backend directory
cd backend

# Install node dependencies
npm install

# Start the dev server with Hot Reload
npm run dev
```

#### 2. Start the Frontend Dashboard
```bash
# Navigate to frontend directory
cd ../frontend

# Install react dependencies
npm install

# Run the Vite Dev server
npm run dev
```

Once running:
*   Open the Web Dashboard on [http://localhost:5173](http://localhost:5173).
*   The Playground communicates with backend sockets running on port `3005`.

---

## 📐 Non-Negotiable System Principles

*   **Immutable Atman**: The core identity must never be dynamically edited by runtime events.
*   **Stateless Skills**: Skill modules should define logic templates and parameters, not runtime state.
*   **Decoupled Adapters**: Adapters perform transport and normalization only. They contain no cognitive or routing decisions.
*   **Continuous Compression**: The memory system will compile and prune logs automatically to stay within context budgets.

---

## 🗺️ Roadmap & Deployment Progression

```
┌─────────────────────────────────┐
│ Wave 1: Foundation (Phases 0-4) │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ Wave 2: Intelligence (Phases 5-8)│
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ Wave 3: Scale (Phases 9-11)     │
└────────────────┬────────────────┘
                 ▼
┌─────────────────────────────────┐
│ Wave 4: True Agency (Phase 12)  │
└─────────────────────────────────┘
```
1.  **Foundation**: Standardize YAML/Markdown schemas, orchestrate echo pipelines, inject Atman context, implement basic routing. (Completed)
2.  **Intelligence**: Introduce structured `Planner` schemas, sequential/parallel `Executor` threads, core skill integrations, and composition formatting. (Completed)
3.  **Scale**: Deploy Email, Discord, and Playground UI connections. Build cron memory maintenance cycles and log observability hooks. (Current Phase)
4.  **True Agency**: Establish multi-agent coordination pipelines, autonomous action tracking, and self-improving skill creation loops. (Upcoming)

---
*Developed by Yuvraj Mishra - June 2026*
