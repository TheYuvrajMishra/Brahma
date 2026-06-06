// ============================================================================
// SCRP (Synchronous Contextual Research Planner) — Type Definitions
// ============================================================================

/** Phase 0 output — parsed intent from user message */
export interface ParsedIntent {
    intent: string;
    entities: string[];
    actions: string[];
    constraints: string[];
    context: string;
    request_type: 'casual' | 'factual' | 'entity_dependent' | 'current_events' | 'task_based' | 'hybrid';
    flagged_entities: string[];
}

/** Phase 1 output — individual search task */
export interface SearchTask {
    id: string;
    target: string;
    purpose: string;
    query_type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    depends_on: string[];
    status: 'pending' | 'completed' | 'failed';
    result?: string;
}

/** Phase 2 output — structured knowledge about a single entity */
export interface ContextEntry {
    entity_name: string;
    what_it_is: string;
    key_facts: string[];
    current_status: string;
    relevant_to_goal: string;
    sources: string[];
    confidence: 'high' | 'medium' | 'low' | 'unverified';
    last_updated: string;
    researched_at: number;
}

/** Full context store */
export interface ContextStore {
    entries: ContextEntry[];
    research_depth: 'minimum' | 'standard' | 'deep';
    total_searches_executed: number;
    gaps: string[];
}

/** Research result passed downstream */
export interface ResearchResult {
    parsed_intent: ParsedIntent;
    context_store: ContextStore;
    research_required: boolean;
    skipped_reason?: string;
    duration_ms: number;
}
