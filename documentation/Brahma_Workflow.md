# Brahma — Full Development Plan: Elaborated

> This document is an in-depth elaboration of `Brahma_Workflow.md`.
> Every phase is expanded with rationale, component descriptions, data-flow notes, and design intent.

---

## What Is Brahma?

Brahma is a **multi-platform agentic AI runtime**. It is not a chatbot wrapper — it is a structured cognitive pipeline that gives an AI agent:

- A **soul** (fixed identity, values, and personality — `atman.md`)
- **Memory** (ephemeral session state + long-term compressed knowledge)
- **Intent routing** (classify the message before deciding what to do)
- **A planning brain** (decompose complex tasks into steps)
- **An execution engine** (carry out those steps safely and reliably)
- **Modular skills** (pluggable capabilities defined in markdown)
- **Platform adapters** (Discord, WhatsApp, Email, etc.)
- **A response composer** (merge all outputs into a platform-native reply)

The architecture is **deliberately layered** — each component has a single, bounded responsibility with no circular dependencies.

---

## Pipeline at a Glance

```
Incoming Message
      │
      ▼
 [ Adapter ]          ← Platform-specific receiver (Discord, WhatsApp, Email…)
      │
      ▼
 [ Normalizer ]       ← Converts raw message → unified internal schema
      │
      ▼
 [ Observer ]         ← Reads tone, patterns, context; updates moment.md
      │
      ▼
 [ Router ]           ← Classifies intent: greeting / simple / complex
      │
      ├──── Fast Lane ────────────────────────────────────▶ [ Composer ]
      │                                                          │
      └──── Planner Lane ──▶ [ Planner ] ──▶ [ Executor ] ──▶ [ Composer ]
                                                   │
                                           [ Skill / Tool Calls ]
      │
      ▼
 [ Composer ]         ← Injects soul + moment + output into final reply
      │
      ▼
 [ Adapter → Emit ]   ← Sends formatted response to originating platform
```

---

## PHASE 0 — Architectural Freeze

### Goal
Lock the philosophy, runtime contract, and system boundaries **before** any serious coding begins.

### Why This Phase Exists
The biggest risk in building a cognitive runtime is **premature implementation**. If you start writing code before the memory model, pipeline contracts, and terminology are agreed upon, you end up with:
- Components that assume different schemas from each other
- Memory that leaks across boundaries it shouldn't
- Adapters that contain business logic they should never hold

Phase 0 forces all decisions to be written down and frozen.

### Key Decisions To Lock

| Decision | Why It Matters |
|---|---|
| **Markdown schema structure** | `atman.md`, `zehn.md`, `moment.md` must have a consistent, parseable schema from day one — changing it mid-project breaks all readers |
| **Planner output schema** | Downstream executor must know exactly what JSON shape to expect; schema drift breaks execution |
| **Memory write timing** | When is memory updated? After every message? After a session? Deciding this prevents race conditions |
| **Retry semantics** | What counts as a failure? How many retries? Exponential backoff or fixed delay? |
| **Skill loading mechanism** | Are skills loaded on startup, lazily, or hot-reloaded? Affects startup time and memory |
| **Router classification strategy** | Rules-based, LLM-based, or hybrid? Determines latency budget of the router |

### Key Files Defined In This Phase

| File | Role |
|---|---|
| `atman.md` | The Soul — immutable identity, values, communication style |
| `zehn.md` | Long-term memory — compressed facts, user preferences, learned knowledge |
| `moment.md` | Session memory — real-time context, current topic, detected tone |
| `hunar.md` | Skill index — list of all loadable capabilities |
| `planner.md` | Planner prompt + output schema definition |
| `executor.md` | Execution contract — how the executor must behave |

---

## PHASE 1 — Core Runtime Skeleton

### Goal
Build the **minimum executable pipeline** — no intelligence, no memory, just the skeleton that a message can travel through end-to-end.

### Why This Phase Exists
Before any intelligence is layered on, you need a working pipe. This phase proves that a message can flow from ingestion to emission without any stage crashing or bypassing another. Everything built after this phase is plugged *into* this skeleton.

