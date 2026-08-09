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
        const plannerSchema = await MemoryManager.getPlannerSchema(message.user_id);
        const hunar = await MemoryManager.getHunar(message.user_id);
        const moment = await MemoryManager.getMoment(message.user_id, message.channel_id);
        const rawZehn = await MemoryManager.getZehn(message.user_id);
        const zehn = MemoryManager.getFilteredZehn(rawZehn, intent, message.content, moment);

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

### Available Capabilities (Hunar Index)
${hunar}

### Relevant Context & Memory (Zehn)
${zehn}

### Session Memory (Moment)
${moment}
${researchContext}

Output MUST be a JSON array of step objects adhering strictly to the plan schema:
[
  {
    "step": 1,
    "action": "short action description",
    "tool": "valid_tool_name_from_hunar",
    "params": { ... },
    "depends_on": []
  }
]
Return ONLY the raw JSON array with no markdown backticks.
`.trim();

        try {
            const llmResponse = await LLMService.chat(systemPrompt, message.content, true);
            if (llmResponse) {
                const cleanResponse = llmResponse.replace(/```(?:json)?/gi, '').trim();
                const parsedPlan = JSON.parse(cleanResponse);
                if (Array.isArray(parsedPlan)) {
                    Logger.info('Planner', message.message_id, Date.now() - startTime, 'SUCCESS', { steps: parsedPlan.length });
                    return parsedPlan as PlanStep[];
                }
            }
        } catch (err) {
            console.error('Planner failed to generate or parse DAG plan:', err);
            Logger.info('Planner', message.message_id, Date.now() - startTime, 'FAILED', { error: String(err) });
        }

        return [];
    }
}
