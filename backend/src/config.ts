import dotenv from 'dotenv';

dotenv.config();

export const config = {
    discordToken: process.env.DISCORD_TOKEN || '',
    llmBaseUrl: process.env.LLM_BASE_URL || 'http://localhost:3001/v1',
    llmEndpoint: process.env.LLM_ENDPOINT || '/v1/chat/completions',
    brainPath: process.env.BRAIN_PATH || require('path').resolve(__dirname, '../brahma [brain]/core'),
};
