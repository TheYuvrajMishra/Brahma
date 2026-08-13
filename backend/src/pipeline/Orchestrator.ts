import { Adapter } from '../adapters/Adapter';
import { NormalizedMessage } from '../types/Message';
import { Router } from './Router';
import { Researcher } from './Researcher';
import { Planner, PlanStep } from './Planner';
import { Executor, ExecutionResult } from './Executor';
import { Composer } from './Composer';
import { Observer } from './Observer';
import { Logger } from '../core/Logger';
import { EventBus, SystemEvents } from '../core/EventBus';
import { HealthServer } from '../core/HealthServer';
import { MemoryManager } from '../core/MemoryManager';

export class PipelineOrchestrator {
    private adapters: Adapter[] = [];
    private queue: { message: NormalizedMessage; adapter: Adapter; resolve: (val: any) => void; reject: (err: any) => void }[] = [];
    private maxConcurrency = 5;
    private currentProcessing = 0;

    registerAdapter(adapter: Adapter) {
        this.adapters.push(adapter);
    }

    async start() {
        for (const adapter of this.adapters) {
            await adapter.init((msg) => this.enqueueMessage(msg, adapter));
        }
    }

    private enqueueMessage(message: NormalizedMessage, adapter: Adapter): Promise<void> {
        return new Promise((resolve, reject) => {
            this.queue.push({ message, adapter, resolve, reject });
            HealthServer.metrics.activeQueueLength = this.queue.length;
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.currentProcessing >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }

        this.currentProcessing++;
        const item = this.queue.shift();
        if (item) {
            HealthServer.metrics.activeQueueLength = this.queue.length;
            try {
                await this.processMessage(item.message, item.adapter);
                item.resolve(true);
            } catch (error) {
                item.reject(error);
            } finally {
                this.currentProcessing--;
                this.processQueue();
            }
        } else {
            this.currentProcessing--;
        }
    }

    private async processMessage(message: NormalizedMessage, adapter: Adapter) {
        const startTime = Date.now();
        EventBus.emit(SystemEvents.MESSAGE_RECEIVED, message);

        try {
            // 1. Normalize (handled by adapter)
            
            // 2. Observe
            await Observer.observe(message);

            // 3. Route
            const routeStartTime = Date.now();
            const routeResult = await Router.route(message);
            Logger.info('Router', message.message_id, Date.now() - routeStartTime, 'SUCCESS', { 
                route: routeResult.bucket, 
                rule: routeResult.rule_matched, 
                confidence: routeResult.confidence_score 
            });
            EventBus.emit(SystemEvents.ROUTING_COMPLETE, { message, routeResult });

            // 3.1. SCRP Research
            EventBus.emit(SystemEvents.RESEARCH_STARTED, { message });
            const researchStartTime = Date.now();
            const researchResult = await Researcher.research(message, routeResult.bucket);
            Logger.info('Researcher', message.message_id, Date.now() - researchStartTime, 'SUCCESS', {
                research_required: researchResult.research_required,
                entries: researchResult.context_store.entries.length,
                searches: researchResult.context_store.total_searches_executed,
            });
            EventBus.emit(SystemEvents.RESEARCH_COMPLETE, { message, researchResult });

            // 3.5. Plan & Execute
            let executionLog: ExecutionResult[] | undefined = undefined;
            if (routeResult.bucket === 'complex') {
                EventBus.emit(SystemEvents.PLANNING_STARTED, { message });
                const plan = await Planner.plan(message, researchResult, routeResult.intent);
                EventBus.emit(SystemEvents.PLANNING_COMPLETE, { message, plan });
                
                if (plan.length > 0) {
                    executionLog = await Executor.execute(plan, message);
                } else if (researchResult.research_required && researchResult.context_store.entries.length > 0) {
                    console.log('[Orchestrator] RESEARCH_ONLY_MODE: Planner returned empty, using research context directly');
                    executionLog = researchResult.context_store.entries.map((entry, i) => ({
                        step: i + 1,
                        action: `research_${entry.entity_name}`,
                        tool: 'scrp_researcher',
                        status: 'success' as const,
                        output: `Entity: ${entry.entity_name}\n${entry.what_it_is}\nKey Facts:\n${entry.key_facts.map(f => `- ${f}`).join('\n')}\nSources:\n${entry.sources.map((s, j) => `[${j+1}] ${s}`).join('\n')}`,
                    }));
                }
            }

            // 4. Compose
            EventBus.emit(SystemEvents.COMPOSING_STARTED, { message });
            const composeStartTime = Date.now();
            const response = await Composer.compose(message, routeResult.bucket, executionLog, researchResult, routeResult.intent);
            Logger.info('Composer', message.message_id, Date.now() - composeStartTime, 'SUCCESS');

            // Append assistant response to moment.md for dialogue context
            try {
                const momentContent = await MemoryManager.getMoment(message.user_id, message.channel_id);
                const momentData = MemoryManager.parseMoment(momentContent);
                
                const cleanReply = response.content.replace(/\s+/g, ' ').trim();
                const truncatedReply = cleanReply.length > 2000 ? cleanReply.substring(0, 2000) + '...' : cleanReply;
                momentData.turns.push(`Assistant: ${truncatedReply}`);
                
                while (momentData.turns.length > 20) {
                    momentData.turns.shift();
                }
                
                const newMoment = MemoryManager.formatMoment(momentData);
                await MemoryManager.updateMoment(newMoment, message.user_id, message.channel_id);
            } catch (err) {
                console.error('Failed to append assistant response to moment.md:', err);
            }

            // Respond back to adapter
            await adapter.emit(response);
            EventBus.emit(SystemEvents.PIPELINE_COMPLETE, { message, response });

            // Decoupled parallel artifact generation loop check
            try {
                const { ArtifactEngine } = require('./ArtifactEngine');
                ArtifactEngine.checkAndTriggerArtifactFromMessage(message, response.content).catch((err: any) => {
                    console.error('[Orchestrator] Parallel artifact trigger error:', err);
                });
            } catch (err) {
                console.error('[Orchestrator] Failed to invoke ArtifactEngine check:', err);
            }

            Logger.info('Orchestrator', message.message_id, Date.now() - startTime, 'SUCCESS');

        } catch (error: any) {
            Logger.error('Orchestrator', message.message_id, error);
            EventBus.emit(SystemEvents.PIPELINE_ERROR, { message, error: error.message });
            await adapter.emit({
                originalMessage: message,
                content: `An error occurred while processing your request: ${error.message}`
            });
        }
    }
}
