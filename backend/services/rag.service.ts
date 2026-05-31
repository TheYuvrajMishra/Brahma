import { EmbeddingService } from './embedding.service';
import { VectorService, ScoredChunk } from './vector.service';
import { LLMService, LLMMessage } from './llm.service';
import type { DocType } from '../models/VectorStore';

// ─── Configuration ────────────────────────────────────────────────────────────

export interface RAGOptions {
  /** Number of chunks retrieved per query variant before reranking. Default: 20 */
  retrievalTopK?: number;
  /** Number of chunks kept after LLM reranking. Default: 10 */
  rerankTopK?: number;
  /** Number of final chunks after MMR deduplication. Default: 5 */
  finalTopK?: number;
  /** MMR lambda: 0 = max diversity, 1 = max relevance. Default: 0.5 */
  mmrLambda?: number;
  /** Max token budget for the final context block. Default: 1500 */
  maxTokenBudget?: number;
  /** Only retrieve chunks of specific doc types. */
  filter?: Partial<{ docType: DocType }>;
  /** Skip query rewriting (faster, less accurate). Default: false */
  skipRewrite?: boolean;
  /** Skip HyDE stage. Default: false */
  skipHyDE?: boolean;
}

export interface RAGResult {
  contextBlock: string;
  sources: { docId: string; docType: string; snippet: string; score: number }[];
  tokenEstimate: number;
  stages: {
    rewrittenQuery: string | null;
    queryVariants: string[];
    hydeDoc: string | null;
    retrievedCount: number;
    afterRerankCount: number;
    afterMmrCount: number;
  };
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Rough token estimate: ~4 chars per token (GPT convention). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── RAGService ───────────────────────────────────────────────────────────────

export class RAGService {
  // ── Stage 1: Query Rewriting ───────────────────────────────────────────────

  /**
   * Uses the LLM to rewrite the raw user query into a precise, 
   * context-aware search query. Removes ambiguity and slang.
   */
  public static async rewriteQuery(rawQuery: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: [
          'You are a query optimization expert for a RAG system.',
          'Rewrite the user query to be precise, specific, and optimized for semantic search.',
          'Remove filler words. Preserve all technical terms. Output ONLY the rewritten query — no explanations.',
        ].join('\n'),
      },
      { role: 'user', content: rawQuery },
    ];

