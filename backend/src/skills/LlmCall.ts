import { ISkill } from '../types/Skill';
import { LLMService } from '../services/LLMService';

const TEMPLATE_MAP: Record<string, string> = {
    summarize_inbox: "Summarize the emails provided in the context. List each email's sender, subject, date, and a short summary of the content.",
    summarize_search: "Summarize the web search results provided in the context, highlighting key facts and sources.",
    general_processing: "Process the provided context and return the finalized output as requested by the user."
};

export class LlmCall implements ISkill {
    name = 'llm_call';
    description = 'Invokes the LLM to process or summarize data.';

    async execute(params: any): Promise<string> {
        const prompt = params.prompt || '';
        const prompt_template = params.prompt_template || 'general_processing';
        const context = params._dependency_context || 'No context provided.';
        
        let instructions = prompt;
        if (!instructions && prompt_template) {
            instructions = TEMPLATE_MAP[prompt_template] || `Execute the processing step: ${prompt_template}`;
        }
        
        const systemPrompt = `You are a cognitive processor for Brahma. Your task: ${instructions}.\nBe direct, clear, and return only the processed content. Do not include conversational preambles or chat filler in your response.`;
        const userPrompt = `Context to process:\n${context}`;
        
        const response = await LLMService.chat(systemPrompt, userPrompt);
        return response || 'No output generated from LLM.';
    }
}
