import { chromium } from 'playwright';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { ISkill } from '../types/Skill';
import { EventBus } from '../core/EventBus';

interface SearchResultItem {
    title: string;
    url: string;
    snippet: string;
    domain: string;
    favicon: string;
}

export class WebSearch implements ISkill {
    name = 'web_search';
    description = 'Performs deep live web search, crawls top article links, extracts cleaned main text using RAG, and returns structured citation context.';

    async execute(params: any): Promise<string> {
        const query = params.query || params.target;
        const messageId = params._message_id || params.message_id || params.messageId;

        if (!query) throw new Error("Missing query parameter for web_search");

        console.log(`[WebSearch] Beginning search for: "${query}"`);

        // Emit search start telemetry
        this.emitTelemetry(messageId, {
            stage: 'Deep Web Search',
            label: `Searching web for: "${query}"`,
            query
        });

        // Step 1: Fetch ranked search result links (Brave Search / DuckDuckGo)
        const searchResults = await this.performRankedSearch(query);

        if (searchResults.length === 0) {
            return `No web search results found for: "${query}"`;
        }

        const visitedArticles: Array<{
            url: string;
            domain: string;
            favicon: string;
            title: string;
            chunks: string[];
        }> = [];

        // Step 2: Visit & Crawl top links (up to 5)
        const linksToVisit = searchResults.slice(0, 5);

        for (let i = 0; i < linksToVisit.length; i++) {
            const item = linksToVisit[i];
            
            // Emit live progress with favicon & URL to frontend UI
            this.emitTelemetry(messageId, {
                stage: 'Deep Web Research',
                label: `Visiting article (${i + 1}/${linksToVisit.length}): ${item.domain}`,
                url: item.url,
                domain: item.domain,
                favicon: item.favicon,
                details: { title: item.title, snippet: item.snippet }
            });

            const cleanedText = await this.fetchAndCleanPageContent(item.url);

            if (cleanedText && cleanedText.trim().length > 150) {
                const chunks = this.chunkAndFilterText(cleanedText, query, 3);
                visitedArticles.push({
                    url: item.url,
                    domain: item.domain,
                    favicon: item.favicon,
                    title: item.title,
                    chunks
                });
            }
        }

        if (visitedArticles.length === 0) {
            // Fallback to initial search snippets if all link fetches failed
            return `Search results for "${query}":\n\n` + searchResults.slice(0, 5).map((r, i) => 
                `[${i + 1}] ${r.title} (${r.domain})\nURL: ${r.url}\n${r.snippet}`
            ).join('\n\n');
        }

        // Step 3: Format RAG Context Output with strict token budget (~3,000 words max)
        const formattedContext: string[] = [];
        let currentWordCount = 0;
        const MAX_WORDS = 3000;

        visitedArticles.forEach((article, idx) => {
            if (currentWordCount >= MAX_WORDS) return;

            const articleText = article.chunks.join('\n\n');
            const words = articleText.split(/\s+/).length;
            currentWordCount += words;

            formattedContext.push(
                `Source [${idx + 1}]: ${article.title}\nDomain: ${article.domain}\nURL: ${article.url}\nFavicon: ${article.favicon}\nExcerpts:\n${articleText}`
            );
        });

        return `### Deep Web Research Findings for "${query}"\n\n` + formattedContext.join('\n\n=================================\n\n');
    }

    private emitTelemetry(messageId: string | undefined, payload: any) {
        if (!messageId) return;
        EventBus.emit('telemetry:custom', {
            message_id: messageId,
            ...payload
        });
    }

    private extractDomain(url: string): string {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch {
            return 'web';
        }
    }

    private getFaviconUrl(domain: string): string {
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
    }

    private async performRankedSearch(query: string): Promise<SearchResultItem[]> {
        const results: SearchResultItem[] = [];

        // Try Brave Search scraping via HTTP
        try {
            const searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 5000
            });

            const dom = new JSDOM(response.data);
            const doc = dom.window.document;
            const snippetEls = Array.from(doc.querySelectorAll('.snippet, .result'));

