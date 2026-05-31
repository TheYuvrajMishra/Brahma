# Skill Sheet: DECOMPOSE_MISSION

```yaml
id: S-BRAH-02
version: 1.0.0
category: Orchestrator
name: DECOMPOSE_MISSION
status: ACTIVE
description: "Strategic decompose of a goal into a mission sub-tasks checklist."
paramSpec: '{ "title": "string", "objective": "string" }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: decompose, plan, strategize, mission, goal, task
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Retrieve relevant RAG contexts for scoping first.
- Return strict structured sub-task list in Dharma.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "DECOMPOSE_MISSION",
  "params": { "title": "string", "objective": "string" }
}
```
