import { SendEmail } from './src/skills/SendEmail';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    const skill = new SendEmail();
    const result = await skill.execute({
        recipient: 'yuvraj17mishra11@gmail.com',
        subject: 'Test Email',
        body: 'This is a test email.'
    });
    console.log(result);
}
run();
