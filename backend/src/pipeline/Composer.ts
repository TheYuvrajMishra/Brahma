import { NormalizedMessage, PipelineResponse } from '../types/Message';
import { ResearchResult } from '../types/ResearchTypes';
import { MemoryManager } from '../core/MemoryManager';
import { LLMService } from '../services/LLMService';
import { ExecutionResult } from './Executor';

export class Composer {
    /**
     * Phase 8: Final Synthesis
     */
    static async compose(message: NormalizedMessage, routeBucket: string, executionLog?: ExecutionResult[], researchResult?: ResearchResult): Promise<PipelineResponse> {
        let soul = await MemoryManager.getSoul(message.channel_id);
        
        if (routeBucket === 'complex') {
            if (!executionLog) {
                // Graceful degradation: if research found something, synthesize from it
                if (researchResult?.context_store?.entries?.length) {
                    const ctx = this.formatResearchContext(researchResult);
                    const prompt = `You are Brahma. Here is your personality:\n${soul}\n\nPre-researched context:\n${ctx}\n\nUsing the context above, respond to the user. Cite sources with [1] notation. Be direct.`.trim();
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
6. MANDATORY CITATIONS: Every single factual claim or news item MUST have an inline citation like [1] pointing to a specific URL provided in the execution log or pre-researched context.
7. MANDATORY SOURCES LIST: If you make citations, you MUST end your response with a "Sources" list containing the clickable markdown links.
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
        const moment = await MemoryManager.getMoment(message.channel_id);
        const zehn = MemoryManager.getZehn();
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
