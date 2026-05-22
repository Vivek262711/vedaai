import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { IGeneratedPaper } from '../models/GeneratedPaper';
import type { IAssignment } from '../models/Assignment';

function generateHTML(paper: IGeneratedPaper, assignment: IAssignment): string {
  const sectionsHTML = paper.sections.map((section, sIdx) => `
    <div class="section">
      <h2>${section.title}</h2>
      <p class="section-instruction">${section.instruction}</p>
      <div class="questions">
        ${section.questions.map((q, qIdx) => `
          <div class="question">
            <div class="q-header">
              <span class="q-number">Q${qIdx + 1}.</span>
              <span class="q-text">${q.question}</span>
              <span class="q-marks">[${q.marks} marks]</span>
            </div>
            ${q.options && q.options.length > 0 ? `
              <div class="options">
                ${q.options.map((opt, oIdx) => `
                  <div class="option">${String.fromCharCode(97 + oIdx)}) ${opt}</div>
                `).join('')}
              </div>
            ` : ''}
            <div class="q-meta">
              <span class="difficulty ${q.difficulty}">${q.difficulty}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; padding: 40px 50px; line-height: 1.6; }
    .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; margin-bottom: 4px; }
    .header .meta { font-size: 13px; color: #555; display: flex; justify-content: center; gap: 24px; margin-top: 8px; }
    .student-info { border: 1px solid #ccc; padding: 12px 16px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .student-info .field { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .student-info .line { flex: 1; border-bottom: 1px dotted #999; min-width: 80px; }
    .instructions { background: #f9f9f9; padding: 12px 16px; margin-bottom: 24px; border-left: 3px solid #333; font-size: 13px; }
    .instructions strong { font-size: 13px; }
    .section { margin-bottom: 28px; page-break-inside: avoid; }
    .section h2 { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 8px; }
    .section-instruction { font-style: italic; font-size: 12px; color: #666; margin-bottom: 12px; }
    .question { margin-bottom: 16px; padding-left: 4px; }
    .q-header { display: flex; gap: 8px; align-items: flex-start; }
    .q-number { font-weight: bold; min-width: 32px; font-size: 14px; }
    .q-text { flex: 1; font-size: 14px; }
    .q-marks { font-size: 12px; color: #666; white-space: nowrap; }
    .options { padding-left: 40px; margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .option { font-size: 13px; }
    .q-meta { padding-left: 40px; margin-top: 4px; }
    .difficulty { font-size: 10px; padding: 1px 8px; border-radius: 4px; text-transform: uppercase; font-weight: 600; }
    .easy { background: #d4edda; color: #155724; }
    .medium { background: #fff3cd; color: #856404; }
    .hard { background: #f8d7da; color: #721c24; }
    @media print { body { padding: 20px 30px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${paper.title}</h1>
    ${assignment.subject ? `<p>Subject: ${assignment.subject}</p>` : ''}
    <div class="meta">
      <span>Total Marks: ${paper.totalMarks}</span>
      ${paper.duration ? `<span>Duration: ${paper.duration}</span>` : ''}
    </div>
  </div>
  <div class="student-info">
    <div class="field"><span>Name:</span><div class="line"></div></div>
    <div class="field"><span>Roll No:</span><div class="line"></div></div>
    <div class="field"><span>Section:</span><div class="line"></div></div>
  </div>
  ${paper.instructions ? `<div class="instructions"><strong>General Instructions:</strong> ${paper.instructions}</div>` : ''}
  ${sectionsHTML}
</body>
</html>`;
}

export async function generatePDF(paper: IGeneratedPaper, assignment: IAssignment): Promise<Buffer> {
  const html = generateHTML(paper, assignment);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    ...(env.NODE_ENV === 'production' && process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {}),
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });

    // Save a copy to storage
    const fileName = `paper-${paper._id}-${Date.now()}.pdf`;
    const filePath = path.resolve(env.PDF_STORAGE_PATH, fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, pdfBuffer);

    logger.info(`PDF generated: ${filePath}`);
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
