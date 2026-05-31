# Skill Sheet: DELETE_ROLE

```yaml
id: S-DISC-04
version: 1.0.0
category: System
name: DELETE_ROLE
status: ACTIVE
description: "Delete a role by name or ID."
paramSpec: '{ "identifier": "string" }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: delete, remove, role, group, tag
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Enforce search by either name or unique numeric role ID.
- Prevent deleting administrative system roles.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "DELETE_ROLE",
  "params": { "identifier": "string" }
}
```
