# Planner Schema & Contract

> The Planner is the "think" step. It produces structured, deterministic task decomposition. It never executes actions directly.

## Planner Prompt Rules
1. Decompose the user request into a sequence of discrete, actionable steps.
2. Only use tools and skills that are available.
3. Explicitly declare dependencies for each step.
4. Output strictly in the defined JSON schema.
5. Do not include explanatory prose outside the JSON payload.

## Output JSON Schema

The Planner must output a validated JSON array of step objects:

```json
[
  {
    "step": "integer (1-indexed)",
    "action": "string (descriptive action name)",
    "tool": "string (name of tool or skill to invoke)",
    "params": "object (key-value pairs matching tool requirements)",
    "depends_on": "array of integers (step IDs this step waits for)"
  }
]
```

## Example Output
```json
[
  {
    "step": 1,
    "action": "search_web",
    "tool": "web_search",
    "params": { "query": "top AI tools 2026" },
    "depends_on": []
  },
  {
    "step": 2,
    "action": "summarize_results",
    "tool": "llm_call",
    "params": { "prompt_template": "summarize_search" },
    "depends_on": [1]
  }
]
```
