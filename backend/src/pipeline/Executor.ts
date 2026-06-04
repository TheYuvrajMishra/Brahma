import { PlanStep } from './Planner';
import { Logger } from '../core/Logger';
import { NormalizedMessage } from '../types/Message';
import { SkillRegistry } from '../core/SkillRegistry';

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
                    
                    // Gather outputs from dependencies
                    const depOutputs = step.depends_on.map(dep => {
                        const res = results.find(r => r.step === dep);
                        return `--- Output from Step ${dep} (${res?.action}) ---\n${res?.output}`;
                    }).join('\n\n');

                    // Inject context into params so the tool can see what happened before it
                    const paramsToRun = { ...step.params, _dependency_context: depOutputs };
                    
                    output = await SkillRegistry.runSkill(step.tool, paramsToRun);
                    
                    success = true;
                } catch (err) {
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
}
