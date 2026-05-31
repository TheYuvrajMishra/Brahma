# Skill Sheet: EMAIL_SUMMARIZER

```yaml
id: S-025
version: 1.0.0
category: Productivity
name: EMAIL_SUMMARIZER
status: ACTIVE
description: "Summarizes the content of emails"
paramSpec: '{"emailContent": "string"}'
created_on: 2026-05-31T14:13:06.122Z
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: summarize email, email summary, condense email
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Summarizes the content of emails
- Always validate input params before execution.
- Fail fast and return descriptive error on invalid inputs.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "EMAIL_SUMMARIZER",
  "params": {"emailContent": "string"}
}
```
