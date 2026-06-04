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
Your job is to read the current memory state and the new message, and output an updated memory state in exactly this markdown format:

# Moment: Session Memory
## Current Context
- **Current Topic**: <topic>
- **Detected Tone**: <tone>
- **Active Task**: None

## Recent Turns
1. <previous turn or empty>
2. <previous turn or empty>
3. User: ${message.content}

Return ONLY the markdown, no surrounding text or markdown ticks.
        `.trim();

        // We use the LLM to process tone and topic
        let updatedMoment = await LLMService.chat(systemPrompt, `Current Moment state:\n${currentMoment}\nNew Message: ${message.content}`);

        // Fallback if LLM fails
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
        Logger.info('Observer', message.message_id, Date.now() - startTime, 'SUCCESS');
    }
}
