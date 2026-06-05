import { Planner } from './src/pipeline/Planner';
import { LLMService } from './src/services/LLMService';
import { MemoryManager } from './src/core/MemoryManager';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log("Mocking MemoryManager...");
    MemoryManager.getPlannerSchema = () => require('fs').readFileSync('./brahma [brain]/core/planner.md', 'utf-8');
    MemoryManager.getHunar = () => require('fs').readFileSync('./brahma [brain]/core/hunar.md', 'utf-8');
    MemoryManager.getMoment = () => require('fs').readFileSync('./brahma [brain]/core/moment.md', 'utf-8');
    MemoryManager.getZehn = () => require('fs').readFileSync('./brahma [brain]/core/zehn.md', 'utf-8');

    // intercept LLMService.chat to print raw output
    const originalChat = LLMService.chat;
    LLMService.chat = async (prompt, content, isJson) => {
        console.log("=== SYSTEM PROMPT ===");
        console.log(prompt);
        console.log("=== USER CONTENT ===");
        console.log(content);
        const result = await originalChat(prompt, content, isJson);
        console.log("=== RAW LLM OUTPUT ===");
        console.log(result);
        return result;
    };

    const message = {
        message_id: 'test',
        platform: 'cli',
        channel_id: 'test',
        user_id: 'test',
        content: 'send this research to my email, yuvraj17mishra11@gmail.com',
        timestamp: new Date()
    };

    try {
        console.log("Running Planner...");
        const plan = await Planner.plan(message as any);
        console.log("=== FINAL PLAN ===");
        console.log(JSON.stringify(plan, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
