# Hunar: The Skill Registry

```yaml
id: HUNAR
version: 1.1.0
last_sync: 2026-05-31T15:23:00+05:30
registered_skills_count: 23
skills_directory: "skills/"
agent_permission: READ-WRITE
description: "Master index of system capabilities, user-generated skills, dynamic registers, and template patterns."
```

---

## 1. Skill Registry Index

This table acts as the unified directory of all operational capabilities that Brahma can execute. Every skill file is hosted in the `skills/` folder.

| Skill ID | Category | Skill Name | Location / File Link | Status | Primary Function / Scope |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **S-001** | `System` | Markdown Architect | [template.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/skills/template.md) | **ACTIVE** | Creates and structures detailed, token-saving markdown files. |
| **S-002** | `System` | System Integrator | [README.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/skills/README.md) | **ACTIVE** | Handles system state sync and file interactions across the workspace. |
| **S-003** | `Orchestrator`| Skill Compiler | [Hunar.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/Hunar.md) | **ACTIVE** | Registers, parses, and dynamic-compiles new skills into Hunar. |
| **S-004** | `Memory` | Database Manager | [Zehn.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/Zehn.md) | **ACTIVE** | Indexes entity relationships and session logs for token efficiency. |
| **S-005** | `Analyst` | Auditing Engineer | [Chintan.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/Chintan.md) | **ACTIVE** | Performs self-audits and generates behavioral optimizations. |
| **S-006** | `System` | CREATE_CHANNEL | [create_channel.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/create_channel.md) | **ACTIVE** | Create a text, voice, or category channel in the server. |
| **S-007** | `System` | DELETE_CHANNEL | [delete_channel.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/delete_channel.md) | **ACTIVE** | Delete a channel by name or ID. |
| **S-008** | `System` | CREATE_ROLE | [create_role.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/create_role.md) | **ACTIVE** | Create a new role with custom color. |
| **S-009** | `System` | DELETE_ROLE | [delete_role.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/delete_role.md) | **ACTIVE** | Delete a role by name or ID. |
| **S-010** | `System` | ASSIGN_ROLE | [assign_role.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/assign_role.md) | **ACTIVE** | Assign a role to a member. |
| **S-011** | `System` | REMOVE_ROLE | [remove_role.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/remove_role.md) | **ACTIVE** | Remove a role from a member. |
| **S-012** | `System` | KICK_MEMBER | [kick_member.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/kick_member.md) | **ACTIVE** | Kick a member from the server. |
| **S-013** | `System` | BAN_MEMBER | [ban_member.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/ban_member.md) | **ACTIVE** | Ban a member from the server. |
| **S-014** | `System` | SEND_MESSAGE | [send_message.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/send_message.md) | **ACTIVE** | Send a message to a text channel. |
| **S-015** | `System` | LIST_CHANNELS | [list_channels.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/list_channels.md) | **ACTIVE** | List all text and voice channels on the server. |
| **S-016** | `System` | LIST_ROLES | [list_roles.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/list_roles.md) | **ACTIVE** | List all roles on the server. |
| **S-017** | `System` | LIST_MEMBERS | [list_members.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/discord/list_members.md) | **ACTIVE** | List all members on the server. |
| **S-018** | `Orchestrator` | QUERY_RAG | [query_rag.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/brahma/query_rag.md) | **ACTIVE** | Search Brahma's internal RAG knowledge base for system documentation. |
| **S-019** | `Orchestrator` | DECOMPOSE_MISSION | [decompose_mission.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/brahma/decompose_mission.md) | **ACTIVE** | Strategic decompose of a goal into a mission sub-tasks checklist. |
| **S-020** | `Orchestrator` | EXECUTE_NEXT_TASK | [execute_next_task.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/brahma/execute_next_task.md) | **ACTIVE** | Activate next pending sub-task for a mission. |
| **S-021** | `Orchestrator` | COMPLETE_TASK | [complete_task.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/brahma/complete_task.md) | **ACTIVE** | Mark a sub-task as completed. |
| **S-022** | `Orchestrator` | SYNC_BRAIN | [sync_brain.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/brahma/sync_brain.md) | **ACTIVE** | Silently serialize and archive user preferences and history into physical files. |
| **S-023** | `Orchestrator` | BRAHMA_CHAT | [brahma_chat.md](file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/brahma/brahma_chat.md) | **ACTIVE** | Default conversational small talk, greetings, personal answers, advice. |

*<!-- DYNAMIC_SKILL_INSERTION_MARKER -->*
*New skills generated by users or agents are appended here in sequence. Maintain formatting.*

---

## 2. Capability Directory Structure

The physical storage layout under the skills directory:

```
Brahma [Brain]/skills/
├── README.md              # Skill folder guide & registration directives
├── template.md            # Empty standard skill template
├── discord/               # Discord admin capability sheets
└── brahma/                # Brahma orchestration engine sheets
```

---

## 3. Dynamic Skill Auto-Registration Protocol

When the user or an agent wants to generate a new capability, follow these steps:

### Phase 1: Creation
1. Copy [skills/template.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/skills/template.md) to a new file path matching the category (e.g. `skills/discord/new_action.md`).
2. Fill out the YAML block, triggers, rules, and example commands in the new skill file.

### Phase 2: Registration
1. Open [Hunar.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/Hunar.md).
2. Read the `registered_skills_count` in the YAML block, increment it by `1`.
3. Locate the `DYNAMIC_SKILL_INSERTION_MARKER` in the registry table.
4. Add a new row right above the marker, following the exact format:
   `| S-XXX | Category | Name | [Link](Path) | ACTIVE | Description |`
   *(Ensure S-XXX is the next incrementing ID).*
5. Save the file. The skill is now active and ready for **Buddhi** to schedule.

---

## 4. Agent Protocol (Self-Update Instructions)

### When to update this file:
- **Skill Addition**: Triggered when a new capability is built. Execute the Phase 2 registration.
- **Skill Deprecation**: If a skill is superseded or no longer viable, edit its `Status` to `DEPRECATED` and document the alternative Skill ID in the `Primary Function` description.

### Safe Edit Guidelines:
1. **Never skip indices**: Skill IDs must increment linearly (`S-006`, `S-007`...).
2. **Path Integrity**: Ensure the Markdown path resolves as a local URI `file:///` relative to the workspace.
3. **No Overwrites**: Do not overwrite existing active rows unless explicitly modifying their parameters or status.