    try {
      const rewritten = await LLMService.query(messages, { temperature: 0.1, maxTokens: 128, isAuxiliary: true });
      return rewritten.trim() || rawQuery;
    } catch {
      return rawQuery; // graceful fallback
    }
  }

  // ── Stage 2: Multi-Query Expansion ────────────────────────────────────────

  /**
   * Generates 3 semantically varied reformulations of the query to maximize
   * retrieval recall (different phrasings hit different embedding neighborhoods).
   */
  public static async expandQuery(query: string): Promise<string[]> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: [
          'You are a query expansion specialist.',
          'Generate exactly 3 alternative phrasings of the query below.',
          'Each variant must explore a different semantic angle.',
          'Respond with ONLY a JSON array of strings: ["variant1", "variant2", "variant3"]',
        ].join('\n'),
      },
      { role: 'user', content: query },
    ];

    try {
      const raw = await LLMService.query(messages, {
        temperature: 0.6,
        maxTokens: 256,
        responseFormat: 'json_object',
        isAuxiliary: true,
      });

      // Parse: LLM may return {"queries": [...]} or just [...]
      const parsed: unknown = JSON.parse(raw);
      let variants: string[] = [];
      if (Array.isArray(parsed)) {
        variants = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        const first = Object.values(obj)[0];
        if (Array.isArray(first)) variants = first;
      }

      return variants.filter((v) => typeof v === 'string' && v.trim().length > 0).slice(0, 3);
    } catch {
      return []; // fallback: use original query only
    }
  }

  // ── Stage 3: HyDE (Hypothetical Document Embedding) ───────────────────────

  /**
   * The LLM generates a hypothetical ideal answer document.
   * This "answer" is then embedded and used for search — because the embedding space
   * of an answer matches documents better than the embedding space of a question.
   */
  public static async generateHyDE(query: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: [
          'Write a concise hypothetical document (3-5 sentences) that would be the PERFECT answer to this query.',
          'Write as if it is extracted from a technical knowledge base. Use dense, factual language.',
          'Do NOT say "I" or "the answer is". Output ONLY the hypothetical document text.',
        ].join('\n'),
      },
      { role: 'user', content: query },
    ];

    try {
      return (await LLMService.query(messages, { temperature: 0.3, maxTokens: 256, isAuxiliary: true })).trim();
    } catch {
      return query;
    }
  }

  // ── Stage 6: LLM Reranking ────────────────────────────────────────────────

  /**
   * Cross-encodes each retrieved chunk against the original query using the LLM.
   * Scores 1–10 for relevance. This is more accurate than pure vector similarity.
   */
  public static async rerank(
    query: string,
    chunks: ScoredChunk[],
    topK: number
  ): Promise<ScoredChunk[]> {
    if (chunks.length === 0) return [];

    const chunkList = chunks
      .map((c, i) => `[${i}] ${c.chunk.content.slice(0, 400)}`)
      .join('\n---\n');

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: [
          'You are a relevance scorer. Given a query and document chunks, rate each chunk 1-10 for relevance.',
          'Respond ONLY in JSON: {"scores": [<score for [0]>, <score for [1]>, ...]}',
          'Use 10 = perfectly relevant, 1 = completely irrelevant.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: `Query: ${query}\n\nChunks:\n${chunkList}`,
      },
    ];

    try {
      const result = await LLMService.queryStructured<{ scores: number[] }>(messages, { isAuxiliary: true });
      const scores = result.scores;

      return chunks
        .map((chunk, i) => ({ ...chunk, score: scores[i] ?? chunk.score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } catch {
      // If reranking fails, return top-K by existing vector score
      return chunks.sort((a, b) => b.score - a.score).slice(0, topK);
    }
  }

  // ── Stage 7: MMR Deduplication ────────────────────────────────────────────

  /**
   * Maximum Marginal Relevance: selects chunks that are both
   * relevant to the query AND diverse from each other.
   * Formula: MMR = argmax[λ·Sim(d,q) - (1-λ)·max Sim(d, already_selected)]
   */
  public static async mmr(
    queryEmbedding: number[],
    chunks: ScoredChunk[],
    topK: number,
    lambda = 0.5
  ): Promise<ScoredChunk[]> {
    if (chunks.length <= topK) return chunks;

    // Pre-embed all chunks
    const chunkEmbeddings = await EmbeddingService.embedBatch(
      chunks.map((c) => c.chunk.content)
    );

    const selected: (ScoredChunk & { idx: number })[] = [];
    const remaining = [...chunks.map((c, i) => ({ ...c, idx: i }))];

    while (selected.length < topK && remaining.length > 0) {
      let bestScore = -Infinity;
      let bestIndex = 0;

      for (let i = 0; i < remaining.length; i++) {
        const item = remaining[i];
        const simToQuery = cosineSimilarity(queryEmbedding, chunkEmbeddings[item.idx]);

        let maxSimToSelected = 0;
        for (const sel of selected) {
          const simToSel = cosineSimilarity(
            chunkEmbeddings[item.idx],
            chunkEmbeddings[sel.idx]
          );
          if (simToSel > maxSimToSelected) maxSimToSelected = simToSel;
        }

        const mmrScore = lambda * simToQuery - (1 - lambda) * maxSimToSelected;
        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIndex = i;
        }
      }

      selected.push(remaining[bestIndex]);
      remaining.splice(bestIndex, 1);
    }

    return selected;
  }

  // ── Stage 8: Contextual Compression ──────────────────────────────────────

  /**
   * Extracts ONLY the sentences from each chunk that are relevant to the query.
   * This can reduce chunk size by 60-80% while keeping all signal.
   */
  public static async compressChunks(
    query: string,
    chunks: ScoredChunk[],
    maxTokenBudget: number
  ): Promise<{ content: string; source: ScoredChunk }[]> {
    const compressed: { content: string; source: ScoredChunk }[] = [];
    let tokenCount = 0;

    for (const chunk of chunks) {
      if (tokenCount >= maxTokenBudget) break;

      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: [
            'Extract ONLY the sentences from the document that directly answer or relate to the query.',
            'Output ONLY the extracted sentences. If nothing is relevant, output: [NOT_RELEVANT]',
          ].join('\n'),
        },
        {
          role: 'user',
          content: `Query: ${query}\n\nDocument:\n${chunk.chunk.content}`,
        },
      ];

      try {
        const extracted = (
          await LLMService.query(messages, { temperature: 0.0, maxTokens: 300, isAuxiliary: true })
        ).trim();

        if (extracted === '[NOT_RELEVANT]' || extracted.length < 10) continue;

        const tokens = estimateTokens(extracted);
        if (tokenCount + tokens > maxTokenBudget) break;

        compressed.push({ content: extracted, source: chunk });
        tokenCount += tokens;
      } catch {
        // If compression fails for a chunk, include the raw chunk (truncated)
        const truncated = chunk.chunk.content.slice(0, 400);
        const tokens = estimateTokens(truncated);
        if (tokenCount + tokens <= maxTokenBudget) {
          compressed.push({ content: truncated, source: chunk });
          tokenCount += tokens;
        }
      }
    }

    return compressed;
  }

  // ── Main Pipeline: run() ──────────────────────────────────────────────────

  /**
   * THE FULL ADVANCED RAG PIPELINE.
   * Input: raw user query string.
   * Output: compressed, diverse, token-budgeted context block for LLM injection.
   *
   * Stages:
   *   1. Query Rewriting     → precise query
   *   2. Multi-Query Expand  → 3 query variants
   *   3. HyDE               → hypothetical answer document
   *   4. Embed all queries
   *   5. Hybrid Retrieval    → semantic + BM25 per variant
   *   6. LLM Reranking       → score each chunk for relevance
   *   7. MMR Deduplication   → remove redundant chunks
   *   8. Contextual Compress → extract only relevant sentences
   */
  public static async run(rawQuery: string, options: RAGOptions = {}): Promise<RAGResult> {
    const {
      retrievalTopK = 20,
      rerankTopK = 10,
      finalTopK = 5,
      mmrLambda = 0.5,
      maxTokenBudget = 1500,
      filter,
      skipRewrite = false,
      skipHyDE = false,
    } = options;

    const clean = rawQuery.trim().toLowerCase();
    const casualGreetings = ['hello', 'hey', 'hi', 'yo', 'sup', 'howdy', 'test', 'status', 'ping', 'pong', 'ok', 'okay'];
    const isCasual = clean.length < 12 || casualGreetings.includes(clean);

    if (isCasual) {
      console.log(`\n🔬 RAG Pipeline skipped for casual query: "${rawQuery.slice(0, 60)}..."`);
      return {
        contextBlock: '',
        sources: [],
        tokenEstimate: 0,
        stages: {
          rewrittenQuery: null,
          queryVariants: [],
          hydeDoc: null,
          retrievedCount: 0,
          afterRerankCount: 0,
          afterMmrCount: 0,
        },
      };
    }

    console.log(`\n🔬 RAG Pipeline starting for query: "${rawQuery.slice(0, 60)}..."`);
    const skipLlm = LLMService.isLlmOffline;

    // ── Stage 1: Query Rewriting ──────────────────────────────────────────
    const rewrittenQuery = (skipRewrite || skipLlm) ? null : await this.rewriteQuery(rawQuery);
    const activeQuery = rewrittenQuery ?? rawQuery;
    console.log(`  [1/8] Rewrite: "${activeQuery.slice(0, 60)}"`);

    // ── Stage 2: Multi-Query Expansion ───────────────────────────────────
    const variants = (skipLlm) ? [] : await this.expandQuery(activeQuery);
    const allQueries = [activeQuery, ...variants];
    console.log(`  [2/8] Expanded to ${allQueries.length} query variants.`);

    // ── Stage 3: HyDE ────────────────────────────────────────────────────
    const hydeDoc = (skipHyDE || skipLlm) ? null : await this.generateHyDE(activeQuery);
    const embeddingInputs = hydeDoc ? [hydeDoc, ...allQueries] : allQueries;
    console.log(`  [3/8] HyDE document: ${hydeDoc ? 'generated' : 'skipped'}`);

    // ── Stage 4: Embed all inputs in one batch ────────────────────────────
    const embeddings = await EmbeddingService.embedBatch(embeddingInputs);
    // Primary embedding = HyDE doc (or first query if HyDE skipped)
    const primaryEmbedding = embeddings[0];
    const queryEmbeddings = hydeDoc ? embeddings.slice(1) : embeddings;
    console.log(`  [4/8] Embedded ${embeddingInputs.length} inputs (${primaryEmbedding.length}-dim).`);

    // ── Stage 5: Hybrid Retrieval across all query variants ───────────────
    const allRetrieved = new Map<string, ScoredChunk>();

    for (let i = 0; i < allQueries.length; i++) {
      const results = await VectorService.hybridSearch(
        allQueries[i],
        queryEmbeddings[i] ?? primaryEmbedding,
        retrievalTopK,
        filter
      );
      for (const r of results) {
        const id = r.chunk._id.toString();
        const existing = allRetrieved.get(id);
        // Keep highest score across query variants
        if (!existing || r.score > existing.score) allRetrieved.set(id, r);
      }
    }

    const retrievedChunks = Array.from(allRetrieved.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, retrievalTopK);

    console.log(`  [5/8] Hybrid retrieval: ${retrievedChunks.length} unique chunks.`);

    if (retrievedChunks.length === 0) {
      console.warn('  ⚠️  No chunks found in VectorStore. Run VectorService.indexAllBrainDocuments() first.');
      return {
        contextBlock: '',
        sources: [],
        tokenEstimate: 0,
        stages: {
          rewrittenQuery,
          queryVariants: variants,
          hydeDoc,
          retrievedCount: 0,
          afterRerankCount: 0,
          afterMmrCount: 0,
        },
      };
    }

    // ── Stage 6: LLM Reranking ────────────────────────────────────────────
    const reranked = (skipLlm) ? retrievedChunks.slice(0, rerankTopK) : await this.rerank(activeQuery, retrievedChunks, rerankTopK);
    console.log(`  [6/8] Reranked: ${retrievedChunks.length} → ${reranked.length} chunks.`);

    // ── Stage 7: MMR Deduplication ────────────────────────────────────────
    const diverse = await this.mmr(primaryEmbedding, reranked, finalTopK, mmrLambda);
    console.log(`  [7/8] MMR: ${reranked.length} → ${diverse.length} diverse chunks.`);

    // ── Stage 8: Contextual Compression ──────────────────────────────────
    const compressed = (skipLlm)
      ? diverse.map((c) => ({ content: c.chunk.content.slice(0, 400), source: c }))
      : await this.compressChunks(activeQuery, diverse, maxTokenBudget);
    console.log(`  [8/8] Compressed to ${compressed.length} chunks (~${compressed.reduce((s, c) => s + estimateTokens(c.content), 0)} tokens).`);

    // ── Assemble final context block ──────────────────────────────────────
    const lines: string[] = ['--- RETRIEVED CONTEXT [Advanced RAG] ---'];

    compressed.forEach((item, i) => {
      lines.push(`\n[Source ${i + 1} | ${item.source.chunk.docType}:${item.source.chunk.docId} | score:${item.source.score.toFixed(3)}]`);
      lines.push(item.content);
    });

    lines.push('\n----------------------------------------');
    const contextBlock = lines.join('\n');
    const tokenEstimate = estimateTokens(contextBlock);

    console.log(`✅ RAG complete. Final context: ~${tokenEstimate} tokens.\n`);

    return {
      contextBlock,
      sources: compressed.map((item) => ({
        docId: item.source.chunk.docId,
        docType: item.source.chunk.docType,
        snippet: item.content.slice(0, 120),
        score: item.source.score,
      })),
      tokenEstimate,
      stages: {
        rewrittenQuery,
        queryVariants: variants,
        hydeDoc,
        retrievedCount: retrievedChunks.length,
        afterRerankCount: reranked.length,
        afterMmrCount: diverse.length,
      },
    };
  }
}
