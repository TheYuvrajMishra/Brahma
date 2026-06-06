import { NormalizedMessage } from '../types/Message';
import { ResearchResult } from '../types/ResearchTypes';
import { MemoryManager } from '../core/MemoryManager';
import { LLMService } from '../services/LLMService';
import { Logger } from '../core/Logger';

export interface PlanStep {
    step: number;
    action: string;
    tool: string;
    params: any;
    depends_on: number[];
}

export class Planner {
    static async plan(message: NormalizedMessage, researchResult?: ResearchResult, intent: string = 'other'): Promise<PlanStep[]> {
        const startTime = Date.now();
        const plannerSchema = MemoryManager.getPlannerSchema();
        const hunar = MemoryManager.getHunar();
        const moment = await MemoryManager.getMoment(message.channel_id);
        const rawZehn = MemoryManager.getZehn();
        const zehn = MemoryManager.getFilteredZehn(rawZehn, intent, message.content, moment);

        // Build SCRP context injection if research was performed
        let researchContext = '';
        if (researchResult?.research_required && researchResult.context_store.entries.length > 0) {
            const summaries = researchResult.context_store.entries.map(e => {
                const facts = e.key_facts.slice(0, 3).map(f => `  - ${f}`).join('\n');
                return `**${e.entity_name}** (${e.confidence})\n  ${e.what_it_is}\n${facts}`;
            }).join('\n\n');

            researchContext = `
### Pre-Researched Context (SCRP)
These entities have already been researched. Do NOT add redundant web_search steps for them.
${summaries}

**IMPORTANT**: Generate a plan that USES this data. At minimum, include an \`llm_call\` step to synthesize findings. Only add web_search for gaps.
`;
        }

        const systemPrompt = `
You are the Planner engine for an AI assistant.
Your job is to break down the user's complex request into a strict sequence of discrete steps.

### Rules and Schema
${plannerSchema}

### Available Skills (Tools)
${hunar}

### Current Context (Moment)
${moment}

### Long-Term Context (Zehn)
${zehn}
${researchContext}
**System Time**: The current date and time is ${new Date().toISOString()}. Use this to filter out outdated news.

### Tone & Conversational Anchoring Rules:
- You MUST match the active conversational tone, language register, emotional temperature, and language mix (e.g. Hinglish, English, Hindi) from the recent turns in the Moment.
- If the recent turns are casual Hinglish (e.g., using "bhai", "yaar", "araam"), configure tool parameters (like tone in write-email) to keep that exact register and cadence. DO NOT fall back to formal English or corporate templates unless the user explicitly requests a professional email/style.
- Never write, configure, or include diagnostic/clinical assertions about health/ADHD in any parameters.

### Recipient Grounding & Self-Email Rules:
- If the user requests to send/draft an email to "me", "myself", "mujhe", or similar self-referential terms, resolve the recipient's email parameter using the email address found in the Long-Term Context (e.g., yuvraj17mishra11@gmail.com).
- If the recipient or their email address is ambiguous, make a plan step to draft the email first or ask the user for confirmation rather than fabricating details.

**Memory-Weighted Planning Directive**: Use the Long-Term Context to inform parameters and styling, but DO NOT automatically execute past actions (e.g., sending emails) unless the user explicitly requests them in the current prompt.

Return ONLY the JSON array matching the schema. No markdown ticks, no explanations.
        `.trim();

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const response = await LLMService.chat(systemPrompt, message.content, true);
                if (response) {
                    let cleanResponse = response;
                    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
                    if (jsonMatch) {
                        cleanResponse = jsonMatch[0];
                    }
                    const parsed = JSON.parse(cleanResponse);
                    
                    // Unwrap object if JSON mode forced an object wrapper
                    const planArray = Array.isArray(parsed) ? parsed : (parsed.plan || parsed.steps || Object.values(parsed)[0]);
                    
                    // Basic validation
                    if (Array.isArray(planArray) && planArray.every((s: any) => s.step && s.action && s.tool)) {
                        // Normalize missing fields
                        planArray.forEach((s: any) => {
                            if (!Array.isArray(s.depends_on)) s.depends_on = [];
                            if (!s.params) s.params = {};
                        });
                        
                        Logger.info('Planner', message.message_id, Date.now() - startTime, 'SUCCESS', { steps: planArray.length, attempt: attempts });
                        return planArray;
                    } else {
                        throw new Error("Invalid schema shape");
                    }
                }
            } catch (err) {
                Logger.error('Planner', message.message_id, `Attempt ${attempts} failed to parse plan: ${err}`);
            }
        }

        Logger.error('Planner', message.message_id, 'All planning attempts failed.');
        return [];
    }
}