### Components Built

#### Adapter Interface
- Defines the **contract** every platform adapter must implement
- Minimum surface: `receive()` and `emit()`
- Ensures the core pipeline never speaks directly to Discord or WhatsApp APIs

#### Message Normalizer
- Converts each platform's raw event format into a **unified internal message schema**
- Example schema fields: `user_id`, `platform`, `channel_id`, `content`, `timestamp`, `attachments`
- This is what every downstream stage reads — never the raw platform event

#### Pipeline Orchestrator
- The central controller that **invokes stages in order**: `receive → normalize → route → compose → emit`
- Does not contain business logic — it only manages stage sequencing
- Must support both synchronous and async stage execution

#### Logging System
- **Structured logs** (JSON preferred) for every stage transition
- Each log entry includes: `message_id`, `stage`, `timestamp`, `duration_ms`, `status`
- Foundation for all future observability — do not shortcut this

#### Runtime Event Bus
- Internal pub/sub system for stage-to-stage communication
- Allows the Observer to be notified passively without being hardcoded into the orchestrator
- Enables future features like monitoring hooks and telemetry without modifying core stages

#### Config Loader
- Reads environment variables, config files, secrets
- Every stage reads its settings through this — no hardcoded values allowed anywhere

### The Pipeline Functions (Phase 1 Contract)

```text
receive()   → Pull raw message from adapter
normalize() → Convert to internal schema
route()     → Classify intent (stub in Phase 1 — always returns "simple")
compose()   → Build response (stub in Phase 1 — echoes input)
emit()      → Send response via adapter
```

### Output
A working **echo bot** — whatever comes in, the normalized version goes back out. Proves the pipe works before intelligence is added.

---

## PHASE 2 — Soul + Memory System

### Goal
Introduce **persistent cognition** — give Brahma a stable identity and the ability to remember across conversations.

### Why This Phase Exists
Without memory and soul, every conversation starts from zero. The AI has no personality continuity, no knowledge of the user's preferences, and no ability to improve over time. This phase is what separates Brahma from a stateless LLM call.

### Memory Architecture

#### `atman.md` — The Soul (Immutable)
- Contains Brahma's fixed identity: name, values, communication style, what it refuses to do, how it handles edge cases
- **Never modified at runtime** — treated as read-only after process start
- Injected into every LLM call to anchor personality
- Example fields: `name`, `personality_traits`, `communication_style`, `ethical_boundaries`, `language_preferences`

#### `moment.md` — Session Memory (Ephemeral)
- The "working memory" of the current conversation
- Tracks: current topic, user's detected mood, recent turns, active task context
- **Reset at the end of each session** — does not persist between restarts
- Updated by the Observer on every single message

#### `zehn.md` — Long-Term Memory (Persistent + Compressed)
- Accumulated knowledge about the user and context over many sessions
- Examples: user preferences, past decisions, recurring topics, corrections the user has made
- **Written by the Observer**, read by the Planner and Composer
- Must be compressed regularly (see Phase 10) to prevent unbounded growth

### Observer Engine
The Observer runs **on every incoming message** and is responsible for:

| Responsibility | Detail |
|---|---|
| **Tone detection** | Is the user frustrated, happy, curious, terse? Informs how Brahma should respond |
| **Pattern detection** | Does this user always ask about X? Do they prefer bullet points or prose? |
| **Context maintenance** | What is the current topic? Has it shifted? |
| **Session summarization** | At session end, distill the conversation into a compact summary |
| **Long-term memory update** | Write significant new facts or changes to `zehn.md` |

### Memory Write Rules
- `atman.md` → **Never written at runtime**
- `moment.md` → Written after every message, reset at session end
- `zehn.md` → Written by Observer after reflection, not on every message

---

## PHASE 3 — Router Intelligence

### Goal
Create a **reliable, fast intent classifier** that sends each message to the right processing lane.

### Why This Phase Exists
Not every message needs the full planner. "Hi!" should never trigger a multi-step reasoning loop. Routing is the traffic controller that keeps Brahma efficient, fast, and cost-effective.

