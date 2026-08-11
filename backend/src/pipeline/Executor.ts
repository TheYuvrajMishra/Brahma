import { PlanStep } from './Planner';
import { Logger } from '../core/Logger';
import { NormalizedMessage } from '../types/Message';
import { SkillRegistry } from '../core/SkillRegistry';
import { EventBus, SystemEvents } from '../core/EventBus';

export interface ExecutionResult {
    step: number;
    action: string;
    tool: string;
    status: 'success' | 'failed';
    output: string;
}

export class Executor {
    static async execute(plan: PlanStep[], message: NormalizedMessage): Promise<ExecutionResult[]> {
        const results: ExecutionResult[] = [];
        const completedSteps = new Set<number>();

        Logger.info('Executor', message.message_id, 0, 'START', { total_steps: plan.length });

        for (const step of plan) {
            // Check dependencies
            const missingDeps = step.depends_on.filter(dep => !completedSteps.has(dep));
            if (missingDeps.length > 0) {
                Logger.error('Executor', message.message_id, `Step ${step.step} failed: Missing dependencies [${missingDeps.join(', ')}]`);
                results.push({
                    step: step.step,
                    action: step.action,
                    tool: step.tool,
                    status: 'failed',
                    output: `Failed due to missing dependencies: ${missingDeps.join(', ')}`
                });
                continue;
            }

            // Simulate tool execution with retries
            let attempts = 0;
            const maxAttempts = 3;
            let success = false;
            let output = '';

            while (attempts < maxAttempts && !success) {
                attempts++;
                try {
                    Logger.info('Executor', message.message_id, 0, `Executing step ${step.step}`, { tool: step.tool, attempt: attempts });
                    EventBus.emit(SystemEvents.STEP_EXECUTION_START, { message, step });
                    
                    // Gather outputs from dependencies
                    const depOutputs = step.depends_on.map(dep => {
                        const res = results.find(r => r.step === dep);
                        return `--- Output from Step ${dep} (${res?.action}) ---\n${res?.output}`;
                    }).join('\n\n');

                    // Interpolate step parameters using execution results so far
                    const interpolatedParams = this.interpolateParams(step.params, results);

                    // Inject context into params so the tool can see what happened before it
                    const paramsToRun = { 
                        ...interpolatedParams, 
                        _dependency_context: depOutputs,
                        _channel_id: message.channel_id,
                        _platform: message.platform,
                        _user_id: message.user_id
                    };
                    
                    output = await SkillRegistry.runSkill(step.tool, paramsToRun);
                    
                    Logger.audit('TOOL_EXECUTION', { tool: step.tool, params: interpolatedParams, outputLength: output.length, status: 'success', userId: message.user_id });
                    EventBus.emit(SystemEvents.STEP_EXECUTION_COMPLETE, { message, step, status: 'success', outputSummary: output.substring(0, 150) });
                    
                    success = true;
                } catch (err) {
                    Logger.audit('TOOL_EXECUTION', { tool: step.tool, params: step.params, error: String(err), status: 'failed', userId: message.user_id });
                    Logger.error('Executor', message.message_id, `Attempt ${attempts} failed for step ${step.step}: ${err}`);
                }
            }

            if (success) {
                completedSteps.add(step.step);
                results.push({
                    step: step.step,
                    action: step.action,
                    tool: step.tool,
                    status: 'success',
                    output
                });
            } else {
                results.push({
                    step: step.step,
                    action: step.action,
                    tool: step.tool,
                    status: 'failed',
                    output: 'All retry attempts failed.'
                });
            }
        }

        Logger.info('Executor', message.message_id, 0, 'COMPLETE', { completed: completedSteps.size, total: plan.length });
        return results;
    }

    private static interpolateParams(params: any, results: ExecutionResult[]): any {
        if (typeof params === 'string') {
            return params.replace(/\{\{step(\d+)(?:\.([a-zA-Z_0-9]+))?\}\}/g, (match, stepNumStr, property) => {
                const stepNum = parseInt(stepNumStr, 10);
                const referencedResult = results.find(r => r.step === stepNum);
                if (!referencedResult) return match;

                // Strip thinking process block if present
                let cleanOutput = referencedResult.output.trim();
                cleanOutput = cleanOutput.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

                if (property) {
                    try {
                        let jsonOutput = cleanOutput;
                        if (jsonOutput.startsWith('```')) {
                            jsonOutput = jsonOutput.replace(/^```[a-zA-Z0-9]*\n/, '').replace(/\n```$/, '').trim();
                        }
                        const parsed = JSON.parse(jsonOutput);
                        if (parsed && typeof parsed === 'object') {
                            const val = parsed[property];
                            if (val !== undefined) {
                                return typeof val === 'object' ? JSON.stringify(val) : String(val);
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to parse property ${property} from step ${stepNum} output:`, e);
                    }
                }
                return cleanOutput;
            });
        } else if (Array.isArray(params)) {
            return params.map(item => this.interpolateParams(item, results));
        } else if (params !== null && typeof params === 'object') {
            const resolved: any = {};
            for (const key of Object.keys(params)) {
                resolved[key] = this.interpolateParams(params[key], results);
            }
            return resolved;
        }
        return params;
    }
}
