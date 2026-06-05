import dotenv from 'dotenv';
import path from 'path';
dotenv.config(); // Automatically picks up h:\Brahma\backend\.env since it's run from there

import { SendEmail } from './src/skills/SendEmail';

async function test() {
    console.log('--- Dry Test: SendEmail Skill ---');
    try {
        const sender = new SendEmail();
        console.log('Executing skill...');
        const result = await sender.execute({
            recipient: 'yuvrajmishra594@gmail.com',
            subject: 'Direct Dry Test',
            body: 'This is a test from the isolated dry run script.'
        });
        console.log('Result:', result);
        console.log('Exiting...');
        process.exit(0);
    } catch (err) {
        console.error('Execution Error:', err);
        process.exit(1);
    }
}

test();
