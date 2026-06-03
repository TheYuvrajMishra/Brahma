import { LLMService, ChatMessage } from './llm.service';
import { ContextService } from './context.service';

export interface Plan {
    intent: 'QUERY' | 'ACTION' | 'REFLECTION';
    requiredContext: {
        category: 'Zehn' | 'Karma' | 'Chintan';
        file: string;
        query: string;
    }[];
    strategy: string;
}

export class PlannerService {
    /**
     * Helper to robustly extract and validate JSON plan from LLM response.
     */
    static parsePlan(text: string): Plan {
        let parsed: any;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1 && end > start) {
                const jsonStr = text.substring(start, end + 1);
                try {
                    parsed = JSON.parse(jsonStr);
                } catch (innerError) {
                    const cleaned = jsonStr
                        .replace(/,(\s*[\]}])/g, '$1') // remove trailing commas
                        .replace(/[\u0000-\u001F]+/g, ' '); // remove control characters
                    try {
                        parsed = JSON.parse(cleaned);
                    } catch (finalError) {
                        console.error('Failed to parse extracted JSON content:', jsonStr);
                        throw new SyntaxError(`Failed to parse plan JSON: ${(finalError as Error).message}`);
                    }
                }
            } else {
                throw new SyntaxError(`Could not find a valid JSON object in response: ${text}`);
            }
        }

        // Validate structure and apply safe defaults
        const plan: Plan = {
            intent: 'QUERY',
            requiredContext: [],
            strategy: ''
        };

        if (parsed) {
            if (parsed.intent === 'QUERY' || parsed.intent === 'ACTION' || parsed.intent === 'REFLECTION') {
                plan.intent = parsed.intent;
            } else {
                plan.intent = 'QUERY';
            }

            if (Array.isArray(parsed.requiredContext)) {
                plan.requiredContext = parsed.requiredContext.filter((ctx: any) => {
                    return ctx && typeof ctx === 'object' && 
                        (ctx.category === 'Zehn' || ctx.category === 'Karma' || ctx.category === 'Chintan') &&
                        typeof ctx.file === 'string' &&
                        typeof ctx.query === 'string';
                });
            }

            if (typeof parsed.strategy === 'string') {
                plan.strategy = parsed.strategy;
            }
        }

        return plan;
    }

    /**
     * Buddhi: Decomposes the user query into a strategic plan.
     */
    static async generatePlan(userQuery: string, preliminaryContext: string = ''): Promise<Plan> {
        const soul = await ContextService.getSoul();
        
        const systemPrompt = `
You are Buddhi, the Planner for Brahma. 
Your soul configuration (Atman) is:
${soul}

Analyze the user's query and decide what context is needed from the Brahma [brain].
Available Context:
- Zehn/entities.md (People, Places, things)
- Zehn/relationships.md (Social graph)
- Karma/long_term_memory.md (Permanent facts)
- Chintan/evolution.md (Reflection/style)

${preliminaryContext ? `Preliminary Context:\n${preliminaryContext}\n` : ''}
You MUST respond with a valid JSON object matching the structure below.
Do not include any explanations, markdown code blocks, or preamble. Return ONLY the raw JSON.

{
    "intent": "QUERY" | "ACTION" | "REFLECTION",
    "requiredContext": [
        { "category": "Zehn" | "Karma" | "Chintan", "file": "filename.md", "query": "keyword to find in index" }
    ],
    "strategy": "Detailed strategy of how to fulfill the request"
}
`;

        const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuery }
        ];

        const response = await LLMService.chat(messages, { json_mode: true });
        return this.parsePlan(response);
    }
}
