import fs from 'fs';
import path from 'path';
import { ISkill } from '../types/Skill';
import { MemoryManager } from '../core/MemoryManager';
import { LLMService } from '../services/LLMService';
import { config } from '../config';

export class SetPersona implements ISkill {
    name = 'set-persona';
    description = 'Updates the bot persona for the current chat session or channel.';

    async execute(params: any): Promise<string> {
        const personaDescription = params.persona_description || '';
        const channelId = params._channel_id || '';
        const userId = params._user_id || params.user_id || params.userId;

        if (!channelId) {
            return 'Failed to set persona: No active channel or session ID context detected.';
        }

        if (!personaDescription) {
            return 'Failed to set persona: No persona description provided.';
        }

        const isDefault = /^(default|brahma|reset|none)$/i.test(personaDescription.trim().toLowerCase());
        if (isDefault) {
            await MemoryManager.updateCustomPersona('', userId, channelId);
            return 'Successfully reset channel persona to the default Brahma persona.';
        }

        try {
            const defaultSoul = await MemoryManager.getSoul(userId);

            const prompt = `
You are a persona-generation engine.
Take the base personality profile of the AI assistant Brahma:
---
${defaultSoul}
---

Generate a customized, channel-specific persona profile that blends this base persona with the style, tone, catchphrases, and identity of: "${personaDescription}".
Keep the same markdown structure (Identity, Personality Traits, Communication Style, Ethical Boundaries, Language Preferences) but adapt the Identity details, Personality Traits, and Communication Style to match the requested persona.
Ensure it remains professional and respectful, but distinctively in-character (e.g. incorporating iconic phrasing or style cues).
Output ONLY the final markdown. Do not include markdown code fence ticks (e.g. \`\`\`) or any introductory/explanatory text.
            `.trim();

            const customPersonaMarkdown = await LLMService.chat(prompt, `Generate customized persona for: ${personaDescription}`);
            if (!customPersonaMarkdown) {
                return `Failed to set persona: LLM failed to generate a persona profile for "${personaDescription}".`;
            }

            await MemoryManager.updateCustomPersona(customPersonaMarkdown.trim(), userId, channelId);
            console.log(`[SetPersona] Updated custom persona for channel ${channelId} to: ${personaDescription}`);
            
            return `Successfully adapted my persona in this channel to be like "${personaDescription}".`;
        } catch (err: any) {
            console.error('[SetPersona] Failed to set persona:', err);
            return `Failed to set persona: ${err.message}`;
        }
    }
}
