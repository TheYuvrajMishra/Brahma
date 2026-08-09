import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Logger } from './Logger';
import { SessionContext } from '../models/SessionContext';

export interface OnboardingData {
    displayName?: string;
    role?: string;
    location?: string;
    preferredHandle?: string;
    preferences?: string;
    dislikes?: string;
    interactionStyle?: 'analytical' | 'conversational' | 'executive';
}

export class MemoryManager {

    /**
     * Resolves the dedicated brain path for a specific user.
     * Path structure: ./backend/brahma [brain]/users/:userId/core
     */
    static getUserBrainPath(userId?: string): string {
        if (!userId) {
            return config.brainPath;
        }
        const userBrainPath = path.resolve(__dirname, '../../brahma [brain]/users', userId, 'core');
        this.ensureUserBrain(userId, userBrainPath);
        return userBrainPath;
    }

    /**
     * Copies default core brain templates to user dedicated core directory if it doesn't exist yet.
     */
    static ensureUserBrain(userId: string, targetPath?: string): void {
        const userBrainPath = targetPath || path.resolve(__dirname, '../../brahma [brain]/users', userId, 'core');
        if (!fs.existsSync(userBrainPath)) {
            fs.mkdirSync(userBrainPath, { recursive: true });
            const templatePath = config.brainPath; // ./brahma [brain]/core
            if (fs.existsSync(templatePath)) {
                const files = fs.readdirSync(templatePath);
                for (const file of files) {
                    const srcFile = path.join(templatePath, file);
                    const destFile = path.join(userBrainPath, file);
                    if (fs.statSync(srcFile).isFile()) {
                        fs.copyFileSync(srcFile, destFile);
                    }
                }
            }
        }
    }

    static async getSoul(userId?: string, channelId?: string): Promise<string> {
        try {
            if (userId && channelId) {
                const doc = await SessionContext.findOne({ userId, channelId });
                if (doc && doc.customPersona) {
                    return doc.customPersona;
                }
            } else if (channelId) {
                const doc = await SessionContext.findOne({ channelId });
                if (doc && doc.customPersona) {
                    return doc.customPersona;
                }
            }
            const brainPath = this.getUserBrainPath(userId);
            return await fs.promises.readFile(path.join(brainPath, 'atman.md'), 'utf-8');
        } catch {
            return '';
        }
    }

