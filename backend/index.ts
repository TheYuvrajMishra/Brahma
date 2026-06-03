import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DBService } from './services/db.service';
import { OrchestratorService } from './services/orchestrator.service';

import { DiscordService } from './services/discord.service';

dotenv.config();

const app = express();
const discordService = new DiscordService();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Main agentic endpoint
app.post('/api/chat', async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const response = await OrchestratorService.run(query);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

const startServer = async () => {
    // await DBService.connect(); // Uncomment when MongoDB is ready
    await discordService.login();
    app.listen(PORT, () => {
        console.log(`Brahma Backend running on http://localhost:${PORT}`);
    });
};

startServer();
