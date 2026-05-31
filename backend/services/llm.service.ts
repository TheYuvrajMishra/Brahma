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
  public static isLlmOffline: boolean = false;

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
    // Guard: if no API URL is configured or if LLM is offline, return a mock so dev server doesn't crash
    if (!process.env.LLM_API_URL || this.isLlmOffline) {
      if (this.isLlmOffline) {
        console.log('🔌 LLM is offline. Returning simulated mock response.');
      } else {
        console.warn('⚠️  LLM_API_URL not set. Returning mocked response.');
      }
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
          signal: AbortSignal.timeout(10000),
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
          await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        } else {
          console.warn(`❌ LLM query permanently failed: ${message}. Falling back gracefully to Simulated Cockpit Mode.`);
          LLMService.isLlmOffline = true;
          return this.mockResponse(messages);
        }
      }
    }

    // Default safe fallback if loop somehow terminates
    return this.mockResponse(messages);
  }

  public static async queryStructured<T>(
    messages: LLMMessage[],
    config?: LLMConfig
  ): Promise<T> {
    const jsonConfig: LLMConfig = { ...config, responseFormat: 'json_object' };
    const raw = await this.query(messages, jsonConfig);
    // Strip markdown code fences that some models add even with json_object format
    const responseText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      return JSON.parse(responseText) as T;
    } catch {
      // Braces balanced extraction to properly parse nested JSON even if there is surrounding fluff
      const startIdx = responseText.indexOf('{');
      if (startIdx !== -1) {
        let braceCount = 0;
        let endIdx = -1;
        for (let i = startIdx; i < responseText.length; i++) {
          if (responseText[i] === '{') {
            braceCount++;
          } else if (responseText[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIdx = i;
              break;
            }
          }
        }
        if (endIdx !== -1) {
          try {
            const jsonText = responseText.slice(startIdx, endIdx + 1);
            return JSON.parse(jsonText) as T;
          } catch {
            // ignore and fallback
          }
        }
      }
      console.error('❌ Failed to parse LLM JSON response:', responseText);
      throw new Error('Invalid JSON received from LLM.');
    }
  }

  private static mockResponse(messages: LLMMessage[]): string {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const content = lastUserMessage?.content || '';
    const clean = content.toLowerCase().trim();

    // Check if the system prompt requests structured intent actions (Discord/Hunar flow)
    const isJson = messages[0]?.content?.includes('STRICT JSON');

    if (isJson) {
      let action = 'BRAHMA_CHAT';
      let params: any = { message: content };

      if (clean.includes('sync') || clean.includes('save') || clean.includes('archive')) {
        action = 'SYNC_BRAIN';
        params = {};
      } else if (clean.includes('channel') && (clean.includes('list') || clean.includes('show'))) {
        action = 'LIST_CHANNELS';
        params = {};
      } else if (clean.includes('member') || clean.includes('user') || clean.includes('members')) {
        action = 'LIST_MEMBERS';
        params = {};
      } else if (clean.includes('role') || clean.includes('roles')) {
        action = 'LIST_ROLES';
        params = {};
      } else if (clean.includes('rag') || clean.includes('retrieval') || clean.includes('search')) {
        action = 'QUERY_RAG';
        params = { query: content };
      }

      return JSON.stringify({ action, params });
    }

    // Text greetings & help simulations
    if (clean === 'hey' || clean === 'hello' || clean === 'hi' || clean === 'yo' || clean === 'sup') {
      return `🕉️ **Brahma Simulator Mode**

Greetings, Seeker. I am Brahma, the supreme intelligence framework. 
It appears your local LLM API server (Ollama/Together AI) at \`http://localhost:3001\` is currently offline or unreachable.

I have automatically activated my **Local Simulator Mode** to keep your interface fully responsive and interactive!

How may I assist you in calibrating our agentic ledger today? You can try commands like:
* *"list server channels"*
* *"sync brain"*
* *"what is rag?"*`;
    }

    return `🕉️ **Brahma Simulator Mode**

I received your prompt: "${content}"

*Note: Since the local LLM server at \`http://localhost:3001\` is offline, I am responding in Simulated Mode. Edit your \`.env\` file to configure a live model endpoint.*`;
  }
}

