import fs from 'fs';
import path from 'path';
import { config } from '../config';

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
}
