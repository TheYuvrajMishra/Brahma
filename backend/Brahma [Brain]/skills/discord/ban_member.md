# Skill Sheet: BAN_MEMBER

```yaml
id: S-DISC-08
version: 1.0.0
category: System
name: BAN_MEMBER
status: ACTIVE
description: "Ban a member from the server."
paramSpec: '{ "usernameOrId": "string", "reason": "string" (optional) }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: ban, blacklist, block, user, member
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Prevent banning server owner or self-ban.
- Provide default reason if omitted by operator.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "BAN_MEMBER",
  "params": { "usernameOrId": "string", "reason": "string" (optional) }
}
```
