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

            const totalSize = systemPrompt.length + userMessage.length;
            if (totalSize > 8000) {
                console.warn(`[LLMService] Large prompt: ${totalSize} chars`);
            }

            // 60s timeout to avoid hanging
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (config.llmApiKey) {
                headers['Authorization'] = `Bearer ${config.llmApiKey}`;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!res.ok) {
                const errText = await res.text();
                console.error(`[LLMService] Error ${res.status}: ${errText.substring(0, 200)}`);
                return '';
            }

            const data: any = await res.json();
            const content = data.choices?.[0]?.message?.content || '';
            if (!content) {
                console.error('[LLMService] OK but empty content:', JSON.stringify(data).substring(0, 200));
            }
            return content;
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.error('[LLMService] Timeout after 60s');
            } else {
                console.error('[LLMService] Failed:', err.message || err);
            }
            return '';
        }
    }
}
