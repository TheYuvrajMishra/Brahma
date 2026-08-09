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
        let soul = await MemoryManager.getSoul(message.user_id, message.channel_id);
        const moment = await MemoryManager.getMoment(message.user_id, message.channel_id);
        const rawZehn = await MemoryManager.getZehn(message.user_id);
        const zehn = MemoryManager.getFilteredZehn(rawZehn, intent, message.content, moment);
        
        if (routeBucket === 'complex') {
            if (!executionLog) {
                if (researchResult?.context_store?.entries?.length) {
                    const ctx = this.formatResearchContext(researchResult);
                    const prompt = `You are Brahma. Here is your personality:\n${soul}\n\nPre-researched context:\n${ctx}\n\nUsing the context above, respond to the user. Cite sources with [1] notation only if factual. Be direct.`.trim();
                    const resp = await LLMService.chat(prompt, message.content);
                    if (resp) return { originalMessage: message, content: resp };
                }
                
                const directResp = await LLMService.chat(`You are Brahma. Personality:\n${soul}\n\nGive your best answer.`, message.content);
                return { originalMessage: message, content: directResp || 'I understood that you wanted me to do a complex task, but I failed to generate a valid plan for it.' };
            }

            const safeLog = executionLog.map(log => ({
                ...log,
                output: log.output && log.output.length > 1500 ? log.output.substring(0, 1500) + '\n...[TRUNCATED]...' : log.output
            }));
            const logString = JSON.stringify(safeLog, null, 2);
            
            const researchCtx = this.formatResearchContext(researchResult);
            const cappedCtx = researchCtx.length > 2000 ? researchCtx.substring(0, 2000) + '\n...[TRUNCATED]' : researchCtx;
            
            let systemPrompt = `
You are Brahma. Here is your soul/personality:
${soul}

### Conversation Memory (Moment)
${moment}

### Long-Term Context (Zehn)
${zehn}
${cappedCtx ? `\n### Pre-Researched Context\n${cappedCtx}` : ''}

The planner and executor ran steps to fulfill the user request.
Execution Results:
${logString}

Your task: Synthesize the final answer for the user based strictly on the execution results and gathered context above.
Rules:
- Be clear, coherent, helpful, and natural.
- Do NOT output JSON or raw logs unless specifically asked.
- Do NOT expose internal step numbers or system mechanics.
- Incorporate user tone preferences seamlessly.
`.trim();

            const finalResponse = await LLMService.chat(systemPrompt, message.content);
            return {
                originalMessage: message,
                content: finalResponse || 'Task execution completed successfully.'
            };
        } else if (routeBucket === 'greeting') {
            const systemPrompt = `
You are Brahma, an intelligent AI assistant runtime.
Here is your soul/personality:
${soul}

### Conversation Memory (Moment)
${moment}

### Long-Term Memory (Zehn)
${zehn}

The user greeted you. Respond with a warm, natural, helpful greeting matching your identity. Keep it concise.
`.trim();

            const greetingResponse = await LLMService.chat(systemPrompt, message.content);
            return {
                originalMessage: message,
                content: greetingResponse || 'Hello! How can I help you today?'
            };
        } else {
            // Simple bucket
            const systemPrompt = `
You are Brahma, an intelligent AI assistant runtime.
Here is your soul/personality:
${soul}

### Conversation Memory (Moment)
${moment}

### Relevant Long-Term Facts (Zehn)
${zehn}

Answer the user directly and accurately. Use your personality and memory for context.
`.trim();

            const simpleResponse = await LLMService.chat(systemPrompt, message.content);
            return {
                originalMessage: message,
                content: simpleResponse || 'Understood.'
            };
        }
    }

    private static formatResearchContext(researchResult?: ResearchResult): string {
        if (!researchResult?.context_store?.entries?.length) return '';
        return researchResult.context_store.entries.map((entry, i) => {
            const facts = entry.key_facts.map(f => `  - ${f}`).join('\n');
            const sources = entry.sources.map((s, j) => `  [${j + 1}] ${s}`).join('\n');
            return `Entity: ${entry.entity_name}\nSummary: ${entry.what_it_is}\nFacts:\n${facts}\nSources:\n${sources}`;
        }).join('\n\n');
    }
}
