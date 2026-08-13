import { YouTubeService } from '../src/services/YouTubeService';
import { WebSearch } from '../src/skills/WebSearch';
import { Researcher } from '../src/pipeline/Researcher';
import { NormalizedMessage } from '../src/types/Message';

async function runTests() {
    console.log('--- Testing YouTube Video ID Extraction ---');
    const testUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/shorts/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ'
    ];

    for (const u of testUrls) {
        const id = YouTubeService.extractVideoId(u);
        console.log(`URL: ${u} => Video ID: ${id}`);
        if (id !== 'dQw4w9WgXcQ') {
            throw new Error(`Failed to extract video ID for ${u}`);
        }
    }
    console.log('✅ Video ID Extraction Passed!\n');

    console.log('--- Testing Researcher Pipeline with Direct Web Link ---');
    const webMessage: NormalizedMessage = {
        message_id: `msg_test_${Date.now()}`,
        user_id: 'test_user',
        channel_id: 'test_session',
        content: 'Please research this article: https://jagrukcockroach.online',
        timestamp: new Date().toISOString(),
        platform: 'playground'
    };

    try {
        const res = await Researcher.research(webMessage, 'complex');
        console.log('Research Required:', res.research_required);
        console.log('Entries:', res.context_store.entries.length);
        if (res.context_store.entries.length > 0) {
            console.log('Entry 0 Entity:', res.context_store.entries[0].entity_name);
            console.log('Entry 0 Sources:', res.context_store.entries[0].sources);
        }
    } catch (err) {
        console.error('Web direct link research test error:', err);
    }

    console.log('\n✅ All YouTube & Direct Link Pipeline Unit Tests Completed!');
}

runTests();
