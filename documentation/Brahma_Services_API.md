# Brahma Services API Reference

```yaml
id: SERVICES_API
version: 1.0.0
last_sync: 2026-05-31T13:44:41+05:30
agent_permission: READ-ONLY
description: "Complete method signatures, parameters, and usage examples for all backend services."
```

---

## DBService (`services/db.service.ts`)

| Method | Signature | Description |
| :--- | :--- | :--- |
| `connect` | `() → Promise<void>` | Connects to MongoDB. Singleton — safe to call repeatedly. Auto-retries on failure. |
| `disconnect` | `() → Promise<void>` | Gracefully closes the Mongoose connection. Clears retry timer if pending. |
| `getStatus` | `() → { connected: boolean; uri: string }` | Returns current connection state. |

```typescript
// Usage in index.ts
import { DBService } from './services';
await DBService.connect();
```

---

## LLMService (`services/llm.service.ts`)

Generic OpenAI-compatible interface. Configured entirely via environment variables — no vendor lock-in.

| Method | Signature | Description |
| :--- | :--- | :--- |
| `query` | `(messages, config?, retries?) → Promise<string>` | Sends a chat completion request. Returns the raw text response. Retries up to 3× on failure. |
| `queryStructured<T>` | `(messages, config?) → Promise<T>` | Forces `json_object` response format and parses the JSON result into type `T`. |

**Config options:**

| Field | Type | Default | Notes |
| :--- | :--- | :--- | :--- |
| `temperature` | `number` | `0.7` | Lower = more deterministic |
| `maxTokens` | `number` | `2000` | Max response length |
| `model` | `string` | `LLM_MODEL` env | Override per-call |
| `responseFormat` | `'json_object' \| 'text'` | `'text'` | Force JSON output |

**Environment variables required:**

| Variable | Description |
| :--- | :--- |
| `LLM_API_URL` | Full chat completions endpoint URL |
| `LLM_API_KEY` | Bearer token (optional for local providers) |
| `LLM_MODEL` | Default model identifier |

---

## EmbeddingService (`services/embedding.service.ts`)

| Method | Signature | Description |
| :--- | :--- | :--- |
| `embed` | `(text: string) → Promise<number[]>` | Embeds one string. Checks LRU cache first. |
| `embedBatch` | `(texts: string[]) → Promise<number[][]>` | Embeds multiple strings. Hits API batch endpoint or local model per-item. |
| `hashText` | `(text: string) → string` | SHA-256 hash. Used for cache keys and deduplication. |
| `getDim` | `(vector: number[]) → number` | Returns embedding dimension. |

**Fallback Strategy:**

```
1. Try /v1/embeddings API (using EMBEDDING_MODEL env)
        ↓ fails
2. Run all-MiniLM-L6-v2 locally via @xenova/transformers (384-dim)
```

**LRU Cache:** 512 entries. Identical text is never re-embedded within a session.

---

## VectorService (`services/vector.service.ts`)

| Method | Signature | Description |
| :--- | :--- | :--- |
| `upsertChunk` | `(options: UpsertOptions) → Promise<boolean>` | Embeds + stores a chunk. Returns `false` if contentHash is unchanged (idempotent). |
| `cosineSimilaritySearch` | `(queryEmbedding, topK, filter?) → Promise<ScoredChunk[]>` | Pure semantic search via cosine distance. |
| `bm25KeywordSearch` | `(query, topK, filter?) → Promise<ScoredChunk[]>` | Keyword-based BM25 retrieval. |
| `hybridSearch` | `(query, queryEmbedding, topK, filter?) → Promise<ScoredChunk[]>` | Semantic + BM25 merged via Reciprocal Rank Fusion. **Default retrieval method.** |
| `indexAllBrainDocuments` | `() → Promise<{ indexed: number; skipped: number }>` | Bootstrap — indexes all Zehn entities and sessions into VectorStore. |

**UpsertOptions:**
```typescript
interface UpsertOptions {
  docId: string;              // e.g., "E-001" or "memory/2026-05-30"
  docType: DocType;           // 'entity' | 'session' | 'skill' | 'memory' | 'mission' | 'generic'
  content: string;            // The text chunk to embed
  metadata?: Record<string, unknown>;
}
```

---

## RAGService (`services/rag.service.ts`)

### `RAGService.run(query, options)` — The Full Pipeline

```typescript
const result = await RAGService.run("How do I handle a complex coding mission?", {
  retrievalTopK: 20,   // fetch 20 chunks per query variant
  rerankTopK: 10,      // keep 10 after LLM scoring
  finalTopK: 5,        // keep 5 after MMR diversity
  mmrLambda: 0.5,      // 0=max diversity, 1=max relevance
  maxTokenBudget: 1500 // hard token cap on final output
});

// result.contextBlock    → inject into system prompt
// result.sources         → source attribution array
// result.tokenEstimate   → ~int (rough token count)
// result.stages          → debug info (rewritten query, variants, etc.)
```

### Individual Stage Methods

| Method | Signature | Stage |
| :--- | :--- | :---: |
| `rewriteQuery` | `(rawQuery) → Promise<string>` | 1 |
| `expandQuery` | `(query) → Promise<string[]>` | 2 |
| `generateHyDE` | `(query) → Promise<string>` | 3 |
| `rerank` | `(query, chunks, topK) → Promise<ScoredChunk[]>` | 6 |
| `mmr` | `(queryEmbedding, chunks, topK, lambda) → Promise<ScoredChunk[]>` | 7 |
| `compressChunks` | `(query, chunks, maxTokenBudget) → Promise<{...}[]>` | 8 |

---

## ContextService (`services/context.service.ts`)

| Method | Signature | Description |
| :--- | :--- | :--- |
| `hydrateEntities` | `(entityIds: string[]) → Promise<HydratedEntity[]>` | Fetch specific `E-XXX` entities from Zehn by ID (fast, token-light). |
| `hydrateHistory` | `(sessionIds: string[]) → Promise<HydratedSession[]>` | Fetch specific `C-XXX` session summaries by ID. |
| `hydrateAll` | `(entityIds, sessionIds) → Promise<PromptContext>` | Both in one parallel call. |
| `formatForPrompt` | `(context: PromptContext) → string` | Formats hydrated data into a compact system prompt block. |
| `retrieveContext` | `(query: string, options?: RAGOptions) → Promise<RAGResult>` | **Full RAG retrieval.** Premium path — use for complex queries. |

**When to use each:**

| Scenario | Method |
| :--- | :--- |
| You know the exact entity IDs needed | `hydrateAll(['E-001', 'E-003'], [])` |
| Query is complex / entity IDs unknown | `retrieveContext('your query here')` |

---

## OrchestratorService (`services/orchestrator.service.ts`)

| Method | Signature | Description |
| :--- | :--- | :--- |
| `decomposeMission` | `(title, objective, entityIds?, sessionIds?) → Promise<IDharma>` | LLM decomposes a goal into sub-tasks. Saves mission to Dharma DB. |
| `executeNextTask` | `(missionId: string) → Promise<ISubTask \| null>` | Promotes the next PENDING sub-task to IN_PROGRESS. Returns `null` when complete. |
| `completeTask` | `(missionId, subTaskId) → Promise<void>` | Marks a sub-task COMPLETED. Recalculates mission progress. |
