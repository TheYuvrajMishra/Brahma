import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { DBService } from './services/db.service';
import { VectorService } from './services/vector.service';
import { DiscordService } from './services/discord.service';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  const dbStatus = DBService.getStatus();
  const discordStatus = DiscordService.getStatus();
  res.json({
    status: 'healthy',
    database: dbStatus,
    discord: discordStatus,
  });
});

async function bootstrap() {
  console.log('⚙️ Bootstrapping Brahma Engine...');

  // 1. Connect to MongoDB
  await DBService.connect();

  // 2. Seed VectorStore (scrapes Zehn entities + sessions and populates hybrid vector search)
  try {
    await VectorService.indexAllBrainDocuments();
  } catch (err: any) {
    console.warn('⚠️ Vector indexing skipped or failed during startup:', err.message);
  }

  // 3. Start Discord Bot integration
  const discordStatus = await DiscordService.connect();
  if (discordStatus.mode === 'live') {
    console.log(`🤖 Live Discord Bot Integration is successfully connected as: ${discordStatus.guildName || 'Active'}`);
  } else {
    console.log('🤖 Discord Bot loaded in MOCK/SIMULATOR mode (token missing or disallowed intents).');
  }

  // 4. Start HTTP Server
  app.listen(PORT, () => {
    console.log(`🚀 Brahma backend server is active at http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Critical bootstrap failure:', err);
  process.exit(1);
});
