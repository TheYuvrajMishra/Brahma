import { Researcher } from '../src/pipeline/Researcher';
import { Composer } from '../src/pipeline/Composer';
import { NormalizedMessage } from '../src/types/Message';

async function testUserPrompt() {
    console.log('--- Testing User Prompt for YouTube Video Ak_edo5Z9YM ---');
    const userMessage: NormalizedMessage = {
        message_id: `msg_yt_${Date.now()}`,
        user_id: 'user_anubh',
        channel_id: 'test_session',
        content: 'generate a roadmap, and summaries of different sections, https://www.youtube.com/watch?v=Ak_edo5Z9YM',
        timestamp: new Date().toISOString(),
        platform: 'playground'
    };

    console.log('Phase 1: Running Researcher...');
    const researchResult = await Researcher.research(userMessage, 'complex');
    console.log('Researcher Output: required=', researchResult.research_required, 'entries=', researchResult.context_store.entries.length);

    if (researchResult.context_store.entries.length > 0) {
        console.log('Entry 0 entity:', researchResult.context_store.entries[0].entity_name);
        console.log('Entry 0 fact length:', researchResult.context_store.entries[0].key_facts[0]?.length || 0);
    }

    console.log('Phase 2: Running Composer...');
    const composerResponse = await Composer.compose(userMessage, 'complex', undefined, researchResult, 'research');
    console.log('\n--- COMPOSER FINAL SYNTHESIZED OUTPUT ---\n');
    console.log(composerResponse.content.slice(0, 2000));
    console.log('\n... (Total length:', composerResponse.content.length, 'chars)');
}

testUserPrompt();
