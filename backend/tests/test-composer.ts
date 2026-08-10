import { Composer } from '../src/pipeline/Composer';
import { LLMService } from '../src/services/LLMService';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    // intercept LLMService.chat to print raw output
    const originalChat = LLMService.chat;
    LLMService.chat = async (prompt, content, isJson) => {
        console.log("=== COMPOSER SYSTEM PROMPT ===");
        console.log(prompt);
        console.log("=== COMPOSER USER CONTENT ===");
        console.log(content);
        const result = await originalChat(prompt, content, isJson);
        console.log("=== COMPOSER RAW LLM OUTPUT ===");
        console.log(result);
        return result;
    };

    const message = {
        message_id: 'test',
        platform: 'cli',
        channel_id: 'test',
        user_id: 'test',
        content: 'i want you to summarize my last 5 emails and tell me whats happening in there',
        timestamp: new Date()
    };

    const executionLog = [
        {
            step: 1,
            action: "get_emails",
            tool: "get-emails",
            status: "success" as const,
            output: "Email ID: 1\nFrom: Alice <alice@example.com>\nDate: Sat, 6 Jun 2026\nSubject: Project Update\nSnippet: We finished the design phase.\nBody: Hi Yuvraj, the design is ready."
        },
        {
            step: 2,
            action: "summarize_emails",
            tool: "llm_call",
            status: "success" as const,
            output: "Alice says the design phase for the project is completed and ready for review."
        }
    ];

    console.log("Running Composer...");
    const result = await Composer.compose(message as any, 'complex', executionLog);
    console.log("=== FINAL RESPONSE ===");
    console.log(result.content);
}

run();
