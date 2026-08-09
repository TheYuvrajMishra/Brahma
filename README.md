# 🕉️ Brahma — Multi-Platform Agentic AI Runtime

Brahma is a state-of-the-art **multi-tenant, multi-platform agentic AI runtime** designed to act as a structured cognitive pipeline rather than a simple wrapper. It establishes a robust, sandboxed environment for execution, persistent memory management, planning, intent routing, and real-time self-reflection.

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
                         │
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

## 🧠 Core Cognitive Layer & Multi-Tenancy

Brahma features a **multi-tenant architecture** where every user receives their own isolated cognitive brain instance living at `./backend/brahma [brain]/users/:userId/core/*`:

1. **Atman (The Soul — Persona & Principles)**: Located at `core/atman.md`. Sets Brahma's personality traits, communication guidelines, and ethical boundaries. Primed with the user's preferred interaction style during onboarding.
2. **Zehn (Long-Term Memory — Persistent)**: Located at `core/zehn.md`. Stores user preferences, profile details, project facts, and historical lessons learned from past tasks. Automatically compressed over time.
3. **Moment (Session Context — Ephemeral)**: Located at `core/moment.md`. Holds temporary conversation turns, detected mood, and current topic.
4. **Hunar (Skill Index — Modular)**: Located at `core/hunar.md`. Contains pluggable templates and boundaries for modular capabilities.
5. **Planner, Executor & Researcher Schemas**: Located at `core/planner.md`, `core/executor.md`, `core/researcher.md`.

> 🔒 **Security Guarantee**: There is strict separation between tenant contexts. No user can read or mutate another user's `core/*` folder or chat history.

---

## 🔐 Security & Encrypted Credentials

