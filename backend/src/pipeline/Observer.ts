import { NormalizedMessage } from '../types/Message';
import { MemoryManager } from '../core/MemoryManager';
import { LLMService } from '../services/LLMService';
import { Logger } from '../core/Logger';

export class Observer {
    static async observe(message: NormalizedMessage): Promise<void> {
        const startTime = Date.now();
        const currentMoment = await MemoryManager.getMoment(message.user_id, message.channel_id);

        const systemPrompt = `
You are the Observer engine for an AI assistant.
Your job is to read the current memory state and the new message, and analyze the user's latest input.
Output exactly this JSON schema:

{
  "topic": "<brief topic of the conversation, e.g. Employer Experience, People & Companies>",
  "tone": "<detected tone of the user's latest message, e.g. angry, casual, informative, formal>",
  "new_long_term_facts": [
    {
      "fact": "<fact text learned about the user, their people, employers, or work, e.g. Shourya Goenka was co-founder of NXT>",
      "target_section": "<MUST be one of: SEC-01 (User Identity), SEC-02 (People & Relationships), SEC-03 (Persona), SEC-04 (Work & Career), SEC-05 (Contact), SEC-06 (Routines), SEC-07 (System Config)>"
    }
  ]
}

CRITICAL FACT EXTRACTION RULE:
- Whenever the user states a fact about people, friends, partners, co-founders, employers, or companies (e.g. "X was co-founder of Y"), you MUST extract it into new_long_term_facts under SEC-02 or SEC-04. Do NOT omit it.

Return ONLY the raw JSON, with no markdown ticks.
`.trim();

        // We use the LLM to process tone and topic
        let llmResponse = await LLMService.chat(systemPrompt, `Current Moment state:\n${currentMoment}\nNew Message: ${message.content}`, true);

        let parsedTopic = 'Unknown';
        let parsedTone = 'Unknown';
        let newFacts: Array<{ fact: string; target_section?: string } | string> = [];

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
        
        if (parsedTopic === 'Unknown' && momentData.topic !== 'Unknown') {
            parsedTopic = momentData.topic;
        }
        if (parsedTone === 'Unknown' && momentData.tone !== 'Unknown') {
            parsedTone = momentData.tone;
        }

        const cleanUserMsg = message.content.replace(/\s+/g, ' ').trim();
        const truncatedUserMsg = cleanUserMsg.length > 1000 ? cleanUserMsg.substring(0, 1000) + '...' : cleanUserMsg;
        
        momentData.topic = parsedTopic;
        momentData.tone = parsedTone;
        momentData.turns.push(`User: ${truncatedUserMsg}`);

        while (momentData.turns.length > 20) {
            momentData.turns.shift();
        }

        const updatedMoment = MemoryManager.formatMoment(momentData);
        await MemoryManager.updateMoment(updatedMoment, message.user_id, message.channel_id);
        
        for (const item of newFacts) {
            if (typeof item === 'string') {
                await MemoryManager.appendZehnFact(item, undefined, message.user_id);
            } else if (item && item.fact) {
                await MemoryManager.appendZehnFact(item.fact, item.target_section, message.user_id);
            }
        }

        Logger.info('Observer', message.message_id, Date.now() - startTime, 'SUCCESS');
    }
}
