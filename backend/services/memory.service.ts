import fs from 'fs/promises';
import path from 'path';

export class MemoryService {
    private static brainPath = path.join(__dirname, '../Brahma [brain]');

    /**
     * Updates an entity in Zehn/entities.md and its index.
     */
    static async saveEntity(id: string, category: string, name: string, description: string, tags: string) {
        const filePath = path.join(this.brainPath, 'Zehn/entities.md');
        let content = await fs.readFile(filePath, 'utf-8');
        
        // 1. Add to the table
        const newRow = `| ${id} | ${category} | ${name} | ${description} | ${tags} |`;
        content += `\n${newRow}`;

        // 2. Update Index
        const lines = content.split('\n');
        const indexEnd = lines.findIndex(l => l.includes('<!-- INDEX_END -->'));
        const newIndexLine = `- ${id}: ${name} (Line ${lines.length})`;
        
        lines.splice(indexEnd, 0, newIndexLine);
        
        await fs.writeFile(filePath, lines.join('\n'));
    }

    /**
     * Updates a relationship in Zehn/relationships.md
     */
    static async saveRelationship(id: string, source: string, relation: string, target: string, strength: number) {
        const filePath = path.join(this.brainPath, 'Zehn/relationships.md');
        let content = await fs.readFile(filePath, 'utf-8');
        
        const newRow = `| ${id} | ${source} | ${relation} | ${target} | ${strength} |`;
        content += `\n${newRow}`;

        // Update Index
        const lines = content.split('\n');
        const indexEnd = lines.findIndex(l => l.includes('<!-- INDEX_END -->'));
        const newIndexLine = `- ${id}: ${source} -> ${relation} -> ${target} (Line ${lines.length})`;
        
        lines.splice(indexEnd, 0, newIndexLine);
        
        await fs.writeFile(filePath, lines.join('\n'));
    }

    /**
     * Saves a permanent fact to Karma/long_term_memory.md
     */
    static async saveFact(id: string, category: string, fact: string, confidence: number) {
        const filePath = path.join(this.brainPath, 'Karma/long_term_memory.md');
        let content = await fs.readFile(filePath, 'utf-8');
        
        const newRow = `| ${id} | ${category} | ${fact} | ${confidence} |`;
        content += `\n${newRow}`;

        // Update Index
        const lines = content.split('\n');
        const indexEnd = lines.findIndex(l => l.includes('<!-- INDEX_END -->'));
        const newIndexLine = `- ${id}: ${fact.substring(0, 30)}... (Line ${lines.length})`;
        
        lines.splice(indexEnd, 0, newIndexLine);
        
        await fs.writeFile(filePath, lines.join('\n'));
    }
}