    static async getZehn(userId?: string): Promise<string> {
        try {
            const brainPath = this.getUserBrainPath(userId);
            return await fs.promises.readFile(path.join(brainPath, 'zehn.md'), 'utf-8');
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

        const SECTION_KEYWORDS: Record<string, string[]> = {
            'SEC-01': ['user', 'who am i', 'my name', 'bio', 'education', 'background', 'profile'],
            'SEC-02': ['love', 'romantic', 'conflict', 'relationship', 'gf', 'girlfriend', 'people', 'friend', 'family', 'partner', 'soft'],
            'SEC-03': ['persona', 'style', 'tone', 'hinglish', 'hindi', 'english', 'bhaijaan', 'communication', 'mode', 'preference'],
            'SEC-04': ['work', 'job', 'brahma', 'project', 'company', 'career', 'developer', 'github', 'code'],
            'SEC-05': ['email', 'mail', 'contact', 'linkedin', 'website', 'address', 'send', 'recipient'],
            'SEC-06': ['routine', 'spreadsheet', 'health', 'sleep', 'habit', 'schedule', 'exercise', 'dinner'],
            'SEC-07': ['ui', 'dark', 'theme', 'system', 'config', 'brahma']
        };

        const activeSections = new Set<string>();
        activeSections.add('SEC-01');
        activeSections.add('SEC-03');

        for (const [secId, keywords] of Object.entries(SECTION_KEYWORDS)) {
            if (keywords.some(kw => this.matchKeyword(searchText, kw))) {
                activeSections.add(secId);
            }
        }

        if (intent === 'email_request') activeSections.add('SEC-05');
        if (intent === 'emotional_support') activeSections.add('SEC-02');
        if (intent === 'spreadsheet_request') activeSections.add('SEC-06');
        if (intent === 'coding') activeSections.add('SEC-04');

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

    static async getMoment(userId?: string, channelId?: string): Promise<string> {
        try {
            if (userId && channelId) {
                const doc = await SessionContext.findOne({ userId, channelId });
                if (doc && doc.momentMarkdown) {
                    return doc.momentMarkdown;
                }
            } else if (channelId) {
                const doc = await SessionContext.findOne({ channelId });
                if (doc && doc.momentMarkdown) {
                    return doc.momentMarkdown;
                }
            }
            const brainPath = this.getUserBrainPath(userId);
            if (fs.existsSync(path.join(brainPath, 'moment.md'))) {
                return await fs.promises.readFile(path.join(brainPath, 'moment.md'), 'utf-8');
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

    static async getPlannerSchema(userId?: string): Promise<string> {
        try {
            const brainPath = this.getUserBrainPath(userId);
            return await fs.promises.readFile(path.join(brainPath, 'planner.md'), 'utf-8');
        } catch {
            return '';
        }
    }

    static async getHunar(userId?: string): Promise<string> {
        try {
            const brainPath = this.getUserBrainPath(userId);
            return await fs.promises.readFile(path.join(brainPath, 'hunar.md'), 'utf-8');
        } catch {
            return '';
        }
    }

    static async getResearcherConfig(userId?: string): Promise<string> {
        try {
            const brainPath = this.getUserBrainPath(userId);
            return await fs.promises.readFile(path.join(brainPath, 'researcher.md'), 'utf-8');
        } catch {
            return '';
        }
    }

    static async updateMoment(content: string, userId?: string, channelId?: string): Promise<void> {
        try {
            if (userId && channelId) {
                await SessionContext.updateOne(
                    { userId, channelId },
                    { $set: { momentMarkdown: content } },
                    { upsert: true }
                );
            } else if (channelId) {
                await SessionContext.updateOne(
                    { channelId },
                    { $set: { momentMarkdown: content } },
                    { upsert: true }
                );
            }
            const brainPath = this.getUserBrainPath(userId);
            await fs.promises.writeFile(path.join(brainPath, 'moment.md'), content, 'utf-8');
        } catch (err) {
            console.error('Failed to write to moment:', err);
        }
    }

    static async updateCustomPersona(persona: string, userId?: string, channelId?: string): Promise<void> {
        try {
            if (userId && channelId) {
                await SessionContext.updateOne(
                    { userId, channelId },
                    { $set: { customPersona: persona } },
                    { upsert: true }
                );
            }
            Logger.audit('MEMORY_WRITE', { file: `customPersona_${userId}_${channelId}`, type: 'update', length: persona.length });
        } catch (err) {
            console.error('Failed to write custom persona:', err);
        }
    }

    static async updateZehn(content: string, userId?: string): Promise<void> {
        try {
            const brainPath = this.getUserBrainPath(userId);
            await fs.promises.writeFile(path.join(brainPath, 'zehn.md'), content, 'utf-8');
            Logger.audit('MEMORY_WRITE', { file: 'zehn.md', type: 'update', length: content.length, userId });
        } catch (err) {
            console.error('Failed to write to zehn.md:', err);
        }
    }

    static async appendZehnFact(fact: string, specifiedSection?: string, userId?: string): Promise<void> {
        try {
            const current = await this.getZehn(userId);
            const factLower = fact.toLowerCase();
            let targetSection = '[SEC-04] Work, Career & Projects';

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
                if (factLower.includes('persona') || factLower.includes('hinglish') || factLower.includes('tone') || factLower.includes('style')) {
                    targetSection = '[SEC-03] Persona & Communication Preferences';
                } else if (factLower.includes('work') || factLower.includes('project') || factLower.includes('job') || factLower.includes('code')) {
                    targetSection = '[SEC-04] Work, Career & Projects';
                } else if (factLower.includes('email') || factLower.includes('mail') || factLower.includes('contact')) {
                    targetSection = '[SEC-05] Contact Information & Channels';
                }
            }

            const formattedFact = `- **Note**: ${fact}`;

            const brainPath = this.getUserBrainPath(userId);
            if (current.includes(`## ${targetSection}`)) {
                const parts = current.split(`## ${targetSection}`);
                const header = parts[0] + `## ${targetSection}`;
                const rest = parts[1];
                const nextHeaderIdx = rest.indexOf('\n## ');
                let updatedZehn = '';
                if (nextHeaderIdx !== -1) {
                    const secContent = rest.substring(0, nextHeaderIdx);
                    const remaining = rest.substring(nextHeaderIdx);
                    updatedZehn = header + secContent + `\n${formattedFact}` + remaining;
                } else {
                    updatedZehn = header + rest + `\n${formattedFact}`;
                }
                await fs.promises.writeFile(path.join(brainPath, 'zehn.md'), updatedZehn, 'utf-8');
            } else {
                const appendText = `\n\n## ${targetSection}\n${formattedFact}`;
                await fs.promises.writeFile(path.join(brainPath, 'zehn.md'), current + appendText, 'utf-8');
            }

            Logger.audit('MEMORY_WRITE', { file: 'zehn.md', type: 'append', fact, section: targetSection, userId });
        } catch (err) {
            console.error('Failed to append to zehn.md:', err);
        }
    }

    /**
     * Seeds the user's dedicated brain in core/* with onboarding profile data.
     */
    static async seedUserBrain(userId: string, data: OnboardingData): Promise<void> {
        this.ensureUserBrain(userId);
        const brainPath = this.getUserBrainPath(userId);

        const styleLabel = data.interactionStyle === 'analytical'
            ? 'Analytical & Concise (direct, code-first, data-dense responses)'
            : data.interactionStyle === 'executive'
                ? 'Executive Summarizer (high-level bullet points, action items)'
                : 'Conversational & Adaptive (collaborative, detailed explanations with Hinglish/tone warmth)';

        const prefText = data.preferences ? data.preferences.trim() : 'None specified';
        const dislikeText = data.dislikes ? data.dislikes.trim() : '';

        const zehnContent = `# Zehn: Long-Term Memory Index & Knowledge Vault

## Index & Routing Table
- [SEC-01] User Identity & Core Profile
- [SEC-02] People & Relationships
- [SEC-03] Persona & Communication Preferences
- [SEC-04] Work, Career & Projects
- [SEC-05] Contact Information & Channels
- [SEC-06] Health, Habits & Routines
- [SEC-07] System & Technical Config

## [SEC-01] User Identity & Core Profile
- **Full / Display Name**: ${data.displayName || 'User'}
- **Role / Occupation**: ${data.role || 'Not specified'}
- **Location / Timezone**: ${data.location || 'Not specified'}
- **Preferred Contact / Handle**: ${data.preferredHandle || 'Not specified'}

## [SEC-02] People & Relationships
- None recorded yet.

## [SEC-03] Persona & Communication Preferences
- **Preferred Interaction Style**: ${styleLabel}
- **Preferences, Stack & Work Profile**:
${prefText}${dislikeText ? `\n- **Dislikes & Things to Avoid**:\n${dislikeText}` : ''}

## [SEC-04] Work, Career & Projects
- **Current Position**: ${data.role || 'Not specified'}

## [SEC-05] Contact Information & Channels
- **Email**: ${data.preferredHandle || 'Not specified'}

## [SEC-06] Health, Habits & Routines
- None recorded yet.

## [SEC-07] System & Technical Config
- **Preferred UI Mode**: Dark mode
- **Brahma System Core**: Thinker-executor-observer; persistent digital consciousness; calm, direct, analytical.
`;

        await fs.promises.writeFile(path.join(brainPath, 'zehn.md'), zehnContent, 'utf-8');

        // Customize Atman (Soul persona guidelines) based on preferred interaction style
        let atmanContent = await fs.promises.readFile(path.join(config.brainPath, 'atman.md'), 'utf-8');
        let styleOverride = '';
        if (data.interactionStyle === 'analytical') {
            styleOverride = '\n\n## User Interaction Mode Override\n- **Style**: Analytical & Concise. Focus on code-first, data-dense, direct answers without unnecessary filler.';
        } else if (data.interactionStyle === 'executive') {
            styleOverride = '\n\n## User Interaction Mode Override\n- **Style**: Executive Summarizer. Provide high-level bulleted summaries, clear action items, and key decisions.';
        } else {
            styleOverride = '\n\n## User Interaction Mode Override\n- **Style**: Conversational & Adaptive. Be collaborative, engaging, with tone warmth and clear explanations.';
        }

        atmanContent += styleOverride;
        await fs.promises.writeFile(path.join(brainPath, 'atman.md'), atmanContent, 'utf-8');

        Logger.audit('BRAIN_SEEDED', { userId, displayName: data.displayName, interactionStyle: data.interactionStyle });
    }

    /**
     * Deletes the user's dedicated brain folder and all its contents.
     */
    static async deleteUserBrain(userId: string): Promise<void> {
        try {
            const userDir = path.resolve(__dirname, '../../brahma [brain]/users', userId);
            if (fs.existsSync(userDir)) {
                await fs.promises.rm(userDir, { recursive: true, force: true });
                Logger.audit('BRAIN_DELETED', { userId });
            }
        } catch (err) {
            console.error(`Failed to delete brain directory for user ${userId}:`, err);
        }
    }
}
