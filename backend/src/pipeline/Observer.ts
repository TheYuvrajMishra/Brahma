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
Your job is to read the current memory state and the new message, and analyze the user's latest input.
Output exactly this JSON schema:

{
  "topic": "<brief topic of the conversation, e.g. Daily Routine, Email Setup>",
  "tone": "<detected tone of the user's latest message, e.g. casual, stressed, formal>",
  "new_long_term_facts": [
    "Array of significant facts learned from this message about the user (e.g. their name, preferences, project details). Leave empty if nothing significant was said."
  ]
}

Return ONLY the raw JSON, with no markdown ticks.
        `.trim();

        // We use the LLM to process tone and topic
        let llmResponse = await LLMService.chat(systemPrompt, `Current Moment state:\n${currentMoment}\nNew Message: ${message.content}`, true);

        let parsedTopic = 'Unknown';
        let parsedTone = 'Unknown';
        let newFacts: string[] = [];

        try {
            if (llmResponse) {
                const cleanResponse = llmResponse.replace(/```(?:json)?/gi, '').trim();
                const parsed = JSON.parse(cleanResponse);
                parsedTopic = parsed.topic || 'Unknown';
                parsedTone = parsed.tone || 'Unknown';
                newFacts = parsed.new_long_term_facts || [];
            }
        } catch (e) {
            console.error('Failed to parse Observer LLM JSON:', e);
        }

        // Programmatically update the moment
        const momentData = MemoryManager.parseMoment(currentMoment);
        
        // If parsed is fallback/unknown but we already have a topic/tone, keep them as fallback
        if (parsedTopic === 'Unknown' && momentData.topic !== 'Unknown') {
            parsedTopic = momentData.topic;
        }
        if (parsedTone === 'Unknown' && momentData.tone !== 'Unknown') {
            parsedTone = momentData.tone;
        }

        // Clean user message for the history
        const cleanUserMsg = message.content.replace(/\s+/g, ' ').trim();
        // Truncate user message if it's extremely long to avoid ballooning context
        const truncatedUserMsg = cleanUserMsg.length > 1000 ? cleanUserMsg.substring(0, 1000) + '...' : cleanUserMsg;
        
        momentData.topic = parsedTopic;
        momentData.tone = parsedTone;
        momentData.turns.push(`User: ${truncatedUserMsg}`);

        // Keep at most 6 recent turns
        while (momentData.turns.length > 6) {
            momentData.turns.shift();
        }

        const updatedMoment = MemoryManager.formatMoment(momentData);
        await MemoryManager.updateMoment(updatedMoment, message.channel_id);
        
        for (const fact of newFacts) {
            await MemoryManager.appendZehnFact(fact);
        }

        Logger.info('Observer', message.message_id, Date.now() - startTime, 'SUCCESS');
    }
}
