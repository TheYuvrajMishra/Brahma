# Skill Sheet: ASSIGN_ROLE

```yaml
id: S-DISC-05
version: 1.0.0
category: System
name: ASSIGN_ROLE
status: ACTIVE
description: "Assign a role to a member."
paramSpec: '{ "usernameOrId": "string", "roleNameOrId": "string" }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: assign, give, add, role, group, tag, user, member
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Verify user exists on the target server.
- Verify role exists before assignment.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "ASSIGN_ROLE",
  "params": { "usernameOrId": "string", "roleNameOrId": "string" }
}
```
