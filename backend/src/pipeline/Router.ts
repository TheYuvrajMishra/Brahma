import { NormalizedMessage } from '../types/Message';
import { LLMService } from '../services/LLMService';

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

        // 1. Rules: Greetings
        const greetingRegex = /^(hi|hello|hey|sup|what's up|greetings)(\s|$|[!?.,])/;
        if (greetingRegex.test(text)) {
            return {
                bucket: 'greeting',
                rule_matched: 'regex_greeting',
                confidence_score: 1.0
            };
        }

        // 2. Rules: Simple constraints
        const words = text.split(/\s+/);
        const actionVerbs = ['create', 'plan', 'research', 'summarize', 'write', 'analyze', 'generate', 'build'];
        const hasActionVerb = actionVerbs.some(verb => text.includes(verb));
        
        if (words.length <= 6 && !hasActionVerb) {
            return {
                bucket: 'simple',
                rule_matched: 'rule_length_and_verbs',
                confidence_score: 0.9
            };
        }

        // 3. LLM Fallback (Complex vs Simple)
        const systemPrompt = `
You are an intent classifier for an AI assistant.
Classify the following user message into exactly one of these two buckets:
- "simple": A straightforward question, casual chat, or query that does NOT require multi-step planning.
- "complex": A task that requires multi-step planning, research, executing tools, or writing a detailed report.

Respond ONLY with a JSON object in this format:
{"bucket": "simple" | "complex", "confidence": <float between 0 and 1>}
        `.trim();

        try {
            const llmResponse = await LLMService.chat(systemPrompt, message.content, true);
            if (llmResponse) {
                const parsed = JSON.parse(llmResponse);
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
