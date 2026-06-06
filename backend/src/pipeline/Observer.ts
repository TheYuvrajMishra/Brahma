import { NormalizedMessage } from '../types/Message';
import { MemoryManager } from '../core/MemoryManager';
import { LLMService } from '../services/LLMService';
import { Logger } from '../core/Logger';

export class Observer {
    static async observe(message: NormalizedMessage): Promise<void> {
        const startTime = Date.now();
        const currentMoment = await MemoryManager.getMoment(message.channel_id);

        const systemPrompt = `
You are the Observer engine for an AI assistant.
Your job is to read the current memory state and the new message, and output exactly this JSON schema:

{
  "updated_moment_markdown": "# Moment: Session Memory\\n## Current Context\\n- **Current Topic**: <topic>\\n- **Detected Tone**: <tone>\\n- **Active Task**: None\\n\\n## Recent Turns\\n<list of recent turns, ending with the new user message>",
  "new_long_term_facts": [
    "Array of significant facts learned from this message about the user (e.g. their name, preferences, project details). Leave empty if nothing significant was said."
  ]
}

Ensure the "updated_moment_markdown" preserves the conversation history (both User and Assistant turns) in "Recent Turns" and appends the new message "User: ${message.content.replace(/"/g, '\\"')}" at the end. Keep at most 6 recent turns.

Return ONLY the raw JSON, with no markdown ticks.
        `.trim();

        // We use the LLM to process tone and topic
        let llmResponse = await LLMService.chat(systemPrompt, `Current Moment state:\n${currentMoment}\nNew Message: ${message.content}`, true);

        let updatedMoment = '';
        let newFacts: string[] = [];

        try {
            if (llmResponse) {
                const cleanResponse = llmResponse.replace(/```(?:json)?/gi, '').trim();
                const parsed = JSON.parse(cleanResponse);
                updatedMoment = parsed.updated_moment_markdown;
                newFacts = parsed.new_long_term_facts || [];
            }
        } catch (e) {
            console.error('Failed to parse Observer LLM JSON:', e);
        }

        // Fallback if LLM fails or parsing fails
        if (!updatedMoment) {
            if (currentMoment.trim()) {
                updatedMoment = currentMoment + `\n- User: ${message.content}`;
            } else {
                updatedMoment = `
# Moment: Session Memory
## Current Context
- **Current Topic**: Unknown (LLM Fallback)
- **Detected Tone**: Unknown
- **Active Task**: None

## Recent Turns
1. [Empty]
2. [Empty]
3. User: ${message.content}
                `.trim();
            }
        }

        await MemoryManager.updateMoment(updatedMoment, message.channel_id);
        
        for (const fact of newFacts) {
            MemoryManager.appendZehnFact(fact);
        }

        Logger.info('Observer', message.message_id, Date.now() - startTime, 'SUCCESS');
    }
}
