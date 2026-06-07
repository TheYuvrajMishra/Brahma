import { NormalizedMessage } from '../types/Message';
import { ParsedIntent, SearchTask, ContextEntry, ContextStore, ResearchResult } from '../types/ResearchTypes';
import { ContextStoreManager } from '../core/ContextStoreManager';
import { LLMService } from '../services/LLMService';
import { SkillRegistry } from '../core/SkillRegistry';
import { Logger } from '../core/Logger';
import { MemoryManager } from '../core/MemoryManager';

// ============================================================================
// SCRP Researcher — Rate-limit-friendly implementation
// Uses only 1 LLM call (Phase 0 parseIntent). All other phases are
// deterministic string parsing to avoid exhausting API keys.
// ============================================================================

const DEPTH_MAP: Record<string, 'minimum' | 'standard'> = {
    casual: 'minimum',
    factual: 'minimum',
    entity_dependent: 'standard',
    current_events: 'standard',
    task_based: 'standard',
    hybrid: 'standard',
};

const DEPTH_LIMITS: Record<string, number> = { minimum: 1, standard: 2 };

export class Researcher {

    static async research(message: NormalizedMessage, routeBucket: string): Promise<ResearchResult> {
        const startTime = Date.now();

        try {
            // ── Phase 0: Intent Parsing (1 LLM call) ────────────────────
            const parsedIntent = await this.parseIntent(message);
            console.log(`[Researcher] Phase 0: type=${parsedIntent.request_type}, entities=[${parsedIntent.entities}], flagged=[${parsedIntent.flagged_entities}]`);

            // ── Gate Check ───────────────────────────────────────────────
            if (parsedIntent.flagged_entities.length === 0 || (routeBucket === 'greeting' && parsedIntent.request_type === 'casual')) {
                console.log(`[Researcher] SKIPPED: no flagged entities or greeting`);
                const moment = await MemoryManager.getMoment(message.channel_id);
                const searchText = (message.content + ' ' + moment).toLowerCase();
                const relevantCachedEntries = ContextStoreManager.getAll().filter(entry => 
                    searchText.includes(entry.entity_name.toLowerCase())
                );
                return {
                    parsed_intent: parsedIntent,
                    context_store: { entries: relevantCachedEntries, research_depth: 'minimum', total_searches_executed: 0, gaps: [] },
                    research_required: false,
                    skipped_reason: parsedIntent.flagged_entities.length === 0 ? 'No entities need research.' : 'Greeting mode.',
                    duration_ms: Date.now() - startTime,
                };
            }

            // ── Phase 1: Build search queue ──────────────────────────────
            const depth = DEPTH_MAP[parsedIntent.request_type] || 'standard';
            const searchQueue = this.buildSearchQueue(parsedIntent, depth);
            console.log(`[Researcher] Phase 1: depth=${depth}, queue=[${searchQueue.map(t => t.target)}]`);

            // ── Phase 2: Execute searches (no LLM calls) ────────────────
            const contextStore = await this.executeResearch(searchQueue, parsedIntent, depth, message.message_id);
            console.log(`[Researcher] Phase 2: entries=${contextStore.entries.length}, searches=${contextStore.total_searches_executed}, gaps=${contextStore.gaps.length}`);

            // Cache for cross-turn persistence
            for (const entry of contextStore.entries) { ContextStoreManager.set(entry.entity_name, entry); }

            return {
                parsed_intent: parsedIntent,
                context_store: contextStore,
                research_required: true,
                duration_ms: Date.now() - startTime,
            };
        } catch (error) {
            console.error('[Researcher] CRASHED:', error);
            return {
                parsed_intent: { intent: '', entities: [], actions: [], constraints: [], context: '', request_type: 'casual', flagged_entities: [] },
                context_store: { entries: ContextStoreManager.getAll(), research_depth: 'minimum', total_searches_executed: 0, gaps: [] },
                research_required: false,
                skipped_reason: `Research error: ${error}`,
                duration_ms: Date.now() - startTime,
            };
        }
    }

    // ========================================================================
    // Phase 0 — Intent Parsing (THE ONLY LLM CALL)
    // ========================================================================
    private static async parseIntent(message: NormalizedMessage): Promise<ParsedIntent> {
        const systemPrompt = `Analyze the user message. Return JSON:
{"intent":"what the user wants","entities":["named entities"],"actions":["implied actions"],"constraints":[],"context":"","request_type":"casual|factual|entity_dependent|current_events|task_based|hybrid","flagged_entities":["entities needing research: unknown ones, time-sensitive ones, NOT well-known stable ones like Google/Python"]}
Return ONLY raw JSON, no markdown.`;

        try {
            const response = await LLMService.chat(systemPrompt, message.content, true);
            if (response) {
                const clean = response.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(clean);
                const flagged = this.applyGateCheck(
                    Array.isArray(parsed.flagged_entities) ? parsed.flagged_entities : [],
                );
                return {
                    intent: parsed.intent || '',
                    entities: Array.isArray(parsed.entities) ? parsed.entities : [],
                    actions: Array.isArray(parsed.actions) ? parsed.actions : [],
                    constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
                    context: parsed.context || '',
                    request_type: parsed.request_type || 'casual',
                    flagged_entities: flagged,
                };
            }
        } catch (err) {
            console.error('[Researcher] parseIntent FAILED:', err);
        }

        return { intent: message.content, entities: [], actions: [], constraints: [], context: '', request_type: 'casual', flagged_entities: [] };
    }

