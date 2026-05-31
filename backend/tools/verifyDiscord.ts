import * as dotenv from 'dotenv';
dotenv.config();

import { DBService } from '../services/db.service';
import { DiscordService } from '../services/discord.service';

async function verify() {
  console.log('🧪 Starting Brahma Discord Bot Programmatic Verification...');

  // 1. Connect to Database
  await DBService.connect();
  console.log('✅ DB Connected.');

  // 2. Initialize Discord Service in Mock Mode
  const status = await DiscordService.connect();
  console.log(`🤖 Discord Bot initialized. Mode: ${status.mode}`);

  const testCases = [
    'Create a text channel named server-announcements with topic Important Updates',
    'Create a role named VIP with color #ffcc00',
    'Query RAG: How do I handle complex coding missions?',
    'Decompose mission: Discord Bot Verification, Objective: Run automated programmatic checks to verify bot works perfectly',
  ];

  for (const prompt of testCases) {
    console.log('\n------------------------------------------------------------');
    console.log(`💬 User Request: "${prompt}"`);
    console.log('🤖 Processing...');
    try {
      const response = await DiscordService.handleUserCommand(
        prompt,
        'test-user-999',
        'Tester',
        'test-channel'
      );
      console.log(`[BOT RESPONSE]:\n${response}`);
    } catch (err: any) {
      console.error(`[BOT ERROR]: ${err.message}`);
    }
  }

  // 3. Print Final Server State
  const state = DiscordService.getMockState();
  console.log('\n============================================================');
  console.log('📊 FINAL MOCK SERVER STATE');
  console.log('============================================================');
  console.log('Channels:', state.channels);
  console.log('Roles:', state.roles);
  console.log('Messages:', state.messages);
  console.log('============================================================');

  await DBService.disconnect();
  console.log('🏁 Verification Complete.');
}

verify().catch(console.error);
