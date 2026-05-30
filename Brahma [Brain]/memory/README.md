# Long-Term Memory Archive (Memory Engine)

This directory serves as the long-term repository for all **Brahma Session Logs**. When raw execution traces in [Karma.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/Karma.md) or short-term context boundaries in [Zehn.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/Zehn.md) approach limits, they are compressed, structured, and archived here.

## Directory Structure

```
memory/
├── README.md               # This archive directory guide
├── template.md             # Standard schema for new memory files
└── YYYY-MM-DD.md           # Concrete, compressed daily logs (e.g. 2026-05-30.md)
```

---

## Retributive Memory Recall

1. **Decay**: The planner (**Buddhi**) checks the dates and files list in the Chronological Session Index inside `Zehn.md`.
2. **Reactivation**: If a current session asks about a choice, error, or custom instruction that took place in a past session, Buddhi triggers the skill `S-004` (Database Manager) to read the specific `memory/YYYY-MM-DD.md` file linked in Zehn.
3. **Retrieval**: The file is read, the relevant section is extracted, and the short-term context is updated, bypassing the need to load the entire historical logs directory and saving significant token weight.

---

## Archival Rules
- Memory logs are strictly static. Once created, they are **never** rewritten unless to append related logs on the same calendar day.
- Always use the standardized format specified in [memory/template.md](file:///h:/Brahma/Brahma%20%5BBrain%5D/memory/template.md).
- Keep descriptions extremely dense and structural to maintain high token savings.
