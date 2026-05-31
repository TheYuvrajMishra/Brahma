import * as dotenv from 'dotenv';
dotenv.config();

import * as readline from 'readline';
import { DBService } from '../services/db.service';
import { DiscordService } from '../services/discord.service';

async function main() {
  console.clear();
  console.log('============================================================');
  console.log('⚡ Brahma Discord Bot & Simulation Tool ⚡');
  console.log('============================================================');

  // 1. Connect to Database (Required for RAG/Missions)
  try {
    await DBService.connect();
  } catch (err: any) {
    console.error('⚠️ DB Connection failed. RAG & Orchestrator features might not work:', err.message);
  }

  // 2. Start Discord Service
  const botStatus = await DiscordService.connect();

  if (botStatus.mode === 'live') {
    console.log('\n🟢 Live Discord Bot is active and listening to events on the server!');
    console.log('Press Ctrl+C to stop the bot and exit.');
    // Keep process alive
    await new Promise(() => {});
  } else {
    // Start interactive simulation console
    console.log('\n💬 WELCOME TO THE BRAHMA DISCORD SIMULATOR CLI');
    console.log('=============================================');
    console.log('Type natural language commands to test the bot.');
    console.log('Example: "Create a text channel named dev-room"');
    console.log('Example: "Create a role named Moderation with color #ff0000"');
    console.log('Example: "Decompose mission: Build a website, Objective: Create a modern home page"');
    console.log('Example: "Query RAG: How do I handle complex coding missions?"');
    console.log("Type 'status' to print the mock server state.");
    console.log("Type 'exit' to quit.\n");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      rl.question('\x1b[36m[YOU]:\x1b[0m ', async (answer) => {
        const input = answer.trim();

        if (input.toLowerCase() === 'exit') {
          rl.close();
          await DBService.disconnect();
          process.exit(0);
        }

        if (input.toLowerCase() === 'status') {
          const state = DiscordService.getMockState();
          console.log('\n📊 \x1b[33m--- Mock Discord Server State ---\x1b[0m');
          console.log('\x1b[32mChannels:\x1b[0m', state.channels);
          console.log('\x1b[32mRoles:\x1b[0m', state.roles);
          console.log('\x1b[32mMembers:\x1b[0m', state.members);
          console.log('\x1b[32mSent Messages:\x1b[0m', state.messages);
          console.log('=================================\n');
          askQuestion();
          return;
        }

        if (!input) {
          askQuestion();
          return;
        }

        console.log('\x1b[2m🤖 Processing...\x1b[0m');
        try {
          const reply = await DiscordService.handleUserCommand(
            input,
            'sim-user-123',
            'SimulatedUser',
            'sim-channel'
          );
          console.log(`\n\x1b[35m[BOT 🤖]:\x1b[0m\n${reply}\n`);
        } catch (err: any) {
          console.log(`\n\x1b[31m[BOT 🤖 ERROR]:\x1b[0m ${err.message}\n`);
        }

        askQuestion();
      });
    };

    askQuestion();
  }
}

main().catch((err) => {
  console.error('Fatal error running Discord tool:', err);
  process.exit(1);
});
