import fs from 'fs/promises';
import path from 'path';
import { LLMService, ChatMessage } from './llm.service';

export class EvolutionService {
    private static brainPath = path.join(__dirname, '../Brahma [brain]');

    /**
     * Chintan: Analyzes an interaction to extract new knowledge.
     */
    static async reflect(userQuery: string, assistantResponse: string): Promise<void> {
        console.log('--- Phase C: Cognitive Integration (Reflection) ---');
        
        const systemPrompt = `
You are Chintan, the Reflection agent for Brahma.
Review the following interaction and determine if any NEW entities, relationships, or permanent facts should be saved to the brain.

Interaction:
User: "${userQuery}"
Brahma: "${assistantResponse}"

Output a JSON object with any updates:
{
    "newEntities": [{ "category": string, "name": string, "notes": string, "tags": string[] }],
    "newRelationships": [{ "sourceName": string, "relation": string, "targetName": string }],
    "newFacts": [{ "category": string, "fact": string }]
}
If nothing new, return empty arrays.
`;

        const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
        const reflectionJson = await LLMService.chat(messages, { json_mode: true });
        const reflection = JSON.parse(reflectionJson);

        if (reflection.newEntities?.length > 0) await this.updateEntities(reflection.newEntities);
        if (reflection.newRelationships?.length > 0) await this.updateRelationships(reflection.newRelationships);
        if (reflection.newFacts?.length > 0) await this.updateKarma(reflection.newFacts);
    }

    private static async updateEntities(entities: any[]) {
        const filePath = path.join(this.brainPath, 'Zehn/entities.md');
        let content = await fs.readFile(filePath, 'utf-8');
        
        for (const entity of entities) {
            const nextId = `E-${(content.match(/E-\d+/g)?.length || 0).toString().padStart(3, '0')}`;
            const newLine = `| ${nextId} | ${entity.category} | ${entity.name} | ${entity.notes} | ${entity.tags.join(', ')} |`;
            content += `\n${newLine}`;
            
            // Update Index
            const indexEntry = `- ${nextId}: ${entity.name} (Line ${content.split('\n').length})`;
            content = content.replace('<!-- INDEX_END -->', `${indexEntry}\n<!-- INDEX_END -->`);
        }
        await fs.writeFile(filePath, content);
    }

    private static async updateRelationships(rels: any[]) {
        const filePath = path.join(this.brainPath, 'Zehn/relationships.md');
        let content = await fs.readFile(filePath, 'utf-8');
        
        for (const rel of rels) {
            const nextId = `R-${(content.match(/R-\d+/g)?.length || 0).toString().padStart(3, '0')}`;
            const newLine = `| ${nextId} | ${rel.sourceName} | ${rel.relation} | ${rel.targetName} | 10 |`;
            content += `\n${newLine}`;
            
            // Update Index
            const indexEntry = `- ${nextId}: ${rel.sourceName} -> ${rel.relation} -> ${rel.targetName} (Line ${content.split('\n').length})`;
            content = content.replace('<!-- INDEX_END -->', `${indexEntry}\n<!-- INDEX_END -->`);
        }
        await fs.writeFile(filePath, content);
    }

    private static async updateKarma(facts: any[]) {
        const filePath = path.join(this.brainPath, 'Karma/long_term_memory.md');
        let content = await fs.readFile(filePath, 'utf-8');
        
        for (const fact of facts) {
            const nextId = `T-${(content.match(/T-\d+/g)?.length || 0).toString().padStart(3, '0')}`;
            const newLine = `| ${nextId} | ${fact.category} | ${fact.fact} | 10 |`;
            content += `\n${newLine}`;
            
            // Update Index
            const indexEntry = `- ${nextId}: ${fact.fact.substring(0, 20)}... (Line ${content.split('\n').length})`;
            content = content.replace('<!-- INDEX_END -->', `${indexEntry}\n<!-- INDEX_END -->`);
        }
        await fs.writeFile(filePath, content);
    }
}
