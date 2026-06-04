import { ISkill } from '../types/Skill';
import { LLMService } from '../services/LLMService';

export class LlmCall implements ISkill {
    name = 'llm_call';
    description = 'Invokes the LLM to process or summarize data.';

    async execute(params: any): Promise<string> {
        const prompt_template = params.prompt_template || 'general_processing';
        const context = params._dependency_context || 'No context provided.';
        
        const systemPrompt = `You are executing an internal processing step. Template: ${prompt_template}`;
        const userPrompt = `Process the following context and return the finalized string output.\n\nContext:\n${context}`;
        
        const response = await LLMService.chat(systemPrompt, userPrompt);
        return response || 'No output generated from LLM.';
    }
}