* **AES-256-GCM Token Encryption**: User Google OAuth tokens (access and refresh tokens) are encrypted at rest in MongoDB using [`CryptoUtils`](file:///H:/Brahma/backend/src/core/CryptoUtils.ts) and are never stored in plaintext on disk or in the database.
* **Signed Session Cookies**: Sessions are authenticated using HTTP-only HMAC-signed session cookies (`brahma_session`) managed via [`SessionUtils`](file:///H:/Brahma/backend/src/core/SessionUtils.ts).
* **Decrypted Workspace Tools**: Google integrations ([`GetEmails`](file:///H:/Brahma/backend/src/skills/GetEmails.ts), [`GoogleSheets`](file:///H:/Brahma/backend/src/skills/GoogleSheets.ts), [`SendEmail`](file:///H:/Brahma/backend/src/skills/SendEmail.ts)) dynamically decrypt per-user tokens in memory via [`GoogleAuthUtils`](file:///H:/Brahma/backend/src/core/GoogleAuthUtils.ts).

---

## 📁 Repository Structure

### 🎛️ Backend: [backend/](file:///H:/Brahma/backend)

Contains the core orchestrator, pipeline stages, memory stores, models, and integration adapters:

*   **Entry Point**: [backend/index.ts](file:///H:/Brahma/backend/index.ts) bootstrap process and cron schedules.
*   **Orchestration & Core Stages**:
    *   [PipelineOrchestrator](file:///H:/Brahma/backend/src/pipeline/Orchestrator.ts): Sequence controller driving the message queue.
    *   [Observer](file:///H:/Brahma/backend/src/pipeline/Observer.ts): Context, tone, and memory logger.
    *   [Router](file:///H:/Brahma/backend/src/pipeline/Router.ts): Rule-based and LLM-fallback intent classifier.
    *   [Researcher](file:///H:/Brahma/backend/src/pipeline/Researcher.ts): Search-and-Consolidate Research Protocol (SCRP).
    *   [Planner](file:///H:/Brahma/backend/src/pipeline/Planner.ts): Decomposes goals into a deterministic DAG/JSON plan.
    *   [Executor](file:///H:/Brahma/backend/src/pipeline/Executor.ts): Executes planned steps, supports step parallelization, retry logic, and timeouts.
    *   [Composer](file:///H:/Brahma/backend/src/pipeline/Composer.ts): Final response generator using context files and adapter targets.
*   **System Core Services & Models**:
    *   [User](file:///H:/Brahma/backend/src/models/User.ts): Multi-tenant user schema with profile details, preferences, and encrypted OAuth tokens.
    *   [ChatSession](file:///H:/Brahma/backend/src/models/ChatSession.ts): User-scoped chat histories.
    *   [SessionContext](file:///H:/Brahma/backend/src/models/SessionContext.ts): User-scoped session moments and personas.
    *   [CryptoUtils](file:///H:/Brahma/backend/src/core/CryptoUtils.ts): AES-256-GCM encryption and decryption.
    *   [SessionUtils](file:///H:/Brahma/backend/src/core/SessionUtils.ts): HMAC-signed session token management.
    *   [GoogleAuthUtils](file:///H:/Brahma/backend/src/core/GoogleAuthUtils.ts): Per-user decrypted OAuth2 client retriever.
    *   [MemoryManager](file:///H:/Brahma/backend/src/core/MemoryManager.ts): Handles per-user brain provisioning and CRUD memory operations.
    *   [ReflectionEngine](file:///H:/Brahma/backend/src/core/ReflectionEngine.ts): Evaluates executor logs and compiles/compresses long-term context per user.
    *   [SkillRegistry](file:///H:/Brahma/backend/src/core/SkillRegistry.ts): Manages hot-loadable capabilities.
    *   [EventBus](file:///H:/Brahma/backend/src/core/EventBus.ts): Internal publish/subscribe event engine.
    *   [HealthServer](file:///H:/Brahma/backend/src/core/HealthServer.ts): Express-based monitoring and telemetry endpoints.
*   **Platform Adapters**:
    *   [Adapter](file:///H:/Brahma/backend/src/adapters/Adapter.ts): Base interface contract.
    *   [PlaygroundAdapter](file:///H:/Brahma/backend/src/adapters/PlaygroundAdapter.ts): Multi-tenant auth endpoints, REST context access, and Socket.io endpoints.
    *   [DiscordAdapter](file:///H:/Brahma/backend/src/adapters/DiscordAdapter.ts): Integration with Discord channels and commands.
    *   [EmailAdapter](file:///H:/Brahma/backend/src/adapters/EmailAdapter.ts): Connects via SMTP/IMAP to read and reply to emails.

---

### 🎨 Frontend: [frontend/](file:///H:/Brahma/frontend)

A premium browser dashboard built using React, Vite, Framer Motion, and Tailwind CSS:

*   **Pages & Screens**:
    *   [AuthScreen.tsx](file:///H:/Brahma/frontend/src/pages/AuthScreen.tsx): Google OAuth login landing matching the sidebar component style.
    *   [OnboardingPage.tsx](file:///H:/Brahma/frontend/src/pages/OnboardingPage.tsx): 5-step onboarding flow collecting profile, contact info (excluding phone numbers), preferences, dislikes, and preferred interaction style (Analytical & Concise, Conversational & Adaptive, Executive Summarizer).
    *   [PlaygroundPage.tsx](file:///H:/Brahma/frontend/src/pages/PlaygroundPage.tsx): Chat interface communicating with Brahma over user-authenticated WebSockets.
    *   [ContextCorePage.tsx](file:///H:/Brahma/frontend/src/pages/ContextCorePage.tsx): View and edit `atman.md`, `zehn.md`, and session context files for the logged-in user.
    *   [AuditTelemetryPage.tsx](file:///H:/Brahma/frontend/src/pages/AuditTelemetryPage.tsx): Real-time event logging, metrics dashboards, and active runs tracing.

---

## 🛠️ Installation & Setup

### Prerequisites

1.  **Node.js** (v18 or higher recommended)
2.  **MongoDB Instance** (Local default: `mongodb://localhost:27017/brahma`)
3.  **Environment Setup**:
    Fill out the `.env` file in `backend/`:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/brahma
    TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key!
    SESSION_SECRET=your_session_secret_key
    GMAIL_CLIENT_ID=your_google_client_id
    GMAIL_CLIENT_SECRET=your_google_client_secret
    GMAIL_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
    ```

### Quick Start

#### 1. Start the Backend Service
```bash
cd backend
npm install
npm run dev
```

#### 2. Start the Frontend Dashboard
```bash
cd ../frontend
npm install
npm run dev
```

Once running:
*   Open the Web Dashboard on [http://localhost:5173](http://localhost:5173).
*   Complete Google OAuth login & onboarding to seed your isolated Brahma brain instance.

---

## 📐 Non-Negotiable System Principles

*   **Multi-Tenant Isolation**: User data, tokens, and brain files are strictly partitioned and inaccessible across tenants.
*   **Immutable Atman Core**: Base soul guidelines are preserved; user interaction modes are layered cleanly via overrides.
*   **Stateless Skills**: Skill modules define logic templates and parameters, receiving context dynamically.
*   **Encrypted Credentials**: Tokens are encrypted at rest with AES-256-GCM.
*   **Continuous Compression**: Long-term memory (`zehn.md`) is automatically summarized and compiled per user.

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
3.  **Scale**: Deploy Email, Discord, and Playground UI connections. Multi-tenant user architecture, encrypted OAuth token storage, dynamic onboarding. (Completed)
4.  **True Agency**: Establish multi-agent coordination pipelines, autonomous action tracking, and self-improving skill creation loops. (Upcoming)

---
*Developed by Yuvraj Mishra - August 2026*
