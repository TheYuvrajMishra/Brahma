# Buddhi: The Strategic Planner

```yaml
id: BUDDHI
version: 1.0.0
last_sync: 2026-05-30T23:57:42+05:30
strategy_mode: HIGH_EFFICIENCY
orchestration_cycle: ACTIVE
agent_permission: READ-WRITE
description: "Orchestration, routing logic, decision analysis, and task allocation matrix."
```

---

## 1. Strategy & Risk Assessment Board

Buddhi analyzes the active mission in `Dharma.md` and defines the core technical approach, identifies potential blockers, and schedules execution routes.

| Target Sub-Task ID | Strategy Route | Associated Risks | Mitigation Policy | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **M-001-03** | Use highly standardized markdown formats with frontmatter. | Overcomplicating layout, leading to parser failure. | Keep layouts uniform across files; test structure before completion. | **CRITICAL** |
| **M-001-04** | Log actions under Karma sequentially, keeping entries concise. | Action logs growing infinitely, exhausting token window. | Set strict log trimming protocols and delegate archiving to Zehn. | **HIGH** |
| **M-001-05** | Standardize skills using metadata indices and discrete trigger rules. | Inconsistent user skill files making registry parsing slow. | Provide a strict Markdown template with YAML metadata headers. | **MEDIUM** |
| **M-001-06** | Structure Zehn around an Entity Index and a Chronological Session Map. | Context drift; agents retrieving outdated terms. | Implement clean timestamp indexing and force deprecation tags. | **CRITICAL** |
| **M-001-07** | Set up reflection tables matching completed missions to learned tips. | Chintan generating vague, non-actionable suggestions. | Enforce "Actionable Optimization Tickets" format. | **MEDIUM** |

---

## 2. Orchestration & Skill Routing Table

Defines which skill, tool, or system agent is mapped to each active task to execute it efficiently.

| Sub-Task ID | Primary Executor / Agent | Required Skill Set (Hunar) | Operational Constraints | Target Outputs |
| :--- | :--- | :--- | :--- | :--- |
| **M-001-03** | System Architect | Markdown Architect (`S-001`) | Maximum detail; keep visual standards. | Premium `Buddhi.md` document. |
| **M-001-04** | Execution Agent | System Integrator (`S-002`) | Log actions; omit bulky raw console dumps. | Premium `Karma.md` trace log. |
| **M-001-05** | Skill Registrary Agent | Skill Compiler (`S-003`) | Build schema and register directories. | Premium `Hunar.md` & template. |
| **M-001-06** | Memory Agent | Database Manager (`S-004`) | Index all created resources token-efficiently. | Premium `Zehn.md` context index. |
| **M-001-07** | Reflective Analyst | Auditing Engineer (`S-005`) | Contrast action logs against Atman constraints. | Premium `Chintan.md` loops. |

---

## 3. Cognitive Decision Ledger
*Tracks major design trade-offs made during planning to maintain intellectual continuity.*

| Decision ID | Context / Problem | Evaluated Alternatives | Selected Path & Rationale |
| :--- | :--- | :--- | :--- |
| **D-001** | Selection of structured data representation inside Markdown. | 1. Pure JSON blocks.<br>2. Frontmatter YAML blocks.<br>3. HTML tables. | **Frontmatter YAML + Markdown Tables**. Offers standard parsing compatibility for agent scripts while maintaining 100% human-readable visual aesthetic in markdown previews. |

---

## 4. Agent Protocol (Self-Update Instructions)

### When to update this file:
- **Strategy Refinement**: Before executing any new sub-task, analyze its parameters and log the strategic path and risks in the **Strategy & Risk Assessment Board**.
- **Orchestration**: Assign appropriate capability identifiers to the **Orchestration & Skill Routing Table**.
- **Decision Capture**: When a major engineering decision or trade-off is made, document it in the **Cognitive Decision Ledger** using the `D-XXX` increment system.

### Safe Edit Guidelines:
1. **Consistency**: Ensure all Sub-Task IDs match `Dharma.md` exactly.
2. **Precision**: Keep strategies focused on execution and implementation logic. Avoid descriptive conversational fillers.
3. **Traceability**: All strategy rows must map to a corresponding risk and mitigation plan.
