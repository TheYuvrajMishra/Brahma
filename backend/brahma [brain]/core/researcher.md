# SCRP Researcher — Configuration

## Research Depth
- minimum: 1 search max (greetings, casual questions)
- standard: 2 searches max (entity research, news, tasks)

## Gate Rules
- Unknown entities → ALWAYS research
- Time-sensitive entities (jobs, prices, news) → ALWAYS research
- Well-known stable entities → ONLY if user asks about recent changes
- Previously cached entities (within 1 hour) → SKIP

## Rate Limit Awareness
- Only 1 LLM call per research cycle (parseIntent only)
- Context building uses string parsing, not LLM
- Max 2 web searches per request
- Max 1 URL fetch per request
