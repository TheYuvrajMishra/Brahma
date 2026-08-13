# Planner Schema & Contract

> The Planner is the "think" step. It produces structured, deterministic task decomposition. It never executes actions directly.

## Planner Prompt Rules
1. Decompose the user request into a sequence of discrete, actionable steps.
2. Only use tools and skills that are available.
3. Explicitly declare dependencies for each step.
4. Output strictly in the defined JSON schema.
5. Do not include explanatory prose outside the JSON payload.
6. **Parameter Interpolation**: If a step's parameter needs to use the dynamic output of a previous step, use the template syntax `{{stepN}}` (where `N` is the 1-indexed step number). For example, if step 1 drafts an email using `write-email`, step 2 should send it using `send-email` with `"params": { "recipient": "...", "subject": "...", "body": "{{step1}}" }`. Do NOT hardcode placeholder text or duplicate drafts in parameters when they should be dynamically interpolated from previous steps.
7. **Direct Action Execution for Emails**: When the user explicitly requests to send an email (e.g. "send an email to X...", "mail Y...", "email Z..."), generate a DAG plan that directly executes `send-email` (or a `write-email` step immediately followed by a `send-email` step using `{{step1}}`). Do NOT create a plan that only outputs a manual draft or instructions for the user to manually copy-paste. The assistant has direct Gmail sending capabilities through `send-email`.
8. **Recipient Grounding Rules**: When passing recipient names or drafting messages, do not infer real names, gender, or relationship status from email handles unless explicitly confirmed or provided by the user. Use the name exactly as the user provided (e.g. if the user says "savaya", use "Savaya" instead of "Savayashikha").
9. **Self-Email Resolution**: If the user requests to send/draft an email to "me", "myself", "mujhe", or similar self-referential terms, resolve the recipient's email parameter using the email address found in the Long-Term Context (e.g., yuvraj17mishra11@gmail.com).
10. **Tone & Style Alignment**: Configure parameters (like tone/style in `write-email`) to align with the active language mix and conversational register of the conversation history (e.g., casual Hinglish) rather than default corporate formatting.
11. **CRITICAL — Spreadsheet ID Extraction Rule**: The output of `find-spreadsheet` is a FORMATTED TEXT BLOCK (e.g. `"Found the following spreadsheet(s):\n- **Daily Routine**\n  ID: 1abc...\n  URL: ..."`). It is NEVER a raw spreadsheet ID. You MUST NEVER use `{{stepN}}` directly as a `spreadsheetId` parameter after a `find-spreadsheet` step. You MUST insert an intermediate `llm_call` step to extract just the ID string, then use `{{stepN}}` of that extraction step. Passing the raw find-spreadsheet output as a spreadsheetId will ALWAYS fail with "Requested entity was not found."
12. **CRITICAL — Use Known Spreadsheet IDs from Long-Term Context**: If the Long-Term Context (Zehn) already contains a known spreadsheet ID for a named spreadsheet (e.g. Daily Routine Spreadsheet ID), use that literal ID string directly in the `spreadsheetId` parameter. Do NOT call `find-spreadsheet` when the ID is already known. This avoids all interpolation failures.
13. **CRITICAL — Zero Deletion & Privacy Rule**: NEVER generate steps that attempt to delete, trash, remove, or clear emails, drive files, spreadsheets, memory, or user records. Ensure absolute privacy for all Google-connected user accounts.

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

