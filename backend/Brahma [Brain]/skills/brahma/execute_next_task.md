# Skill Sheet: EXECUTE_NEXT_TASK

```yaml
id: S-BRAH-03
version: 1.0.0
category: Orchestrator
name: EXECUTE_NEXT_TASK
status: ACTIVE
description: "Activate next pending sub-task for a mission."
paramSpec: '{ "missionId": "string" }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: execute, run, start, begin, activate, next, task
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Locate the next PENDING task chronologically.
- Mark to IN_PROGRESS and log executing tracer under Karma.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "EXECUTE_NEXT_TASK",
  "params": { "missionId": "string" }
}
```
