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
        if (lines.length === 0) return '';

        // Extract Index Header lines if available
        const indexHeaderLines: string[] = [];
        let inIndexHeader = false;
        for (const line of lines) {
            if (line.trim().startsWith('## Index & Routing Table')) {
                inIndexHeader = true;
                indexHeaderLines.push(line);
                continue;
            }
            if (inIndexHeader) {
                if (line.trim().startsWith('## [')) {
                    inIndexHeader = false;
                } else {
                    indexHeaderLines.push(line);
                }
            }
        }

        const searchText = (userMessage + ' ' + recentTurns).toLowerCase();

        // Categorized section mapping
        const SECTION_KEYWORDS: Record<string, string[]> = {
            'SEC-01': ['user', 'who am i', 'my name', 'yuvraj', 'bio', 'education', 'background', 'profile'],
            'SEC-02': ['savaya', 'shikha', 'rani', 'love', 'romantic', 'conflict', 'relationship', 'gf', 'girlfriend', 'people', 'friend', 'family', 'partner', 'soft'],
            'SEC-03': ['persona', 'style', 'tone', 'hinglish', 'hindi', 'english', 'bhaijaan', 'kamath', 'communication', 'mode'],
            'SEC-04': ['work', 'job', 'foontro', 'brahma', 'cto', 'project', 'company', 'career', 'developer', 'github'],
            'SEC-05': ['email', 'mail', 'phone', 'contact', 'linkedin', 'website', 'number', 'address', 'send', 'recipient'],
            'SEC-06': ['routine', 'spreadsheet', 'health', 'sleep', 'habit', 'schedule', 'exercise', 'dinner'],
            'SEC-07': ['ui', 'dark', 'theme', 'system', 'config', 'brahma']
        };

        const activeSections = new Set<string>();

        // Always include User Identity [SEC-01] and Persona [SEC-03] for foundational grounding
        activeSections.add('SEC-01');
        activeSections.add('SEC-03');

        // Match user message & recent context against section keywords
        for (const [secId, keywords] of Object.entries(SECTION_KEYWORDS)) {
            if (keywords.some(kw => this.matchKeyword(searchText, kw))) {
                activeSections.add(secId);
            }
        }

        // Match based on intent routing
        if (intent === 'email_request') activeSections.add('SEC-05');
        if (intent === 'emotional_support') activeSections.add('SEC-02');
        if (intent === 'spreadsheet_request') activeSections.add('SEC-06');
        if (intent === 'coding') activeSections.add('SEC-04');

        // Parse markdown sections
        const extractedSections: string[] = [];
        let currentSecId = '';
        let currentLines: string[] = [];

        for (const line of lines) {
            const match = line.trim().match(/^##\s+\[(SEC-\d+)\]/i);
            if (match) {
                if (currentSecId && activeSections.has(currentSecId)) {
                    extractedSections.push(currentLines.join('\n'));
                }
                currentSecId = match[1].toUpperCase();
                currentLines = [line];
            } else if (currentSecId) {
                currentLines.push(line);
            }
        }
        if (currentSecId && activeSections.has(currentSecId)) {
            extractedSections.push(currentLines.join('\n'));
        }

        return indexHeaderLines.join('\n') + '\n\n' + extractedSections.join('\n\n');
    }

    static async getMoment(channelId?: string): Promise<string> {
        try {
            if (channelId) {
                const doc = await SessionContext.findOne({ channelId });
                if (doc && doc.momentMarkdown) {
                    return doc.momentMarkdown;
                }
            }
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

        const topicMatch = markdown.match(/-\s+\*\*Current Topic\*\*:\s*([^\n]+)/i);
        if (topicMatch) data.topic = topicMatch[1].trim();

        const toneMatch = markdown.match(/-\s+\*\*Detected Tone\*\*:\s*([^\n]+)/i);
        if (toneMatch) data.tone = toneMatch[1].trim();

        const taskMatch = markdown.match(/-\s+\*\*Active Task\*\*:\s*([^\n]+)/i);
        if (taskMatch) data.activeTask = taskMatch[1].trim();

        if (markdown.includes('## Recent Turns')) {
            const parts = markdown.split('## Recent Turns');
            const turnsText = parts[1].trim();
            if (turnsText) {
                const lines = turnsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                data.turns = lines.map(line => line.replace(/^\d+\.\s*/, '').trim());
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

    static async appendZehnFact(fact: string, specifiedSection?: string): Promise<void> {
        try {
            const current = await this.getZehn();
            const factLower = fact.toLowerCase();

            // Determine target section based on explicit request or fact content
            let targetSection = '[SEC-04] Work, Career & Projects'; // Default fallback for professional notes/facts

            if (specifiedSection) {
                const secClean = specifiedSection.trim().toUpperCase();
                if (secClean.includes('SEC-01')) targetSection = '[SEC-01] User Identity & Core Profile';
                else if (secClean.includes('SEC-02')) targetSection = '[SEC-02] People & Relationships';
                else if (secClean.includes('SEC-03')) targetSection = '[SEC-03] Persona & Communication Preferences';
                else if (secClean.includes('SEC-04')) targetSection = '[SEC-04] Work, Career & Projects';
                else if (secClean.includes('SEC-05')) targetSection = '[SEC-05] Contact Information & Channels';
                else if (secClean.includes('SEC-06')) targetSection = '[SEC-06] Health, Habits & Routines';
                else if (secClean.includes('SEC-07')) targetSection = '[SEC-07] System & Technical Config';
            } else {
                if (factLower.includes('savaya') || factLower.includes('girlfriend') || factLower.includes('relationship') || factLower.includes('shikha') || factLower.includes('rani') || factLower.includes('love') || factLower.includes('soft') || factLower.includes('kanishk') || factLower.includes('employer') || factLower.includes('founder') || factLower.includes('friend') || factLower.includes('boss')) {
                    // People & Relationships (or People related to work)
                    if (factLower.includes('kanishk') || factLower.includes('employer') || factLower.includes('nxt') || factLower.includes('founder') || factLower.includes('work') || factLower.includes('cto') || factLower.includes('job')) {
                        targetSection = '[SEC-04] Work, Career & Projects';
                    } else {
                        targetSection = '[SEC-02] People & Relationships';
                    }
                } else if (factLower.includes('persona') || factLower.includes('hinglish') || factLower.includes('tone') || factLower.includes('style') || factLower.includes('language')) {
                    targetSection = '[SEC-03] Persona & Communication Preferences';
                } else if (factLower.includes('foontro') || factLower.includes('brahma') || factLower.includes('work') || factLower.includes('cto') || factLower.includes('project') || factLower.includes('job') || factLower.includes('nxt') || factLower.includes('company') || factLower.includes('developer')) {
                    targetSection = '[SEC-04] Work, Career & Projects';
                } else if (factLower.includes('email') || factLower.includes('mail') || factLower.includes('phone') || factLower.includes('contact') || factLower.includes('github') || factLower.includes('linkedin')) {
                    targetSection = '[SEC-05] Contact Information & Channels';
                } else if (factLower.includes('routine') || factLower.includes('spreadsheet') || factLower.includes('health') || factLower.includes('sleep') || factLower.includes('habit')) {
                    targetSection = '[SEC-06] Health, Habits & Routines';
                } else if (factLower.includes('ui') || factLower.includes('theme') || factLower.includes('dark')) {
                    targetSection = '[SEC-07] System & Technical Config';
                }
            }

            const formattedFact = `- **Note**: ${fact}`;

            if (current.includes(`## ${targetSection}`)) {
                // Insert under existing section
                const parts = current.split(`## ${targetSection}`);
                const header = parts[0] + `## ${targetSection}`;
                const rest = parts[1];
                
                // Find next header or end of string
                const nextHeaderIdx = rest.indexOf('\n## ');
                let updatedZehn = '';
                if (nextHeaderIdx !== -1) {
                    const secContent = rest.substring(0, nextHeaderIdx);
                    const remaining = rest.substring(nextHeaderIdx);
                    updatedZehn = header + secContent + `\n${formattedFact}` + remaining;
                } else {
                    updatedZehn = header + rest + `\n${formattedFact}`;
                }
                await fs.promises.writeFile(path.join(config.brainPath, 'zehn.md'), updatedZehn, 'utf-8');
            } else {
                // Fallback append
                const appendText = `\n\n## ${targetSection}\n${formattedFact}`;
                await fs.promises.writeFile(path.join(config.brainPath, 'zehn.md'), current + appendText, 'utf-8');
            }

            Logger.audit('MEMORY_WRITE', { file: 'zehn.md', type: 'append', fact, section: targetSection });
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
