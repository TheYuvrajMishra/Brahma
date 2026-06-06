import { NormalizedMessage } from '../types/Message';
import { LLMService } from '../services/LLMService';
import { MemoryManager } from '../core/MemoryManager';

export interface RouteResult {
    bucket: 'greeting' | 'simple' | 'complex';
    rule_matched: string;
    confidence_score: number;
}

export class Router {
    /**
     * Phase 3: Hybrid Classifier
     */
    static async route(message: NormalizedMessage): Promise<RouteResult> {
        const text = message.content.trim().toLowerCase();

        // 1. Rules: Greetings (only if the message is purely a greeting)
        const greetingRegex = /^(hi|hello|hey|sup|what's up|greetings)(\s|$|[!?.,])/;
        if (greetingRegex.test(text)) {
            const cleanedText = text
                .replace(/^(hi|hello|hey|sup|what's up|greetings)/g, '')
                .replace(/\bbrahma\b/g, '')
                .replace(/[!?.,\s]/g, '')
                .trim();
            
            if (cleanedText.length === 0) {
                return {
                    bucket: 'greeting',
                    rule_matched: 'regex_greeting',
                    confidence_score: 1.0
                };
            }
        }

        // 2. Rules: Simple constraints
        const words = text.split(/\s+/);
        const actionVerbs = ['create', 'plan', 'research', 'summarize', 'write', 'analyze', 'generate', 'build', 'send', 'mail', 'email', 'message', 'msg'];
        const hasActionVerb = actionVerbs.some(verb => text.includes(verb));
        
        const moment = await MemoryManager.getMoment(message.channel_id);
        const hasActiveTask = /active task:\s*(?!none\b)\w+/i.test(moment);
        const confirmationWords = ['yes', 'confirm', 'yup', 'do it', 'go ahead', 'sure', 'ok', 'okay', 'yep', 'y', 'correct'];
        const isNumber = /^\d+$/.test(text);
        const isSingleLetter = /^[a-z]$/.test(text);
        const isConfirmation = confirmationWords.includes(text) || 
                               confirmationWords.some(word => text.startsWith(word)) ||
                               isNumber ||
                               isSingleLetter;

        if (words.length <= 6 && !hasActionVerb && !hasActiveTask && !isConfirmation) {
            return {
                bucket: 'simple',
                rule_matched: 'rule_length_and_verbs',
                confidence_score: 0.9
            };
        }

        // 2.5 Force complex if action verb is explicitly used
        if (hasActionVerb) {
            return {
                bucket: 'complex',
                rule_matched: 'rule_action_verb',
                confidence_score: 0.9
            };
        }

        // 3. LLM Fallback (Complex vs Simple)
        const systemPrompt = `
You are an intent classifier for an AI assistant.
Classify the user's message into exactly one of these two buckets:
- "simple": A straightforward question, casual chat, or query that does NOT require multi-step planning.
- "complex": A task that requires multi-step planning, research, executing tools, or writing a detailed report.

### Context (Current Conversation Memory)
${moment}

Respond ONLY with a JSON object in this format:
{"bucket": "simple" | "complex", "confidence": <float between 0 and 1>}
        `.trim();

        try {
            const llmResponse = await LLMService.chat(systemPrompt, `User Message: ${message.content}\nClassify the intent based on context.`, true);
            if (llmResponse) {
                const cleanResponse = llmResponse.replace(/```(?:json)?/gi, '').trim();
                const parsed = JSON.parse(cleanResponse);
                if (parsed.bucket === 'simple' || parsed.bucket === 'complex') {
                    return {
                        bucket: parsed.bucket,
                        rule_matched: 'llm_classifier',
                        confidence_score: parsed.confidence || 0.5
                    };
                }
            }
        } catch (err) {
            console.error('LLM routing failed, falling back to simple.', err);
        }

        // Fallback if LLM is offline or fails to parse
        return {
            bucket: 'simple',
            rule_matched: 'fallback_error',
            confidence_score: 0.0
        };
    }
}
