import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { ISkill } from '../types/Skill';

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

export class ConvertDocumentToMarkdown implements ISkill {
    name = 'convert-document';
    description = 'Converts PDF, DOCX/DOC, XLSX/CSV document files into clean structured Markdown.';

    async execute(params: any): Promise<string> {
        const filePath = params.file_path || params.filePath;
        if (!filePath) {
            return 'Failed: No file path provided for document conversion.';
        }

        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        if (!fs.existsSync(absolutePath)) {
            return `Failed: File not found at path "${absolutePath}".`;
        }

        const ext = path.extname(absolutePath).toLowerCase();
        const fileName = path.basename(absolutePath);

        try {
            if (ext === '.pdf') {
                return await this.convertPdf(absolutePath, fileName);
            } else if (ext === '.docx' || ext === '.doc') {
                return await this.convertDocx(absolutePath, fileName);
            } else if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
                return await this.convertXlsx(absolutePath, fileName);
            } else if (ext === '.txt' || ext === '.md' || ext === '.json') {
                const text = fs.readFileSync(absolutePath, 'utf-8');
                return `# Document: ${fileName}\n\n\`\`\`\n${text}\n\`\`\``;
            } else {
                return `Failed: Unsupported file format "${ext}". Supported formats: PDF, DOCX, XLSX, XLS, CSV, TXT, MD.`;
            }
        } catch (err: any) {
            console.error('[ConvertDocumentToMarkdown] Conversion error:', err);
            return `Failed to convert document "${fileName}": ${err.message}`;
        }
    }

    private async convertPdf(filePath: string, fileName: string): Promise<string> {
        const dataBuffer = fs.readFileSync(filePath);
        
        let pdfText = '';
        let totalPages = 1;

        if (typeof pdfParse === 'function') {
            const data = await pdfParse(dataBuffer);
            pdfText = data.text;
            totalPages = data.numpages || 1;
        } else if (pdfParse && pdfParse.PDFParse) {
            const parser = new pdfParse.PDFParse({ data: dataBuffer });
            const data = await parser.getText();
            pdfText = data.text || '';
            totalPages = data.total || 1;
        } else {
            throw new Error('PDF parser engine could not be instantiated.');
        }

        const pagesText = pdfText
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0)
            .join('\n');

        return `# PDF Document: ${fileName}\n\n**Total Pages**: ${totalPages}\n\n---\n\n${pagesText}`;
    }

    private async convertDocx(filePath: string, fileName: string): Promise<string> {
        const result = await mammoth.convertToMarkdown({ path: filePath });
        return `# DOCX Document: ${fileName}\n\n---\n\n${result.value || 'Empty document.'}`;
    }

    private async convertXlsx(filePath: string, fileName: string): Promise<string> {
        const workbook = XLSX.readFile(filePath);
        const markdownSheets: string[] = [];

        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!jsonData || jsonData.length === 0) {
                markdownSheets.push(`## Sheet: ${sheetName}\n\n*Sheet is empty.*`);
                continue;
            }

            const headerRow = jsonData[0] || [];
            const headers = headerRow.map(h => (h !== undefined && h !== null ? String(h).trim() : ''));
            
            const divider = headers.map(() => '---');
            const rows = jsonData.slice(1).map(row => 
                `| ${headers.map((_, colIdx) => (row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]).replace(/\|/g, '\\|').trim() : '')).join(' | ')} |`
            );

            const tableMd = `| ${headers.join(' | ')} |\n| ${divider.join(' | ')} |\n${rows.join('\n')}`;
            markdownSheets.push(`## Sheet: ${sheetName}\n\n${tableMd}`);
        }

        return `# Spreadsheet Document: ${fileName}\n\n${markdownSheets.join('\n\n---\n\n')}`;
    }
}
