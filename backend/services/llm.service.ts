export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: 'json_object' | 'text';
}

interface LLMResponseChoice {
  message: {
    content: string;
    role: string;
  };
  finish_reason: string;
  index: number;
}

interface LLMAPIResponse {
  choices: LLMResponseChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMService {
  // Fully generic - works with any OpenAI-compatible endpoint (Ollama, Together AI, custom, etc.)
  private static get API_URL(): string {
    const url = process.env.LLM_API_URL;
    if (!url) throw new Error('LLM_API_URL environment variable is not set.');
    return url;
  }

  private static get API_KEY(): string {
    return process.env.LLM_API_KEY || '';
  }

  private static get DEFAULT_MODEL(): string {
    const model = process.env.LLM_MODEL;
    if (!model) throw new Error('LLM_MODEL environment variable is not set.');
    return model;
  }

  public static async query(
    messages: LLMMessage[],
    config?: LLMConfig,
    retries: number = 3
  ): Promise<string> {
    // Guard: if no API URL is configured, return a mock so dev server doesn't crash
    if (!process.env.LLM_API_URL) {
      console.warn('⚠️  LLM_API_URL not set. Returning mocked response.');
      return this.mockResponse(messages);
    }

    const payload = {
      model: config?.model ?? this.DEFAULT_MODEL,
      messages,
      temperature: config?.temperature ?? 0.7,
      max_tokens: config?.maxTokens ?? 2000,
      ...(config?.responseFormat === 'json_object' && {
        response_format: { type: 'json_object' },
      }),
    };

    for (let attempt = retries; attempt >= 0; attempt--) {
      try {
        const response = await fetch(this.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.API_KEY && { Authorization: `Bearer ${this.API_KEY}` }),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`API ${response.status} ${response.statusText}: ${errorBody}`);
        }

        const data = (await response.json()) as LLMAPIResponse;

        if (!data.choices?.length || !data.choices[0].message?.content) {
          throw new Error('LLM returned an empty or malformed response.');
        }

        return data.choices[0].message.content.trim();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt > 0) {
          console.warn(`🔄 LLM attempt failed (${attempt} retries left): ${message}`);
          await new Promise<void>((resolve) => setTimeout(resolve, 2000));
        } else {
          console.error(`❌ LLM query permanently failed: ${message}`);
          throw error instanceof Error ? error : new Error(message);
        }
      }
    }

    // TypeScript needs an explicit return here even though the loop always throws/returns
    throw new Error('LLM query exhausted all retries.');
  }

  public static async queryStructured<T>(
    messages: LLMMessage[],
    config?: LLMConfig
  ): Promise<T> {
    const jsonConfig: LLMConfig = { ...config, responseFormat: 'json_object' };
    const responseText = await this.query(messages, jsonConfig);
    try {
      return JSON.parse(responseText) as T;
    } catch {
      console.error('❌ Failed to parse LLM JSON response:', responseText);
      throw new Error('Invalid JSON received from LLM.');
    }
  }

  private static mockResponse(messages: LLMMessage[]): string {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    return JSON.stringify({
      status: 'mocked',
      received: lastUserMessage?.content ?? null,
      note: 'Set LLM_API_URL and LLM_MODEL in your .env to use a real model.',
    });
  }
}

