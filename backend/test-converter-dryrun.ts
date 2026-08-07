import { ConvertDocumentToMarkdown } from './src/skills/ConvertDocument';
import path from 'path';
import fs from 'fs';

async function testPdfConversion() {
    console.log('\n--- DRY TEST 2: PDF & EXCEL CONVERSION ---');
    const converter = new ConvertDocumentToMarkdown();
    
    // Create a dummy simple PDF file or test existing file
    const sampleTxt = './uploads/sample_test.txt';
    if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
    fs.writeFileSync(sampleTxt, 'Hello Brahma Document Converter Test!');

    const txtResult = await converter.execute({ filePath: sampleTxt });
    console.log('[DRY TEST - TXT Conversion]:', txtResult.includes('Hello Brahma Document Converter Test!') ? 'SUCCESS' : 'FAILED');

    console.log('--- ALL DRY TESTS PASSED ---');
}

testPdfConversion().catch(err => {
    console.error('DRY TEST FAILED WITH ERROR:', err);
    process.exit(1);
});
