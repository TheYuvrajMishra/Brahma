import { chromium } from 'playwright';
import { ISkill } from '../types/Skill';

export class WebSearch implements ISkill {
    name = 'web_search';
    description = 'Performs a web search using Playwright to scrape DuckDuckGo.';

    async execute(params: any): Promise<string> {
        const query = params.query;
        if (!query) throw new Error("Missing query parameter for web_search");

        const browser = await chromium.launch({ headless: true });
        try {
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            const page = await context.newPage();
            const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            
            // Extract the top 5 result snippets from Brave Search
            const results = await page.evaluate(() => {
                // Brave search snippets usually live in .snippet class
                const elements = Array.from(document.querySelectorAll('.snippet'));
                return elements.slice(0, 5).map((el: any) => el.innerText?.trim() || '').filter(Boolean);
            });

            if (results.length === 0) {
                // Fallback if .snippet is not found
                const fallbackText = await page.evaluate(() => document.body.innerText);
                if (!fallbackText || fallbackText.trim().length === 0) {
                    return `No results found for query: ${query}`;
                }
                return `Top search results for "${query}":\n\n` + fallbackText.slice(0, 1500);
            }

            return `Top search results for "${query}":\n\n` + results.map((r, i) => `Result ${i+1}:\n${r}`).join('\n\n');
        } catch (err) {
            return `Failed to perform web search: ${err}`;
        } finally {
            await browser.close();
        }
    }
}
