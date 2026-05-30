# Karma: The Execution Engine

```yaml
id: KARMA
version: 1.0.0
last_sync: 2026-05-30T23:57:42+05:30
execution_status: IDLE
executed_actions_count: 3
agent_permission: READ-WRITE
description: "Operational execution logs, tool traces, output validations, and archival registers."
```

---

## 1. Live Action Register

This register logs atomic, actionable events executed by agents in real-time. Only recent actions are kept here; older actions are systematically summarized and moved to `memory/`.

| Step ID | Task Ref | Tool/Command Executed | Intended Purpose | Results & Output Summary | Outcome |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **K-001** | `M-001-01` | `write_to_file` on `Atman.md` | Create the identity engine with core attributes and behavioral matrices. | File written successfully; YAML structure validated. | **SUCCESS** |
| **K-002** | `M-001-02` | `write_to_file` on `Dharma.md` | Create the mission planner featuring active task status ledger. | File written successfully; active board structured. | **SUCCESS** |
| **K-003** | `M-001-03` | `write_to_file` on `Buddhi.md` | Create strategic planning mastermind with routing mappings. | File written successfully; risk mitigations mapped. | **SUCCESS** |

---

## 2. Workspace State Sync Tracer

A status tracker that keeps a high-density footprint of workspace structural conditions and build status.

| Check Target | Verification Metric | Current Status | Observation Notes |
| :--- | :--- | :---: | :--- |
| **Directory Struct** | `Brahma [Brain]/` tree validation | **PASS** | Essential files reside cleanly in core root folders. |
| **Linter Compliance**| Markdown style checks | **PASS** | No broken markdown elements, headers, or bad link formats. |
| **Git Status** | Git tracker state | **STABLE** | Local `.git` folder active. Master tracking stable. |

---

## 3. Archival & Compression Protocol

To prevent token exhaustion, `Karma.md` operates on a **sliding log window**. Agents **must** apply these rules:

1. **Threshold**: When the **Live Action Register** reaches **20 entries**, the archive protocol triggers.
2. **Execution**:
   - Create or open the relevant daily file: `memory/YYYY-MM-DD.md`.
   - Compress the 20 entries into a high-density, 3-sentence summary (e.g., *"Completed setup of brain architecture. Initialized core markdown engines. Resolved parser linter issues."*).
   - Write this summary into the daily memory file.
   - Delete the 15 oldest entries from `Karma.md`, leaving only the 5 most recent entries to maintain short-term context.
   - Update `executed_actions_count` in the YAML block.

---

## 4. Agent Protocol (Self-Update Instructions)

### When to update this file:
- **Atomic Operations**: Immediately after running a tool command or modifying a file, append a row to the **Live Action Register** with the next incrementing ID (`K-XXX`).
- **Workspace Changes**: Update the **Workspace State Sync Tracer** if workspace boundaries or builds shift.
- **Log Rollup**: If entries exceed the threshold, run the compression and archiving actions first, then log the rollup action as a single `SUCCESS` entry in the register.

### Safe Edit Guidelines:
1. **No Duplicates**: Ensure step IDs (`K-XXX`) never repeat.
2. **Conciseness**: Keep the `Results & Output Summary` column highly dense (under 15 words) to avoid excessive horizontal wrapping.
3. **Enum Enforcement**: Outcomes are strictly restricted to: `SUCCESS`, `WARNING`, or `FAILED`.
