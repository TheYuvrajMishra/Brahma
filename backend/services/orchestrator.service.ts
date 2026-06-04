import { PlannerService } from './planner.service';
import { RAGService } from './rag.service';
import { LLMService, ChatMessage } from './llm.service';
import { ContextService } from './context.service';

export class OrchestratorService {
    static async run(userQuery: string): Promise<string> {
        try {
            // 1. Plan (Buddhi)
            console.log('--- Phase A: Strategic Synthesis (Planning) ---');
            const plan = await PlannerService.generatePlan(userQuery);
            console.log('Plan generated:', JSON.stringify(plan, null, 2));

            // 2. Hydrate Context (RAG)
            console.log('--- Phase B: Tactical Execution (Context Hydration) ---');
            const contextChunks = await RAGService.hydrateContext(plan);
            const hydratedQuery = await RAGService.process(userQuery, contextChunks);

            // 3. Execute Response (Karma)
            const soul = await ContextService.getSoul();
            const messages: ChatMessage[] = [
                { role: 'system', content: `You are Brahma. ${soul}` },
                { role: 'user', content: hydratedQuery }
            ];

            const response = await LLMService.chat(messages);
            
            // 4. Reflection (Chintan) - Placeholder for now
            console.log('--- Phase C: Cognitive Integration (Reflection) ---');
            
            return response;
        } catch (error) {
            console.error('Orchestration Error Detail:', error);
            if (error instanceof Error) {
                console.error('Stack:', error.stack);
            }
            return "I encountered an error while processing your request.";
        }
    }
}
