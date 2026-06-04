import { PipelineOrchestrator } from './src/pipeline/Orchestrator';
import { DiscordAdapter } from './src/adapters/DiscordAdapter';

async function bootstrap() {
    console.log('Starting Brahma Pipeline (Phase 1)...');

    const orchestrator = new PipelineOrchestrator();

    // Register Discord Adapter
    const discordAdapter = new DiscordAdapter();
    orchestrator.registerAdapter(discordAdapter);

    // Start pipeline
    await orchestrator.start();
}

bootstrap().catch(err => {
    console.error('Failed to start pipeline:', err);
});
