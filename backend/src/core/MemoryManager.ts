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
            return fs.readFileSync(path.join(config.brainPath, 'atman.md'), 'utf-8');
        } catch {
            return '';
        }
    }

    static getZehn(): string {
        try {
            return fs.readFileSync(path.join(config.brainPath, 'zehn.md'), 'utf-8');
        } catch {
            return '';
        }
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
            }
        };

        const activeCategories = new Set<string>();
        if (intent === 'email_request') {
            activeCategories.add('email');
        } else if (intent === 'coding') {
            activeCategories.add('ui');
        } else if (intent === 'emotional_support') {
            activeCategories.add('stress');
        }
        
        for (const [key, rule] of Object.entries(RULES)) {
            if (rule.keywords.some(keyword => searchText.includes(keyword))) {
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
                    if (rule.keywords.some(keyword => content.includes(keyword))) {
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

    static getPlannerSchema(): string {
        try {
            return fs.readFileSync(path.join(config.brainPath, 'planner.md'), 'utf-8');
        } catch {
            return '';
        }
    }

    static getHunar(): string {
        try {
            return fs.readFileSync(path.join(config.brainPath, 'hunar.md'), 'utf-8');
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
                fs.writeFileSync(path.join(config.brainPath, 'moment.md'), content, 'utf-8');
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

    static updateZehn(content: string): void {
        try {
            fs.writeFileSync(path.join(config.brainPath, 'zehn.md'), content, 'utf-8');
            Logger.audit('MEMORY_WRITE', { file: 'zehn.md', type: 'update', length: content.length });
        } catch (err) {
            console.error('Failed to write to zehn.md:', err);
        }
    }

    static appendZehnFact(fact: string): void {
        try {
            const current = this.getZehn();
            const appendText = `\n- [${new Date().toISOString()}] ${fact}`;
            fs.writeFileSync(path.join(config.brainPath, 'zehn.md'), current + appendText, 'utf-8');
            Logger.audit('MEMORY_WRITE', { file: 'zehn.md', type: 'append', fact });
        } catch (err) {
            console.error('Failed to append to zehn.md:', err);
        }
    }

    static getResearcherConfig(): string {
        try {
            return fs.readFileSync(path.join(config.brainPath, 'researcher.md'), 'utf-8');
        } catch {
            return '';
        }
    }
}
