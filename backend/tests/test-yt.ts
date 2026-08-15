const getSubtitles = require('youtube-captions-scraper').getSubtitles;

(async () => {
    const videoId = 'Ak_edo5Z9YM';
    console.log('Testing youtube-captions-scraper package...');
    try {
        const captions = await getSubtitles({
            videoID: videoId,
            lang: 'en'
        });
        console.log('youtube-captions-scraper SUCCESS! Items count:', captions.length);
        console.log('Sample item 0:', captions[0]);
    } catch (e: any) {
        console.error('youtube-captions-scraper error:', e.message);
    }
})();
