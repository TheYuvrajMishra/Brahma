import { ISkill } from '../types/Skill';
import { LLMService } from '../services/LLMService';

export function sanitizeEmailText(rawText: string): string {
    if (!rawText) return '';
    let cleaned = rawText.trim();

    // 1. Remove XML/HTML thinking tags: <think>...</think>
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 2. Remove markdown code blocks (e.g. ```text or ```)
    cleaned = cleaned.replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, '$1');
    cleaned = cleaned.replace(/```[\s\S]*?$/g, '');

    // 3. Remove thinking process headers/blocks
    if (/^\s*(Here's a thinking process|Thinking Process|Thought Process|1\.\s*\*\*Analyze|Analyze User Input)/i.test(cleaned)) {
        const salutationMatch = cleaned.match(/\n\s*(?:Hey|Hi|Dear|Hello)\b[\s\S]*/i);
        if (salutationMatch) {
            cleaned = salutationMatch[0].trim();
        } else {
            const paragraphs = cleaned.split(/\n\s*\n/);
            const bodyParagraphs = paragraphs.filter(p => 
                !/^\s*(?:Here's a thinking|Thinking Process|\d+\.\s*\*\*|Checks:|Proceeds|Tone\/Style:|Critical Rules:)/i.test(p.trim())
            );
            if (bodyParagraphs.length > 0) {
                cleaned = bodyParagraphs.join('\n\n').trim();
            }
        }
    }

    // 4. Scan lines from start to find salutation or Subject line
    const lines = cleaned.split('\n');
    let contentStartIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/^(dear|hi|hello|hey)\b/i.test(line)) {
            contentStartIndex = i;
            break;
        }
        if (/^subject:/i.test(line)) {
            contentStartIndex = i + 1;
            break;
        }
    }
    
    if (contentStartIndex > 0) {
        cleaned = lines.slice(contentStartIndex).join('\n').trim();
    }

    // 5. Remove dependency context markers or step outputs if leaked
    cleaned = cleaned.replace(/--- Output from Step \d+ [\s\S]*?---/g, '');

    // 6. Normalize Paragraphs & Remove Unnecessary Mid-Paragraph Line Breaks
    const blocks = cleaned.split(/\n\s*\n/);
    const cleanedBlocks = blocks.map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';

        const blockLines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);

        // Keep list blocks intact (lines starting with -, *, •, or numbered 1., 2.)
        const isListBlock = blockLines.every(l => /^\s*([-*•]|\d+\.)\s+/.test(l)) || 
                            (blockLines.length > 1 && blockLines.some(l => /^\s*([-*•]|\d+\.)\s+/.test(l)));
        if (isListBlock) {
            return blockLines.join('\n');
        }

        // Keep sign-off blocks intact (e.g. "Best regards,\nBrahma Team")
        const isSignoffBlock = /^(best regards|kind regards|regards|sincerely|thanks|thank you|warmly|yours truly|cheers|best|with love),?/i.test(blockLines[0]);
        if (isSignoffBlock) {
            return blockLines.join('\n');
        }

        // Otherwise join lines within the paragraph with a single space
        return blockLines.join(' ');
    });

    cleaned = cleanedBlocks.filter(Boolean).join('\n\n');

    return cleaned.trim();
}

export class WriteBlog implements ISkill {
    name = 'write-blog';
    description = 'Drafts SEO-optimized blog posts.';

    async execute(params: any): Promise<string> {
        const topic = params.topic || 'General Topic';
        const tone = params.tone || 'informative';
        const keywords = params.keywords ? params.keywords.join(', ') : 'none';
        const context = params._dependency_context || '';

        const systemPrompt = `
You are an expert copywriter. Write a blog post about "${topic}".
Tone: ${tone}
Keywords to include: ${keywords}
Format the output in clean Markdown.
${context ? `\nUse the following research context to write the blog post:\n${context}` : ''}
        `.trim();

        const response = await LLMService.chat(systemPrompt, 'Generate the blog post.');
        return response || 'Failed to generate blog post.';
    }
}

export class WriteEmail implements ISkill {
    name = 'write-email';
    description = 'Drafts professional emails.';

    async execute(params: any): Promise<string> {
        const subject = params.subject || 'No Subject';
        const recipient = params.recipient || 'Recipient';
        const sender_name = params.sender_name || '';
        const tone = params.tone || 'professional';
        const key_points = params.key_points ? (Array.isArray(params.key_points) ? params.key_points.join(', ') : params.key_points) : 'none';
        const context = params._dependency_context || '';

        const systemPrompt = `
You are an expert email drafter. Write an email to ${recipient}.
Subject: ${subject}
Key Points to include: ${key_points}

${sender_name ? `The email is from: ${sender_name}. Sign off the email using this name.` : 'If the sender name is not provided, sign off without placeholders, or leave it generic (e.g. "Best regards"). Do not output signature placeholders like "[Your Name]".'}

Tone/Style: ${tone}. Adapt the email style, vocabulary, and formatting to match this tone. If the tone is informal, casual, or romantic/playful, write a fittingly warm and natural message (e.g., using "I love you very much" instead of formal equivalents). Do NOT use stiff, boilerplate corporate-romantic templates unless a professional/formal tone is explicitly requested.

${context ? `\nUse the following research context to write the email:\n${context}` : ''}

CRITICAL RULES:
- NO ATTACHMENTS: Brahma does NOT support email attachments. Never write boilerplate placeholders like "Please find the report attached" or "I have attached the document". You MUST write and inline the actual research findings, report contents, or requested details directly inside the email body itself.
- Ensure the email is self-contained, detailed, and contains the actual reports/findings.
- NO UNNECESSARY MID-PARAGRAPH LINE BREAKS: Every paragraph must be a single continuous flowing text line without hard line wraps inside the paragraph. Line breaks must ONLY occur between separate paragraphs (using double line breaks \\n\\n), list items, salutation, and sign-off.

MANDATORY OUTPUT FORMAT:
Return ONLY the raw email body text.
- Do NOT output any thinking process, reasoning steps, or analysis headers (e.g., "Here's a thinking process:").
- Do NOT wrap the output in markdown code blocks (like \`\`\`text).
- Do NOT include the subject line or "To: / From:" headers in the response.
- Do NOT include any conversational preamble or postscript (such as "Here is the drafted email:").
        `.trim();

        const response = await LLMService.chat(systemPrompt, 'Generate the email body text.');
        return sanitizeEmailText(response || '');
    }
}
