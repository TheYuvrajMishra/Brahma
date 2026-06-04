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
}
