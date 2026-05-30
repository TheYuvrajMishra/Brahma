# Reusable Capability Directory (Hunar Skills)

This directory hosts localized, task-focused intelligence sub-files representing individual **Skills (Hunar)**. These files are loaded by **Buddhi** (Strategic Planner) and executed by **Karma** (Execution Engine).

## Directory Structure

```
skills/
├── README.md               # This index & integration guide
├── template.md             # Blueprint for new skill sheets
├── system/                 # Core engine workflow skills
│   └── SYSTEM_SKILLS.md
├── coding/                 # Programming & development capability sheets
│   └── CODING_SKILLS.md
└── research/               # Information extraction & auditing sheets
    └── RESEARCH_SKILLS.md
```

---

## The Lifecycle of a Skill

```
1. Need Identified ---> 2. Template Copied ---> 3. Instructions & Triggers Written ---> 4. Registered in Hunar.md
```

1. **Intake**: A new recurring workflow is identified (e.g. "Deploy NextJS application to Vercel" or "Format Database JSON outputs").
2. **Setup**: An agent copies [skills/template.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/skills/template.md) to the target subfolder, assigning it a lowercase name with underscores (e.g., `skills/coding/vercel_deploy.md`).
3. **Drafting**: The agent writes high-density rules, input/output schemas, error mitigations, and execution commands into the skill.
4. **Activation**: The agent adds a new record in [Hunar.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/Hunar.md) under the Skill Registry table with the next `S-XXX` sequence index.

---

## Execution Constraints
- Skills must contain **only** highly condensed technical rules, examples, and triggers.
- Do not write conversational filler inside individual skill files.
- Each skill file must maintain the standard YAML header block.
