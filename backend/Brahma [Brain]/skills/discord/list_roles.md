# Skill Sheet: LIST_ROLES

```yaml
id: S-DISC-11
version: 1.0.0
category: System
name: LIST_ROLES
status: ACTIVE
description: "List all roles on the server."
paramSpec: '{}'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: list, see, show, get, roles, groups, tags
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Order from highest hierarchy down to lowest.
- Cleanly format with colors and membership counts.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "LIST_ROLES",
  "params": {}
}
```
