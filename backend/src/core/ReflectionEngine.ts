import { MemoryManager } from './MemoryManager';
import { LLMService } from '../services/LLMService';
import { Logger } from './Logger';
import { NormalizedMessage } from '../types/Message';
import { ExecutionResult } from '../pipeline/Executor';
import { config } from '../config';

export class ReflectionEngine {
    static async runCompressionCycle(userId?: string): Promise<void> {
        if (!config.enableMemoryCompression) {
            Logger.info('ReflectionEngine', 'system', 0, 'SKIPPED', { reason: 'Memory compression disabled per user preference' });
            return;
        }

        const startTime = Date.now();
        try {
            const rawZehn = await MemoryManager.getZehn(userId);
            if (!rawZehn || !rawZehn.trim()) {
                Logger.info('ReflectionEngine', 'system', 0, 'SKIPPED', { reason: 'Memory is empty' });
                return;
            }

            const prompt = `
You are the Memory Compression Engine for Brahma.
Your task is to review and compress the long-term memory file (zehn.md) to keep it clean, concise, structured, and indexed.

The memory file follows a strict indexed section structure:
1. Index & Routing Table at the top listing sections [SEC-01] to [SEC-07].
2. Section headers:
   - ## [SEC-01] User Identity & Core Profile
   - ## [SEC-02] People & Relationships
   - ## [SEC-03] Persona & Communication Preferences
   - ## [SEC-04] Work, Career & Projects
   - ## [SEC-05] Contact Information & Channels
   - ## [SEC-06] Health, Habits & Routines
   - ## [SEC-07] System & Technical Config

Review and optimize each section:
- Combine duplicate observations and facts within their respective sections.
- Resolve any conflicting statements, prioritizing more recent information.
- Maintain the section headers exactly as formatted above.

Output the ENTIRE updated markdown file.
Output ONLY the markdown content. Do NOT include markdown code fence ticks (\`\`\`) or any introductory/explanatory text.
            `.trim();

            const compressedResult = await LLMService.chat(prompt, `Here is the current memory file content:\n\n${rawZehn}`);
            if (compressedResult && compressedResult.trim()) {
                let cleanedContent = compressedResult.trim();
                cleanedContent = cleanedContent.replace(/^```(markdown)?\n/i, '');
                cleanedContent = cleanedContent.replace(/\n```$/g, '');
                cleanedContent = cleanedContent.trim();
                
                await MemoryManager.updateZehn(cleanedContent, userId);
                Logger.info('ReflectionEngine', 'system', Date.now() - startTime, 'COMPRESSED', { 
                    original_length: rawZehn.length, 
                    compressed_length: cleanedContent.length,
                    userId
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
MANDATORY CONSTRAINTS:
- Output ONLY a single-sentence fact if yes, or "NONE" if no.
- Do NOT record system-level task execution status, tool performance, internal component configurations, or execution log messages.
- The fact must focus strictly on the USER's profile, preferences, constraints, or work style.
- Do NOT include markdown formatting, bullet points, headers, or any introductory conversational text.
        `.trim();

        try {
            const evaluation = await LLMService.chat(systemPrompt, 'Evaluate task.');
            let cleaned = (evaluation || '').trim();
            
            cleaned = cleaned.replace(/^(##|###|\*|-)\s*/g, '');
            cleaned = cleaned.replace(/^Fact:\s*/i, '');
            
            if (cleaned && cleaned.toLowerCase() !== "none" && !cleaned.toLowerCase().includes("task evaluation") && cleaned.split('\n').length <= 2) {
                await MemoryManager.appendZehnFact(cleaned, undefined, message.user_id);
                Logger.info('ReflectionEngine', message.message_id, Date.now() - startTime, 'LEARNED_FACT', { fact: cleaned, userId: message.user_id });
            } else {
                Logger.info('ReflectionEngine', message.message_id, Date.now() - startTime, 'NO_NEW_LEARNINGS');
            }
        } catch (error) {
            Logger.error('ReflectionEngine', message.message_id, error);
        }
    }
}
