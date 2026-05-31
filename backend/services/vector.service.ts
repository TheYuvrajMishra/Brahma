import * as fs from 'fs';
import * as path from 'path';
import VectorChunk, { DocType, IVectorChunk } from '../models/VectorStore';
import { Zehn } from '../models';
import type { IEntity, ISession } from '../models/Zehn';
import { EmbeddingService } from './embedding.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoredChunk {
  chunk: IVectorChunk;
  score: number;
}

export interface UpsertOptions {
  docId: string;
  docType: DocType;
  content: string;
  metadata?: Record<string, unknown>;
}

// ─── BM25 helpers ────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

function termFreq(tokens: string[], term: string): number {
  return tokens.filter((t) => t === term).length;
}

function bm25Score(
  queryTokens: string[],
  docTokens: string[],
  avgDocLen: number,
  k1 = 1.5,
  b = 0.75
): number {
  const docLen = docTokens.length;
  let score = 0;
  for (const term of queryTokens) {
    const tf = termFreq(docTokens, term);
    if (tf === 0) continue;
    const idf = Math.log(1 + 1 / (1 + tf)); // simplified IDF
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLen));
    score += idf * (numerator / denominator);
  }
  return score;
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Reciprocal Rank Fusion — merges multiple ranked lists into one. */
function rrfFuse(
  lists: ScoredChunk[][],
  k = 60
): ScoredChunk[] {
  const scores = new Map<string, { chunk: IVectorChunk; rrf: number }>();

  for (const list of lists) {
    list.forEach((item, rank) => {
      const id = item.chunk._id.toString();
      const prev = scores.get(id);
      const rrfScore = 1 / (k + rank + 1);
      if (prev) {
        prev.rrf += rrfScore;
      } else {
        scores.set(id, { chunk: item.chunk, rrf: rrfScore });
      }
    });
  }

  return Array.from(scores.values())
    .map(({ chunk, rrf }) => ({ chunk, score: rrf }))
    .sort((a, b) => b.score - a.score);
}

// ─── VectorService ────────────────────────────────────────────────────────────

export class VectorService {
  /**
   * Upserts a document chunk. Skips if contentHash is unchanged (idempotent).
   * Returns true if a new embedding was stored, false if skipped.
   */
  public static async upsertChunk(options: UpsertOptions): Promise<boolean> {
    const { docId, docType, content, metadata = {} } = options;
    const contentHash = EmbeddingService.hashText(content);

    const existing = await VectorChunk.findOne({ contentHash }).lean();
    if (existing) return false; // No change — skip re-embedding

    const embedding = await EmbeddingService.embed(content);

    await VectorChunk.findOneAndUpdate(
      { docId, docType },
      {
        $set: {
          content,
          contentHash,
          embedding,
          embeddingDim: embedding.length,
          metadata,
        },
      },
      { upsert: true, new: true }
    );

    return true;
  }

