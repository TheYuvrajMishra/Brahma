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
            
            const critiquePrompt = `
You are an Internal Critique Engine for Brahma.
Evaluate the following synthesized response for quality, tone (based on the soul), and directness.
If the response uses generic AI boilerplate or fails to present information clearly, rewrite it to be better.
If it is already excellent, reply EXACTLY with "PASS".
Response to evaluate:
${responseText}
            `.trim();
            const critiqueResponse = await LLMService.chat(critiquePrompt, "Evaluate and rewrite if necessary.");
            const finalContent = (critiqueResponse && critiqueResponse.trim() !== "PASS") ? critiqueResponse : responseText;

            return {
                originalMessage: message,
                content: finalContent || 'Failed to synthesize response.'
            };
        }

        // Fast Reply Lane (Simple / Greeting)
        const moment = MemoryManager.getMoment();
        const systemPrompt = `
You are Brahma. Here is your soul:
${soul}

Here is the current conversation memory (Moment):
${moment}

Respond to the user's message appropriately. Keep it concise and use the context from the memory to remember things like their name.
        `.trim();

        const responseText = await LLMService.chat(systemPrompt, message.content);

        return {
            originalMessage: message,
            content: responseText || 'I am speechless.'
        };
    }
}


