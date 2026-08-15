import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { Document as DocxDocument, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, Packer, AlignmentType } from 'docx';
import { chromium } from 'playwright';
import { Artifact, IArtifact } from '../models/Artifact';
import { Logger } from '../core/Logger';

export interface CreateArtifactParams {
    userId: string;
    sessionId: string;
    messageId?: string;
    title: string;
    filename: string;
    fileType?: string;
    content: string; // Raw text/markdown/json/code or structured data string
}

export class ArtifactEngine {

    /**
     * Resolves physical storage directory for session artifacts per-user.
     * Location: ./backend/brahma [brain]/users/:userId/artifacts/:sessionId
     */
    static getStorageDir(userId: string, sessionId: string): string {
        const dir = path.resolve(__dirname, '../../brahma [brain]/users', userId, 'artifacts', sessionId);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        return dir;
    }

    /**
     * Infers clean normalized file extension & type
     */
    static normalizeFileType(filename: string, explicitType?: string): string {
        if (explicitType && explicitType.trim()) {
            return explicitType.trim().toLowerCase().replace(/^\./, '');
        }
        const ext = path.extname(filename).toLowerCase().replace(/^\./, '');
        return ext || 'md';
    }

    /**
     * Parallel Decoupled Generation Loop Entry Point
     */
    static async generateArtifact(params: CreateArtifactParams): Promise<IArtifact> {
        const startTime = Date.now();
        const artifactId = `art_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const fileType = this.normalizeFileType(params.filename, params.fileType);

        // Sanitize filename
        let cleanFileName = path.basename(params.filename).replace(/[^a-zA-Z0-9_.-]/g, '_');
        if (!cleanFileName.toLowerCase().endsWith(`.${fileType}`)) {
            cleanFileName = `${cleanFileName}.${fileType}`;
        }

        const storageDir = this.getStorageDir(params.userId, params.sessionId);
        const physicalFilePath = path.join(storageDir, `${artifactId}_${cleanFileName}`);

        let textContentForDb = '';

        // Execute Strategy based on target file format
        switch (fileType) {
            case 'json':
                textContentForDb = await this.generateJson(physicalFilePath, params.content);
                break;
            case 'md':
            case 'markdown':
                textContentForDb = await this.generateMarkdown(physicalFilePath, params.content);
                break;
            case 'html':
                textContentForDb = await this.generateHtml(physicalFilePath, params.content, params.title);
                break;
            case 'css':
                textContentForDb = await this.generateCss(physicalFilePath, params.content);
                break;
            case 'js':
            case 'javascript':
            case 'ts':
            case 'typescript':
                textContentForDb = await this.generateJs(physicalFilePath, params.content);
                break;
            case 'docx':
                textContentForDb = await this.generateDocx(physicalFilePath, params.content, params.title);
                break;
            case 'xlsx':
            case 'xls':
            case 'csv':
                textContentForDb = await this.generateXlsx(physicalFilePath, params.content, params.title);
                break;
            case 'pdf':
                textContentForDb = await this.generatePdf(physicalFilePath, params.content, params.title);
                break;
            default:
                // General text fallback
                fs.writeFileSync(physicalFilePath, params.content, 'utf-8');
                textContentForDb = params.content;
                break;
        }

        // Save metadata record in MongoDB
        const artifactDoc = await Artifact.create({
            artifactId,
            userId: params.userId,
            sessionId: params.sessionId,
            messageId: params.messageId,
            title: params.title || cleanFileName,
            filename: cleanFileName,
            fileType,
            content: textContentForDb,
            storagePath: physicalFilePath,
            isArchived: false
        });

        Logger.info('ArtifactEngine', params.sessionId, Date.now() - startTime, 'SUCCESS', {
            artifactId,
            filename: cleanFileName,
            fileType
        });

        return artifactDoc;
    }

    // ── Strategy Implementations ──────────────────────────────────────────────

    private static async generateJson(filePath: string, rawContent: string): Promise<string> {
        let formatted = rawContent;
        try {
            const parsed = typeof rawContent === 'object' ? rawContent : JSON.parse(rawContent);
            formatted = JSON.stringify(parsed, null, 2);
        } catch {
            // Keep raw if not parseable
        }
        fs.writeFileSync(filePath, formatted, 'utf-8');
        return formatted;
    }

    private static async generateMarkdown(filePath: string, content: string): Promise<string> {
        fs.writeFileSync(filePath, content, 'utf-8');
        return content;
    }

    private static async generateHtml(filePath: string, content: string, title: string): Promise<string> {
        let fullHtml = content;
        if (!/<html/i.test(content)) {
            fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Generated HTML Artifact'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 2rem; color: #111; max-width: 900px; margin: 0 auto; }
        pre { background: #f4f4f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        code { font-family: monospace; font-size: 0.9em; }
        table { border-collapse: collapse; width: 100%; margin: 1.5rem 0; }
        th, td { border: 1px solid #e4e4e7; padding: 0.75rem; text-align: left; }
        th { background: #f4f4f5; font-weight: 600; }
    </style>
</head>
<body>
${content}
</body>
</html>`;
        }
        fs.writeFileSync(filePath, fullHtml, 'utf-8');
        return fullHtml;
    }

    private static async generateCss(filePath: string, content: string): Promise<string> {
        fs.writeFileSync(filePath, content, 'utf-8');
        return content;
    }

    private static async generateJs(filePath: string, content: string): Promise<string> {
        fs.writeFileSync(filePath, content, 'utf-8');
        return content;
    }

    private static async generateDocx(filePath: string, content: string, title: string): Promise<string> {
        const lines = content.split('\n');
        const children: any[] = [];

        children.push(
            new Paragraph({
                text: title || 'Generated Document',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.LEFT,
            })
        );

        let currentParagraphRuns: TextRun[] = [];

        const flushParagraph = () => {
            if (currentParagraphRuns.length > 0) {
                children.push(new Paragraph({ children: currentParagraphRuns }));
                currentParagraphRuns = [];
            }
        };

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                flushParagraph();
                children.push(new Paragraph({ text: '' }));
                continue;
            }

            if (trimmed.startsWith('# ')) {
                flushParagraph();
                children.push(new Paragraph({ text: trimmed.substring(2).trim(), heading: HeadingLevel.HEADING_1 }));
            } else if (trimmed.startsWith('## ')) {
                flushParagraph();
                children.push(new Paragraph({ text: trimmed.substring(3).trim(), heading: HeadingLevel.HEADING_2 }));
            } else if (trimmed.startsWith('### ')) {
                flushParagraph();
                children.push(new Paragraph({ text: trimmed.substring(4).trim(), heading: HeadingLevel.HEADING_3 }));
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                flushParagraph();
                children.push(new Paragraph({ text: trimmed.substring(2).trim(), bullet: { level: 0 } }));
            } else {
                currentParagraphRuns.push(new TextRun({ text: line }));
            }
        }
        flushParagraph();

        const doc = new DocxDocument({
            sections: [{
                properties: {},
                children
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(filePath, buffer);
        return content;
    }

    private static async generateXlsx(filePath: string, content: string, title: string): Promise<string> {
        const wb = XLSX.utils.book_new();

        try {
            // Attempt 1: Parse as JSON array of objects
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                const ws = XLSX.utils.json_to_sheet(parsed);
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
                fs.writeFileSync(filePath, buf);
                return JSON.stringify(parsed, null, 2);
            }
        } catch {
            // Not pure JSON
        }

        // Attempt 2: Parse Markdown table or CSV lines
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const rows: string[][] = [];

        for (const line of lines) {
            if (line.includes('|')) {
                if (line.includes('---')) continue; // skip table divider line
                const cols = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                if (cols.length > 0) rows.push(cols);
            } else if (line.includes(',')) {
                rows.push(line.split(',').map(c => c.trim()));
            } else if (line.includes('\t')) {
                rows.push(line.split('\t').map(c => c.trim()));
            }
        }

        if (rows.length === 0) {
            rows.push(['Content'], [content]);
        }

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 30) || 'Sheet1');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        fs.writeFileSync(filePath, buf);
        return content;
    }

    private static async generatePdf(filePath: string, markdownContent: string, title: string): Promise<string> {
        // Step 1: Convert Markdown to clean styled HTML
        const htmlBody = this.convertMarkdownToSimpleHtml(markdownContent);

        const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title || 'PDF Document'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #111827;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { font-size: 26px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 0; color: #111827; }
        h2 { font-size: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 24px; color: #1f2937; }
        h3 { font-size: 16px; margin-top: 20px; color: #374151; }
        p { margin: 12px 0; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
        pre { background: #1f2937; color: #f9fafb; padding: 16px; border-radius: 8px; overflow-x: auto; }
        pre code { background: none; color: inherit; padding: 0; }
        blockquote { border-left: 4px solid #3b82f6; margin: 16px 0; padding-left: 16px; color: #4b5563; font-style: italic; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
        th { background: #f3f4f6; font-weight: 600; }
        ul, ol { padding-left: 24px; }
        li { margin: 4px 0; }
    </style>
</head>
<body>
    <h1>${title || 'Generated PDF'}</h1>
    ${htmlBody}
</body>
</html>`;

        // Step 2: Use Playwright (already installed in backend) to compile HTML to PDF
        let browser;
        try {
            browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            const page = await browser.newPage();
            await page.setContent(fullHtml, { waitUntil: 'load' });
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
                printBackground: true
            });
            fs.writeFileSync(filePath, pdfBuffer);
        } catch (err) {
            console.warn('[ArtifactEngine] Playwright PDF generation fallback:', err);
            // Fallback plain text write if browser launch fails
            fs.writeFileSync(filePath, Buffer.from(markdownContent));
        } finally {
            if (browser) {
                await browser.close().catch(() => {});
            }
        }

        return markdownContent;
    }

    private static convertMarkdownToSimpleHtml(md: string): string {
        if (!md) return '';
        let html = md
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Headings
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold & Italics
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Paragraphs
        html = html.split('\n\n').map(p => {
            if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<blockquote')) {
                return p;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('\n');

        return html;
    }

    // ── Queries & Utilities ──────────────────────────────────────────────────

    /**
     * Get active (non-archived) artifacts for a user session
     */
    static async getSessionArtifacts(userId: string, sessionId: string): Promise<IArtifact[]> {
        return await Artifact.find({ userId, sessionId, isArchived: false }).sort({ createdAt: -1 });
    }

    /**
     * Get single artifact by ID
     */
    static async getArtifactById(userId: string, artifactId: string): Promise<IArtifact | null> {
        return await Artifact.findOne({ userId, artifactId });
    }

    /**
     * Invalidate/Archive artifacts generated by truncated message turns when a prompt is edited/rewound.
     */
    static async archiveArtifactsAfterMessage(userId: string, sessionId: string, messageIdsToArchive: string[]): Promise<number> {
        if (!messageIdsToArchive || messageIdsToArchive.length === 0) return 0;
        const res = await Artifact.updateMany(
            { userId, sessionId, messageId: { $in: messageIdsToArchive } },
            { $set: { isArchived: true } }
        );
        return res.modifiedCount;
    }

    /**
     * Decoupled automatic artifact creation check based on user prompt & composer response
     */
    static async checkAndTriggerArtifactFromMessage(message: any, composerContent?: string): Promise<void> {
        if (!message || !message.user_id || !message.channel_id) return;
        const text = (message.content || '').toLowerCase();
        
        const isPdf = /\b(pdf|document|report)\b/.test(text) && /\b(create|generate|make|build|export|download|write|save|give|produce)\b/.test(text);
        const isDocx = /\b(docx|doc|word|word doc)\b/.test(text) && /\b(create|generate|make|build|export|download|write|save|give|produce)\b/.test(text);
        const isXlsx = /\b(xlsx|xls|excel|spreadsheet|csv)\b/.test(text) && /\b(create|generate|make|build|export|download|write|save|give|produce)\b/.test(text);
        const isJson = /\b(json|dataset|configuration)\b/.test(text) && /\b(create|generate|make|build|export|download|write|save|give|produce)\b/.test(text);
        const isHtml = /\b(html|webpage|landing page|component|ui)\b/.test(text) && /\b(create|generate|make|build|export|download|write|save|give|produce)\b/.test(text);
        const isCss = /\b(css|stylesheet|styles)\b/.test(text) && /\b(create|generate|make|build|export|download|write|save|give|produce)\b/.test(text);
        const isJs = /\b(js|javascript|script)\b/.test(text) && /\b(create|generate|make|build|export|download|write|save|give|produce)\b/.test(text);
        const isYouTubeStructuredOutput = (/\b(youtube|youtu\.be)\b/i.test(text) || /https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(text)) && /\b(course|tutorial|curriculum|roadmap|guide|study notes|notes|summary|outline|modules?|lessons?)\b/i.test(text);
        const isCourseRequest = /\b(course|tutorial|curriculum|roadmap|study guide)\b/i.test(text) && /\b(create|generate|make|build|export|download|write|save|give|produce|convert|derive|structure)\b/i.test(text);
        const isMd = (/\b(md|markdown|notes|article|guide|file)\b/.test(text) && /\b(create|generate|make|build|export|download|write|save|give|produce)\b/.test(text)) || isYouTubeStructuredOutput || isCourseRequest;

        if (!isPdf && !isDocx && !isXlsx && !isJson && !isHtml && !isCss && !isJs && !isMd) {
            return;
        }

        let targetType = 'md';
        if (isPdf) targetType = 'pdf';
        else if (isDocx) targetType = 'docx';
        else if (isXlsx) targetType = 'xlsx';
        else if (isJson) targetType = 'json';
        else if (isHtml) targetType = 'html';
        else if (isCss) targetType = 'css';
        else if (isJs) targetType = 'js';
        else if (isMd) targetType = 'md';

        const cleanTitle = message.content.trim().substring(0, 24).replace(/[^a-zA-Z0-9_]/g, '_');
        const filename = `${cleanTitle || 'artifact'}.${targetType}`;

        let contentToSave = composerContent || message.content;
        const codeBlockMatch = contentToSave.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1].trim().length > 0) {
            contentToSave = codeBlockMatch[1].trim();
        }

        try {
            const artifact = await this.generateArtifact({
                userId: message.user_id,
                sessionId: message.channel_id,
                messageId: message.message_id,
                title: message.content.trim().substring(0, 30),
                filename,
                fileType: targetType,
                content: contentToSave
            });

            const { EventBus, SystemEvents } = require('../core/EventBus');
            EventBus.emit(SystemEvents.ARTIFACT_CREATED, { message, artifact });
        } catch (err) {
            console.error('[ArtifactEngine] Automatic artifact creation failed:', err);
        }
    }
}

