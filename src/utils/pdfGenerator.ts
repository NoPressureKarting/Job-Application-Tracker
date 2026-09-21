import { jsPDF } from 'jspdf';

export interface ResumePdfOptions {
  title?: string;
  company?: string;
  role?: string;
}

/**
 * Parses markdown/plain-text resume into clean ATS-formatted vector PDF.
 * Uses pure text rendering (not bitmap screenshot) so ATS parsers & recruiters
 * can read, copy, and search the text cleanly.
 */
export function generateResumePdf(
  rawContent: string,
  fileName: string = 'Resume.pdf',
  options?: ResumePdfOptions
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter', // 612 x 792 pt
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginLeft = 45;
  const marginRight = 45;
  const marginTop = 45;
  const marginBottom = 45;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let cursorY = marginTop;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      cursorY = marginTop;
    }
  };

  // Pre-process lines
  const lines = rawContent.split('\n');

  // Regex helpers
  const heading1Regex = /^#\s+(.+)$/;
  const heading2Regex = /^##\s+(.+)$/;
  const heading3Regex = /^###\s+(.+)$/;
  const bulletRegex = /^[-*•]\s+(.+)$/;
  const subBulletRegex = /^\s+[-*•]\s+(.+)$/;
  const dividerRegex = /^[-*_]{3,}$/;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trimEnd();
    const line = rawLine.trim();

    if (!line) {
      cursorY += 6;
      continue;
    }

    // Markdown Horizontal Rule / Divider
    if (dividerRegex.test(line)) {
      checkPageBreak(12);
      doc.setDrawColor(200, 205, 215);
      doc.setLineWidth(0.75);
      doc.line(marginLeft, cursorY + 3, pageWidth - marginRight, cursorY + 3);
      cursorY += 12;
      continue;
    }

    // Main Header (e.g. Candidate Name) -> # Name
    const h1Match = line.match(heading1Regex);
    if (h1Match) {
      const text = cleanInlineMarkdown(h1Match[1]);
      checkPageBreak(32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(24, 30, 42); // deep slate/navy

      // Center candidate name if on first page near top
      if (cursorY < marginTop + 60) {
        doc.text(text, pageWidth / 2, cursorY + 16, { align: 'center' });
      } else {
        doc.text(text, marginLeft, cursorY + 16);
      }

      cursorY += 26;
      continue;
    }

    // Section Header -> ## WORK EXPERIENCE, ## EDUCATION, etc.
    const h2Match = line.match(heading2Regex);
    if (h2Match) {
      const text = cleanInlineMarkdown(h2Match[1]).toUpperCase();
      checkPageBreak(28);
      cursorY += 6; // Section spacing

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(37, 47, 63); // crisp dark header
      doc.text(text, marginLeft, cursorY + 10);

      // Section underline bar
      doc.setDrawColor(79, 70, 229); // indigo accent line
      doc.setLineWidth(1.2);
      doc.line(marginLeft, cursorY + 14, pageWidth - marginRight, cursorY + 14);

      cursorY += 22;
      continue;
    }

    // Subheader -> ### Job Title | Company | Dates
    const h3Match = line.match(heading3Regex);
    if (h3Match) {
      const text = cleanInlineMarkdown(h3Match[1]);
      checkPageBreak(20);

      // Split title and right-aligned date if contains pipe or tab
      if (text.includes('|')) {
        const parts = text.split('|').map((p) => p.trim());
        const leftPart = parts.slice(0, -1).join('  |  ');
        const rightPart = parts[parts.length - 1];

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(30, 41, 59);
        doc.text(leftPart, marginLeft, cursorY + 9);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        doc.text(rightPart, pageWidth - marginRight, cursorY + 9, {
          align: 'right',
        });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(30, 41, 59);
        doc.text(text, marginLeft, cursorY + 9);
      }

      cursorY += 16;
      continue;
    }

    // Bullet Point -> - Bullet text
    const bulletMatch = rawLine.match(bulletRegex);
    if (bulletMatch) {
      const bulletContent = cleanInlineMarkdown(bulletMatch[1]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      const bulletIndent = 12;
      const textWidth = contentWidth - bulletIndent;
      const wrappedLines = doc.splitTextToSize(bulletContent, textWidth);

      const neededHeight = wrappedLines.length * 13 + 3;
      checkPageBreak(neededHeight);

      // Render bullet symbol
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229); // subtle colored bullet
      doc.text('•', marginLeft + 2, cursorY + 8.5);

      // Render wrapped bullet text
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(wrappedLines, marginLeft + bulletIndent, cursorY + 8.5, {
        lineHeightFactor: 1.35,
      });

      cursorY += wrappedLines.length * 13 + 3;
      continue;
    }

    // Sub-bullet point (indented)
    const subBulletMatch = rawLine.match(subBulletRegex);
    if (subBulletMatch) {
      const bulletContent = cleanInlineMarkdown(subBulletMatch[1]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      const bulletIndent = 24;
      const textWidth = contentWidth - bulletIndent;
      const wrappedLines = doc.splitTextToSize(bulletContent, textWidth);

      const neededHeight = wrappedLines.length * 12 + 2;
      checkPageBreak(neededHeight);

      doc.text('◦', marginLeft + 12, cursorY + 8);
      doc.text(wrappedLines, marginLeft + bulletIndent, cursorY + 8, {
        lineHeightFactor: 1.35,
      });

      cursorY += wrappedLines.length * 12 + 2;
      continue;
    }

    // Regular Paragraph / Contact line / Skills line
    const cleanLine = cleanInlineMarkdown(line);
    const isContactHeader =
      cursorY < marginTop + 80 &&
      (cleanLine.includes('@') ||
        cleanLine.includes('|') ||
        cleanLine.includes('linkedin.com') ||
        cleanLine.includes('github.com') ||
        /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(cleanLine));

    if (isContactHeader) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      checkPageBreak(14);
      doc.text(cleanLine, pageWidth / 2, cursorY + 8, { align: 'center' });
      cursorY += 14;
      continue;
    }

    // Check if line is bold label like "Skills:" or "Certifications:"
    const isKeyVal = /^\*\*[^*]+:\*\*/.test(line);

    if (isKeyVal) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
    }
    doc.setFontSize(9.5);

    const wrapped = doc.splitTextToSize(cleanLine, contentWidth);
    const lineBlockHeight = wrapped.length * 13 + 3;
    checkPageBreak(lineBlockHeight);

    doc.text(wrapped, marginLeft, cursorY + 8.5, { lineHeightFactor: 1.35 });
    cursorY += lineBlockHeight;
  }

  // Ensure safe file name
  const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  doc.save(safeName);
}

/**
 * Strips markdown inline asterisks, bolding, italics, brackets while preserving text.
 */
function cleanInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // **bold**
    .replace(/\*(.*?)\*/g, '$1')     // *italic*
    .replace(/__(.*?)__/g, '$1')     // __bold__
    .replace(/_(.*?)_/g, '$1')       // _italic_
    .replace(/`([^`]+)`/g, '$1')     // `code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link text](url)
    .trim();
}
