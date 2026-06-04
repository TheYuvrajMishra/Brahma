import { MemoryManager } from './MemoryManager';
import { LLMService } from '../services/LLMService';
import { Logger } from './Logger';

export class ReflectionEngine {
    static async runCompressionCycle(): Promise<void> {
        const startTime = Date.now();
        Logger.info('ReflectionEngine', 'system', 0, 'START');

        const currentZehn = MemoryManager.getZehn();

        if (!currentZehn.trim()) {
            Logger.info('ReflectionEngine', 'system', Date.now() - startTime, 'SKIPPED', { reason: 'zehn.md is empty' });
            return;
        }

        const systemPrompt = `
You are the Memory Reflection Engine for Brahma.
Your job is to read the raw, uncompressed long-term memory file and rewrite it into a highly compressed, structured format.

CRITICAL INSTRUCTIONS:
1. Discard redundant facts.
2. Resolve contradictions by favoring more recent facts (look at the ISO timestamps).
3. Structure the output into EXACTLY these two sections:
   ## Core Facts (Importance > 0.8)
   ## Contextual Notes (Importance < 0.8)
4. Use bullet points. Keep it extremely concise.

Here is the uncompressed memory:
${currentZehn}

Return ONLY the new markdown format. Do not include markdown code block ticks.
        `.trim();

        try {
            const compressedMemory = await LLMService.chat(systemPrompt, 'Run memory compression.');
            
            if (compressedMemory && compressedMemory.includes('## Core Facts')) {
                MemoryManager.updateZehn(compressedMemory.trim());
                Logger.info('ReflectionEngine', 'system', Date.now() - startTime, 'SUCCESS');
            } else {
                Logger.info('ReflectionEngine', 'system', Date.now() - startTime, 'FAILED', { reason: 'LLM returned invalid format' });
            }
        } catch (error) {
            Logger.error('ReflectionEngine', 'system', error);
        }
    }
}
