import express = require('express');
import { Logger } from './Logger';

export class HealthServer {
    private app = express();
    private port = 3006;
    
    // Simple metrics tracking
    public static metrics = {
        messagesProcessed: 0,
        errors: 0,
        activeQueueLength: 0
    };

    constructor() {
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'OK', uptime: process.uptime() });
        });

        this.app.get('/metrics', (req, res) => {
            res.status(200).json(HealthServer.metrics);
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`[System] Health and Metrics server listening on port ${this.port}`);
            Logger.info('HealthServer', 'system', 0, 'STARTED', { port: this.port });
        });
    }
}
