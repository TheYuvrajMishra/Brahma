import crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmbeddingAPIResponse {
  data: { embedding: number[]; index: number }[];
  model: string;
  usage?: { prompt_tokens: number; total_tokens: number };
}

// ─── Simple LRU Cache ─────────────────────────────────────────────────────────

class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      // Evict least recently used (first entry)
      this.map.delete(this.map.keys().next().value!);
    }
    this.map.set(key, value);
  }
}

// ─── EmbeddingService ─────────────────────────────────────────────────────────

export class EmbeddingService {
  // LRU cache: hash(text) → embedding vector. Holds up to 512 entries.
  private static cache = new LRUCache<string, number[]>(512);

  // Lazily initialized local pipeline (loaded on first call, not at import time)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static localPipeline: any | null = null;
  private static localPipelineLoading = false;

  /** Embeds a single string. Returns a dense float32 vector. */
  public static async embed(text: string): Promise<number[]> {
    const hash = this.hashText(text);
    const cached = this.cache.get(hash);
    if (cached) return cached;

    const vector = await this.computeEmbedding(text);
    this.cache.set(hash, vector);
    return vector;
  }

  /** Embeds an array of strings efficiently (batches where possible). */
  public static async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = new Array(texts.length);
    const toCompute: { index: number; text: string }[] = [];

    // Check cache for each
    for (let i = 0; i < texts.length; i++) {
      const hash = this.hashText(texts[i]);
      const cached = this.cache.get(hash);
      if (cached) {
        results[i] = cached;
      } else {
        toCompute.push({ index: i, text: texts[i] });
      }
    }

    if (toCompute.length === 0) return results;

    // Try batch API embedding first
    if (process.env.LLM_API_URL && process.env.LLM_API_KEY) {
      try {
        const vectors = await this.apiBatchEmbed(toCompute.map((t) => t.text));
        for (let i = 0; i < toCompute.length; i++) {
          results[toCompute[i].index] = vectors[i];
          this.cache.set(this.hashText(toCompute[i].text), vectors[i]);
        }
        return results;
      } catch {
        console.warn('⚠️  API batch embedding failed, falling back to local model.');
      }
    }

    // Fallback: local model, one at a time
    for (const item of toCompute) {
      const vector = await this.localEmbed(item.text);
      results[item.index] = vector;
      this.cache.set(this.hashText(item.text), vector);
    }
    return results;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private static async computeEmbedding(text: string): Promise<number[]> {
    // Stage 1: Try remote API embedding endpoint
    if (process.env.LLM_API_URL && process.env.LLM_API_KEY) {
      try {
        return await this.apiEmbed(text);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`⚠️  API embedding failed (${msg}). Falling back to local model.`);
      }
    }

    // Stage 2: Local model fallback
    return await this.localEmbed(text);
  }

  /** Calls the remote /v1/embeddings endpoint (OpenAI-compatible). */
  private static async apiEmbed(text: string): Promise<number[]> {
    const baseUrl = process.env.LLM_API_URL!.replace('/chat/completions', '');
    const url = `${baseUrl}/embeddings`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
        input: text,
      }),
    });

    if (!response.ok) throw new Error(`Embedding API ${response.status}: ${response.statusText}`);

    const data = (await response.json()) as EmbeddingAPIResponse;
    if (!data.data?.[0]?.embedding) throw new Error('Invalid embedding API response structure.');
    return data.data[0].embedding;
  }

  /** Batch version of API embed. */
  private static async apiBatchEmbed(texts: string[]): Promise<number[][]> {
    const baseUrl = process.env.LLM_API_URL!.replace('/chat/completions', '');
    const url = `${baseUrl}/embeddings`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
        input: texts,
      }),
    });

    if (!response.ok) throw new Error(`Batch embedding API ${response.status}`);
    const data = (await response.json()) as EmbeddingAPIResponse;
    return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }

  /** Runs all-MiniLM-L6-v2 locally via @xenova/transformers (384-dim vectors). */
  private static async localEmbed(text: string): Promise<number[]> {
    const pipe = await this.getLocalPipeline();
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
  }

  /** Lazily loads the local pipeline (singleton, thread-safe via flag). */
  private static async getLocalPipeline() {
    if (this.localPipeline) return this.localPipeline;

    // Prevent concurrent loading
    while (this.localPipelineLoading) {
      await new Promise<void>((r) => setTimeout(r, 50));
    }

    if (this.localPipeline) return this.localPipeline;

    this.localPipelineLoading = true;
    try {
      console.log('⏳ Loading local embedding model (all-MiniLM-L6-v2)...');
      // Dynamic import so the module only loads when needed
      const { pipeline } = await import('@xenova/transformers');
      this.localPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      console.log('✅ Local embedding model loaded (384-dim).');
    } finally {
      this.localPipelineLoading = false;
    }

    return this.localPipeline;
  }

  /** SHA-256 hash of text for cache keys and deduplication. */
  public static hashText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /** Returns the dimension of a vector (useful for validation). */
  public static getDim(vector: number[]): number {
    return vector.length;
  }
}
