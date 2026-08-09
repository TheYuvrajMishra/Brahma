import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const resolveBrainCore = (): string => {
    if (process.env.BRAIN_PATH && fs.existsSync(process.env.BRAIN_PATH)) {
        return process.env.BRAIN_PATH;
    }
    const candidates = [
        path.resolve(__dirname, '../brahma [brain]/core'),
        path.resolve(__dirname, '../../brahma [brain]/core'),
        path.resolve(process.cwd(), 'brahma [brain]/core'),
        path.resolve(process.cwd(), '../brahma [brain]/core')
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return candidates[0];
};

export const config = {
    discordToken: process.env.DISCORD_TOKEN || '',
    llmBaseUrl: process.env.LLM_BASE_URL || 'http://localhost:3001/v1',
    llmEndpoint: process.env.LLM_ENDPOINT || '/v1/chat/completions',
    llmApiKey: process.env.LLM_API_KEY || '',
    brainPath: resolveBrainCore(),
    enableMemoryCompression: process.env.ENABLE_MEMORY_COMPRESSION !== 'false',
};
