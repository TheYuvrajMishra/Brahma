import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, 'backend/.env') });
import { SendEmail } from './backend/src/skills/SendEmail';
async function test() {
    const sender = new SendEmail();
    console.log('Sending test email...');
    const result = await sender.execute({
        recipient: 'yuvraj17mishra11@gmail.com',
        subject: 'Dry Test from Script',
        body: 'This is a dry test script.'
    });
    console.log('Result:', result);
}
test();
