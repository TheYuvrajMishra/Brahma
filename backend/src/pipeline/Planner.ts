import { NormalizedMessage } from '../types/Message';
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
    static async plan(message: NormalizedMessage): Promise<PlanStep[]> {
        const startTime = Date.now();
        const plannerSchema = MemoryManager.getPlannerSchema();
        const hunar = MemoryManager.getHunar();
        const moment = MemoryManager.getMoment();
        const zehn = MemoryManager.getZehn();

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

**Memory-Weighted Planning Directive**: Bias your plan to use strategies and parameters that align with the user's past preferences found in the Long-Term Context.

Return ONLY the JSON array matching the schema. No markdown ticks, no explanations.
        `.trim();

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const response = await LLMService.chat(systemPrompt, message.content, true);
                if (response) {
                    const cleanResponse = response.replace(/```(?:json)?/gi, '').trim();
                    const parsed = JSON.parse(cleanResponse);
                    
                    // Basic validation
                    if (Array.isArray(parsed) && parsed.every(s => s.step && s.action && s.tool && Array.isArray(s.depends_on))) {
                        Logger.info('Planner', message.message_id, Date.now() - startTime, 'SUCCESS', { steps: parsed.length, attempt: attempts });
                        return parsed;
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
