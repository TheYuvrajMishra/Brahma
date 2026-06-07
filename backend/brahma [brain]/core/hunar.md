# Hunar: Skill Index

> This file acts as the registry for all loadable capabilities (skills). Skills are modular and define prompts, formatting, and configuration.

## Available Skills

### web_search
- **Description**: Performs a web search using Tavily API to gather up-to-date information, news, or research on a given query.
- **Parameters**: `query` (the search string)
- **Output**: A text summary of search results.

### llm_call
- **Description**: Makes a generic call to the LLM to process text, answer general questions, analyze data, or synthesize information.
- **Parameters**: `prompt` (the instruction for the LLM)
- **Output**: The generated text response.

### write-email
- **Description**: Drafts professional emails based on context.
- **Parameters**: `sender_name`, `recipient`, `subject`, `tone`, `key_points`
- **Output**: Plain text email body.

### send-email
- **Description**: Actually sends/dispatches an email to a recipient using Gmail.
- **Parameters**: `recipient` (email address), `subject` (string), `body` (string)
- **Output**: Success or failure confirmation string.

### get-emails
- **Description**: Retrieves a list of recent emails from the inbox with their details.
- **Parameters**: `max_results` (number of emails to retrieve, default: 5), `query` (optional Gmail search query filter string)
- **Output**: A concatenated string of email summaries including ID, From, Date, Subject, Snippet, and Body content.

### write-blog
- **Description**: Produces structured blog posts.
- **Parameters**: `topic`, `tone`, `length`, `keywords`
- **Output**: Markdown-formatted article.

### summarize
- **Description**: Condenses long content into key points.
- **Parameters**: `content`, `max_sentences`
- **Output**: Bulleted list.

### discord-reply
- **Description**: Formats a response for Discord markdown.
- **Parameters**: `content`, `include_embeds`
- **Output**: Discord-compatible markdown string.

### whatsapp-message
- **Description**: Produces WhatsApp-appropriate plain text.
- **Parameters**: `content`, `use_emojis`
- **Output**: Plain text string.

### discord-create-channel
- **Description**: Creates a new text or voice channel in the active Discord guild.
- **Parameters**: `name` (the channel name string, required), `type` (the channel type, e.g. "text" or "voice", default: "text")
- **Output**: Confirmation string indicating channel creation status.

### set-persona
- **Description**: Updates the bot's persona for the current chat session or Discord channel context.
- **Parameters**: `persona_description` (description of the target persona style/identity to adopt, e.g. "Salman Khan / Sallu Bhai", or "Brahma" to reset to default, required)
- **Output**: Confirmation string indicating persona adaptation status.

### create-spreadsheet
- **Description**: Creates a new Google Spreadsheet on the user's Google Drive.
- **Parameters**: `title` (optional string, name of the spreadsheet, defaults to "New Spreadsheet")
- **Output**: Confirmation string including the newly created Spreadsheet's ID and URL.

### find-spreadsheet
- **Description**: Searches the user's Google Drive files for spreadsheets matching a search query/title.
- **Parameters**: `query` (optional string, filename/title search query)
- **Output**: A list of matching spreadsheets with their name, ID, and URL.

### read-spreadsheet
- **Description**: Reads and returns values from a cell range in a specified Google Spreadsheet.
- **Parameters**: `spreadsheetId` (required string, target spreadsheet ID), `range` (optional string, cell range notation, e.g. "Sheet1!A1:D10", defaults to "Sheet1!A1:Z100")
- **Output**: Text matrix representation of the spreadsheet cells.

### write-spreadsheet
- **Description**: Writes or overwrites cell values in a specified range of a Google Spreadsheet.
- **Parameters**: `spreadsheetId` (required string, target spreadsheet ID), `range` (required string, cell range notation, e.g. "Sheet1!A1:D10"), `values` (required 2D array, or a 1D array representing a single row, or a JSON string representing the array of values to write)
- **Output**: Confirmation of updated cells.

### append-spreadsheet
- **Description**: Appends one or more rows of values to the end of an existing range/sheet in a Google Spreadsheet.
- **Parameters**: `spreadsheetId` (required string, target spreadsheet ID), `range` (optional string, cell range/sheet name notation, e.g. "Sheet1"), `values` (required 2D array, or a 1D array representing a single row, or a JSON string representing the array of values to append)
- **Output**: Confirmation of the range where data was appended.

### batch-update-spreadsheet
- **Description**: Executes a batch of formatting/updating requests (e.g. column resizing, bold text, grid configurations, sheet renaming/addition) on a Google Spreadsheet.
- **Parameters**: `spreadsheetId` (required string, target spreadsheet ID), `requests` (required array of request objects or JSON string of objects in the Google Sheets API v4 request format)
- **Output**: Confirmation of executed batch operations.

