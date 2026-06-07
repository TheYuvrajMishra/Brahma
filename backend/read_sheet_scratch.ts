import dotenv from 'dotenv';
dotenv.config();

import { ReadSpreadsheet } from './src/skills/GoogleSheets';

async function main() {
    const readSkill = new ReadSpreadsheet();
    try {
        const result = await readSkill.execute({
            spreadsheetId: '1prEGiZkT-BD2KhEEU_ECMlYkT8KLEfhbXvkr0cYz-7E',
            range: 'Sheet1!A1:C50'
        });
        console.log(result);
    } catch (err) {
        console.error('Error reading sheet:', err);
    }
}

main();