  /**
   * Pure semantic search: cosine similarity of query embedding vs stored embeddings.
   * Loads all chunks into memory and ranks — appropriate for < 100k documents.
   */
  public static async cosineSimilaritySearch(
    queryEmbedding: number[],
    topK = 20,
    filter?: Partial<{ docType: DocType }>
  ): Promise<ScoredChunk[]> {
    const query = filter ? { docType: filter.docType } : {};
    const chunks = await VectorChunk.find(query).lean<IVectorChunk[]>();
    if (!chunks.length) return [];

    return chunks
      .map((chunk) => ({
        chunk: chunk as unknown as IVectorChunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * BM25 keyword search: term-frequency based retrieval.
   * Runs in-memory over stored content strings.
   */
  public static async bm25KeywordSearch(
    query: string,
    topK = 20,
    filter?: Partial<{ docType: DocType }>
  ): Promise<ScoredChunk[]> {
    const dbQuery = filter ? { docType: filter.docType } : {};
    const chunks = await VectorChunk.find(dbQuery)
      .select('docId docType content contentHash metadata embedding embeddingDim')
      .lean<IVectorChunk[]>();

    if (!chunks.length) return [];

    const queryTokens = tokenize(query);
    const allTokenCounts = chunks.map((c) => tokenize(c.content).length);
    const avgDocLen = allTokenCounts.reduce((s, l) => s + l, 0) / chunks.length;

    return chunks
      .map((chunk) => ({
        chunk: chunk as unknown as IVectorChunk,
        score: bm25Score(queryTokens, tokenize(chunk.content), avgDocLen),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Hybrid search: merges semantic + BM25 results using Reciprocal Rank Fusion.
   * This is the default retrieval method — best accuracy.
   */
  public static async hybridSearch(
    query: string,
    queryEmbedding: number[],
    topK = 20,
    filter?: Partial<{ docType: DocType }>
  ): Promise<ScoredChunk[]> {
    const [semanticResults, keywordResults] = await Promise.all([
      this.cosineSimilaritySearch(queryEmbedding, topK, filter),
      this.bm25KeywordSearch(query, topK, filter),
    ]);

    return rrfFuse([semanticResults, keywordResults]).slice(0, topK);
  }

  /**
   * Bootstrap: indexes all Brahma Brain documents into the vector store.
   * Safe to call repeatedly — skips unchanged chunks.
   */
  public static async indexAllBrainDocuments(): Promise<{
    indexed: number;
    skipped: number;
  }> {
    console.log('🔍 Indexing all Brahma Brain documents into VectorStore...');
    let indexed = 0;
    let skipped = 0;

    // 1. Index files on disk from Brahma [Brain] folder
    const brainDir = path.join(__dirname, '../Brahma [Brain]');
    const scanAndIndexFiles = async (dir: string): Promise<void> => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scanAndIndexFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const relativePath = path.relative(brainDir, fullPath).replace(/\\/g, '/');
          const content = fs.readFileSync(fullPath, 'utf-8');

          let docType: DocType = 'generic';
          if (relativePath.startsWith('memory/')) {
            docType = 'memory';
          } else if (relativePath.startsWith('skills/')) {
            docType = 'skill';
          } else {
            const base = entry.name.replace('.md', '').toLowerCase();
            if (['entity', 'session', 'skill', 'memory', 'mission'].includes(base)) {
              docType = base as DocType;
            }
          }

          // Chunk by markdown sections (split on header bounds)
          const sections = content.split(/\n(?=#+ )/);

          for (let i = 0; i < sections.length; i++) {
            const sectionText = sections[i].trim();
            if (!sectionText) continue;

            const lines = sectionText.split('\n');
            const header = lines[0].replace(/^#+\s+/, '').trim();
            const chunkId = `${relativePath}#${header || `Section-${i + 1}`}`;

            const stored = await this.upsertChunk({
              docId: chunkId,
              docType,
              content: sectionText,
              metadata: { filePath: relativePath, sectionIndex: i, header },
            });
            stored ? indexed++ : skipped++;
          }
        }
      }
    };

    try {
      await scanAndIndexFiles(brainDir);
    } catch (err: any) {
      console.warn('⚠️  Disk file indexing had a warning:', err.message);
    }

    // 2. Index legacy Zehn collections if populated
    try {
      const zehn = await Zehn.findOne({}).lean<{
        entities: IEntity[];
        sessions: ISession[];
      }>();

      if (zehn) {
        for (const entity of zehn.entities) {
          const content = `[${entity.entityId}] ${entity.name}: ${entity.scope}. Relationships: ${entity.relationships}`;
          const stored = await this.upsertChunk({
            docId: entity.entityId,
            docType: 'entity',
            content,
            metadata: { name: entity.name, category: entity.category },
          });
          stored ? indexed++ : skipped++;
        }

        for (const session of zehn.sessions) {
          const content = `[${session.sessionId}] ${session.focus}`;
          const stored = await this.upsertChunk({
            docId: session.sessionId,
            docType: 'session',
            content,
            metadata: { date: session.date, tokenWeight: session.tokenWeight },
          });
          stored ? indexed++ : skipped++;
        }
      }
    } catch (err: any) {
      console.warn('⚠️ Zehn index scan skipped:', err.message);
    }

    console.log(`✅ Indexing complete. Indexed: ${indexed}, Skipped (unchanged): ${skipped}`);
    return { indexed, skipped };
  }
}
