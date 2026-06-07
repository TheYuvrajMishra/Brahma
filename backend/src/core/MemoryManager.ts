import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Logger } from './Logger';
import { SessionContext } from '../models/SessionContext';

export class MemoryManager {
    static async getSoul(channelId?: string): Promise<string> {
        try {
            if (channelId) {
                const doc = await SessionContext.findOne({ channelId });
                if (doc && doc.customPersona) {
                    return doc.customPersona;
                }
            }
            return await fs.promises.readFile(path.join(config.brainPath, 'atman.md'), 'utf-8');
        } catch {
            return '';
        }
    }

    static async getZehn(): Promise<string> {
        try {
            return await fs.promises.readFile(path.join(config.brainPath, 'zehn.md'), 'utf-8');
        } catch {
            return '';
        }
    }

    private static matchKeyword(text: string, keyword: string): boolean {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const startBoundary = /^\w/.test(keyword) ? '\\b' : '';
        const endBoundary = /\w$/.test(keyword) ? '\\b' : '';
        const regex = new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'i');
        return regex.test(text);
    }

    static getFilteredZehn(rawZehn: string, intent: string, userMessage: string, recentTurns: string): string {
        const lines = rawZehn.split('\n');
        const filteredLines: string[] = [];
        
        const searchText = (userMessage + ' ' + recentTurns).toLowerCase();
        
        interface FactFilterRule {
            keywords: string[];
            category: string;
        }

        const RULES: Record<string, FactFilterRule> = {
            foontro: {
                keywords: ['foontro', 'freelance', 'marketplace', 'startup', 'cto'],
                category: 'project_foontro'
            },
            savaya: {
                keywords: ['savaya', 'shikha', 'savayashikha', 'rani', 'love', 'romantic', 'conflict', 'relationship', 'gf', 'girlfriend', 'affection'],
                category: 'relationship'
            },
            adhd: {
                keywords: ['adhd', 'attention deficit', 'hyperactive', 'disorder'],
                category: 'health_adhd'
            },
            stress: {
                keywords: ['stress', 'pressure', 'relax', 'exhausted', 'burnout', 'abusive', 'frustrated', 'upset', 'wellness', 'health', 'motivate', 'motivation', 'sehat', 'araam', 'break', 'priority', 'prioritize', 'pomodoro'],
                category: 'wellness'
            },
            ui: {
                keywords: ['ui', 'theme', 'dark', 'light', 'sidebar', 'border', 'styling', 'frontend', 'page', 'component', 'color'],
                category: 'user_interface'
            },
            email: {
                keywords: ['email', 'mail', 'inbox', 'gmail', 'recipient', 'send'],
                category: 'email'
            },
            discord: {
                keywords: ['discord', 'guild', 'channel', 'text channel', 'voice channel'],
                category: 'discord'
            },
            spreadsheet: {
                keywords: ['spreadsheet', 'sheet', 'sheets', 'google sheet', 'excel', 'row', 'column', 'cell'],
                category: 'spreadsheet'
            }
        };

        const activeCategories = new Set<string>();
        if (intent === 'email_request') {
            activeCategories.add('email');
        } else if (intent === 'coding') {
            activeCategories.add('ui');
        } else if (intent === 'emotional_support') {
            activeCategories.add('stress');
        } else if (intent === 'spreadsheet_request') {
            activeCategories.add('spreadsheet');
        }
        
        for (const [key, rule] of Object.entries(RULES)) {
            if (rule.keywords.some(keyword => this.matchKeyword(searchText, keyword))) {
                activeCategories.add(key);
            }
        }
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                filteredLines.push(line);
                continue;
            }
            
            if (trimmed.startsWith('#')) {
                filteredLines.push(line);
                continue;
            }
            
            if (trimmed.startsWith('-')) {
                const content = trimmed.substring(1).trim().toLowerCase();
                
                // Keep name and general language/persona preferences
                const isAlwaysAllowed = 
                    content.startsWith('name:') ||
                    content.includes('language') ||
                    content.includes('hinglish') ||
                    content.includes('hindi') ||
                    content.includes('english') ||
                    content.includes('persona') ||
                    content.includes('style') ||
                    content.includes('tone') ||
                    content.includes('communication') ||
                    content.includes('bhaijaan') ||
                    content.includes('salman');
                    
                if (isAlwaysAllowed) {
                    filteredLines.push(line);
                    continue;
                }
                
                let belongsToGated = false;
                let matchesActive = false;
                
                for (const [key, rule] of Object.entries(RULES)) {
                    if (rule.keywords.some(keyword => this.matchKeyword(content, keyword))) {
                        belongsToGated = true;
                        if (activeCategories.has(key)) {
                            matchesActive = true;
                        }
                    }
                }
                
                if (!belongsToGated) {
                    filteredLines.push(line);
                } else if (matchesActive) {
                    filteredLines.push(line);
                }
            } else {
                filteredLines.push(line);
            }
        }
        
        // Clean up empty sections
        const resultLines: string[] = [];
        let lastHeaderIdx = -1;
        
        for (let i = 0; i < filteredLines.length; i++) {
            const line = filteredLines[i];
            if (line.trim().startsWith('#') || line.trim().startsWith('##')) {
                if (lastHeaderIdx !== -1) {
                    const prevSectionLines = resultLines.slice(lastHeaderIdx + 1);
                    const hasContent = prevSectionLines.some(l => l.trim().startsWith('-'));
                    if (!hasContent) {
                        resultLines.splice(lastHeaderIdx, resultLines.length - lastHeaderIdx);
                    }
                }
                lastHeaderIdx = resultLines.length;
                resultLines.push(line);
            } else {
                resultLines.push(line);
            }
        }
        
        if (lastHeaderIdx !== -1) {
            const lastSectionLines = resultLines.slice(lastHeaderIdx + 1);
            const hasContent = lastSectionLines.some(l => l.trim().startsWith('-'));
            if (!hasContent) {
                resultLines.splice(lastHeaderIdx, resultLines.length - lastHeaderIdx);
            }
        }
        
        return resultLines.join('\n');
    }

    static async getMoment(channelId?: string): Promise<string> {
        try {
            if (channelId) {
                const doc = await SessionContext.findOne({ channelId });
                if (doc && doc.momentMarkdown) {
                    return doc.momentMarkdown;
                }
            }
            // Fallback default moment structure
            return `# Moment: Session Memory\n## Current Context\n- **Current Topic**: Unknown\n- **Detected Tone**: Unknown\n- **Active Task**: None\n\n## Recent Turns`;
        } catch {
            return '';
        }
    }

    static parseMoment(markdown: string): { topic: string; tone: string; activeTask: string; turns: string[] } {
        const data = {
            topic: 'Unknown',
            tone: 'Unknown',
            activeTask: 'None',
            turns: [] as string[]
        };

        // Extract Topic
        const topicMatch = markdown.match(/-\s+\*\*Current Topic\*\*:\s*([^\n]+)/i);
        if (topicMatch) {
            data.topic = topicMatch[1].trim();
        }

        // Extract Tone
        const toneMatch = markdown.match(/-\s+\*\*Detected Tone\*\*:\s*([^\n]+)/i);
        if (toneMatch) {
            data.tone = toneMatch[1].trim();
        }

        // Extract Active Task
        const taskMatch = markdown.match(/-\s+\*\*Active Task\*\*:\s*([^\n]+)/i);
        if (taskMatch) {
            data.activeTask = taskMatch[1].trim();
        }

        // Extract Turns
        if (markdown.includes('## Recent Turns')) {
            const parts = markdown.split('## Recent Turns');
            const turnsText = parts[1].trim();
            if (turnsText) {
                const lines = turnsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                data.turns = lines.map(line => {
                    return line.replace(/^\d+\.\s*/, '').trim();
                });
            }
        }

        return data;
    }

    static formatMoment(data: { topic: string; tone: string; activeTask: string; turns: string[] }): string {
        const renumberedTurns = data.turns.map((turn, idx) => `${idx + 1}. ${turn}`).join('\n');
        return `# Moment: Session Memory
## Current Context
- **Current Topic**: ${data.topic}
- **Detected Tone**: ${data.tone}
- **Active Task**: ${data.activeTask}

## Recent Turns
${renumberedTurns}`.trim();
    }

    static async getPlannerSchema(): Promise<string> {
        try {
            return await fs.promises.readFile(path.join(config.brainPath, 'planner.md'), 'utf-8');
        } catch {
            return '';
        }
    }

    static async getHunar(): Promise<string> {
        try {
            return await fs.promises.readFile(path.join(config.brainPath, 'hunar.md'), 'utf-8');
        } catch {
            return '';
        }
    }

    static async updateMoment(content: string, channelId?: string): Promise<void> {
        try {
            if (channelId) {
                await SessionContext.updateOne(
                    { channelId },
                    { $set: { momentMarkdown: content } },
                    { upsert: true }
                );
            } else {
                await fs.promises.writeFile(path.join(config.brainPath, 'moment.md'), content, 'utf-8');
            }
        } catch (err) {
            console.error('Failed to write to moment:', err);
        }
    }

    static async updateCustomPersona(persona: string, channelId: string): Promise<void> {
        try {
            await SessionContext.updateOne(
                { channelId },
                { $set: { customPersona: persona } },
                { upsert: true }
            );
            Logger.audit('MEMORY_WRITE', { file: `customPersona_${channelId}`, type: 'update', length: persona.length });
        } catch (err) {
            console.error('Failed to write custom persona:', err);
        }
    }

    static async updateZehn(content: string): Promise<void> {
        try {
            await fs.promises.writeFile(path.join(config.brainPath, 'zehn.md'), content, 'utf-8');
            Logger.audit('MEMORY_WRITE', { file: 'zehn.md', type: 'update', length: content.length });
        } catch (err) {
            console.error('Failed to write to zehn.md:', err);
        }
    }

    static async appendZehnFact(fact: string): Promise<void> {
        try {
            const current = await this.getZehn();
            const appendText = `\n- [${new Date().toISOString()}] ${fact}`;
            await fs.promises.writeFile(path.join(config.brainPath, 'zehn.md'), current + appendText, 'utf-8');
            Logger.audit('MEMORY_WRITE', { file: 'zehn.md', type: 'append', fact });
        } catch (err) {
            console.error('Failed to append to zehn.md:', err);
        }
    }

    static async getResearcherConfig(): Promise<string> {
        try {
            return await fs.promises.readFile(path.join(config.brainPath, 'researcher.md'), 'utf-8');
        } catch {
            return '';
        }
    }
}
