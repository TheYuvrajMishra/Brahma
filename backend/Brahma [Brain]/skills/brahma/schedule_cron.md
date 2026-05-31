# Skill Blueprint: SCHEDULE_CRON

```yaml
id: S-CRON
name: SCHEDULE_CRON
version: 1.0.0
category: System
created_on: 2026-05-31T23:10:00+05:30
last_modified: 2026-05-31T23:10:00+05:30
status: ACTIVE
description: "Schedule a recurring background task or cron job that triggers an AI action automatically based on a standard cron expression. Can self-terminate if durationSec is provided."
paramSpec: '{"name": "string", "cronExpression": "string", "prompt": "string", "durationSec": "number"}'
triggers: "schedule, cron, timer, background, loop, every minute, every day"
```

---

## 1. Activation & Execution Triggers

This section defines when **Buddhi** (Planner) must route tasks to this skill.

* **Keyword Triggers**: `[schedule, timer, recurring, automatically, cron, every day, every 10 seconds]`
* **Context Conditions**: When the user requests a continuous or recurring background operation without manual intervention.

---

## 2. Input / Output Schema Specification

### Input Parameters
| Parameter Name | Data Type | Required | Default Value | Description / Constraint |
| :--- | :---: | :---: | :---: | :--- |
| `name` | `string` | **YES** | - | Name of the job. |
| `cronExpression` | `string` | **YES** | - | Cron expression string (e.g. `*/10 * * * * *`). |
| `prompt` | `string` | **YES** | - | Instruction for the AI when the cron job runs. |
| `durationSec` | `number` | **NO** | - | Max duration in seconds the job should run before expiring. |

### Target Outputs
| Output Name | Data Type | Location / Destination | Success State Criteria |
| :--- | :---: | :--- | :--- |
| `message` | `string` | Discord Chat | Confirmation message that the task was scheduled successfully. |

---

## 3. High-Density Rules & Directives

- **Rule 1**: The AI must translate natural language timing into a valid node-cron expression. **IMPORTANT:** `node-cron` supports 6 fields where the **FIRST** field is seconds `(second minute hour day month dayOfWeek)`. 
  - Examples: 
    - Every 10 seconds = `*/10 * * * * *`
    - Every minute = `0 * * * * *` or `* * * * *`
  - Do NOT append seconds to the end of the expression (e.g., `* * * * * */10` is WRONG).
- **Rule 2**: If the user requests a time limit like "for 1 minute", the AI MUST set the `durationSec` parameter accurately (e.g., `60`).
- **Rule 3**: Do not provide raw coding examples for cron scripts when this tool can natively schedule the task.
