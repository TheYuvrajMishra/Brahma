# Skill Sheet: SYNC_BRAIN

```yaml
id: S-BRAH-05
version: 1.0.0
category: Orchestrator
name: SYNC_BRAIN
status: ACTIVE
description: "Silently serialize and archive user preferences and history into physical files."
paramSpec: '{}'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: sync, save, commit, archive, backup, brain
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Serialize current memory summaries into Daily Memory log.
- Register new session ID reference inside Zehn index.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "SYNC_BRAIN",
  "params": {}
}
```