### The Three Routing Buckets

| Bucket | Examples | Handled By |
|---|---|---|
| **Greeting** | "Hi", "Hello", "What's up?" | Fast Lane (no LLM call, template response) |
| **Simple** | "What's 2+2?", "Who is Einstein?" | Fast Lane (direct LLM call with soul context) |
| **Complex** | "Plan a trip to Tokyo for 5 days", "Write a detailed analysis of X" | Planner Lane |

### Classifier Strategy
**Phase 3 recommendation: Hybrid — rules first, LLM fallback**

```
if message matches greeting patterns → bucket = greeting
else if message is under N tokens AND no tool indicators → bucket = simple
else → ask lightweight LLM classifier with confidence score
  if confidence < threshold → escalate to complex / ask for clarification
```

**Why not full-agent reasoning for routing?**
- Too slow: adds 500ms–2s per message just to decide what to do
- Circular: using the planner to decide if you need the planner is unstable
- Rules + small classifier covers 95%+ of cases with <50ms overhead

### Telemetry
- Every routing decision is logged with: `bucket`, `confidence_score`, `rule_matched`, `latency_ms`
- Used to tune the classifier over time

---

## PHASE 4 — Fast Reply Lane

### Goal
Build an **ultra-low-latency conversational layer** for greetings and simple requests.

### Why This Phase Exists
First impressions matter. If every "Hi!" takes 3 seconds to respond, the product feels broken. The Fast Lane ensures casual conversation feels instant and in-character.

### Components

#### Soul Injection
- `atman.md` is injected into every Fast Lane LLM prompt
- Ensures Brahma never breaks character even for trivial messages

#### Short-Context Generation
- Fast Lane keeps a very short context window (last 3–5 turns from `moment.md`)
- No heavy memory retrieval, no tool calls

#### Personality Consistency System
- A lightweight prompt structure that enforces tone, style, and response length
- Uses `moment.md` to adapt tone: more formal if user seems professional, warmer if user seems casual

### Constraints (Non-Negotiable)
- **No planner** — no step decomposition, no dependency graphs
- **No heavy tool usage** — no web search, no file operations
- **Low latency priority** — target under 800ms end-to-end

---

## PHASE 5 — Planner System

### Goal
Build a **structured, deterministic task decomposition engine** that thinks before acting.

### Why This Phase Exists
Complex tasks — "research competitors and write a report", "book a flight and send confirmation to my team" — cannot be executed in one shot. They need to be broken into discrete, ordered, dependency-aware steps. The Planner is Brahma's "think" step.

### Architecture Philosophy: Think First, Execute Later

```
User Request → Planner (produces plan) → Executor (executes plan)
```

The Planner **never executes**. The Executor **never thinks**. This separation is critical:
- Planner can be retried or revised without side effects
- Executor can be audited, replayed, or sandboxed without touching the reasoning

### Planner Output Schema

The Planner always outputs a **validated JSON array of steps**:

```json
[
  {
    "step": 1,
    "action": "search_web",
    "tool": "web_search",
    "params": { "query": "top AI tools 2026" },
    "depends_on": []
  },
  {
    "step": 2,
    "action": "summarize_results",
    "tool": "llm_call",
    "params": { "prompt_template": "summarize_search" },
    "depends_on": [1]
  },
  {
    "step": 3,
    "action": "write_report",
    "skill": "write-blog",
    "params": { "tone": "professional", "length": "medium" },
    "depends_on": [2]
  }
]
```

### Validation Layer
- All plans must pass schema validation before execution begins
- Invalid plans (missing `step`, circular `depends_on`, unknown tools) are **rejected before the executor ever sees them**
- The planner may be retried up to N times before escalating as an error

### Dependency Graph
- The `depends_on` field enables the executor to identify which steps can run **in parallel**
- Steps with no dependencies or whose dependencies are complete can be parallelized

---

## PHASE 6 — Executor Runtime

### Goal
Build a **reliable, traceable, safe execution engine** that carries out planner-defined steps without improvisation.