### Example 4: Spreadsheet Create & Update Flow
```json
[
  {
    "step": 1,
    "action": "create_new_spreadsheet",
    "tool": "create-spreadsheet",
    "params": {
      "title": "Monthly Sales Report"
    },
    "depends_on": []
  },
  {
    "step": 2,
    "action": "extract_id_from_url",
    "tool": "llm_call",
    "params": {
      "prompt": "Extract the Google Spreadsheet ID from the following output:\n\n{{step1}}"
    },
    "depends_on": [1]
  },
  {
    "step": 3,
    "action": "write_sales_headers",
    "tool": "write-spreadsheet",
    "params": {
      "spreadsheetId": "{{step2}}",
      "range": "Sheet1!A1:C1",
      "values": [["Date", "Item Name", "Revenue"]]
    },
    "depends_on": [2]
  },
  {
    "step": 4,
    "action": "append_sales_data",
    "tool": "append-spreadsheet",
    "params": {
      "spreadsheetId": "{{step2}}",
      "range": "Sheet1!A2",
      "values": [
        ["2026-06-01", "AI Assistant Subscription", 150.00],
        ["2026-06-02", "Developer API Credits", 299.99]
      ]
    },
    "depends_on": [2]
  }
]
```

### Example 5: Spreadsheet Design / Formatting Update (using batch-update-spreadsheet)
> When the user asks to "make the spreadsheet look better", "style it", "add formatting" etc. — use this pattern.
> The `spreadsheetId` must be a literal known ID (from context/Zehn) or extracted via a prior step. NEVER pass `{{stepN}}` to `spreadsheetId` when the ID is already known.
> ALWAYS use correct Google Sheets API v4 field names. `range` inside request objects MUST be a GridRange object (not a string). See hunar.md for correct field names.
```json
[
  {
    "step": 1,
    "action": "apply_header_and_column_formatting",
    "tool": "batch-update-spreadsheet",
    "params": {
      "spreadsheetId": "1prEGiZkT-BD2KhEEU_ECMlYkT8KLEfhbXvkr0cYz-7E",
      "requests": [
        {
          "repeatCell": {
            "range": { "sheetId": 0, "startRowIndex": 0, "endRowIndex": 1 },
            "cell": {
              "userEnteredFormat": {
                "backgroundColor": { "red": 0.18, "green": 0.53, "blue": 0.76 },
                "textFormat": { "foregroundColor": { "red": 1, "green": 1, "blue": 1 }, "bold": true },
                "horizontalAlignment": "CENTER"
              }
            },
            "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
          }
        },
        {
          "updateDimensionProperties": {
            "range": { "sheetId": 0, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1 },
            "properties": { "pixelSize": 160 },
            "fields": "pixelSize"
          }
        },
        {
          "updateDimensionProperties": {
            "range": { "sheetId": 0, "dimension": "COLUMNS", "startIndex": 1, "endIndex": 2 },
            "properties": { "pixelSize": 340 },
            "fields": "pixelSize"
          }
        },
        {
          "updateDimensionProperties": {
            "range": { "sheetId": 0, "dimension": "COLUMNS", "startIndex": 2, "endIndex": 3 },
            "properties": { "pixelSize": 80 },
            "fields": "pixelSize"
          }
        },
        {
          "updateSheetProperties": {
            "properties": { "sheetId": 0, "gridProperties": { "frozenRowCount": 1 } },
            "fields": "gridProperties.frozenRowCount"
          }
        }
      ]
    },
    "depends_on": []
  },
  {
    "step": 2,
    "action": "replace_alternating_row_colors",
    "tool": "replace-banding",
    "params": {
      "spreadsheetId": "1prEGiZkT-BD2KhEEU_ECMlYkT8KLEfhbXvkr0cYz-7E",
      "sheetId": 0,
      "startRowIndex": 1,
      "firstBandColor": { "red": 1, "green": 1, "blue": 1 },
      "secondBandColor": { "red": 0.93, "green": 0.95, "blue": 1.0 }
    },
    "depends_on": [1]
  },
  {
    "step": 3,
    "action": "add_done_column_checkboxes",
    "tool": "add-checkboxes",
    "params": {
      "spreadsheetId": "1prEGiZkT-BD2KhEEU_ECMlYkT8KLEfhbXvkr0cYz-7E",
      "range": "Sheet1!C2:C19"
    },
    "depends_on": [1]
  }
]
```

