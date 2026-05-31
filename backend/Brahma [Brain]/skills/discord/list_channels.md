# Skill Sheet: LIST_CHANNELS

```yaml
id: S-DISC-10
version: 1.0.0
category: System
name: LIST_CHANNELS
status: ACTIVE
description: "List all text and voice channels on the server."
paramSpec: '{}'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: list, see, show, get, channels, rooms
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Order results hierarchically by positions/types.
- Handle formatting as detailed lists.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "LIST_CHANNELS",
  "params": {}
}
```
