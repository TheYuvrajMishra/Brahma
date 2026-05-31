# Skill Sheet: KICK_MEMBER

```yaml
id: S-DISC-07
version: 1.0.0
category: System
name: KICK_MEMBER
status: ACTIVE
description: "Kick a member from the server."
paramSpec: '{ "usernameOrId": "string", "reason": "string" (optional) }'
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: kick, boot, throw, user, member
* **Context Conditions**: User queries corresponding operation in natural language.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Description |
| :--- | :---: | :---: | :--- |
| params | `object` | **YES** | Conforming to YAML paramSpec contract. |

---

## 3. High-Density Rules & Directives

- Verify that the bot is allowed to kick this user.
- File an entry in the moderator log trace.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "KICK_MEMBER",
  "params": { "usernameOrId": "string", "reason": "string" (optional) }
}
```
