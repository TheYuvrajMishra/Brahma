# Skill Sheet: DELETE_CHANNEL

```yaml
id: S-DISC-02
version: 1.0.0
category: System
name: DELETE_CHANNEL
status: ACTIVE
description: "Delete a channel by name or ID."
paramSpec: '{ "identifier": "string" }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: delete, remove, destroy, channel, chatroom
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Verify channel existence before deletion.
- Warn or fail gracefully if target is essential.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "DELETE_CHANNEL",
  "params": { "identifier": "string" }
}
```
