import * as fs from 'fs';
import * as path from 'path';
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

  public static syncEntitiesInZehn(brainDir: string, username: string): void {
    const zehnPath = path.join(brainDir, 'Zehn.md');
    if (!fs.existsSync(zehnPath)) return;

    let zehnContent = fs.readFileSync(zehnPath, 'utf-8');
    
    const entityMatches = Array.from(zehnContent.matchAll(/E-(\d+)/g));
    let maxIdx = 5;
    if (entityMatches.length > 0) {
      const idxs = entityMatches.map(m => parseInt(m[1], 10));
      maxIdx = Math.max(...idxs);
    }

    const lowerContent = zehnContent.toLowerCase();
    const newEntities: string[] = [];

    let actualName = username;
    const atmanPath = path.join(brainDir, 'Atman.md');
    if (fs.existsSync(atmanPath)) {
      const atmanContent = fs.readFileSync(atmanPath, 'utf-8');
      const nameMatch = atmanContent.match(/User's name is ([a-zA-Z\s\.]+)/i);
      if (nameMatch && nameMatch[1]) {
        actualName = nameMatch[1].trim();
      }
    }

    if (!lowerContent.includes(actualName.toLowerCase()) && !lowerContent.includes('e-006') && !lowerContent.includes('primary user')) {
      maxIdx += 1;
      const idStr = `E-${String(maxIdx).padStart(3, '0')}`;
      newEntities.push(`| **${idStr}** | \`${actualName}\` | User | Primary user and system operator. Specializes in full-stack engineering and UI/UX design. | Commands and trains Brahma; controls server. |`);
    }

    if (!lowerContent.includes('skills/discord')) {
      maxIdx += 1;
      const idStr = `E-${String(maxIdx).padStart(3, '0')}`;
      newEntities.push(`| **${idStr}** | \`skills/discord\` | Directory | Contains Discord administrative capability sheets. | Loaded by Hunar; executed by DiscordService. |`);
    }

    if (!lowerContent.includes('skills/brahma')) {
      maxIdx += 1;
      const idStr = `E-${String(maxIdx).padStart(3, '0')}`;
      newEntities.push(`| **${idStr}** | \`skills/brahma\` | Directory | Contains Brahma strategic orchestration skill sheets. | Loaded by Hunar; executed by OrchestratorService. |`);
    }

    if (!lowerContent.includes('hunar.md') && !lowerContent.includes('skill registry')) {
      maxIdx += 1;
      const idStr = `E-${String(maxIdx).padStart(3, '0')}`;
      newEntities.push(`| **${idStr}** | \`Hunar.md\` | File | Master capability registry listing all operational skills. | Maintained by Brahma; dictates operational capabilities. |`);
    }

    if (newEntities.length > 0) {
      const insertion = newEntities.join('\n') + '\n';
      if (zehnContent.includes('<!-- DYNAMIC_ENTITY_INSERTION_MARKER -->')) {
        zehnContent = zehnContent.replace(
          '<!-- DYNAMIC_ENTITY_INSERTION_MARKER -->',
          `<!-- DYNAMIC_ENTITY_INSERTION_MARKER -->\n${insertion}`
        );
        
        zehnContent = zehnContent.replace(
          /indexed_entities_count: \d+/,
          `indexed_entities_count: ${maxIdx}`
        );
        
        fs.writeFileSync(zehnPath, zehnContent, 'utf-8');
        console.log(`🧠 [Zehn Sync] Registered ${newEntities.length} new structural entities dynamically.`);
      }
    }
  }
  public static execCreateSkill(
    brainDir: string,
    skillName: string,
    description: string,
    category: string,
    paramSpec: string,
    triggers: string,
    reloadCallback?: () => void
  ): { skillId: string; fileName: string; filePath: string } {
    const hunarPath = path.join(brainDir, 'Hunar.md');
    if (!fs.existsSync(hunarPath)) throw new Error('Hunar.md not found in Brain directory.');

    // Derive next S-ID from Hunar.md
    const hunarContent = fs.readFileSync(hunarPath, 'utf-8');
    const skillMatches = Array.from(hunarContent.matchAll(/S-(\d+)/g));
    let maxSkillNum = 23;
    if (skillMatches.length > 0) {
      const nums = skillMatches.map(m => parseInt(m[1], 10));
      maxSkillNum = Math.max(...nums);
    }
    const nextSkillNum = maxSkillNum + 1;
    const skillId = `S-${String(nextSkillNum).padStart(3, '0')}`;

    // Derive the skill action name (SCREAMING_SNAKE_CASE) and file name
    const actionName = skillName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    const fileName = skillName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '.md';
    const categoryDir = path.join(brainDir, 'skills', 'brahma');
    if (!fs.existsSync(categoryDir)) fs.mkdirSync(categoryDir, { recursive: true });
    const filePath = path.join(categoryDir, fileName);

    if (fs.existsSync(filePath)) {
      throw new Error(`Skill file "${fileName}" already exists in skills/brahma/.`);
    }

    // Generate the skill markdown file following the established skill sheet pattern
    const nowIso = new Date().toISOString();
    const skillContent = [
      `# Skill Sheet: ${actionName}`,
      ``,
      `\`\`\`yaml`,
      `id: ${skillId}`,
      `version: 1.0.0`,
      `category: ${category}`,
      `name: ${actionName}`,
      `status: ACTIVE`,
      `description: "${description}"`,
      `paramSpec: '${paramSpec}'`,
      `created_on: ${nowIso}`,
      `\`\`\``,
      ``,
      `---`,
      ``,
      `## 1. Activation & Execution Triggers`,
      ``,
      `* **Keyword Triggers**: ${triggers}`,
      `* **Context Conditions**: User queries corresponding operation in natural language.`,
      ``,
      `---`,
      ``,
      `## 2. Input / Output Schema Specification`,
      ``,
      `### Input Parameters`,
      `| Parameter | Data Type | Required | Description |`,
      `| :--- | :---: | :---: | :--- |`,
      `| params | \`object\` | **YES** | Conforming to YAML paramSpec contract. |`,
      ``,
      `---`,
      ``,
      `## 3. High-Density Rules & Directives`,
      ``,
      `- ${description}`,
      `- Always validate input params before execution.`,
      `- Fail fast and return descriptive error on invalid inputs.`,
      ``,
      `---`,
      ``,
      `## 4. Execution Patterns (Examples)`,
      ``,
      `Standard payload invocation:`,
      `\`\`\`json`,
      `{`,
      `  "action": "${actionName}",`,
      `  "params": ${paramSpec}`,
      `}`,
      `\`\`\``,
      ``,
    ].join('\n');

    fs.writeFileSync(filePath, skillContent, 'utf-8');
    console.log(`🛠️ [Skill Engine] Created skill file: ${filePath}`);

    // Register in Hunar.md using DYNAMIC_SKILL_INSERTION_MARKER
    const relPath = `file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/brahma/${fileName}`;
    const newRow = `| **${skillId}** | \`${category}\` | ${actionName} | [${fileName}](${relPath}) | **ACTIVE** | ${description} |`;

    if (hunarContent.includes('<!-- DYNAMIC_SKILL_INSERTION_MARKER -->')) {
      const updatedHunar = hunarContent
        .replace(
          '<!-- DYNAMIC_SKILL_INSERTION_MARKER -->',
          `<!-- DYNAMIC_SKILL_INSERTION_MARKER -->\n${newRow}`
        )
        .replace(/registered_skills_count: \d+/, `registered_skills_count: ${nextSkillNum}`);

      fs.writeFileSync(hunarPath, updatedHunar, 'utf-8');
      console.log(`🛠️ [Skill Engine] Registered ${skillId} in Hunar.md.`);
    } else {
      console.warn('⚠️ [Skill Engine] DYNAMIC_SKILL_INSERTION_MARKER not found in Hunar.md.');
    }

    // Hot-reload the Hunar skill registry if a callback is provided
    if (reloadCallback) reloadCallback();

    return { skillId, fileName, filePath };
  }
}

