# Skill Sheet: CREATE_SKILL

```yaml
id: S-024
version: 1.0.0
category: Orchestrator
name: CREATE_SKILL
status: ACTIVE
description: "Create a new named skill, write its markdown sheet to disk, and register it live in Hunar.md."
paramSpec: '{ "name": "string", "description": "string", "category": "string", "paramSpec": "string", "triggers": "string" }'
created_on: 2026-05-31T00:00:00.000Z
```

---

## 1. Activation & Execution Triggers

* **Keyword Triggers**: create skill, new skill, add skill, build capability, make a skill
* **Context Conditions**: User explicitly asks to create, add, or register a new named skill or capability.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter | Data Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `name` | `string` | **YES** | - | Human-readable name of the new skill (e.g. "The Token Efficient"). |
| `description` | `string` | **YES** | - | One-line description of what this skill does. |
| `category` | `string` | NO | `Custom` | Category: `Discord`, `Brahma`, `Orchestrator`, `System`, `Custom`. |
| `paramSpec` | `string` | NO | `{"input":"string"}` | JSON string defining the expected params contract. |
| `triggers` | `string` | NO | `create, skill` | Comma-separated trigger keywords for LLM routing. |

---

## 3. High-Density Rules & Directives

- Always derive a unique `S-XXX` ID from the current max in `Hunar.md` — never hardcode.
- Convert the skill name to `SCREAMING_SNAKE_CASE` for the action identifier.
- Write the skill sheet to `skills/brahma/` and register it in `Hunar.md` atomically.
- Hot-reload `loadSkillsFromDisk()` immediately so the skill is live without restart.
- If the file already exists, throw — never silently overwrite an existing skill.

---

## 4. Execution Patterns (Examples)

Standard payload invocation:
```json
{
  "action": "CREATE_SKILL",
  "params": {
    "name": "The Token Efficient",
    "description": "Suppress filler words; enforce ultra-concise, high-density responses.",
    "category": "Custom",
    "paramSpec": "{\"input\":\"string\"}",
    "triggers": "token efficient, concise, no filler"
  }
}
```
