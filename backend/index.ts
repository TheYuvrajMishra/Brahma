import mongoose from 'mongoose';
import { PipelineOrchestrator } from './src/pipeline/Orchestrator';
import { DiscordAdapter } from './src/adapters/DiscordAdapter';
import { PlaygroundAdapter } from './src/adapters/PlaygroundAdapter';
import { EmailAdapter } from './src/adapters/EmailAdapter';
import { ReflectionEngine } from './src/core/ReflectionEngine';
import { HealthServer } from './src/core/HealthServer';
import cron from 'node-cron';

async function bootstrap() {
    console.log('Starting Brahma Pipeline (Phase 1)...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/brahma';
    try {
        await mongoose.connect(mongoUri);
        console.log(`[MongoDB] Connected to ${mongoUri}`);
    } catch (err) {
        console.error('[MongoDB] Connection failed:', err);
        process.exit(1);
    }

    // Start Health & Metrics Server (Phase 11)
    const healthServer = new HealthServer();
    healthServer.start();

    const orchestrator = new PipelineOrchestrator();

    // Register Discord Adapter
    const discordAdapter = new DiscordAdapter();
    orchestrator.registerAdapter(discordAdapter);

    // Register Playground Adapter
    const port = parseInt(process.env.PORT || '5000', 10);
    const playgroundAdapter = new PlaygroundAdapter(port);
    orchestrator.registerAdapter(playgroundAdapter);

    // Register Email Adapter
    const emailAdapter = new EmailAdapter();
    orchestrator.registerAdapter(emailAdapter);

    // Schedule Memory Compression (Every hour)
    cron.schedule('0 * * * *', () => {
        console.log('[System] Running scheduled memory compression cycle...');
        ReflectionEngine.runCompressionCycle();
    });

    // Start pipeline
    await orchestrator.start();
}

bootstrap().catch(err => {
    console.error('Failed to start pipeline:', err);
});
