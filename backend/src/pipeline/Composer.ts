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
        
        if (routeBucket === 'complex' && executionLog) {
            const logString = JSON.stringify(executionLog, null, 2);
            
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
            
            return {
                originalMessage: message,
                content: responseText || 'Failed to synthesize response.'
            };
        }

        // Fast Reply Lane (Simple / Greeting)
        const systemPrompt = `
You are Brahma. Here is your soul:
${soul}

Respond to the user's message appropriately. Keep it concise.
        `.trim();

        const responseText = await LLMService.chat(systemPrompt, message.content);

        return {
            originalMessage: message,
            content: responseText || 'I am speechless.'
        };
    }
}


