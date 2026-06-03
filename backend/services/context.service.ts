import fs from 'fs/promises';
import path from 'path';

export class ContextService {
    private static brainPath = path.join(__dirname, '../Brahma [brain]');

    /**
     * Surgically reads a specific section of a brain file based on the Quick Index.
     */
    static async getSurgicalContext(category: 'Zehn' | 'Karma' | 'Chintan', fileName: string, query: string): Promise<string> {
        try {
            const filePath = path.join(this.brainPath, category, fileName);
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');

            // 1. Find the Index block
            const indexStart = lines.findIndex(l => l.includes('<!-- INDEX_START -->'));
            const indexEnd = lines.findIndex(l => l.includes('<!-- INDEX_END -->'));

            if (indexStart === -1 || indexEnd === -1) {
                return content; // Fallback to full file if no index
            }

            // 2. Search index for the query
            const indexLines = lines.slice(indexStart + 1, indexEnd);
            const targetLineMatch = indexLines.find(l => l.toLowerCase().includes(query.toLowerCase()));

            if (targetLineMatch) {
                const lineMatch = targetLineMatch.match(/Line (\d+)/);
                if (lineMatch) {
                    const lineNum = parseInt(lineMatch[1], 10) - 1; // 0-indexed
                    // Return the target line plus a small buffer (e.g., 5 lines)
                    return lines.slice(lineNum, lineNum + 5).join('\n');
                }
            }

            // Fallback: search the entire file for the query if not in index
            const fileLineIndex = lines.findIndex(l => l.toLowerCase().includes(query.toLowerCase()));
            if (fileLineIndex !== -1) {
                // Return that line plus some surrounding context
                const start = Math.max(0, fileLineIndex - 2);
                const end = Math.min(lines.length, fileLineIndex + 5);
                return lines.slice(start, end).join('\n');
            }

            return "Context not found in index or file.";
        } catch (error) {
            console.error('Context Service Error:', error);
            return '';
        }
    }

    static async getSoul(): Promise<string> {
        const soulPath = path.join(this.brainPath, 'Atman.md');
        return fs.readFile(soulPath, 'utf-8');
    }
}
