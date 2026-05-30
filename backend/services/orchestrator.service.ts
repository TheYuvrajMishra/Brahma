import { Dharma } from '../models';
import type { ISubTask } from '../models/Dharma';
import { LLMService, LLMMessage } from './llm.service';
import { ContextService } from './context.service';

/** Shape the LLM must return when decomposing a mission */
interface DecomposedTask {
  title: string;
  description: string;
  requiredSkillCategory: string;
}

interface DecomposedMissionResponse {
  tasks: DecomposedTask[];
}

export class OrchestratorService {
  /**
   * Phase A: Strategic Synthesis (Planning)
   * Takes a user mission, hydrates Zehn context, calls the LLM, and stores
   * the decomposed sub-tasks into Dharma (Mission database).
   */
  public static async decomposeMission(
    missionTitle: string,
    objective: string,
    contextEntityIds: string[] = [],
    contextSessionIds: string[] = []
  ) {
    console.log(`🧠 Buddhi Orchestrator: Decomposing mission → "${missionTitle}"`);

    // 1. Hydrate token-efficient context from Zehn (entities + history in one call)
    const context = await ContextService.hydrateAll(contextEntityIds, contextSessionIds);
    const contextBlock = ContextService.formatForPrompt(context);

    // 2. Build the LLM system prompt (Buddhi persona, strict JSON output contract)
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: [
          'You are Buddhi, the strategic planner of the Brahma architecture.',
          'Your ONLY job is to decompose the provided mission into actionable sub-tasks.',
          'Respond in STRICT JSON matching EXACTLY this schema — no extra keys, no markdown:',
          '{',
          '  "tasks": [',
          '    {',
          '      "title": "string",',
          '      "description": "string",',
          '      "requiredSkillCategory": "string"',
          '    }',
          '  ]',
          '}',
          contextBlock,
        ].join('\n'),
      },
      {
        role: 'user',
        content: `Mission Title: ${missionTitle}\nObjective: ${objective}`,
      },
    ];

    // 3. Query the configured LLM API (generic, no vendor lock-in)
    console.log('🤖 Querying LLM for strategic decomposition...');
    const result = await LLMService.queryStructured<DecomposedMissionResponse>(messages);

    if (!Array.isArray(result.tasks) || result.tasks.length === 0) {
      throw new Error('LLM returned zero tasks. Cannot create a mission with no sub-tasks.');
    }

    // 4. Map LLM response to ISubTask[] with proper Mongoose-compatible defaults
    const newMissionId = `M-${Date.now().toString().slice(-6)}`;

    const subTasks: ISubTask[] = result.tasks.map(
      (t: DecomposedTask, index: number): ISubTask => ({
        subTaskId: `${newMissionId}-${String(index + 1).padStart(2, '0')}`,
        title: t.title,
        description: t.description,
        dependency: index === 0 ? null : `${newMissionId}-${String(index).padStart(2, '0')}`,
        assignedTo: 'Unassigned',
        status: 'PENDING',
        progress: 0,
      })
    );

    // 5. Persist the mission into Dharma
    const newDharma = new Dharma({
      missionId: newMissionId,
      title: missionTitle,
      objective,
      status: 'PENDING',
      overallProgress: 0,
      subTasks,
    });

    await newDharma.save();
    console.log(`✅ Mission "${missionTitle}" saved as ${newMissionId} with ${subTasks.length} sub-tasks.`);
    return newDharma;
  }

  /**
   * Phase B: Tactical Execution – promotes the next PENDING sub-task to IN_PROGRESS.
   * Returns the activated sub-task or null if the mission is complete.
   */
  public static async executeNextTask(missionId: string): Promise<ISubTask | null> {
    const mission = await Dharma.findOne({ missionId });
    if (!mission) throw new Error(`Mission "${missionId}" not found in Dharma.`);

    const nextTask = mission.subTasks.find(
      (t: ISubTask) => t.status === 'PENDING'
    );

    if (!nextTask) {
      console.log(`🏁 All sub-tasks complete for mission ${missionId}.`);
      // Mark the parent mission as completed if all sub-tasks are done
      if (mission.subTasks.every((t: ISubTask) => t.status === 'COMPLETED')) {
        mission.status = 'COMPLETED';
        mission.overallProgress = 100;
        await mission.save();
        console.log(`✅ Mission ${missionId} marked as COMPLETED.`);
      }
      return null;
    }

    // Promote the task to IN_PROGRESS
    nextTask.status = 'IN_PROGRESS';

    // Recalculate overall mission progress
    const completedCount = mission.subTasks.filter(
      (t: ISubTask) => t.status === 'COMPLETED'
    ).length;
    mission.overallProgress = Math.round((completedCount / mission.subTasks.length) * 100);
    mission.status = 'IN_PROGRESS';
    mission.lastSync = new Date();

    await mission.save();
    console.log(`🚀 Activated sub-task: ${nextTask.subTaskId} — "${nextTask.title}"`);
    return nextTask;
  }

  /**
   * Marks a specific sub-task as COMPLETED and recalculates mission progress.
   */
  public static async completeTask(
    missionId: string,
    subTaskId: string
  ): Promise<void> {
    const mission = await Dharma.findOne({ missionId });
    if (!mission) throw new Error(`Mission "${missionId}" not found in Dharma.`);

    const task = mission.subTasks.find((t: ISubTask) => t.subTaskId === subTaskId);
    if (!task) throw new Error(`Sub-task "${subTaskId}" not found in mission "${missionId}".`);

    task.status = 'COMPLETED';
    task.progress = 100;

    const completedCount = mission.subTasks.filter(
      (t: ISubTask) => t.status === 'COMPLETED'
    ).length;
    mission.overallProgress = Math.round((completedCount / mission.subTasks.length) * 100);

    if (completedCount === mission.subTasks.length) {
      mission.status = 'COMPLETED';
    }

    mission.lastSync = new Date();
    await mission.save();
    console.log(`✅ Sub-task ${subTaskId} marked COMPLETED. Mission progress: ${mission.overallProgress}%`);
  }
}

