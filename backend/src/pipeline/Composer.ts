import { NormalizedMessage, PipelineResponse } from '../types/Message';
import { ResearchResult } from '../types/ResearchTypes';
import { MemoryManager } from '../core/MemoryManager';
import { LLMService } from '../services/LLMService';
import { ExecutionResult } from './Executor';

export class Composer {
    /**
     * Phase 8: Final Synthesis
     */
    static async compose(message: NormalizedMessage, routeBucket: string, executionLog?: ExecutionResult[], researchResult?: ResearchResult, intent: string = 'other'): Promise<PipelineResponse> {
        let soul = await MemoryManager.getSoul(message.channel_id);
        const moment = await MemoryManager.getMoment(message.channel_id);
        const rawZehn = MemoryManager.getZehn();
        const zehn = MemoryManager.getFilteredZehn(rawZehn, intent, message.content, moment);
        
        if (routeBucket === 'complex') {
            if (!executionLog) {
                // Graceful degradation: if research found something, synthesize from it
                if (researchResult?.context_store?.entries?.length) {
                    const ctx = this.formatResearchContext(researchResult);
                    const prompt = `You are Brahma. Here is your personality:\n${soul}\n\nPre-researched context:\n${ctx}\n\nUsing the context above, respond to the user. Cite sources with [1] notation only if factual. Be direct.`.trim();
                    const resp = await LLMService.chat(prompt, message.content);
                    if (resp) return { originalMessage: message, content: resp };
                }
                
                // Last resort: direct LLM response
                const directResp = await LLMService.chat(`You are Brahma. Personality:\n${soul}\n\nGive your best answer.`, message.content);
                return { originalMessage: message, content: directResp || 'I understood that you wanted me to do a complex task, but I failed to generate a valid plan for it.' };
            }

            // Truncate execution log to stay under rate limits
            const safeLog = executionLog.map(log => ({
                ...log,
                output: log.output && log.output.length > 1500 ? log.output.substring(0, 1500) + '\n...[TRUNCATED]...' : log.output
            }));
            const logString = JSON.stringify(safeLog, null, 2);
            
            // Cap total system prompt — the LLM proxy rejects prompts > ~20k chars
            const researchCtx = this.formatResearchContext(researchResult);
            const cappedCtx = researchCtx.length > 2000 ? researchCtx.substring(0, 2000) + '\n...[TRUNCATED]' : researchCtx;
            
            let systemPrompt = `
You are Brahma. Here is your soul/personality:
${soul}

### Long-Term Context (Zehn)
${zehn}

### Current Context (Moment)
${moment}

You have just executed a complex plan for the user. Here are the results of your execution:
${logString}
${cappedCtx}
Your task is to synthesize these results into a final, conversational response for the user.

CRITICAL INSTRUCTIONS:
1. Speak EXACTLY in your defined Tone and Personality.
2. NEVER use generic AI boilerplate (e.g., "I have conducted a search", "Here is a summary", "Next Steps", "If you need more help").
3. DO NOT use generic section headers like "Search Overview" or "Detailed Summary". 
4. Be direct, concise, and just state what you found or generated.
5. If a tool generated a blog post or email, present it clearly using Markdown.
6. CITATIONS RULE: Cite sources using [1] notation ONLY if the user's request is factual, research-based, or explicitly asks for references/links, AND the source URLs are present in the execution log or pre-researched context. Do NOT invent URLs or citations.
7. SOURCES LIST: Provide a "Sources" list at the end of the response ONLY if you cited sources in the response body. If no citations are made, do NOT output a Sources list.
8. NO CITATIONS FOR CASUAL CHAT/EMAILS: Never include citations, Wikipedia links, or academic sources for casual chat, emotional support, simple emails, or personal advice.
9. TONE & CONVERSATIONAL ANCHORING:
   - You MUST match the active conversational tone, language register, emotional temperature, and language mix (e.g. Hinglish, English, Hindi) from the recent turns in the Moment.
   - If the recent turns are casual Hinglish (e.g. using "bhai", "yaar", "araam"), keep that exact register and cadence. DO NOT collapse to formal English or corporate boilerplate.
   - Never make diagnostic/clinical assertions, or assume health/ADHD conditions unless the user explicitly refers to it in the active turn.
10. LANGUAGE & SCRIPT SENSITIVITY: Match the user's language and script. If the user writes in English, respond in English. If the user writes in Hinglish (Hindi in Roman/Latin script), respond in Hinglish. Do NOT use Devnagri script unless the user's input is in Devnagri script.
            `.trim();

            // Hard cap to avoid 429
            if (systemPrompt.length > 15000) {
                console.warn(`[Composer] Prompt too large (${systemPrompt.length}), truncating to 15000`);
                systemPrompt = systemPrompt.substring(0, 15000) + '\n...[PROMPT TRUNCATED]';
            }

            console.log(`[Composer] Synthesis prompt: ${systemPrompt.length} chars`);
            const responseText = await LLMService.chat(systemPrompt, `Original Request: ${message.content}\nSynthesize the final response.`);
            
            if (!responseText) {
                console.error('[Composer] LLM returned empty — prompt may be too large');
                // Try with a much smaller prompt
                const miniPrompt = `You are Brahma. Personality:\n${soul}\n\nSummarize these results:\n${logString.substring(0, 3000)}\n\nBe direct. Cite URLs.`;
                const miniResp = await LLMService.chat(miniPrompt, message.content);
                return { originalMessage: message, content: miniResp || 'Failed to synthesize response.' };
            }

            // Skip critique to save 1 LLM call
            return { originalMessage: message, content: responseText };
        }

        // Fast Reply Lane (Simple / Greeting)
        const researchCtx = this.formatResearchContext(researchResult);
        const systemPrompt = `
You are Brahma. Here is your soul:
${soul}

Here is the current conversation memory (Moment):
${moment}

Here is the long-term knowledge about the user (Zehn):
${zehn}
${researchCtx ? researchCtx.substring(0, 1500) : ''}
Respond to the user's message appropriately. Keep it concise and use the context from both memory types to remember things like their name and past preferences.

### Tone & Conversational Anchoring Rules:
- You MUST match the active conversational tone, language register, emotional temperature, and language mix (e.g. Hinglish, English, Hindi) from the recent turns in the Moment.
- If the recent turns are casual Hinglish, keep that exact register and cadence. DO NOT collapse to formal English or corporate boilerplate.
- Never make diagnostic/clinical assertions, or assume health/ADHD conditions unless the user explicitly refers to it in the active turn.

### Language & Script Rules:
- Match the user's language and script. If the user writes in English, respond in English. If they write in Hinglish (Hindi in Roman/Latin script), respond in Hinglish. Never output Devnagri script unless the user specifically typed in Devnagri script.
        `.trim();

        const responseText = await LLMService.chat(systemPrompt, message.content);

        return {
            originalMessage: message,
            content: responseText || 'I am speechless.'
        };
    }

    /**
     * Format SCRP research context for injection into system prompts.
     */
    private static formatResearchContext(researchResult?: ResearchResult): string {
        if (!researchResult?.context_store?.entries?.length) return '';

        const entries = researchResult.context_store.entries.map(entry => {
            const facts = entry.key_facts.length > 0
                ? entry.key_facts.slice(0, 3).map(f => `  - ${f}`).join('\n')
                : '  - No verified facts';
            const sources = entry.sources.length > 0
                ? entry.sources.slice(0, 3).map((s, i) => `  [${i + 1}] ${s}`).join('\n')
                : '  No sources';
            return `**${entry.entity_name}** (${entry.confidence})\n  ${entry.what_it_is}\n${facts}\n${sources}`;
        }).join('\n\n');

        return `\n### Pre-Researched Context\n${entries}\n`;
    }
}
