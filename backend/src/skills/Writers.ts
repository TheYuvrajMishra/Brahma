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

Use the following research context to write the blog post:
${context}
        `.trim();

        const response = await LLMService.chat(systemPrompt, 'Generate the blog post based on the research context.');
        return response || 'Failed to generate blog post.';
    }
}

export class WriteEmail implements ISkill {
    name = 'write-email';
    description = 'Drafts professional emails.';

    async execute(params: any): Promise<string> {
        const subject = params.subject || 'No Subject';
        const recipient = params.recipient || 'Recipient';
        const key_points = params.key_points ? params.key_points.join(', ') : 'none';
        const context = params._dependency_context || '';

        const systemPrompt = `
You are an expert email drafter. Write an email to ${recipient}.
Subject: ${subject}
Key Points to include: ${key_points}
Format the output professionally.

Use the following research context to write the email:
${context}
        `.trim();

        const response = await LLMService.chat(systemPrompt, 'Generate the email based on the research context.');
        return response || 'Failed to generate email.';
    }
}