            for (const el of snippetEls) {
                const linkEl = el.querySelector('a') as HTMLAnchorElement;
                const titleEl = el.querySelector('.title, h2, .snippet-title');
                const descEl = el.querySelector('.snippet-description, .desktop-snippet, p');

                if (linkEl && linkEl.href && linkEl.href.startsWith('http')) {
                    const url = linkEl.href;
                    const domain = this.extractDomain(url);
                    const title = titleEl ? titleEl.textContent?.trim() || domain : domain;
                    const snippet = descEl ? descEl.textContent?.trim() || '' : '';

                    if (!results.some(r => r.url === url)) {
                        results.push({
                            title,
                            url,
                            snippet,
                            domain,
                            favicon: this.getFaviconUrl(domain)
                        });
                    }
                }
            }
        } catch (err) {
            console.warn('[WebSearch] HTTP search fetch failed, trying Playwright fallback:', err);
        }

        if (results.length > 0) return results;

        // Fallback to Playwright Chromium search
        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            });
            const page = await context.newPage();
            await page.goto(`https://search.brave.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 8000 });

            const scraped = await page.evaluate(() => {
                const items: Array<{ title: string; url: string; snippet: string }> = [];
                const links = Array.from(document.querySelectorAll('a[href^="http"]'));
                for (const link of links) {
                    const href = (link as HTMLAnchorElement).href;
                    if (href.includes('search.brave.com') || href.includes('brave.com')) continue;
                    const title = link.textContent?.trim() || '';
                    const parent = link.closest('.snippet, .result, div');
                    const snippet = parent?.textContent?.trim() || '';
                    if (title.length > 5 && !items.some(i => i.url === href)) {
                        items.push({ title, url: href, snippet: snippet.slice(0, 200) });
                    }
                }
                return items.slice(0, 8);
            });

            for (const item of scraped) {
                const domain = this.extractDomain(item.url);
                results.push({
                    title: item.title,
                    url: item.url,
                    snippet: item.snippet,
                    domain,
                    favicon: this.getFaviconUrl(domain)
                });
            }
        } catch (err) {
            console.error('[WebSearch] Playwright search fallback failed:', err);
        } finally {
            if (browser) await browser.close();
        }

        return results;
    }

    private async fetchAndCleanPageContent(url: string): Promise<string> {
        // Fast HTTP GET + Mozilla Readability
        try {
            const resp = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                timeout: 6000,
                maxRedirects: 3
            });

            if (typeof resp.data === 'string') {
                const dom = new JSDOM(resp.data, { url });
                const reader = new Readability(dom.window.document);
                const article = reader.parse();

                if (article && article.textContent && article.textContent.trim().length > 200) {
                    return article.textContent.trim();
                }
            }
        } catch (err) {
            // HTTP fetch failed or was blocked
        }

        // Playwright Chromium fallback for JS-rendered SPAs
        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            });
            const page = await context.newPage();
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

            const html = await page.content();
            const dom = new JSDOM(html, { url });
            const reader = new Readability(dom.window.document);
            const article = reader.parse();

            if (article && article.textContent) {
                return article.textContent.trim();
            }

            const bodyText = await page.evaluate(() => document.body.innerText);
            return bodyText || '';
        } catch (err) {
            return '';
        } finally {
            if (browser) await browser.close();
        }
    }

    private chunkAndFilterText(text: string, query: string, maxChunks = 3): string[] {
        const clean = text.replace(/\s+/g, ' ').trim();
        const paragraphs = clean.split(/(?<=[.!?])\s+/);

        const chunks: string[] = [];
        let currentChunk = '';

        for (const p of paragraphs) {
            if ((currentChunk + ' ' + p).length > 800) {
                if (currentChunk.trim()) chunks.push(currentChunk.trim());
                currentChunk = p;
            } else {
                currentChunk += ' ' + p;
            }
        }
        if (currentChunk.trim()) chunks.push(currentChunk.trim());

        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        
        const scored = chunks.map(chunk => {
            const lower = chunk.toLowerCase();
            let score = 0;
            for (const term of queryTerms) {
                if (lower.includes(term)) score += 1;
            }
            return { chunk, score };
        });

        scored.sort((a, b) => b.score - a.score);

        return scored.slice(0, maxChunks).map(s => s.chunk);
    }
}
