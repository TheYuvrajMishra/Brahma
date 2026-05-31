# Skill Sheet: SOMETHING

```yaml
id: S-026
version: 1.0.0
category: orchestration
name: SOMETHING
status: ACTIVE
description: "does everything"
paramSpec: '{"key": "value"}'
created_on: 2026-05-31T15:50:41.645Z
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: something
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- does everything
- Always validate input params before execution.
- Fail fast and return descriptive error on invalid inputs.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "SOMETHING",
  "params": {"key": "value"}
}
```
