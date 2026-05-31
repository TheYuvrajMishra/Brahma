# Skill Sheet: REMOVE_ROLE

```yaml
id: S-DISC-06
version: 1.0.0
category: System
name: REMOVE_ROLE
status: ACTIVE
description: "Remove a role from a member."
paramSpec: '{ "usernameOrId": "string", "roleNameOrId": "string" }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: remove, strip, take, role, member
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Check if member holds the target role first.
- Gracefully complete if member does not have it.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "REMOVE_ROLE",
  "params": { "usernameOrId": "string", "roleNameOrId": "string" }
}
```
