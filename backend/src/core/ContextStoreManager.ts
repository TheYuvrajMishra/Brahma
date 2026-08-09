import { ContextEntry } from '../types/ResearchTypes';
import { Logger } from './Logger';

const STALE_MS = 60 * 60 * 1000; // 1 hour

class ContextStoreManagerClass {
    private store: Map<string, ContextEntry> = new Map();

    private getKey(entityName: string, userId?: string): string {
        const cleanEntity = entityName.toLowerCase().trim();
        return userId ? `${userId}:${cleanEntity}` : cleanEntity;
    }

    has(entityName: string, userId?: string): boolean {
        const key = this.getKey(entityName, userId);
        const entry = this.store.get(key);
        if (!entry) return false;
        if (Date.now() - entry.researched_at > STALE_MS) { 
            this.store.delete(key); 
            return false; 
        }
        return true;
    }

    get(entityName: string, userId?: string): ContextEntry | undefined {
        const key = this.getKey(entityName, userId);
        const entry = this.store.get(key);
        if (!entry) return undefined;
        if (Date.now() - entry.researched_at > STALE_MS) { 
            this.store.delete(key); 
            return undefined; 
        }
        return entry;
    }

    set(entityName: string, entry: ContextEntry, userId?: string): void {
        const key = this.getKey(entityName, userId);
        this.store.set(key, entry);
        Logger.info('ContextStore', 'system', 0, `Cached: ${entityName} for user: ${userId || 'global'}`, { facts: entry.key_facts.length });
    }

    getAll(userId?: string): ContextEntry[] {
        const now = Date.now();
        const results: ContextEntry[] = [];
        const prefix = userId ? `${userId}:` : null;

        for (const [k, v] of this.store) { 
            if (now - v.researched_at > STALE_MS) {
                this.store.delete(k); 
                continue;
            }
            if (prefix) {
                if (k.startsWith(prefix)) {
                    results.push(v);
                }
            } else {
                results.push(v);
            }
        }
        return results;
    }

    clear(userId?: string): void { 
        if (userId) {
            const prefix = `${userId}:`;
            for (const k of this.store.keys()) {
                if (k.startsWith(prefix)) {
                    this.store.delete(k);
                }
            }
        } else {
            this.store.clear(); 
        }
    }
}

export const ContextStoreManager = new ContextStoreManagerClass();
