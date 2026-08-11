export class Logger {
    static info(stage: string, messageId: string, durationMs: number, status: string, extra: any = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            stage,
            message_id: messageId,
            duration_ms: durationMs,
            status,
            ...extra
        };
        console.log(JSON.stringify(logEntry));
    }

    static error(stage: string, messageId: string, error: any) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            stage,
            message_id: messageId,
            error: error instanceof Error ? error.message : String(error)
        };
        console.error(JSON.stringify(logEntry));
    }

    static audit(action: string, details: any = {}) {
        const userId = details?.userId || details?._user_id || details?.user_id;
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'AUDIT',
            action,
            details,
            userId
        };
        const logString = JSON.stringify(logEntry) + '\n';
        console.log(logString.trim());
        
        try {
            const fs = require('fs');
            const path = require('path');
            fs.appendFileSync(path.join(__dirname, '../../audit.log'), logString);

            if (userId) {
                const { MemoryManager } = require('./MemoryManager');
                const userBrainPath = MemoryManager.getUserBrainPath(userId);
                fs.appendFileSync(path.join(userBrainPath, 'audit.log'), logString);
            }
        } catch (err) {
            console.error('Failed to write to audit log:', err);
        }
    }
}
