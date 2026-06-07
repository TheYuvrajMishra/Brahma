import dotenv from 'dotenv';
dotenv.config();

import { ReadSpreadsheet, WriteSpreadsheet, AddCheckboxes } from './src/skills/GoogleSheets';
import { LLMService } from './src/services/LLMService';

async function main() {
    const spreadsheetId = '1prEGiZkT-BD2KhEEU_ECMlYkT8KLEfhbXvkr0cYz-7E';
    const readSkill = new ReadSpreadsheet();
    const writeSkill = new WriteSpreadsheet();
    const addCheckboxesSkill = new AddCheckboxes();

    try {
        console.log('Reading spreadsheet...');
        const readOutput = await readSkill.execute({
            spreadsheetId,
            range: 'Sheet1!A1:C50'
        });
        console.log('Current Sheet Data:\n', readOutput);

        const systemPrompt = `
You are a spreadsheet routine editor.
You will be given a list of rows from a spreadsheet containing a daily routine.
Your job is to parse the routine and adjust the timings logically so that "Dinner" is moved to 9:30 PM (e.g. 9:30 - 10:30 PM).
Ensure that the other tasks around it (like evening leisure, wind-down, etc.) are shifted or adjusted in duration/time range so that the daily schedule remains continuous with no overlaps or gaps.
Maintain the exact same 3 columns for each row: [Time, Task, Done] (where the third column is always empty string "").
Do not change the tasks themselves, only their time ranges.
Output ONLY a raw JSON array of arrays representing the new sheet rows, including the header row ["Time", "Task", "Done"]. No markdown blocks, no text.
`.trim();

        console.log('Calling LLM to adjust timings...');
        const llmResponse = await LLMService.chat(systemPrompt, readOutput, true);
        
        let cleanResponse = llmResponse.trim();
        if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/^```[a-zA-Z0-9]*\n/, '').replace(/\n```$/, '').trim();
        }
        
        console.log('Parsed LLM response:\n', cleanResponse);
        const newRows = JSON.parse(cleanResponse);

        console.log('Writing updated rows back to spreadsheet...');
        const writeResult = await writeSkill.execute({
            spreadsheetId,
            range: `Sheet1!A1:C${newRows.length}`,
            values: newRows
        });
        console.log('Write Result:', writeResult);

        console.log('Re-applying checkboxes on column C...');
        const checkboxResult = await addCheckboxesSkill.execute({
            spreadsheetId,
            range: `Sheet1!C2:C${newRows.length}`
        });
        console.log('Checkbox Result:', checkboxResult);

        console.log('Spreadsheet successfully updated!');
    } catch (err) {
        console.error('Execution failed:', err);
    }
}

main();
