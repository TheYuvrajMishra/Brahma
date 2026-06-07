import { MemoryManager } from './MemoryManager';
import { LLMService } from '../services/LLMService';
import { Logger } from './Logger';
import { NormalizedMessage } from '../types/Message';
import { ExecutionResult } from '../pipeline/Executor';
import { config } from '../config';

export class ReflectionEngine {
    static async runCompressionCycle(): Promise<void> {
        if (!config.enableMemoryCompression) {
            Logger.info('ReflectionEngine', 'system', 0, 'SKIPPED', { reason: 'Memory compression disabled per user preference' });
            return;
        }

        const startTime = Date.now();
        try {
            const rawZehn = await MemoryManager.getZehn();
            if (!rawZehn || !rawZehn.trim()) {
                Logger.info('ReflectionEngine', 'system', 0, 'SKIPPED', { reason: 'Memory is empty' });
                return;
            }

            const prompt = `
You are the Memory Compression Engine for Brahma.
Your task is to review and compress the long-term memory file (zehn.md) to keep it clean, concise, and structured.

The memory file contains two sections:
1. "## Core Facts (Importance > 0.8)" - These are fundamental user details (e.g. name, email, preferred UI mode, active projects, and core Brahma definition). You MUST preserve these core facts exactly as they are without deleting or changing them.
2. "## Contextual Notes (Importance < 0.8)" - These are temporary or contextual notes, preferences, and observations. Over time, these can become duplicate, verbose, or contradictory.

Analyze the "## Contextual Notes" section:
- Combine similar observations and facts into clean, single-sentence points (e.g. consolidate multiple entries about preferred tone, persona styles, or stress levels).
- Resolve any conflicting statements, prioritizing more recent timestamps.
- Prune minor, transient, or low-value observations (like temporary tool execution details or transient failures).
- Maintain timestamp references only when they are highly relevant to tracking changes in preferences over time.

Output the entire updated markdown file containing BOTH the "## Core Facts" (untouched) and the new, consolidated "## Contextual Notes".
Output ONLY the markdown content. Do NOT include markdown code fence ticks (\`\`\`) or any introductory/explanatory text.
            `.trim();

            const compressedResult = await LLMService.chat(prompt, `Here is the current memory file content:\n\n${rawZehn}`);
            if (compressedResult && compressedResult.trim()) {
                let cleanedContent = compressedResult.trim();
                // Strip markdown code fence markers if LLM accidentally outputted them
                cleanedContent = cleanedContent.replace(/^```(markdown)?\n/i, '');
                cleanedContent = cleanedContent.replace(/\n```$/g, '');
                cleanedContent = cleanedContent.trim();
                
                await MemoryManager.updateZehn(cleanedContent);
                Logger.info('ReflectionEngine', 'system', Date.now() - startTime, 'COMPRESSED', { 
                    original_length: rawZehn.length, 
                    compressed_length: cleanedContent.length 
                });
            } else {
                Logger.info('ReflectionEngine', 'system', Date.now() - startTime, 'EMPTY_COMPRESSION_RESULT');
            }
        } catch (error) {
            Logger.error('ReflectionEngine', 'system', error);
        }
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
                await MemoryManager.appendZehnFact(cleaned);
                Logger.info('ReflectionEngine', message.message_id, Date.now() - startTime, 'LEARNED_FACT', { fact: cleaned });
            } else {
                Logger.info('ReflectionEngine', message.message_id, Date.now() - startTime, 'NO_NEW_LEARNINGS');
            }
        } catch (error) {
            Logger.error('ReflectionEngine', message.message_id, error);
        }
    }
}
