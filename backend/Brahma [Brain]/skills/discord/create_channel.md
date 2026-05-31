# Skill Sheet: CREATE_CHANNEL

```yaml
id: S-DISC-01
version: 1.0.0
category: System
name: CREATE_CHANNEL
status: ACTIVE
description: "Create a text, voice, or category channel in the server."
paramSpec: '{ "name": "string", "type": "text"|"voice"|"category", "topic": "string" (optional) }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: create, new, channel, category, voice, chatroom
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Always sanitize the channel name to lowercase with hyphens.
- Ensure appropriate channel type defaults to text if not specified.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "CREATE_CHANNEL",
  "params": { "name": "string", "type": "text"|"voice"|"category", "topic": "string" (optional) }
}
```
