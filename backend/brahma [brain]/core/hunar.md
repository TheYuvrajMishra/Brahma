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
