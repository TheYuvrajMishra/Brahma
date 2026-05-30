# Skill Blueprint: [Skill Name]

```yaml
id: S-XXX
version: 1.0.0
category: "[Coding | Research | System | Custom]"
created_on: 2026-05-30T23:57:42+05:30
last_modified: 2026-05-30T23:57:42+05:30
status: DRAFT
description: "Brief, high-density description of what capability this skill gives Brahma."
```

---

## 1. Activation & Execution Triggers

This section defines when **Buddhi** (Planner) must route tasks to this skill.

* **Keyword Triggers**: `[e.g., compile, build, run-linter, deploy, verify]`
* **Context Conditions**: `[e.g., active document is main.rs, user requests build action, or code file updated]`
* **Agent Context Prerequisites**: `[e.g., requires node installed, requires active python environment]`

---

## 2. Input / Output Schema Specification

To ensure structured execution, inputs and outputs are defined as strict parameters:

### Input Parameters
| Parameter Name | Data Type | Required | Default Value | Description / Constraint |
| :--- | :---: | :---: | :---: | :--- |
| `input_param_1` | `string` | **YES** | - | Path to target code file to inspect. |
| `input_param_2` | `boolean`| **NO** | `false` | Enable detailed verbose logging trace. |

### Target Outputs
| Output Name | Data Type | Location / Destination | Success State Criteria |
| :--- | :---: | :--- | :--- |
| `execution_trace` | `object` | Returned in Karma console. | Tracing object containing exit codes. |
| `output_file` | `file` | `h:\Brahma\output.log` | File exists and contains valid JSON payload. |

---

## 3. High-Density Rules & Directives

*Detailed instructions governing execution of this capability. Keep sentences short.*

- **Rule 1**: Always execute build validation checks before committing changes.
- **Rule 2**: Check for dependencies first; do not run code if packages are missing.
- **Rule 3**: If execution fails with error `E_PARSE`, abort and trigger the compiler rollback loop.

---

## 4. Execution Patterns (Examples)

### Standard Usage Trace

```powershell
# Proactive command to execute this capability
node ./scripts/validate.js --target="main.js" --verbose
```

### Rollback / Recovery Execution

```powershell
# Rollback script if verification fails
git checkout HEAD -- main.js
```
