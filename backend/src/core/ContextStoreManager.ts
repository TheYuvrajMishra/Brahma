import { ContextEntry } from '../types/ResearchTypes';
import { Logger } from './Logger';

const STALE_MS = 60 * 60 * 1000; // 1 hour

class ContextStoreManagerClass {
    private store: Map<string, ContextEntry> = new Map();

    has(entityName: string): boolean {
        const entry = this.store.get(entityName.toLowerCase().trim());
        if (!entry) return false;
        if (Date.now() - entry.researched_at > STALE_MS) { this.store.delete(entityName.toLowerCase().trim()); return false; }
        return true;
    }

    get(entityName: string): ContextEntry | undefined {
        const entry = this.store.get(entityName.toLowerCase().trim());
        if (!entry) return undefined;
        if (Date.now() - entry.researched_at > STALE_MS) { this.store.delete(entityName.toLowerCase().trim()); return undefined; }
        return entry;
    }

    set(entityName: string, entry: ContextEntry): void {
        this.store.set(entityName.toLowerCase().trim(), entry);
        Logger.info('ContextStore', 'system', 0, `Cached: ${entityName}`, { facts: entry.key_facts.length });
    }

    getAll(): ContextEntry[] {
        const now = Date.now();
        for (const [k, v] of this.store) { if (now - v.researched_at > STALE_MS) this.store.delete(k); }
        return Array.from(this.store.values());
    }

    clear(): void { this.store.clear(); }
}

export const ContextStoreManager = new ContextStoreManagerClass();
