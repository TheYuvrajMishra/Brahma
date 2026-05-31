# Brahma Setup & Getting Started Guide

```yaml
id: SETUP_GUIDE
version: 1.0.0
last_sync: 2026-05-31T13:44:41+05:30
agent_permission: READ-ONLY
description: "Step-by-step setup, environment configuration, bootstrap instructions, and quick-start usage examples."
```

---

## Prerequisites

| Dependency | Version | Purpose |
| :--- | :---: | :--- |
| Node.js | ≥ 18.x | Runtime |
| MongoDB | ≥ 6.x | Database |
| TypeScript | ≥ 5.x | Language |
| A running LLM endpoint | any | Chat completions (OpenAI-compatible) |

---

## 1. Environment Configuration (`.env`)

All service behaviour is driven by environment variables. Edit `h:\Brahma\backend\.env`:

```env
# ── Database ─────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/brahma

# ── LLM API (any OpenAI-compatible endpoint) ─────────────────
LLM_API_URL=http://localhost:3001/v1/chat/completions
LLM_API_KEY=your-api-key-here
LLM_MODEL=gemini-2.5-flash-lite

# ── Embeddings ────────────────────────────────────────────────
# Leave unset to use the local all-MiniLM-L6-v2 fallback
EMBEDDING_MODEL=text-embedding-ada-002

# ── Server ───────────────────────────────────────────────────
PORT=3000
NODE_ENV=development
```

> [!TIP]
> If your LLM provider does not support `/v1/embeddings`, simply leave `EMBEDDING_MODEL` unset. The system will automatically use the local `all-MiniLM-L6-v2` model (384-dim, downloaded once on first use, ~90MB).

---

## 2. Install Dependencies

```bash
cd h:\Brahma\backend
npm install
```

---

## 3. Bootstrap on First Run

Before any agents can use the RAG pipeline, the VectorStore must be seeded with Brahma Brain documents.

Add this to your startup logic in `backend/index.ts`:

```typescript
import { DBService } from './services/db.service';
import { VectorService } from './services/vector.service';

async function bootstrap() {
  // 1. Connect to MongoDB
  await DBService.connect();

  // 2. Seed the VectorStore from Zehn entities + sessions
  //    Safe to call on every startup — skips unchanged content automatically
  await VectorService.indexAllBrainDocuments();

  console.log('🚀 Brahma is ready.');
}

bootstrap().catch(console.error);
```

---

## 4. Quick-Start Usage Examples

### A. Simple Goal Decomposition
```typescript
import { OrchestratorService } from './services/orchestrator.service';

const mission = await OrchestratorService.decomposeMission(
  'Build a REST API for user authentication',
  'Implement JWT-based auth with login, register, refresh, and logout endpoints.',
  ['E-001', 'E-004'],   // Optional: entity IDs to inject as context
  ['C-001']             // Optional: session IDs to inject as history
);

console.log(mission.missionId);       // "M-048231"
console.log(mission.subTasks.length); // e.g., 5 tasks
```

### B. RAG-Powered Context Retrieval
```typescript
import { ContextService } from './services/context.service';

// Full 8-stage RAG pipeline — returns compressed, diverse context
const result = await ContextService.retrieveContext(
  'What strategy should I use for a complex data pipeline mission?',
  { finalTopK: 5, maxTokenBudget: 1200 }
);

console.log(result.contextBlock);   // Inject into system prompt
console.log(result.sources);        // Source attribution
console.log(result.tokenEstimate);  // e.g., 1104
```

### C. Execute & Complete Tasks
```typescript
import { OrchestratorService } from './services/orchestrator.service';

// Promote next pending sub-task to IN_PROGRESS
const task = await OrchestratorService.executeNextTask('M-048231');

if (task) {
  console.log(`Running: ${task.subTaskId} — ${task.title}`);
  // ... do work ...

  // Mark as done, recalculates mission progress automatically
  await OrchestratorService.completeTask('M-048231', task.subTaskId);
}
```

### D. Index a Custom Document for RAG
```typescript
import { VectorService } from './services/vector.service';

// Add any document chunk to the RAG retrieval pool
await VectorService.upsertChunk({
  docId: 'custom-001',
  docType: 'generic',
  content: 'Brahma uses MongoDB Atlas for cloud deployments with replica sets...',
  metadata: { source: 'architecture-notes', author: 'system' }
});
```

### E. Standalone Embedding
```typescript
import { EmbeddingService } from './services/embedding.service';

const vector = await EmbeddingService.embed('What is the Dharma engine?');
console.log(vector.length); // 384 (MiniLM) or 1536 (text-embedding-ada-002)

// Batch (more efficient — one API call)
const vectors = await EmbeddingService.embedBatch([
  'Mission planning strategies',
  'How Karma logs actions',
  'Zehn entity indexing'
]);
```

---

## 5. Documentation Index

| Document | Description |
| :--- | :--- |
| [Brahma_Workflow.md](./Brahma_Workflow.md) | Core architecture loop, RAG pipeline overview, token strategy |
| [Brahma_Services_API.md](./Brahma_Services_API.md) | Method signatures and parameters for all services |
| [Brahma_DB_Schema.md](./Brahma_DB_Schema.md) | MongoDB collection schemas, field types, indexes |
| [Brahma_Setup.md](./Brahma_Setup.md) | This file — setup, bootstrap, and usage examples |
