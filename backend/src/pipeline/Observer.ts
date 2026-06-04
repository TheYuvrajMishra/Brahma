import { NormalizedMessage } from '../types/Message';
import { MemoryManager } from '../core/MemoryManager';
import { LLMService } from '../services/LLMService';
import { Logger } from '../core/Logger';

export class Observer {
    static async observe(message: NormalizedMessage): Promise<void> {
        const startTime = Date.now();
        const currentMoment = MemoryManager.getMoment();

        const systemPrompt = `
You are the Observer engine for an AI assistant.
Your job is to read the current memory state and the new message, and output exactly this JSON schema:

{
  "updated_moment_markdown": "# Moment: Session Memory\\n## Current Context\\n- **Current Topic**: <topic>\\n- **Detected Tone**: <tone>\\n- **Active Task**: None\\n\\n## Recent Turns\\n1. <previous turn or empty>\\n2. <previous turn or empty>\\n3. User: ${message.content.replace(/"/g, '\\"')}",
  "new_long_term_facts": [
    "Array of significant facts learned from this message about the user (e.g. their name, preferences, project details). Leave empty if nothing significant was said."
  ]
}

Return ONLY the raw JSON, with no markdown ticks.
        `.trim();

        // We use the LLM to process tone and topic
        let llmResponse = await LLMService.chat(systemPrompt, `Current Moment state:\n${currentMoment}\nNew Message: ${message.content}`);

        let updatedMoment = '';
        let newFacts: string[] = [];

        try {
            if (llmResponse) {
                const parsed = JSON.parse(llmResponse);
                updatedMoment = parsed.updated_moment_markdown;
                newFacts = parsed.new_long_term_facts || [];
            }
        } catch (e) {
            console.error('Failed to parse Observer LLM JSON:', e);
        }

        // Fallback if LLM fails or parsing fails
        if (!updatedMoment) {
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

        MemoryManager.updateMoment(updatedMoment);
        
        for (const fact of newFacts) {
            MemoryManager.appendZehnFact(fact);
        }

        Logger.info('Observer', message.message_id, Date.now() - startTime, 'SUCCESS');
    }
}
