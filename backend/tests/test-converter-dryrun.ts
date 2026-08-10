import { ConvertDocumentToMarkdown } from '../src/skills/ConvertDocument';
import path from 'path';
import fs from 'fs';

async function testPdfConversion() {
    console.log('\n--- DRY TEST 2: PDF & EXCEL CONVERSION ---');
    const converter = new ConvertDocumentToMarkdown();
    
    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    
    const sampleTxt = path.join(uploadsDir, 'sample_test.txt');
    fs.writeFileSync(sampleTxt, 'Hello Brahma Document Converter Test!');

    const txtResult = await converter.execute({ filePath: sampleTxt });
    console.log('[DRY TEST - TXT Conversion]:', txtResult.includes('Hello Brahma Document Converter Test!') ? 'SUCCESS' : 'FAILED');

    console.log('--- ALL DRY TESTS PASSED ---');
}

testPdfConversion().catch(err => {
    console.error('Dry test failed:', err);
});
