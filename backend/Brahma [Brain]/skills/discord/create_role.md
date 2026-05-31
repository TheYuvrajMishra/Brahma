# Skill Sheet: CREATE_ROLE

```yaml
id: S-DISC-03
version: 1.0.0
category: System
name: CREATE_ROLE
status: ACTIVE
description: "Create a new role with custom color."
paramSpec: '{ "name": "string", "color": "string" (hex color, e.g. "#ff0000") }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: create, new, role, group, tag
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Enforce valid hex color codes.
- Ensure role is created at the default position.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "CREATE_ROLE",
  "params": { "name": "string", "color": "string" (hex color, e.g. "#ff0000") }
}
```
