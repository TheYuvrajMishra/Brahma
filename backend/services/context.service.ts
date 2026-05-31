import { Zehn } from '../models';
import type { IEntity, ISession } from '../models/Zehn';
import { RAGService, RAGOptions, RAGResult } from './rag.service';

export interface HydratedEntity {
  id: string;
  name: string;
  definition: string;
}

export interface HydratedSession {
  session: string;
  focus: string;
}

export interface PromptContext {
  entities: HydratedEntity[];
  historicalReferences: HydratedSession[];
}

export class ContextService {
  /**
   * Retrieves specific entities from the Zehn database using their E-XXX IDs.
   * Only fetches the IDs requested, ensuring the LLM is given the minimum
   * context needed for a task (token-saving Zehn principle).
   */
  public static async hydrateEntities(entityIds: string[]): Promise<HydratedEntity[]> {
    if (!entityIds.length) return [];

    try {
      const zehnDb = await Zehn.findOne({}).lean<{
        entities: IEntity[];
        sessions: ISession[];
      }>();
      if (!zehnDb) return [];

      return zehnDb.entities
        .filter((e: IEntity) => entityIds.includes(e.entityId))
        .map((e: IEntity): HydratedEntity => ({
          id: e.entityId,
          name: e.name,
          definition: `${e.scope} [Relationships: ${e.relationships}]`,
        }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to hydrate entities from Zehn: ${msg}`);
      return [];
    }
  }

  /**
   * Retrieves high-level session summaries by C-XXX IDs from the Zehn memory map.
   */
  public static async hydrateHistory(sessionIds: string[]): Promise<HydratedSession[]> {
    if (!sessionIds.length) return [];

    try {
      const zehnDb = await Zehn.findOne({}).lean<{
        entities: IEntity[];
        sessions: ISession[];
      }>();
      if (!zehnDb) return [];

      return zehnDb.sessions
        .filter((s: ISession) => sessionIds.includes(s.sessionId))
        .map((s: ISession): HydratedSession => ({
          session: s.sessionId,
          focus: s.focus,
        }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to hydrate history from Zehn: ${msg}`);
      return [];
    }
  }

  /**
   * Hydrates both entities and history in a single parallel call.
   */
  public static async hydrateAll(
    entityIds: string[],
    sessionIds: string[]
  ): Promise<PromptContext> {
    const [entities, historicalReferences] = await Promise.all([
      this.hydrateEntities(entityIds),
      this.hydrateHistory(sessionIds),
    ]);
    return { entities, historicalReferences };
  }

  /**
   * Formats the hydrated context into a compact, token-efficient string block
   * suitable for injection into an LLM System Prompt.
   */
  public static formatForPrompt(context: PromptContext): string {
    const lines: string[] = ['--- SYSTEM CONTEXT ---'];

    if (context.entities.length > 0) {
      lines.push('ENTITIES:');
      context.entities.forEach((e) => {
        lines.push(`[${e.id}] ${e.name}: ${e.definition}`);
      });
    }

    if (context.historicalReferences.length > 0) {
      lines.push('');
      lines.push('HISTORICAL SESSIONS:');
      context.historicalReferences.forEach((h) => {
        lines.push(`[${h.session}] Focus: ${h.focus}`);
      });
    }

    lines.push('----------------------');
    return lines.join('\n');
  }

  /**
   * Advanced RAG retrieval — the premium path.
   * Uses the full 8-stage pipeline (query rewriting, HyDE, multi-query,
   * hybrid search, reranking, MMR, compression) to return the most accurate,
   * diverse, and token-efficient context block.
   *
   * Use this instead of hydrateAll() when the query is complex or
   * the knowledge base is large and entity IDs are unknown.
   */
  public static async retrieveContext(
    query: string,
    options?: RAGOptions
  ): Promise<RAGResult> {
    return RAGService.run(query, options);
  }
}

