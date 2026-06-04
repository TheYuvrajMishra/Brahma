import { config } from '../config';

export class LLMService {
    static async chat(systemPrompt: string, userMessage: string, requireJson = false): Promise<string> {
        try {
            let endpoint = config.llmBaseUrl;
            if (!endpoint.endsWith(config.llmEndpoint)) {
                endpoint += config.llmEndpoint;
            }
            const body = {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.3,
                ...(requireJson && { response_format: { type: 'json_object' } })
            };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                console.error('LLM API Error:', await res.text());
                return '';
            }

            const data: any = await res.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (err) {
            console.error('Failed to contact LLM:', err);
            return '';
        }
    }
}
