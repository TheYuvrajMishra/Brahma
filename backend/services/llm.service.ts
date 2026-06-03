import dotenv from 'dotenv';

dotenv.config();

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CompletionOptions {
    temperature?: number;
    max_tokens?: number;
    json_mode?: boolean;
}

export class LLMService {
    private static baseUrl = process.env.LLM_BASE_URL || 'http://localhost:3001/v1/chat/completions';

    static async chat(messages: ChatMessage[], options: CompletionOptions = {}): Promise<string> {
        try {
            const body: any = {
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.max_tokens ?? 2000,
                response_format: options.json_mode ? { type: 'json_object' } : undefined,
            };

            if (process.env.LLM_MODEL) {
                body.model = process.env.LLM_MODEL;
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`LLM API Error: ${error}`);
            }

            const data = await response.json() as { choices: { message: { content: string } }[] };
            return data.choices[0].message.content;
        } catch (error) {
            console.error('LLM Service Error:', error);
            throw error;
        }
    }
}