### Why This Phase Exists
Execution is where things actually happen — tools are called, APIs are hit, files are written. This needs to be robust, observable, and strictly bounded. The executor must never add steps the planner didn't define or skip steps due to assumptions.

### Execution Modes

#### Sequential Executor
- Runs steps one by one in `step` order
- Used when all steps have dependencies on previous steps

#### Parallel Executor
- Identifies steps that have satisfied dependencies and no unresolved `depends_on`
- Runs eligible steps concurrently using async workers
- Reduces wall-clock time for independent subtasks

### Reliability Features

| Feature | Purpose |
|---|---|
| **Retry System** | On tool failure, retry N times with backoff before marking step as failed |
| **Timeout Handling** | Each step has a max allowed duration; exceeded steps are killed and marked failed |
| **Error Propagation** | Failed step marks dependent steps as skipped; error surfaces to composer |
| **Execution Tracing** | Every step logs: start_time, end_time, status, tool_called, output_hash |

### Executor Rules (Hard Constraints)
- **Execute the plan only** — no adding, removing, or reordering steps
- **No improvisation** — if a step fails, do not try an alternative approach; report the failure
- **Never mutate planner output** — the plan is read-only; executor writes to a separate execution log

---

## PHASE 7 — Hunar Skill System

### Goal
Create a **modular, hot-loadable capability system** where skills are defined as markdown files.

### Why This Phase Exists
Not all of Brahma's capabilities need to be hardcoded in the core. Skills are pluggable — they define *what* to do (prompt template, output format, config) without knowing *when* to do it. This keeps the core clean and makes Brahma extensible without core changes.

### How Skills Work

1. `hunar.md` is the **skill index** — it lists all available skills by name
2. The **skill loader** reads `hunar.md` at startup (or on demand) and registers each skill
3. The **skill registry** maps skill names → skill definitions
4. When the executor calls a skill, the **parameter injection** layer fills in the template variables
5. The **prompt-template engine** produces the final LLM prompt from the skill definition

### Skill Definition (Conceptual Schema)

```markdown
# skill: write-email

## Description
Writes a professional email based on provided context.

## Prompt Template
You are writing an email on behalf of {{sender_name}}.
Recipient: {{recipient}}
Subject: {{subject}}
Tone: {{tone}}
Key points: {{key_points}}

## Output Format
Plain text email body, no subject line included.

## Config
max_tokens: 500
temperature: 0.7
```

### Built-in Skill Types (Phase 7 Baseline)

| Skill | Description |
|---|---|
| `write-email` | Drafts professional emails |
| `write-blog` | Produces structured blog posts |
| `summarize` | Condenses long content into key points |
| `discord-reply` | Formats a response for Discord markdown |
| `whatsapp-message` | Produces WhatsApp-appropriate plain text |

### Architecture Rule
Skills define **prompts, formatting, and configs**. They do NOT define when they run, how steps are ordered, or what tools to call. That is the Planner and Executor's job.

---

## PHASE 8 — Response Composer

### Goal
Merge all pipeline outputs — soul, session memory, executor results — into a **single, platform-native response**.

### Why This Phase Exists
Every lane (fast or planner) eventually converges at the Composer. This is the final intelligence layer before emission. It ensures that:
- Brahma's personality is preserved in every response
- The format matches the target platform
- Executor artifacts (raw tool outputs) are translated into human-readable prose

### Inputs to the Composer

| Input | Source | Purpose |
|---|---|---|
| `atman.md` | Soul loader | Personality anchoring |
| `moment.md` | Observer | Tone adaptation (formal vs casual) |
| Executor output | Executor | The raw results of task execution |
| Skill output | Skill engine | Pre-formatted content if a skill was used |

### Composer Output

The Composer produces a **platform-specific formatted response**:

| Platform | Format |
|---|---|
| Discord | Markdown with embeds, code blocks, mentions |
| WhatsApp | Plain text, emojis allowed, no markdown |
| Email | HTML or plaintext with subject line |
| Playground UI | Rich HTML with interactive elements |

