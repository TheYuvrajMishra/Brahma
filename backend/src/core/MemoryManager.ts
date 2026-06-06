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
