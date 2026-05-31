# Skill Sheet: SEND_MESSAGE

```yaml
id: S-DISC-09
version: 1.0.0
category: System
name: SEND_MESSAGE
status: ACTIVE
description: "Send a message to a text channel."
paramSpec: '{ "channelNameOrId": "string", "content": "string" }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: send, message, post, write, announce
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Verify channel accessibility first.
- Ensure messages do not exceed standard length bounds.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "SEND_MESSAGE",
  "params": { "channelNameOrId": "string", "content": "string" }
}
```
