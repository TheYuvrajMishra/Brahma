import * as dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express, { Request, Response } from 'express';
import * as path from 'path';
import { DBService } from './services/db.service';
import { VectorService } from './services/vector.service';
import { DiscordService } from './services/discord.service';
import { ContextService } from './services/context.service';
import { LLMService } from './services/llm.service';
import { Dharma, Atman, Zehn, Hunar } from './models';

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  const dbStatus = DBService.getStatus();
  const discordStatus = DiscordService.getStatus();
  res.json({
    status: 'healthy',
    database: dbStatus,
    discord: discordStatus,
  });
});

// ─── Keymanager & Config Endpoint ───────────────────────────────────────────
app.get('/api/keys', (req: Request, res: Response) => {
  res.json({
    llmModel: process.env.LLM_MODEL || 'mock',
    llmApiUrl: process.env.LLM_API_URL || 'mock',
    embeddingModel: process.env.EMBEDDING_MODEL || 'local-fallback',
    hasApiKey: !!process.env.LLM_API_KEY,
    dbStatus: DBService.getStatus(),
    discordStatus: DiscordService.getStatus(),
  });
});

// ─── Missions (Dharma) Routes ───────────────────────────────────────────────
app.get('/api/missions', async (req: Request, res: Response) => {
  try {
    const list = await Dharma.find({}).sort({ lastSync: -1 });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/missions/:missionId', async (req: Request, res: Response) => {
  try {
    const mission = await Dharma.findOne({ missionId: req.params.missionId });
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    res.json(mission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/missions/decompose', async (req: Request, res: Response) => {
  try {
    const { title, objective, contextEntityIds, contextSessionIds } = req.body;
    if (!title || !objective) {
      return res.status(400).json({ error: 'Title and objective are required' });
    }
    const newMission = await OrchestratorServiceDecompose(title, objective, contextEntityIds, contextSessionIds);
    res.status(201).json(newMission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to isolate import execution safely
async function OrchestratorServiceDecompose(title: string, obj: string, entIds?: string[], sesIds?: string[]) {
  const { OrchestratorService } = await import('./services/orchestrator.service');
  return OrchestratorService.decomposeMission(title, obj, entIds || [], sesIds || []);
}

app.post('/api/missions/:missionId/execute-next', async (req: Request, res: Response) => {
  try {
    const { OrchestratorService } = await import('./services/orchestrator.service');
    const nextTask = await OrchestratorService.executeNextTask(req.params.missionId as string);
    res.json({ success: true, nextTask });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/missions/:missionId/complete-task', async (req: Request, res: Response) => {
  try {
    const { subTaskId } = req.body;
    if (!subTaskId) return res.status(400).json({ error: 'subTaskId is required' });
    const { OrchestratorService } = await import('./services/orchestrator.service');
    await OrchestratorService.completeTask(req.params.missionId as string, subTaskId);
    const updatedMission = await Dharma.findOne({ missionId: req.params.missionId as string });
    res.json({ success: true, mission: updatedMission });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/missions/:missionId', async (req: Request, res: Response) => {
  try {
    const result = await Dharma.deleteOne({ missionId: req.params.missionId as string });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Atman (Personality) Routes ─────────────────────────────────────────────
app.get('/api/atman', async (req: Request, res: Response) => {
  try {
    let atman = await Atman.findOne({});
    if (!atman) {
      atman = new Atman({
        version: '1.0.0',
        directness: 4,
        philosophicalDepth: 3,
        advisoryProactivity: 5,
        humanEmpathy: 4,
        userAlignments: []
      });
      await atman.save();
    }
    res.json(atman);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/atman', async (req: Request, res: Response) => {
  try {
    const { directness, philosophicalDepth, advisoryProactivity, humanEmpathy, userAlignments } = req.body;
    let atman = await Atman.findOne({});
    if (!atman) {
      atman = new Atman({});
    }
    if (directness !== undefined) atman.directness = directness;
    if (philosophicalDepth !== undefined) atman.philosophicalDepth = philosophicalDepth;
    if (advisoryProactivity !== undefined) atman.advisoryProactivity = advisoryProactivity;
    if (humanEmpathy !== undefined) atman.humanEmpathy = humanEmpathy;
    if (userAlignments !== undefined) atman.userAlignments = userAlignments;
    atman.lastSync = new Date();
    await atman.save();
    res.json(atman);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Zehn (Context Map) Routes ──────────────────────────────────────────────
app.get('/api/zehn', async (req: Request, res: Response) => {
  try {
    let zehn = await Zehn.findOne({});
    if (!zehn) {
      zehn = new Zehn({
        version: '1.0.0',
        indexedEntitiesCount: 0,
        chronologicalSessionsCount: 0,
        memoryDecayStatus: 'NOMINAL',
        entities: [],
        sessions: []
      });
      await zehn.save();
    }
    res.json(zehn);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/zehn/entities', async (req: Request, res: Response) => {
  try {
    const { entityId, name, category, scope, relationships } = req.body;
    if (!entityId || !name || !category || !scope || !relationships) {
      return res.status(400).json({ error: 'All entity fields are required' });
    }
    let zehn = await Zehn.findOne({});
    if (!zehn) zehn = new Zehn({});
    zehn.entities.push({ entityId, name, category, scope, relationships });
    zehn.indexedEntitiesCount = zehn.entities.length;
    zehn.lastSync = new Date();
    await zehn.save();
    res.json(zehn);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/zehn/sessions', async (req: Request, res: Response) => {
  try {
    const { sessionId, focus, fileLink, tokenWeight } = req.body;
    if (!sessionId || !focus || !fileLink || !tokenWeight) {
      return res.status(400).json({ error: 'All session fields are required' });
    }
    let zehn = await Zehn.findOne({});
    if (!zehn) zehn = new Zehn({});
    zehn.sessions.push({ sessionId, date: new Date(), focus, fileLink, tokenWeight });
    zehn.chronologicalSessionsCount = zehn.sessions.length;
    zehn.lastSync = new Date();
    await zehn.save();
    res.json(zehn);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Skills (Hunar) Routes ──────────────────────────────────────────────────
app.get('/api/skills', async (req: Request, res: Response) => {
  try {
    const list = await Hunar.find({}).sort({ skillId: 1 });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/skills', async (req: Request, res: Response) => {
  try {
    const { skillName, description, category, paramSpec, triggers } = req.body;
    if (!skillName || !description || !category || !paramSpec || !triggers) {
      return res.status(400).json({ error: 'All skill fields are required' });
    }
    const brainDir = path.join(__dirname, 'Brahma [Brain]');
    const result = ContextService.execCreateSkill(
      brainDir,
      skillName,
      description,
      category,
      paramSpec,
      triggers,
      () => {
        VectorService.indexAllBrainDocuments().catch(console.error);
      }
    );
    
    const newHunar = new Hunar({
      skillId: result.skillId,
      category,
      name: skillName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, ''),
      status: 'ACTIVE',
      description,
      fileLink: `file:///h:/Brahma/backend/Brahma%20%5BBrain%5D/skills/brahma/${result.fileName}`,
      createdOn: new Date(),
      lastModified: new Date()
    });
    await newHunar.save();
    
    res.status(201).json(newHunar);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Playground Chat Endpoint ───────────────────────────────────────────────
app.post('/api/playground/query', async (req: Request, res: Response) => {
  try {
    const { query, options } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });
    
    const ragResult = await ContextService.retrieveContext(query, options);
    
    // Process query using the Discord natural language command interpreter
    const answer = await DiscordService.handleUserCommand(query, 'playground-user', 'User', 'playground');
    
    res.json({
      answer,
      rag: ragResult
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cron Jobs Routes ───────────────────────────────────────────────────────
app.get('/api/cron', async (req: Request, res: Response) => {
  try {
    const { CronService } = await import('./services/cron.service');
    const jobs = await CronService.listJobs();
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cron', async (req: Request, res: Response) => {
  try {
    const { name, cronExpression, prompt } = req.body;
    if (!name || !cronExpression || !prompt) {
      return res.status(400).json({ error: 'name, cronExpression, and prompt are required' });
    }
    const { CronService } = await import('./services/cron.service');
    const newJob = await CronService.addJob(name, cronExpression, prompt);
    res.status(201).json(newJob);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cron/:jobId/toggle', async (req: Request, res: Response) => {
  try {
    const { CronService } = await import('./services/cron.service');
    const updatedJob = await CronService.toggleJob(req.params.jobId as string);
    res.json(updatedJob);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cron/:jobId', async (req: Request, res: Response) => {
  try {
    const { CronService } = await import('./services/cron.service');
    await CronService.deleteJob(req.params.jobId as string);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Bootstrap ─────────────────────────────────────────────────────────────
async function bootstrap() {
  console.log('⚙️ Bootstrapping Brahma Engine...');

  await DBService.connect();
  const { CronService } = await import('./services/cron.service');
  await CronService.init();

  try {
    await VectorService.indexAllBrainDocuments();
  } catch (err: any) {
    console.warn('⚠️ Vector indexing skipped or failed during startup:', err.message);
  }

  const discordStatus = await DiscordService.connect();
  if (discordStatus.mode === 'live') {
    console.log(`🤖 Live Discord Bot Integration is successfully connected as: ${discordStatus.guildName || 'Active'}`);
  } else {
    console.log('🤖 Discord Bot loaded in MOCK/SIMULATOR mode (token missing or disallowed intents).');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Brahma backend server is active at http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Critical bootstrap failure:', err);
  process.exit(1);
});
