import { NormalizedMessage, PipelineResponse } from '../types/Message';
import { MemoryManager } from '../core/MemoryManager';
import { LLMService } from '../services/LLMService';
import { ExecutionResult } from './Executor';

export class Composer {
    /**
     * Phase 8: Final Synthesis
     */
    static async compose(message: NormalizedMessage, routeBucket: string, executionLog?: ExecutionResult[]): Promise<PipelineResponse> {
        let soul = MemoryManager.getSoul();
        
        if (routeBucket === 'complex') {
            if (!executionLog) {
                return {
                    originalMessage: message,
                    content: 'I understood that you wanted me to do a complex task, but I failed to generate a valid plan for it.'
                };
            }

            const safeLog = executionLog.map(log => ({
                ...log,
                output: log.output && log.output.length > 2000 ? log.output.substring(0, 2000) + '\n...[TRUNCATED FOR SYNTHESIS]...' : log.output
            }));
            const logString = JSON.stringify(safeLog, null, 2);
            
            const systemPrompt = `
You are Brahma. Here is your soul/personality:
${soul}

You have just executed a complex plan for the user. Here are the results of your execution:
${logString}

Your task is to synthesize these results into a final, conversational response for the user.
CRITICAL INSTRUCTIONS:
1. Speak EXACTLY in your defined Tone and Personality.
2. NEVER use generic AI boilerplate (e.g., "I have conducted a search", "Here is a summary", "Next Steps", "If you need more help").
3. DO NOT use generic section headers like "Search Overview" or "Detailed Summary". 
4. Be direct, concise, and just state what you found or generated.
5. If a tool generated a blog post or email, present it clearly using Markdown.
            `.trim();

            const responseText = await LLMService.chat(systemPrompt, `Original Request: ${message.content}\nSynthesize the final response.`);
            
            const critiquePrompt = `
You are an Internal Critique Engine for Brahma.
Check the following synthesized response for quality, tone, and directness.
If the response uses generic AI boilerplate or fails to present information clearly, output ONLY the rewritten response. Do NOT include any explanations, rationales, or the word "Evaluation".
If it is already excellent, output EXACTLY the word "PASS" and nothing else.
Response to evaluate:
${responseText}
            `.trim();
            const critiqueResponse = await LLMService.chat(critiquePrompt, "Output ONLY the rewrite, or PASS.");
            
            let finalContent = responseText;
            if (critiqueResponse) {
                const cleanCritique = critiqueResponse.trim();
                // If it's not a pass and not empty, use the critique
                if (cleanCritique !== "PASS" && cleanCritique !== '"PASS"' && !cleanCritique.endsWith("PASS")) {
                    finalContent = cleanCritique;
                }
            }

            return {
                originalMessage: message,
                content: finalContent || 'Failed to synthesize response.'
            };
        }

        // Fast Reply Lane (Simple / Greeting)
        const moment = MemoryManager.getMoment();
        const zehn = MemoryManager.getZehn();
        const systemPrompt = `
You are Brahma. Here is your soul:
${soul}

Here is the current conversation memory (Moment):
${moment}

Here is the long-term knowledge about the user (Zehn):
${zehn}

Respond to the user's message appropriately. Keep it concise and use the context from both memory types to remember things like their name and past preferences.
        `.trim();

        const responseText = await LLMService.chat(systemPrompt, message.content);

        return {
            originalMessage: message,
            content: responseText || 'I am speechless.'
        };
    }
}


