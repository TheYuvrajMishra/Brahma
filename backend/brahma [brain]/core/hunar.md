# Hunar: Skill Index

> This file acts as the registry for all loadable capabilities (skills). Skills are modular and define prompts, formatting, and configuration.

## Available Skills

### write-email
- **Description**: Drafts professional emails based on context.
- **Parameters**: `sender_name`, `recipient`, `subject`, `tone`, `key_points`
- **Output**: Plain text email body.

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