### Key Rule
**Planner artifacts are never exposed to the user.** The raw JSON plan, step logs, and intermediate results are internal. The Composer's job is to translate them into natural language.

---

## PHASE 9 — Adapter Expansion

### Goal
Deploy Brahma across **multiple platforms** by adding adapters without touching core logic.

### Why This Phase Exists
Brahma's adapter abstraction (defined in Phase 1) is only valuable if it's actually used across platforms. Phase 9 realizes the "plug and play" promise: each new platform is just one new adapter file.

### Adapter Contract (Enforced Since Phase 1)

Every adapter must implement:
- `receive(raw_event) → NormalizedMessage` — convert platform event to internal schema
- `emit(normalized_response) → platform_call` — convert internal response to platform API call

### Platform Adapters

| Platform | Notes |
|---|---|
| **Discord** | Uses Discord.js; handles slash commands, DMs, server messages |
| **WhatsApp** | Uses WhatsApp Business API or Twilio; handles text, media |
| **Email** | SMTP/IMAP integration; handles inbound parsing + outbound sending |
| **Playground UI** | Internal browser-based chat interface for testing |

### Hard Rule
Adding a new platform **must require zero changes** to the pipeline orchestrator, planner, executor, or composer. The adapter is the only new file.

---

## PHASE 10 — Memory Compression + Reflection

### Goal
Ensure **long-term cognition quality** by preventing memory bloat, duplication, and degradation.

### Why This Phase Exists
Without active compression, `zehn.md` grows unboundedly. After months of use, it becomes:
- Too large to fit in LLM context windows
- Full of contradictions (user said X in March, Y in May)
- Polluted with redundant facts

Phase 10 is the **maintenance engine** that keeps memory healthy.

### Components

#### Summarization Engine
- Periodically reads `zehn.md` and produces a compressed version
- Preserves key facts, discards verbose notes

#### Memory Pruning
- Removes facts that are older than a threshold AND haven't been referenced recently
- Implements importance scoring: high-importance facts are never pruned

#### Contradiction Detection
- Scans `zehn.md` for conflicting statements
- Example: "User prefers dark mode" + "User set light mode as default" → flag for resolution
- Resolved by recency or explicit user correction

#### Importance Scoring
- Every memory entry has an importance score (0.0 – 1.0)
- Score increases if fact is referenced frequently
- Score decreases over time unless reinforced

#### Reflection Cycles
- Periodic LLM-driven reflection: "Given everything we know about this user, what are the most important things to remember?"
- Output becomes the new compressed `zehn.md` section

---

## PHASE 11 — Reliability + Production Hardening

### Goal
Make Brahma **safe, observable, and resilient** in a real production environment.

### Why This Phase Exists
A prototype that works on a developer's machine is not the same as a system that runs 24/7 under real user load with malicious inputs, network failures, and LLM provider outages. Phase 11 closes that gap.

### What Gets Built

#### Observability
- **Structured logging**: every stage, every message, JSON format
- **Distributed tracing**: end-to-end trace IDs so a single message can be followed through all stages
- **Metrics**: message throughput, stage latency histograms, error rates, queue depths

#### Security & Access
- **Auth layer**: API keys, token validation for incoming requests
- **Rate limiting**: per-user, per-platform limits to prevent abuse
- **Sandboxing**: skill and tool execution in isolated environments to prevent side effects
- **Audit logs**: immutable log of all tool calls and memory writes

#### Resilience
- **Queueing**: message queue (e.g., Redis/BullMQ) between adapter and pipeline so spikes don't drop messages
- **Crash recovery**: if the process restarts, in-flight messages are re-queued, not lost
- **Health endpoints**: `/health`, `/ready` endpoints for load balancers and monitoring
- **Execution replay**: ability to re-run a past message through the pipeline for debugging

---

## PHASE 12 — Advanced Agentic Features

### Goal
Evolve Brahma from a **reactive assistant** into a **proactive, self-improving agent**.

### Why This Phase Exists
Phases 0–11 build a reliable, personality-consistent assistant. Phase 12 pushes into genuine agency — the ability to act autonomously, self-critique, and learn new capabilities.

