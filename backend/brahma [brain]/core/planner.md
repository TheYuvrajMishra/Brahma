# Planner Schema & Contract

> The Planner is the "think" step. It produces structured, deterministic task decomposition. It never executes actions directly.

## Planner Prompt Rules
1. Decompose the user request into a sequence of discrete, actionable steps.
2. Only use tools and skills that are available.
3. Explicitly declare dependencies for each step.
4. Output strictly in the defined JSON schema.
5. Do not include explanatory prose outside the JSON payload.
6. **Parameter Interpolation**: If a step's parameter needs to use the dynamic output of a previous step, use the template syntax `{{stepN}}` (where `N` is the 1-indexed step number). For example, if step 1 drafts an email using `write-email`, step 2 should send it using `send-email` with `"params": { "recipient": "...", "subject": "...", "body": "{{step1}}" }`. Do NOT hardcode placeholder text or duplicate drafts in parameters when they should be dynamically interpolated from previous steps.
7. **Recipient Grounding Rules**: When passing recipient names or drafting messages, do not infer real names, gender, or relationship status from email handles unless explicitly confirmed or provided by the user. Use the name exactly as the user provided (e.g. if the user says "savaya", use "Savaya" instead of "Savayashikha").
8. **Self-Email Resolution**: If the user requests to send/draft an email to "me", "myself", "mujhe", or similar self-referential terms, resolve the recipient's email parameter using the email address found in the Long-Term Context (e.g., yuvraj17mishra11@gmail.com).
9. **Tone & Style Alignment**: Configure parameters (like tone/style in `write-email`) to align with the active language mix and conversational register of the conversation history (e.g., casual Hinglish) rather than default corporate formatting.

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

## Example Outputs

### Example 1: Web Research & Synthesis
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

### Example 2: Email Draft & Send Flow
```json
[
  {
    "step": 1,
    "action": "draft_email",
    "tool": "write-email",
    "params": {
      "recipient": "Savaya",
      "subject": "Expression of Love",
      "tone": "casual/playful",
      "sender_name": "Yuvraj",
      "key_points": ["i love her veeerrryy much"]
    },
    "depends_on": []
  },
  {
    "step": 2,
    "action": "send_email",
    "tool": "send-email",
    "params": {
      "recipient": "savayashikha571@gmail.com",
      "subject": "Expression of Love",
      "body": "{{step1}}"
    },
    "depends_on": [1]
  }
]
```

### Example 3: Email Inbox Summarization
```json
[
  {
    "step": 1,
    "action": "get_emails",
    "tool": "get-emails",
    "params": {
      "max_results": 5
    },
    "depends_on": []
  },
  {
    "step": 2,
    "action": "summarize_emails",
    "tool": "llm_call",
    "params": {
      "prompt_template": "summarize_inbox"
    },
    "depends_on": [1]
  }
]
```
