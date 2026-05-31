# Skill Sheet: COMPLETE_TASK

```yaml
id: S-BRAH-04
version: 1.0.0
category: Orchestrator
name: COMPLETE_TASK
status: ACTIVE
description: "Mark a sub-task as completed."
paramSpec: '{ "missionId": "string", "subTaskId": "string" }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: complete, finish, resolve, close, task, sub-task
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Mark task as COMPLETED (100% progress).
- Recalculate parent mission progress cleanly.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "COMPLETE_TASK",
  "params": { "missionId": "string", "subTaskId": "string" }
}
```
