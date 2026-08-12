import html2pdf from 'html2pdf.js';
import jsPDF from 'jspdf';

export const downloadAsMarkdown = (content: string, filename = 'response.md') => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const downloadAsTXT = (content: string, filename = 'response.txt') => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const downloadAsPDF = async (
    content: string,
    messageElement?: HTMLElement | null,
    filename = 'response.pdf'
) => {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '750px';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.color = '#111827';
    tempContainer.style.padding = '36px 40px';
    tempContainer.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.lineHeight = '1.6';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.borderBottom = '2px solid #e5e7eb';
    header.style.paddingBottom = '14px';
    header.style.marginBottom = '24px';

    const brand = document.createElement('div');
    brand.style.fontSize = '14px';
    brand.style.fontWeight = '700';
    brand.style.letterSpacing = '0.05em';
    brand.style.color = '#111827';
    brand.innerText = 'BRAHMA SYSTEM';

    const dateStr = document.createElement('div');
    dateStr.style.fontSize = '11px';
    dateStr.style.color = '#6b7280';
    dateStr.innerText = new Date().toLocaleString();

    header.appendChild(brand);
    header.appendChild(dateStr);
    tempContainer.appendChild(header);

    const bodyContent = document.createElement('div');
    bodyContent.className = 'pdf-markdown-body';

    if (messageElement) {
        const clone = messageElement.cloneNode(true) as HTMLElement;
        const buttons = clone.querySelectorAll('button');
        buttons.forEach(b => b.remove());

        bodyContent.appendChild(clone);
    } else {
        const p = document.createElement('pre');
        p.style.whiteSpace = 'pre-wrap';
        p.style.fontFamily = 'inherit';
        p.innerText = content;
        bodyContent.appendChild(p);
    }

    tempContainer.appendChild(bodyContent);

    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        .pdf-markdown-body { color: #1f2937 !important; }
        .pdf-markdown-body * { color: inherit !important; background-color: transparent !important; border-color: #e5e7eb !important; text-shadow: none !important; box-shadow: none !important; }
        .pdf-markdown-body h1 { font-size: 22px !important; font-weight: 800 !important; margin-top: 18px !important; margin-bottom: 10px !important; color: #111827 !important; border-bottom: 1px solid #e5e7eb !important; padding-bottom: 6px !important; }
        .pdf-markdown-body h2 { font-size: 18px !important; font-weight: 700 !important; margin-top: 16px !important; margin-bottom: 8px !important; color: #111827 !important; }
        .pdf-markdown-body h3 { font-size: 16px !important; font-weight: 600 !important; margin-top: 14px !important; margin-bottom: 6px !important; color: #111827 !important; }
        .pdf-markdown-body p { margin-bottom: 12px !important; color: #374151 !important; line-height: 1.65 !important; }
        .pdf-markdown-body ul, .pdf-markdown-body ol { margin-top: 6px !important; margin-bottom: 12px !important; padding-left: 24px !important; }
        .pdf-markdown-body li { margin-bottom: 4px !important; color: #374151 !important; }
        .pdf-markdown-body pre { background-color: #f3f4f6 !important; border: 1px solid #e5e7eb !important; border-radius: 6px !important; padding: 12px !important; margin: 12px 0 !important; font-family: monospace !important; font-size: 12px !important; white-space: pre-wrap !important; word-break: break-all !important; }
        .pdf-markdown-body code { background-color: #f3f4f6 !important; padding: 2px 5px !important; border-radius: 4px !important; font-family: monospace !important; font-size: 12px !important; color: #1f2937 !important; }
        .pdf-markdown-body table { width: 100% !important; border-collapse: collapse !important; margin: 12px 0 !important; }
        .pdf-markdown-body th, .pdf-markdown-body td { border: 1px solid #d1d5db !important; padding: 8px 12px !important; text-align: left !important; font-size: 12px !important; }
        .pdf-markdown-body th { background-color: #f9fafb !important; font-weight: 600 !important; color: #111827 !important; }
        .pdf-markdown-body blockquote { border-left: 4px solid #9ca3af !important; padding-left: 12px !important; margin: 12px 0 !important; color: #4b5563 !important; font-style: italic !important; }
    `;
    tempContainer.appendChild(styleEl);

    document.body.appendChild(tempContainer);

    try {
        const opt = {
            margin: [12, 12, 12, 12] as [number, number, number, number],
            filename: filename,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const html2pdfFn = typeof html2pdf === 'function' ? html2pdf : (html2pdf as unknown as { default: typeof html2pdf }).default;
        if (typeof html2pdfFn === 'function') {
            await html2pdfFn().set(opt).from(tempContainer).save();
        } else {
            const doc = new jsPDF();
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(content, 180);
            doc.text(lines, 15, 15);
            doc.save(filename);
        }
    } catch (err) {
        console.error('PDF export error, falling back to jsPDF text output:', err);
        const doc = new jsPDF();
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(content, 180);
        doc.text(lines, 15, 15);
        doc.save(filename);
    } finally {
        if (document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer);
        }
    }
};
