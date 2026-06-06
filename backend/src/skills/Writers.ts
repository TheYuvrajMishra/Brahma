import { ISkill } from '../types/Skill';
import { LLMService } from '../services/LLMService';

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

MANDATORY OUTPUT FORMAT:
Return ONLY the raw email body text.
- Do NOT wrap the output in markdown code blocks (like \`\`\`text).
- Do NOT include the subject line or "To: / From:" headers in the response.
- Do NOT include any conversational preamble or postscript (such as "Here is the drafted email:").
        `.trim();

        const response = await LLMService.chat(systemPrompt, 'Generate the email body text.');
        return response || 'Failed to generate email.';
    }
}
