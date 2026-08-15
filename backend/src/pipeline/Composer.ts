import { NormalizedMessage, PipelineResponse } from '../types/Message';
import { ResearchResult } from '../types/ResearchTypes';
import { MemoryManager } from '../core/MemoryManager';
import { LLMService } from '../services/LLMService';
import { ExecutionResult } from './Executor';
import { SecurityGuard } from '../core/SecurityGuard';

const MARKDOWN_HIERARCHY_PROMPT = `
### Response Formatting & Visual Hierarchy Guidelines
Format your response using clean Markdown structure and a clear visual hierarchy:
- **Headings**: Use Headings (# Main Title, ## Primary Section, ### Sub-Section, #### Micro-Title) logically to structure your content into clear sections. Do not skip heading levels.
- **Scannability & Bold Terms**: Bold (**key concept**) important technical terms, metrics, key concepts, and takeaways so the user can easily scan the answer.
- **Paragraphs**: Write clear, well-spaced paragraphs (2-4 sentences max per paragraph). Avoid dense unformatted walls of text.
- **Lists**: Use bullet points (- or *) for lists of features/items, and numbered lists (1., 2.) for step-by-step workflows.
- **Callouts & Highlights**: Use blockquotes (> summary or key takeaway) for key highlights or executive summaries.
- **Code & Tables**: Use fenced code blocks with language identifiers for all code/commands, and Markdown tables for structured comparison data.

### CRITICAL SECURITY & IDENTITY RULES:
- **Zero-Deletion & Privacy Guarantee**: Brahma operates with an active Zero-Deletion and Privacy Protection Shield. Connected user data, emails, spreadsheets, and files can NEVER be deleted, purged, or compromised.
- Brahma HAS full automated Gmail sending integration through the \`send-email\` tool. NEVER state "I do not have direct email-sending capabilities", "I cannot send that email for you", or "I provide drafts for manual copy-paste".
- If a \`send-email\` step executed in the Execution Results, state clearly and concisely that the email has been sent to the recipient.
`.trim();

export class Composer {
    /**
     * Phase 8: Final Synthesis
     */
    static async compose(message: NormalizedMessage, routeBucket: string, executionLog?: ExecutionResult[], researchResult?: ResearchResult, intent: string = 'other'): Promise<PipelineResponse> {
        // Direct Return for YouTube Structured Outputs
        const ytEntry = researchResult?.context_store?.entries?.find(e => e.entity_name.startsWith('YouTube Video'));
        if (ytEntry && ytEntry.key_facts?.[0] && ytEntry.key_facts[0].length > 150) {
            console.log('[Composer] Returning pre-synthesized YouTube structured content directly to user.');
            return {
                originalMessage: message,
                content: SecurityGuard.appendSecurityFooter(ytEntry.key_facts[0])
            };
        }

        let soul = await MemoryManager.getSoul(message.user_id, message.channel_id);
        const moment = await MemoryManager.getMoment(message.user_id, message.channel_id);
        const rawZehn = await MemoryManager.getZehn(message.user_id);
        const zehn = MemoryManager.getFilteredZehn(rawZehn, intent, message.content, moment);

        let responseContent = '';
        
        if (routeBucket === 'complex') {
            if (!executionLog) {
                if (researchResult?.context_store?.entries?.length) {
                    const ctx = this.formatResearchContext(researchResult);
                    const prompt = `You are Brahma. Here is your personality:\n${soul}\n\n${MARKDOWN_HIERARCHY_PROMPT}\n\nPre-researched context:\n${ctx}\n\nUsing the context above, respond to the user. Cite sources with [1] notation only if factual. Be direct.`.trim();
                    const resp = await LLMService.chat(prompt, message.content);
                    if (resp) {
                        return { originalMessage: message, content: SecurityGuard.appendSecurityFooter(resp) };
                    }
                    return { originalMessage: message, content: SecurityGuard.appendSecurityFooter(ctx) };
                }
                
                const directResp = await LLMService.chat(`You are Brahma. Personality:\n${soul}\n\n${MARKDOWN_HIERARCHY_PROMPT}\n\nGive your best answer.`, message.content);
                responseContent = directResp || 'I understood that you wanted me to do a task, but I encountered an issue processing the request.';
                return { originalMessage: message, content: SecurityGuard.appendSecurityFooter(responseContent) };
            }

            const safeLog = executionLog.map(log => ({
                ...log,
                output: log.output && log.output.length > 2500 ? log.output.substring(0, 2500) + '\n...[TRUNCATED]...' : log.output
            }));
            const logString = JSON.stringify(safeLog, null, 2);
            
            const researchCtx = this.formatResearchContext(researchResult);
            const cappedCtx = researchCtx.length > 30000 ? researchCtx.substring(0, 30000) + '\n...[TRUNCATED]' : researchCtx;
            
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

${MARKDOWN_HIERARCHY_PROMPT}

Rules:
- Be clear, coherent, helpful, and natural.
- Do NOT output JSON or raw logs unless specifically asked.
- Do NOT expose internal step numbers or system mechanics.
- Incorporate user tone preferences seamlessly.
`.trim();

            const finalResponse = await LLMService.chat(systemPrompt, message.content);
            responseContent = finalResponse || (cappedCtx ? cappedCtx : 'Task execution completed successfully.');
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
            responseContent = greetingResponse || 'Hello! How can I help you today?';
        } else {
            // Simple bucket
            const researchCtx = this.formatResearchContext(researchResult);
            const cappedCtx = researchCtx.length > 30000 ? researchCtx.substring(0, 30000) + '\n...[TRUNCATED]' : researchCtx;

            const systemPrompt = `
You are Brahma, an intelligent AI assistant runtime.
Here is your soul/personality:
${soul}

### Conversation Memory (Moment)
${moment}

### Relevant Long-Term Facts (Zehn)
${zehn}
${cappedCtx ? `\n### Pre-Researched Web Context\n${cappedCtx}` : ''}

${MARKDOWN_HIERARCHY_PROMPT}

Answer the user directly and accurately. Use your personality, memory, and researched web context to give a clear answer. Cite sources if web context is provided.
`.trim();

            const simpleResponse = await LLMService.chat(systemPrompt, message.content);
            responseContent = simpleResponse || (cappedCtx ? cappedCtx : 'Understood.');
        }

        return {
            originalMessage: message,
            content: SecurityGuard.appendSecurityFooter(responseContent)
        };
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
