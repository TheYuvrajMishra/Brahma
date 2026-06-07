import mongoose from 'mongoose';
import { ChatSession } from './src/models/ChatSession';
import { SessionContext } from './src/models/SessionContext';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/brahma';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const targetSessionId = 'session_1780822545524_8075';
    const s = await ChatSession.findOne({ sessionId: targetSessionId });
    if (s) {
        console.log('--- RECENT CHAT MESSAGES ---');
        s.messages.slice(-6).forEach((msg, idx) => {
            console.log(`${idx + 1}. [${msg.role}] ${msg.content}`);
        });
        console.log('-----------------------------');
    } else {
        console.log('Session not found');
    }

    const c = await SessionContext.findOne({ channelId: targetSessionId });
    if (c) {
        console.log('--- SESSION CONTEXT (MOMENT) ---');
        console.log(c.momentMarkdown);
        console.log('-----------------------------');
    } else {
        console.log('Session context not found');
    }

    await mongoose.disconnect();
}

run().catch(console.error);
