import { MemoryManager } from './MemoryManager';
import { LLMService } from '../services/LLMService';
import { Logger } from './Logger';
import { NormalizedMessage } from '../types/Message';
import { ExecutionResult } from '../pipeline/Executor';

export class ReflectionEngine {
    static async runCompressionCycle(): Promise<void> {
        Logger.info('ReflectionEngine', 'system', 0, 'SKIPPED', { reason: 'Memory compression disabled per user preference' });
        return;
    }

    static async evaluateTask(message: NormalizedMessage, executionLog: ExecutionResult[], finalResponse: string): Promise<void> {
        const startTime = Date.now();
        const systemPrompt = `
You are the Self-Reflection Engine for Brahma.
Evaluate the recent task execution.
Original Request: ${message.content}
Execution Log: ${JSON.stringify(executionLog)}
Final Response: ${finalResponse}

Did we learn anything new about the user's preferences, constraints, or workflows that should be remembered for next time?
MANDATORY: Output ONLY a single-sentence fact if yes, or "NONE" if no.
Do NOT include markdown formatting, bullet points, headers, or any introductory conversational text.
        `.trim();

        try {
            const evaluation = await LLMService.chat(systemPrompt, 'Evaluate task.');
            let cleaned = (evaluation || '').trim();
            
            // Clean up headers or markdown prefixes
            cleaned = cleaned.replace(/^(##|###|\*|-)\s*/g, '');
            cleaned = cleaned.replace(/^Fact:\s*/i, '');
            
            if (cleaned && cleaned.toLowerCase() !== "none" && !cleaned.toLowerCase().includes("task evaluation") && cleaned.split('\n').length <= 2) {
                MemoryManager.appendZehnFact(cleaned);
                Logger.info('ReflectionEngine', message.message_id, Date.now() - startTime, 'LEARNED_FACT', { fact: cleaned });
            } else {
                Logger.info('ReflectionEngine', message.message_id, Date.now() - startTime, 'NO_NEW_LEARNINGS');
            }
        } catch (error) {
            Logger.error('ReflectionEngine', message.message_id, error);
        }
    }
}