    private static applyGateCheck(flaggedEntities: string[]): string[] {
        const stopWords = new Set(['krdo', 'kardo', 'kro', 'karo', 'bhai', 'yaar', 'please', 'dena', 'karna', 'update', 'save', 'edit', 'put', 'add', 'insert']);
        return flaggedEntities.filter(entity => {
            const clean = entity.toLowerCase().trim();
            if (stopWords.has(clean)) return false;
            if (ContextStoreManager.has(entity)) { console.log(`[Researcher] Gate: "${entity}" cached — skip`); return false; }
            return true;
        });
    }

    // ========================================================================
    // Phase 1 — Search Queue (deterministic, no LLM)
    // ========================================================================
    private static buildSearchQueue(intent: ParsedIntent, depth: 'minimum' | 'standard'): SearchTask[] {
        const queue: SearchTask[] = [];
        const max = DEPTH_LIMITS[depth];
        let n = 0;

        for (const entity of intent.flagged_entities) {
            if (n >= max) break;
            queue.push({
                id: `s_${++n}`, target: entity,
                purpose: `Research "${entity}"`,
                query_type: 'general', priority: 'critical',
                depends_on: [], status: 'pending',
            });

            if (depth === 'standard' && n < max) {
                queue.push({
                    id: `s_${++n}`, target: `${entity} latest news 2025 2026`,
                    purpose: `Recent info about "${entity}"`,
                    query_type: 'news', priority: 'high',
                    depends_on: [], status: 'pending',
                });
            }
        }
        return queue;
    }

    // ========================================================================
    // Phase 2 — Execute searches & build context (NO LLM calls)
    // ========================================================================
    private static async executeResearch(
        queue: SearchTask[], intent: ParsedIntent,
        depth: 'minimum' | 'standard', messageId: string,
    ): Promise<ContextStore> {
        let totalSearches = 0;

        for (const task of queue) {
            try {
                console.log(`[Researcher] Searching: "${task.target}"`);
                const output = await SkillRegistry.runSkill('web_search', { query: task.target });
                task.result = output || '';
                task.status = 'completed';
                totalSearches++;

                // Only fetch 1 URL for critical tasks
                if (task.priority === 'critical' && output) {
                    const urls = this.extractUrls(output);
                    if (urls.length > 0) {
                        try {
                            console.log(`[Researcher] Fetching: ${urls[0]}`);
                            const fetched = await SkillRegistry.runSkill('fetch_url', { url: urls[0] });
                            if (fetched) task.result += `\n\n--- ${urls[0]} ---\n${fetched}`;
                            totalSearches++;
                        } catch (e) { console.error(`[Researcher] fetch_url failed:`, e); }
                    }
                }
            } catch (err) {
                console.error(`[Researcher] Search failed for "${task.target}":`, err);
                task.status = 'failed';
            }
        }

        // Build context entries deterministically (no LLM)
        const entries = this.buildContextEntries(queue.filter(t => t.status === 'completed'), intent);
        const gaps = intent.flagged_entities.filter(e =>
            !entries.find(en => en.entity_name.toLowerCase() === e.toLowerCase()) ||
            entries.find(en => en.entity_name.toLowerCase() === e.toLowerCase() && en.key_facts.length === 0)
        );

        return { entries, research_depth: depth, total_searches_executed: totalSearches, gaps };
    }

    private static extractUrls(text: string): string[] {
        const urls: string[] = [];
        const regex = /URL:\s*(https?:\/\/[^\s]+)/g;
        let m;
        while ((m = regex.exec(text)) !== null) urls.push(m[1]);
        return urls;
    }

    /**
     * Build structured ContextEntries from raw search output.
     * Pure string parsing — zero LLM calls.
     */
    private static buildContextEntries(tasks: SearchTask[], intent: ParsedIntent): ContextEntry[] {
        const entityMap = new Map<string, string>();
        for (const task of tasks) {
            const root = intent.flagged_entities.find(e => task.target.toLowerCase().includes(e.toLowerCase())) || task.target;
            entityMap.set(root, (entityMap.get(root) || '') + '\n' + (task.result || ''));
        }

        const entries: ContextEntry[] = [];
        for (const [entity, raw] of entityMap) {
            const sources = this.extractUrls(raw);
            const facts: string[] = [];

            // Extract Snippet: lines
            const snippetRe = /Snippet:\s*(.+)/g;
            let sm;
            while ((sm = snippetRe.exec(raw)) !== null) {
                const f = sm[1].trim();
                if (f.length > 15 && !facts.includes(f)) facts.push(f);
            }

            // Extract Title: lines
            const titleRe = /Title:\s*(.+)/g;
            while ((sm = titleRe.exec(raw)) !== null) {
                const f = sm[1].trim();
                if (f.length > 10 && !facts.includes(f)) facts.push(f);
            }

            // Fallback: meaningful lines from fetched content
            if (facts.length === 0) {
                raw.split('\n').filter(l => l.trim().length > 40 && !l.includes('URL:') && !l.startsWith('---') && !l.startsWith('Result'))
                    .slice(0, 3).forEach(l => facts.push(l.trim().substring(0, 200)));
            }

            const isError = raw.includes('failed') || raw.includes('no results') || raw.includes('anti-bot');
            const confidence: ContextEntry['confidence'] = isError ? 'unverified' : (facts.length > 0 && sources.length > 0) ? 'medium' : facts.length > 0 ? 'low' : 'unverified';

            entries.push({
                entity_name: entity,
                what_it_is: facts[0]?.substring(0, 150) || `Search results for "${entity}"`,
                key_facts: facts.slice(0, 5),
                current_status: 'unknown',
                relevant_to_goal: intent.intent,
                sources: sources.slice(0, 5),
                confidence,
                last_updated: new Date().toISOString(),
                researched_at: Date.now(),
            });
            console.log(`[Researcher] Built context: "${entity}" — ${facts.length} facts, ${sources.length} sources, confidence=${confidence}`);
        }
        return entries;
    }
}
