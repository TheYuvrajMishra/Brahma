# Skill Sheet: BRAHMA_CHAT

```yaml
id: S-BRAH-06
version: 1.0.0
category: Orchestrator
name: BRAHMA_CHAT
status: ACTIVE
description: "Default conversational small talk, greetings, personal answers, advice."
paramSpec: '{ "message": "string" }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: chat, talk, discuss, hello, hey, greet
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Answer with conversational warmth and expertise.
- Launch background Chintan reflection silently after responding.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "BRAHMA_CHAT",
  "params": { "message": "string" }
}
```