### Planned Features

| Feature | Description |
|---|---|
| **Self-reflection loops** | After completing a task, Brahma evaluates its own output: "Was this the best response?" |
| **Autonomous task continuation** | Brahma can continue multi-step tasks across sessions without re-prompting |
| **Memory-weighted planning** | Planner uses `zehn.md` to bias toward approaches that have worked before for this user |
| **Internal critique stage** | Before emitting a response, a critique LLM call checks for quality, tone, and accuracy |
| **Skill generation** | Brahma can draft new `hunar.md` skill definitions based on recurring task patterns |
| **Adaptive routing** | Router learns from misclassification telemetry and adjusts confidence thresholds |
| **Collaborative multi-agent execution** | Multiple Brahma instances can coordinate on sub-tasks |
| **Tool-learning layer** | Brahma can learn to use new tools from documentation without code changes |

### Guard Rails (Non-Negotiable)
- **Autonomy must remain controllable** — every autonomous action is logged and reversible
- **Recursive loops must terminate** — self-reflection and critique cannot enter infinite regress
- **Memory must not drift personality** — learning new facts cannot override `atman.md`

---

## RECOMMENDED BUILD ORDER

```
Wave 1 — Foundation
  Phase 0 → Freeze architecture
  Phase 1 → Build the pipe
  Phase 2 → Add soul + memory
  Phase 3 → Add routing
  Phase 4 → Fast lane works

Wave 2 — Intelligence
  Phase 5 → Planner
  Phase 6 → Executor
  Phase 7 → Skills
  Phase 8 → Composer

Wave 3 — Scale
  Phase 9 → More platforms
  Phase 10 → Memory health
  Phase 11 → Production grade

Wave 4 — Agency
  Phase 12 → True autonomy
```

**Why this order?**
Each wave only introduces new complexity *on top of a verified foundation*. You never build intelligence on an untested pipe. You never scale a system that hasn't been made reliable first.

---

## CRITICAL ENGINEERING RULES — Explained

| Rule | Statement | Why |
|---|---|---|
| **1** | Adapters are transport only | Business logic in adapters means you can't swap platforms without rewriting features. Pure transport keeps core portable. |
| **2** | Planner produces structure, not prose | If the planner outputs freeform text, the executor can't parse it reliably. JSON schema enforces machine-readable contracts. |
| **3** | Executor never improvises | An executor that "fills in gaps" is unpredictable. Every deviation from the plan is a bug waiting to happen. |
| **4** | Soul is immutable during runtime | Personality drift is catastrophic for user trust. `atman.md` is a constant, not a variable. |
| **5** | Memory must compress continuously | Unbounded memory growth will eventually break context windows and degrade output quality. |
| **6** | Skills are modular and stateless | Stateful skills create hidden dependencies. Stateless skills can be tested, swapped, and parallelized freely. |
| **7** | All branches converge before emit | Both fast lane and planner lane must pass through the Composer. Nothing bypasses final personality and format injection. |
| **8** | Every message passes Observer | Observer is the always-on context tracker. Skipping it — even for fast replies — breaks memory continuity. |

---

## MVP Definition — What "Done" Looks Like for v1

Brahma v1 is **complete** when all of the following are true:

| Requirement | What It Proves |
|---|---|
| ✅ Discord adapter works | End-to-end pipeline is functional on a real platform |
| ✅ Fast lane works | Low-latency conversational responses with personality |
| ✅ Planner lane works | Complex multi-step tasks decompose and execute correctly |
| ✅ Skill system works | At least 3 skills load, execute, and produce correct output |
| ✅ Persistent memory works | `zehn.md` survives restarts and influences future responses |
| ✅ Soul consistency exists | Personality is identical across cold starts and long conversations |
| ✅ Multi-step tasks execute reliably | No silent failures; errors surface cleanly |
| ✅ Adding a new platform requires only one adapter file | Architecture contract is actually upheld in practice |

---

*Elaborated from `Brahma_Workflow.md` — June 2026*
