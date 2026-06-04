import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Logger } from './Logger';

export class MemoryManager {
    static getSoul(): string {
        try {
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

    static getMoment(): string {
        try {
            return fs.readFileSync(path.join(config.brainPath, 'moment.md'), 'utf-8');
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

    static updateMoment(content: string): void {
        try {
            fs.writeFileSync(path.join(config.brainPath, 'moment.md'), content, 'utf-8');
        } catch (err) {
            console.error('Failed to write to moment.md:', err);
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
}
