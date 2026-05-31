# Skill Sheet: LIST_MEMBERS

```yaml
id: S-DISC-12
version: 1.0.0
category: System
name: LIST_MEMBERS
status: ACTIVE
description: "List all members on the server."
paramSpec: '{}'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: list, see, show, get, members, users, people
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Perform pre-fetching of guild members.
- Format as detailed markdown list with primary roles.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "LIST_MEMBERS",
  "params": {}
}
```
