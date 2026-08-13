import { NormalizedMessage } from '../types/Message';
import { ParsedIntent, SearchTask, ContextEntry, ContextStore, ResearchResult } from '../types/ResearchTypes';
import { ContextStoreManager } from '../core/ContextStoreManager';
import { LLMService } from '../services/LLMService';
import { SkillRegistry } from '../core/SkillRegistry';
import { Logger } from '../core/Logger';
import { MemoryManager } from '../core/MemoryManager';
import { YouTubeService } from '../services/YouTubeService';
import { WebSearch } from '../skills/WebSearch';

const DEPTH_MAP: Record<string, 'minimum' | 'standard'> = {
    casual: 'minimum',
    factual: 'minimum',
    entity_dependent: 'standard',
    current_events: 'standard',
    task_based: 'standard',
    hybrid: 'standard',
};

const DEPTH_LIMITS: Record<string, number> = { minimum: 1, standard: 2 };

const defaultParsedIntent: ParsedIntent = {
    intent: 'general',
    entities: [],
    actions: [],
    constraints: [],
    context: '',
    request_type: 'casual',
    flagged_entities: []
};

export class Researcher {

    static async research(message: NormalizedMessage, routeBucket: string): Promise<ResearchResult> {
        const startTime = Date.now();
        const userId = message.user_id;

        try {
            // ── Phase -1: Direct URL & YouTube Detection (Skip Search-and-Rank) ────
            const detectedUrls = message.content.match(/https?:\/\/[^\s<>"'\(\)]+/gi) || [];

            if (detectedUrls.length > 0) {
                console.log(`[Researcher] Detected ${detectedUrls.length} direct user-supplied URL(s):`, detectedUrls);
                const directEntries: ContextEntry[] = [];
                const webSearch = new WebSearch();

                for (const url of detectedUrls) {
                    const ytVideoId = YouTubeService.extractVideoId(url);
                    if (ytVideoId) {
                        // YouTube Link -> YouTube Transcript Pipeline
                        console.log(`[Researcher] Routing user link to YouTube Transcript pipeline for video ID: ${ytVideoId}`);
                        const ytEntry = await YouTubeService.processYouTubeUrl(url, message.content, message.message_id);
                        ContextStoreManager.set(url, ytEntry, userId);
                        directEntries.push(ytEntry);
                    } else {
                        // Regular Web Link -> Direct Visit & DOM Cleanup (Skip Search)
                        console.log(`[Researcher] Routing regular link directly to Visit & Clean stage: ${url}`);
                        const searchOutput = await webSearch.fetchDirectUrl(url, message.content, message.message_id);

                        const domain = url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
                        const entry: ContextEntry = {
                            entity_name: domain || url,
                            what_it_is: `Direct Web Article content for ${url}`,
                            key_facts: [searchOutput],
                            current_status: 'active',
                            relevant_to_goal: 'high',
                            sources: [url],
                            confidence: 'high',
                            last_updated: new Date().toISOString(),
                            researched_at: Date.now()
                        };

                        ContextStoreManager.set(url, entry, userId);
                        directEntries.push(entry);
                    }
                }

                const parsedIntent: ParsedIntent = {
                    intent: 'research',
                    entities: detectedUrls,
                    actions: ['direct_url_visit'],
                    constraints: [],
                    context: message.content,
                    request_type: 'task_based',
                    flagged_entities: detectedUrls
                };

                return {
                    parsed_intent: parsedIntent,
                    context_store: {
                        entries: directEntries,
                        research_depth: 'standard',
                        total_searches_executed: detectedUrls.length,
                        gaps: []
                    },
                    research_required: true,
                    duration_ms: Date.now() - startTime
                };
            }

            // ── Phase 0: Intent Parsing (1 LLM call) ────────────────────
            const parsedIntent = await this.parseIntent(message);
            console.log(`[Researcher] Phase 0: type=${parsedIntent.request_type}, entities=[${parsedIntent.entities}], flagged=[${parsedIntent.flagged_entities}]`);

            // ── Gate Check ───────────────────────────────────────────────
            if (parsedIntent.flagged_entities.length === 0 || (routeBucket === 'greeting' && parsedIntent.request_type === 'casual')) {
                console.log(`[Researcher] SKIPPED: no flagged entities or greeting`);
                const moment = await MemoryManager.getMoment(message.user_id, message.channel_id);
                const searchText = (message.content + ' ' + moment).toLowerCase();
                const relevantCachedEntries = ContextStoreManager.getAll(userId).filter(entry => 
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
            const searchQueue = this.buildSearchQueue(parsedIntent, depth, userId);
            console.log(`[Researcher] Phase 1: depth=${depth}, queue=[${searchQueue.map(t => t.target)}]`);

            // ── Phase 2: Execute searches (no LLM calls) ────────────────
            const contextStore = await this.executeResearch(searchQueue, parsedIntent, depth, message.message_id, userId);
            console.log(`[Researcher] Phase 2: entries=${contextStore.entries.length}, searches=${contextStore.total_searches_executed}, gaps=${contextStore.gaps.length}`);

            return {
                parsed_intent: parsedIntent,
                context_store: contextStore,
                research_required: true,
                duration_ms: Date.now() - startTime,
            };
        } catch (err: any) {
            console.error('[Researcher] FAILED:', err);
            return {
                parsed_intent: defaultParsedIntent,
                context_store: { entries: [], research_depth: 'minimum', total_searches_executed: 0, gaps: [] },
                research_required: false,
                skipped_reason: `Research error: ${err.message}`,
                duration_ms: Date.now() - startTime,
            };
        }
    }


    private static async parseIntent(message: NormalizedMessage): Promise<ParsedIntent> {
        const researcherConfig = await MemoryManager.getResearcherConfig(message.user_id);
        const moment = await MemoryManager.getMoment(message.user_id, message.channel_id);

        const systemPrompt = `
You are the SCRP Researcher Intent Classifier.
Read the user's message and recent memory, then extract entities and determine research needs.

${researcherConfig}

### Current Session Memory
${moment}

Respond ONLY with a valid JSON object (no markdown, no backticks):
{
  "intent": "research",
  "entities": ["entity1", "entity2"],
  "actions": [],
  "constraints": [],
  "context": "",
  "request_type": "casual" | "factual" | "entity_dependent" | "current_events" | "task_based" | "hybrid",
  "flagged_entities": ["entity1"]
}
`.trim();

        const llmResp = await LLMService.chat(systemPrompt, `User message: "${message.content}"`, true);
        if (llmResp) {
            try {
                const clean = llmResp.replace(/```(?:json)?/gi, '').trim();
                const parsed = JSON.parse(clean);
                
                const isExplicitResearchRequest = /(research|search|find\s+info|who\s+is|who\s+owns|investigate|look\s*up)/i.test(message.content);
                let flagged: string[] = Array.isArray(parsed.flagged_entities) ? parsed.flagged_entities : [];
                if (!isExplicitResearchRequest) {
                    flagged = flagged.filter(e => !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(e).trim()));
                }

                return {
                    intent: parsed.intent || 'general',
                    entities: Array.isArray(parsed.entities) ? parsed.entities : [],
                    actions: Array.isArray(parsed.actions) ? parsed.actions : [],
                    constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
                    context: parsed.context || '',
                    request_type: parsed.request_type || 'casual',
                    flagged_entities: flagged,
                };
            } catch (e) {
                console.warn('[Researcher] LLM JSON parse failed, falling back.');
            }
        }

        return defaultParsedIntent;
    }

    private static buildSearchQueue(parsedIntent: ParsedIntent, depth: 'minimum' | 'standard', userId: string): SearchTask[] {
        const maxTasks = DEPTH_LIMITS[depth] || 1;
        const queue: SearchTask[] = [];

        for (const entity of parsedIntent.flagged_entities.slice(0, maxTasks)) {
            const cached = ContextStoreManager.get(entity, userId);
            if (cached) {
                console.log(`[Researcher] Context cache HIT for entity: ${entity}`);
                continue;
            }

            queue.push({
                id: `task_${queue.length + 1}`,
                target: entity,
                purpose: `Search details for ${entity}`,
                query_type: 'web_search',
                priority: queue.length === 0 ? 'high' : 'medium',
                depends_on: [],
                status: 'pending'
            });
        }

        return queue;
    }

    private static async executeResearch(
        queue: SearchTask[],
        parsedIntent: ParsedIntent,
        depth: 'minimum' | 'standard',
        messageId: string,
        userId: string
    ): Promise<ContextStore> {
        const entries: ContextEntry[] = [];
        const gaps: string[] = [];
        let totalSearches = 0;

        for (const task of queue) {
            const cached = ContextStoreManager.get(task.target, userId);
            if (cached) {
                entries.push(cached);
                continue;
            }

            try {
                console.log(`[Researcher] Executing web_search for: ${task.target}`);
                totalSearches++;
                const searchOutput = await SkillRegistry.runSkill('web_search', { query: task.target, _message_id: messageId });

                const entry: ContextEntry = {
                    entity_name: task.target,
                    what_it_is: `Web search results for ${task.target}`,
                    key_facts: [searchOutput],
                    current_status: 'active',
                    relevant_to_goal: 'high',
                    sources: ['Live Web Search'],
                    confidence: 'high',
                    last_updated: new Date().toISOString(),
                    researched_at: Date.now()
                };

                ContextStoreManager.set(task.target, entry, userId);
                entries.push(entry);
            } catch (err: any) {
                console.error(`[Researcher] Search failed for ${task.target}:`, err);
                gaps.push(`Search failed for ${task.target}: ${err.message}`);
            }
        }

        return {
            entries,
            research_depth: depth,
            total_searches_executed: totalSearches,
            gaps,
        };
    }
}
