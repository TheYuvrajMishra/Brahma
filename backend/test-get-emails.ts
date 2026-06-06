import { GetEmails } from './src/skills/GetEmails';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    const skill = new GetEmails();
    const result = await skill.execute({
        max_results: 3
    });
    console.log('--- TEST RESULTS ---');
    console.log(result);
}
run();
