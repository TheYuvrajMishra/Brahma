import { NormalizedMessage } from '../types/Message';
import { ResearchResult } from '../types/ResearchTypes';
import { MemoryManager } from '../core/MemoryManager';
import { LLMService } from '../services/LLMService';
import { Logger } from '../core/Logger';
import { SecurityGuard } from '../core/SecurityGuard';

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

        // Security Prompt Intent Check
        const secPromptCheck = SecurityGuard.inspectPromptIntent(message.content);
        if (!secPromptCheck.isSafe) {
            Logger.audit('SECURITY_INTENT_BLOCKED', { prompt: message.content, reason: secPromptCheck.reason });
            return [];
        }

        const plannerSchema = await MemoryManager.getPlannerSchema(message.user_id);
        const hunar = await MemoryManager.getHunar(message.user_id);
        const moment = await MemoryManager.getMoment(message.user_id, message.channel_id);
        const rawZehn = await MemoryManager.getZehn(message.user_id);
        const zehn = MemoryManager.getFilteredZehn(rawZehn, intent, message.content, moment);

        // Direct URL / YouTube Context Check: If YouTube or direct link research is already complete and no explicit tool action is requested, skip planning.
        const hasDirectUrlResearch = researchResult?.context_store?.entries?.some(e => 
            e.entity_name.startsWith('YouTube Video') || e.what_it_is.includes('Direct Web Article')
        );
        const isToolActionIntent = ['email_request', 'spreadsheet_request', 'command_execution'].includes(intent) ||
                                  /(send|mail|email|bhej|sheet|spreadsheet|excel|create file|delete)/i.test(message.content);

        if (hasDirectUrlResearch && !isToolActionIntent) {
            console.log('[Planner] Pre-extracted direct URL/YouTube context present. Bypassing tool planning for direct synthesis.');
            return [];
        }

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

        let emailPlanningDirective = '';
        if (intent === 'email_request' || /(send|mail|email|bhej)/i.test(message.content)) {
            emailPlanningDirective = `
### MANDATORY EMAIL PLANNER DIRECTIVE:
The user wants to send an email. You MUST generate a 2-step plan:
Step 1: "tool": "write-email" to draft the body based on the context/user input.
Step 2: "tool": "send-email" with "params": { "recipient": "<recipient_email_address>", "subject": "<descriptive_subject>", "body": "{{step1}}" }, "depends_on": [1] to send the email directly via Gmail API.
DO NOT omit Step 2 (send-email). DO NOT create a plan that only outputs a text draft or copy-paste text.
`.trim();
        }

        const zeroDeletionDirective = `
### ZERO-DELETION & PRIVACY MANDATE:
- NEVER generate steps that delete, trash, remove, wipe, or purge emails, drive files, spreadsheets, memory, or user records.
- Protect Google-connected user privacy at all times.
`.trim();

        const systemPrompt = `
You are the Planner engine for an AI assistant.
Your job is to break down the user's complex request into a strict sequence of discrete steps.

${zeroDeletionDirective}
${emailPlanningDirective}

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
