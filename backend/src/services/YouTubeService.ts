import { YoutubeTranscript } from 'youtube-transcript';
import { chromium } from 'playwright';
import axios from 'axios';
import { LLMService } from './LLMService';
import { EventBus } from '../core/EventBus';
import { ContextEntry } from '../types/ResearchTypes';

export interface YouTubeTranscriptItem {
    text: string;
    offset: number; // in seconds
    duration: number; // in seconds
}

export class YouTubeService {

    static extractVideoId(urlOrText: string): string | null {
        if (!urlOrText) return null;
        const patterns = [
            /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        for (const pattern of patterns) {
            const match = urlOrText.match(pattern);
            if (match && match[1]) return match[1];
        }
        return null;
    }

    static formatTimestamp(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `[${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}]`;
        }
        return `[${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}]`;
    }

    private static emitTelemetry(messageId: string | undefined, payload: any) {
        if (!messageId) return;
        EventBus.emit('telemetry:custom', {
            message_id: messageId,
            ...payload
        });
    }

    static async fetchTranscript(videoIdInput: string, messageId?: string): Promise<{ items: YouTubeTranscriptItem[]; source: string }> {
        const videoId = this.extractVideoId(videoIdInput) || videoIdInput;
        // Attempt 0: Android InnerTube API (Fastest & Most Reliable across all servers & VPS)
        try {
            console.log(`[YouTubeService] Attempting Android InnerTube fetch for videoId: ${videoId}`);
            this.emitTelemetry(messageId, {
                stage: 'YouTube Transcript Extraction',
                label: `Fetching transcript for YouTube video: ${videoId}`,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                domain: 'youtube.com',
                favicon: 'https://www.google.com/s2/favicons?domain=youtube.com'
            });

            const innerTubeResp = await axios.post('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
                context: {
                    client: {
                        clientName: 'ANDROID',
                        clientVersion: '20.10.38',
                        androidSdkVersion: 34,
                        hl: 'en',
                        gl: 'US'
                    }
                },
                videoId: videoId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)'
                },
                timeout: 8000
            });

            const captionTracks = innerTubeResp.data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (Array.isArray(captionTracks) && captionTracks.length > 0) {
                const track = captionTracks.find((t: any) => t.languageCode === 'en') || captionTracks[0];
                if (track?.baseUrl) {
                    const xmlResp = await axios.get(track.baseUrl, {
                        headers: {
                            'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)'
                        },
                        timeout: 8000
                    });

                    const xml = typeof xmlResp.data === 'string' ? xmlResp.data : JSON.stringify(xmlResp.data);
                    const items: YouTubeTranscriptItem[] = [];

                    // SRV3 format: <p t="ms" d="ms"><s>text</s></p>
                    const srvMatches = [...xml.matchAll(/<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g)];
                    for (const m of srvMatches) {
                        const startMs = parseInt(m[1], 10);
                        const durMs = parseInt(m[2], 10);
                        const rawText = m[3]
                            .replace(/<[^>]+>/g, '')
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .replace(/&apos;/g, "'")
                            .trim();
                        if (rawText) {
                            items.push({
                                text: rawText,
                                offset: Math.floor(startMs / 1000),
                                duration: Math.floor(durMs / 1000)
                            });
                        }
                    }

                    // Classic XML format: <text start="s" dur="s">content</text>
                    if (items.length === 0) {
                        const classicMatches = [...xml.matchAll(/<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g)];
                        for (const m of classicMatches) {
                            const rawText = m[3]
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&apos;/g, "'")
                                .trim();
                            if (rawText) {
                                items.push({
                                    text: rawText,
                                    offset: Math.floor(parseFloat(m[1]) || 0),
                                    duration: Math.floor(parseFloat(m[2]) || 0)
                                });
                            }
                        }
                    }

                    if (items.length > 0) {
                        console.log(`[YouTubeService] Android InnerTube extracted ${items.length} items for ${videoId}`);
                        return { items, source: 'Android InnerTube API' };
                    }
                }
            }
        } catch (err: any) {
            console.warn(`[YouTubeService] Android InnerTube fetch failed for ${videoId}: ${err?.message || err}. Trying youtube-transcript package fallback.`);
        }

        // Attempt 1: 'youtube-transcript' npm package (default + lang fallbacks)
        try {
            console.log(`[YouTubeService] Attempting youtube-transcript fetch for videoId: ${videoId}`);
            this.emitTelemetry(messageId, {
                stage: 'YouTube Transcript Extraction',
                label: `Fetching transcript for YouTube video: ${videoId}`,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                domain: 'youtube.com',
                favicon: 'https://www.google.com/s2/favicons?domain=youtube.com'
            });

            // Try default fetch
            let rawItems = await YoutubeTranscript.fetchTranscript(videoId).catch(() => null);

            // If null, retry with english language option
            if (!rawItems || rawItems.length === 0) {
                rawItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }).catch(() => null);
            }

            // If still null, try with full URL string
            if (!rawItems || rawItems.length === 0) {
                rawItems = await YoutubeTranscript.fetchTranscript(`https://www.youtube.com/watch?v=${videoId}`).catch(() => null);
            }

            if (rawItems && rawItems.length > 0) {
                const items: YouTubeTranscriptItem[] = rawItems.map(item => ({
                    text: item.text,
                    offset: Math.floor((item.offset || 0) > 10000 ? item.offset / 1000 : (item.offset || 0)),
                    duration: Math.floor((item.duration || 0) > 10000 ? item.duration / 1000 : (item.duration || 0))
                }));
                return { items, source: 'youtube-transcript package' };
            }
        } catch (err: any) {
            console.warn(`[YouTubeService] youtube-transcript package failed for ${videoId}: ${err?.message || err}. Trying direct HTML captionTracks fallback.`);
        }

        // Attempt 2: Direct Axios HTML captionTracks extraction
        try {
            console.log(`[YouTubeService] Attempting direct HTML captionTracks extraction for videoId: ${videoId}`);
            const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const resp = await axios.get(pageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cookie': 'SOCS=CAESEwgDEgk1ODE3OTQxMjAaAmVuIAEaBgiA_a-1Bg; CONSENT=YES+'
                },
                timeout: 8000
            });

            const html = resp.data;
            const match = html.match(/"captionTracks":\s*(\[[^\]]+\])/);
            if (match) {
                const tracks = JSON.parse(match[1]);
                if (Array.isArray(tracks) && tracks.length > 0 && tracks[0].baseUrl) {
                    const xmlResp = await axios.get(tracks[0].baseUrl, { timeout: 8000 });
                    const xml = typeof xmlResp.data === 'string' ? xmlResp.data : JSON.stringify(xmlResp.data);

                    const items: YouTubeTranscriptItem[] = [];

                    // Classic XML format: <text start="s" dur="s">content</text>
                    const classicMatches = [...xml.matchAll(/<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g)];
                    for (const m of classicMatches) {
                        const rawText = m[3]
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .replace(/&apos;/g, "'")
                            .trim();
                        if (rawText) {
                            items.push({
                                text: rawText,
                                offset: Math.floor(parseFloat(m[1]) || 0),
                                duration: Math.floor(parseFloat(m[2]) || 0)
                            });
                        }
                    }

                    // SRV3 XML format: <p t="ms" d="ms"><s>text</s></p>
                    if (items.length === 0) {
                        const srvMatches = [...xml.matchAll(/<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g)];
                        for (const m of srvMatches) {
                            const startMs = parseInt(m[1], 10);
                            const durMs = parseInt(m[2], 10);
                            const rawText = m[3]
                                .replace(/<[^>]+>/g, '')
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&apos;/g, "'")
                                .trim();
                            if (rawText) {
                                items.push({
                                    text: rawText,
                                    offset: Math.floor(startMs / 1000),
                                    duration: Math.floor(durMs / 1000)
                                });
                            }
                        }
                    }

                    if (items.length > 0) {
                        console.log(`[YouTubeService] Direct HTML captionTracks extracted ${items.length} items for ${videoId}`);
                        return { items, source: 'Direct Axios captionTracks fallback' };
                    }
                }
            }
        } catch (err: any) {
            console.warn(`[YouTubeService] Direct HTML captionTracks failed for ${videoId}: ${err?.message || err}. Trying Playwright fallback.`);
        }

        // Attempt 3: Playwright Chromium Headless Fallback with Consent Bypass Cookies
        let browser;
        try {
            this.emitTelemetry(messageId, {
                stage: 'YouTube Browser Automation',
                label: `Using Playwright browser fallback to extract transcript for ${videoId}`,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                domain: 'youtube.com',
                favicon: 'https://www.google.com/s2/favicons?domain=youtube.com'
            });

            browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                locale: 'en-US'
            });

            // Set cookie consent bypass cookies
            await context.addCookies([
                { name: 'SOCS', value: 'CAESEwgDEgk1ODE3OTQxMjAaAmVuIAEaBgiA_a-1Bg', domain: '.youtube.com', path: '/' },
                { name: 'CONSENT', value: 'YES+', domain: '.youtube.com', path: '/' }
            ]);

            const page = await context.newPage();

            let capturedTimedText: string | null = null;
            page.on('response', async (response) => {
                const url = response.url();
                if (url.includes('/api/timedtext') || url.includes('/youtubei/v1/get_transcript')) {
                    try {
                        const body = await response.text();
                        if (body && body.length > 100) {
                            capturedTimedText = body;
                        }
                    } catch {}
                }
            });

            await page.goto(`https://www.youtube.com/watch?v=${videoId}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
            await page.waitForTimeout(2000);

            // Attempt to click 'Show transcript' button if present in description
            try {
                const expandBtn = await page.$('button[aria-label="Expand"], #expand');
                if (expandBtn) await expandBtn.click();
                await page.waitForTimeout(1000);

                const showTranscriptBtn = await page.$('button[aria-label="Show transcript"], ytd-video-description-transcript-section-renderer button');
                if (showTranscriptBtn) {
                    await showTranscriptBtn.click();
                    await page.waitForTimeout(2000);
                }
            } catch {}

            // Scrape transcript DOM elements if present
            const domSegments = await page.evaluate(() => {
                const results: Array<{ text: string; timestampStr: string }> = [];
                const segmentEls = document.querySelectorAll('ytd-transcript-segment-renderer');
                segmentEls.forEach(el => {
                    const ts = el.querySelector('.segment-timestamp')?.textContent?.trim() || '';
                    const text = el.querySelector('.segment-text')?.textContent?.trim() || '';
                    if (text) {
                        results.push({ text, timestampStr: ts });
                    }
                });
                return results;
            });

            if (domSegments.length > 0) {
                const items: YouTubeTranscriptItem[] = domSegments.map(s => {
                    const parts = s.timestampStr.split(':').map(Number);
                    let sec = 0;
                    if (parts.length === 2) sec = parts[0] * 60 + parts[1];
                    else if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    return { text: s.text, offset: sec, duration: 2 };
                });
                return { items, source: 'Playwright DOM transcript fallback' };
            }

            if (capturedTimedText) {
                const cleanText = (capturedTimedText as string).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                if (cleanText.length > 100) {
                    return {
                        items: [{ text: cleanText, offset: 0, duration: 0 }],
                        source: 'Playwright TimedText network fallback'
                    };
                }
            }
        } catch (err: any) {
            console.error(`[YouTubeService] Playwright fallback failed for ${videoId}:`, err);
        } finally {
            if (browser) await browser.close().catch(() => {});
        }

        throw new Error(`Could not retrieve transcript for YouTube video (ID: ${videoId}). The video may lack closed captions or subtitles.`);
    }

    static async processYouTubeUrl(
        url: string,
        userQuery: string,
        messageId?: string
    ): Promise<ContextEntry> {
        const videoId = this.extractVideoId(url);
        if (!videoId) {
            throw new Error(`Invalid YouTube URL: ${url}`);
        }

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Step 1: Fetch raw transcript items
        const { items, source } = await this.fetchTranscript(videoId, messageId);

        // Format timestamped transcript lines
        const timestampedLines = items.map(item => `${this.formatTimestamp(item.offset)} ${item.text}`);
        const fullTranscriptText = timestampedLines.join('\n');
        const totalWords = fullTranscriptText.split(/\s+/).length;

        console.log(`[YouTubeService] Extracted ${items.length} transcript lines (${totalWords} words) for video ${videoId} via ${source}`);

        this.emitTelemetry(messageId, {
            stage: 'YouTube Transcript Extracted',
            label: `Extracted ${totalWords} words across ${items.length} timestamped lines`,
            url: videoUrl,
            domain: 'youtube.com',
            favicon: 'https://www.google.com/s2/favicons?domain=youtube.com',
            details: { videoId, totalWords, lineCount: items.length, source }
        });

        // Step 2: Structured Processing (Single-pass vs Multi-pass Sectional Chunking)
        let finalStructuredContent = '';

        if (totalWords <= 2500) {
            // Short Video: Single-pass direct synthesis
            this.emitTelemetry(messageId, {
                stage: 'YouTube Video Processing',
                label: `Processing transcript in single pass (${totalWords} words)`,
                url: videoUrl,
                domain: 'youtube.com',
                favicon: 'https://www.google.com/s2/favicons?domain=youtube.com'
            });

            const prompt = `
You are analyzing a YouTube video transcript.
Video ID: ${videoId}
URL: ${videoUrl}

### User Request / Question:
"${userQuery}"

### Full Video Transcript (with timestamps):
${fullTranscriptText}

### Task Instructions:
1. Thoroughly address the user's request using the video content as the primary source.
2. If the user asked for a step-by-step course, tutorial, guide, outline, or notes, construct a comprehensive, logically ordered, high-quality document (with Modules, Lessons, Timestamps, Code/Examples, and Key Takeaways).
3. Do NOT provide a generic surface summary. Preserve key technical details, specific steps, and timestamp references.
`.trim();

            const llmResponse = await LLMService.chat('You are an expert video content analyst and educational architect.', prompt, false);
            finalStructuredContent = llmResponse || fullTranscriptText;
        } else {
            // Long Video: Multi-pass Sectional Chunking
            const CHUNK_WORD_LIMIT = 2000;
            const chunks: string[] = [];
            let currentChunk: string[] = [];
            let currentWords = 0;

            for (const line of timestampedLines) {
                const words = line.split(/\s+/).length;
                if (currentWords + words > CHUNK_WORD_LIMIT && currentChunk.length > 0) {
                    chunks.push(currentChunk.join('\n'));
                    currentChunk = [line];
                    currentWords = words;
                } else {
                    currentChunk.push(line);
                    currentWords += words;
                }
            }
            if (currentChunk.length > 0) chunks.push(currentChunk.join('\n'));

            console.log(`[YouTubeService] Splitting long transcript into ${chunks.length} sections for processing.`);

            // Pass 1: Process each section sequentially with telemetry
            const sectionSummaries: string[] = [];

            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];
                const firstLine = chunkText.split('\n')[0] || '';
                const lastLine = chunkText.split('\n').pop() || '';
                const startTs = firstLine.match(/\[\d+:\d+(?::\d+)?\]/)?.[0] || '';
                const endTs = lastLine.match(/\[\d+:\d+(?::\d+)?\]/)?.[0] || '';

                this.emitTelemetry(messageId, {
                    stage: 'YouTube Sectional Processing',
                    label: `Analyzing Section ${i + 1}/${chunks.length} (${startTs} - ${endTs})`,
                    url: videoUrl,
                    domain: 'youtube.com',
                    favicon: 'https://www.google.com/s2/favicons?domain=youtube.com',
                    details: { section: i + 1, totalSections: chunks.length, timeRange: `${startTs} - ${endTs}` }
                });

                const sectionPrompt = `
You are analyzing Section ${i + 1} of ${chunks.length} of a YouTube video transcript [Timestamps: ${startTs} to ${endTs}].
User Goal: "${userQuery}"

Section Transcript Excerpt:
${chunkText}

Task: Extract key concepts, specific steps, technical details, code/examples, and timestamp markers from this section relevant to building the final answer/roadmap/course for the user.
Important: Be concise, high-density, and actionable (under 350 words). Include exact timestamps [MM:SS].
`.trim();

                const secSummary = await LLMService.chat('You are a structured video section analyzer.', sectionPrompt, false);
                const fallbackSectionText = chunkText.split('\n').slice(0, 15).join('\n');
                const cleanSec = secSummary && secSummary.trim().length > 50 ? secSummary.trim() : `Key timestamps & contents:\n${fallbackSectionText}`;
                sectionSummaries.push(`### Section ${i + 1} (${startTs} - ${endTs})\n${cleanSec}`);
            }

            // Pass 2: Global Synthesis across all sections
            this.emitTelemetry(messageId, {
                stage: 'YouTube Global Synthesis',
                label: `Synthesizing final response across all ${chunks.length} sections`,
                url: videoUrl,
                domain: 'youtube.com',
                favicon: 'https://www.google.com/s2/favicons?domain=youtube.com'
            });

            const combinedSectionalFindings = sectionSummaries.join('\n\n=================================\n\n');

            const globalPrompt = `
You are an expert curriculum architect and video content synthesizer.
You have analyzed a ${chunks.length}-part transcript for YouTube video: ${videoUrl}

User Request: "${userQuery}"

### Sectional Analysis Findings:
${combinedSectionalFindings}

### Master Task Instructions:
1. Deliver an exhaustive, research-grade, highly structured response answering the user's specific request.
2. If the user asked for a roadmap, course, or section summaries, structure it logically into:
   - **Executive Roadmap Overview** (with milestones and timelines/timestamps)
   - **Detailed Section-by-Section Breakdown** (incorporating timestamps and key concepts)
   - **Key Takeaways & Next Steps**
3. Ensure no critical concepts from any section are omitted. Combine sectional insights into a cohesive, beautifully formatted markdown document.
`.trim();

            const globalResponse = await LLMService.chat('You are a master curriculum architect and synthesizer.', globalPrompt, false);
            finalStructuredContent = (globalResponse && globalResponse.trim().length > 100) 
                ? globalResponse 
                : `# 📌 Roadmap & Section-by-Section Summaries\n**Source Video:** ${videoUrl}\n\n${sectionSummaries.join('\n\n---\n\n')}`;
        }

        const entry: ContextEntry = {
            entity_name: `YouTube Video ${videoId}`,
            what_it_is: `Structured video analysis & transcript extraction for YouTube ID ${videoId}`,
            key_facts: [finalStructuredContent],
            current_status: 'active',
            relevant_to_goal: 'high',
            sources: [`YouTube: ${videoUrl}`],
            confidence: 'high',
            last_updated: new Date().toISOString(),
            researched_at: Date.now()
        };

        return entry;
    }
}
