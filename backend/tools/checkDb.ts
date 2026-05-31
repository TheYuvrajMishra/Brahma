import * as dotenv from 'dotenv';
dotenv.config();

import { DBService } from '../services/db.service';
import { VectorService } from '../services/vector.service';
import VectorChunk from '../models/VectorStore';

async function check() {
  await DBService.connect();
  console.log('🔌 Connected to MongoDB.');

  // Force a manual indexing pass of all Brahma Brain files from disk
  const indexStats = await VectorService.indexAllBrainDocuments();
  console.log('📊 Indexing stats:', indexStats);

  const count = await VectorChunk.countDocuments();
  console.log(`📈 Current VectorStore chunk count: ${count}`);

  await DBService.disconnect();
}

check().catch(console.error);
