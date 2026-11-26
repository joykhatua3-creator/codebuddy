import { jsPDF } from 'jspdf';
import { formatDate, getLanguageLabel } from './helpers.js';

/**
 * Normalize Unicode symbols that built-in PDF Helvetica/Courier WinAnsi fonts cannot render cleanly.
 */
const toPdfText = (value) => {
  const normalized = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[→➔➜]/g, '->')
    .replace(/[←]/g, '<-')
    .replace(/[↔]/g, '<->')
    .replace(/[•●◦]/g, '-')
    .replace(/[—–]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...');
  return [...normalized]
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code === 9 || code === 10 || (code >= 32 && code <= 126) || (code >= 160 && code <= 255);
    })
    .join('');
};

const buildSafeFileName = (title, language) => {
  const base = (title || `${getLanguageLabel(language)}-study-notes`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'codebuddy'}-study-notes.pdf`;
};

/**
 * Derive unified 6-section study notes data from either v3 Gemini reviews or legacy v2 reviews.
 */
export const normalizeReviewSections = (review) => {
  const rawErrors = Array.isArray(review?.errors) && review.errors.length > 0
    ? review.errors
    : Array.isArray(review?.codeErrors) && review.codeErrors.length > 0
      ? review.codeErrors
      : (review?.bugs || []).map((b) => ({
          line: b.lineNumber ?? 0,
          severity: /warning|loose equality|var declaration/i.test(String(b.title || '')) ? 'WARNING' : 'ERROR',
          title: b.title || 'Code Issue',
          explanation: b.whyItHappens || b.description || b.hint || '',
          fix: b.solution || b.hint || '',
        }));

  const howItWorks = Array.isArray(review?.howItWorks) && review.howItWorks.length > 0
    ? review.howItWorks
    : review?.summary
      ? [review.summary]
      : ['Code execution flow analyzed cleanly from top to bottom.'];

  const complexity = {
    time: review?.complexity?.time || 'O(1)',
    timeReason:
      review?.complexity?.timeReason ||
      review?.complexity?.explanation ||
      'Estimated from loops, recursion depth, and data operations.',
    space: review?.complexity?.space || 'O(1)',
    spaceReason:
      review?.complexity?.spaceReason ||
      review?.complexity?.explanation ||
      'Estimated from memory allocations and call stack usage.',
  };

  const callGraph = Array.isArray(review?.callGraph) ? review.callGraph : [];
  const functionBreakdown = Array.isArray(review?.functionBreakdown) ? review.functionBreakdown : [];

  const isGemini =
    review?.analysisEngine === 'GEMINI_AI' ||
    (!review?.isFallback && review?.analysisEngine !== 'STATIC_FALLBACK');

  return {
    errors: rawErrors,
    howItWorks,
    complexity,
    callGraph,
    functionBreakdown,
    isGemini,
  };
};

/**
 * Generate and download well-formatted, printable Study Notes PDF for any code review.
 */
export const downloadStudyNotesPdf = (review) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 44;
  const maxWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 54;
  let y = 46;

  const { errors, howItWorks, complexity, callGraph, functionBreakdown, isGemini } =
    normalizeReviewSections(review);

  const ensureSpace = (neededHeight = 24) => {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      y = 48;
    }
  };

  const writeSectionHeading = (numLabel, title) => {
    ensureSpace(44);
    y += 8;
    doc.setFillColor(239, 246, 255); // soft indigo/blue header bar
    doc.roundedRect(marginX, y, maxWidth, 24, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text(toPdfText(`${numLabel}  ${title}`), marginX + 10, y + 16);
    y += 34;
  };

  const writeWrappedParagraph = (text, { font = 'helvetica', style = 'normal', size = 10, color = [30, 41, 59], indent = 0, lineHeight = 14 } = {}) => {
    const clean = toPdfText(text).trim();
    if (!clean) return;
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(clean, maxWidth - indent);
    for (const line of wrapped) {
      ensureSpace(lineHeight + 4);
      doc.text(line, marginX + indent, y);
      y += lineHeight;
    }
  };

  const writeCodeBlock = (codeText, { maxLines = 120, lineNumbers = true, label = '' } = {}) => {
    if (!codeText || !String(codeText).trim()) return;
    if (label) {
      writeWrappedParagraph(label, { style: 'bold', size: 9, color: [71, 85, 105] });
      y += 2;
    }
    const rawLines = toPdfText(codeText).split('\n').slice(0, maxLines);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    const lineHeight = 11.5;

    for (let i = 0; i < rawLines.length; i++) {
      const prefix = lineNumbers ? `${String(i + 1).padStart(3, ' ')} | ` : '';
      const wrapped = doc.splitTextToSize(`${prefix}${rawLines[i]}`, maxWidth - 16);
      for (const wLine of wrapped) {
        ensureSpace(lineHeight + 6);
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y - 9, maxWidth, lineHeight + 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, y - 9, marginX, y + 3);
        doc.line(marginX + maxWidth, y - 9, marginX + maxWidth, y + 3);
        doc.setTextColor(15, 23, 42);
        doc.text(wLine, marginX + 8, y);
        y += lineHeight;
      }
    }
    y += 8;
  };

  // ── Header Banner ────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, y, maxWidth, 74, 6, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  const titleStr = toPdfText(review?.title || 'Code Review Study Notes').slice(0, 68);
  doc.text(titleStr, marginX + 14, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  const metaLine = toPdfText(
    `Language: ${getLanguageLabel(review?.language)}   |   Date: ${formatDate(review?.createdAt)}   |   Score: ${review?.score ?? 0}/100   |   Engine: ${isGemini ? 'Google Gemini AI' : 'Static Syntax Analyzer'}`
  );
  doc.text(metaLine, marginX + 14, y + 48);

  y += 88;

  if (review?.summary) {
    writeWrappedParagraph(`Summary: ${review.summary}`, { size: 10.5, style: 'bold', color: [30, 41, 59] });
    y += 8;
  }

  // ── Submitted Code ───────────────────────────────────────────────────────────
  writeSectionHeading('CODE', 'Submitted Code');
  writeCodeBlock(review?.code || '', { lineNumbers: true });

  // ── Section 1: Errors & Fixes ────────────────────────────────────────────────
  writeSectionHeading('01', `Errors & Bugs Found (${errors.length})`);
  if (errors.length === 0) {
    writeWrappedParagraph('No syntax or logic errors found! Great job.', {
      style: 'bold',
      color: [21, 128, 61],
      indent: 6,
    });
    y += 6;
  } else {
    errors.forEach((err, idx) => {
      ensureSpace(46);
      const isWarn = err.severity === 'WARNING';
      const color = isWarn ? [180, 83, 9] : [185, 28, 28];
      const lineTag = err.line > 0 ? `Line ${err.line} - ` : '';
      writeWrappedParagraph(
        `${idx + 1}. [${err.severity}] ${lineTag}${err.title}`,
        { style: 'bold', size: 10.5, color, indent: 4 }
      );
      writeWrappedParagraph(`Why: ${err.explanation}`, { size: 9.5, indent: 14 });
      if (err.fix) {
        writeWrappedParagraph('Fix:', { style: 'bold', size: 9.5, color: [21, 128, 61], indent: 14 });
        writeCodeBlock(err.fix, { lineNumbers: false, maxLines: 12 });
      }
      y += 4;
    });
  }

  // ── Section 2: How This Code Works (Step-by-Step) ────────────────────────────
  writeSectionHeading('02', 'How This Code Works (Step-by-Step)');
  howItWorks.forEach((step, idx) => {
    writeWrappedParagraph(`Step ${idx + 1}: ${step}`, { size: 10, indent: 6, lineHeight: 14 });
    y += 3;
  });
  y += 4;

  // ── Section 3: Time & Space Complexity ───────────────────────────────────────
  writeSectionHeading('03', 'Time & Space Complexity');
  writeWrappedParagraph(`Time Complexity: ${complexity.time}`, { style: 'bold', size: 10.5, indent: 6 });
  writeWrappedParagraph(`Why: ${complexity.timeReason}`, { size: 9.5, indent: 16 });
  y += 4;
  writeWrappedParagraph(`Space Complexity: ${complexity.space}`, { style: 'bold', size: 10.5, indent: 6 });
  writeWrappedParagraph(`Why: ${complexity.spaceReason}`, { size: 9.5, indent: 16 });
  y += 6;

  // ── Section 4: Method / Function Call Flow ───────────────────────────────────
  writeSectionHeading('04', 'Method / Function Call Flow');
  if (callGraph.length === 0) {
    writeWrappedParagraph('Single-block script or standalone functions - no nested function calls detected.', {
      size: 9.5,
      color: [100, 116, 139],
      indent: 6,
    });
  } else {
    callGraph.forEach((edge, idx) => {
      writeWrappedParagraph(`${idx + 1}. ${edge.caller}() -> ${edge.callee}()`, {
        style: 'bold',
        size: 10,
        color: [30, 64, 175],
        indent: 6,
      });
      writeWrappedParagraph(edge.purpose, { size: 9.5, indent: 18 });
      y += 2;
    });
  }
  y += 6;

  // ── Section 5: Complete Function & Method Breakdown ──────────────────────────
  writeSectionHeading('05', 'Complete Function & Method Breakdown');
  if (functionBreakdown.length === 0) {
    writeWrappedParagraph('No standalone functions or methods were declared in this snippet.', {
      size: 9.5,
      color: [100, 116, 139],
      indent: 6,
    });
  } else {
    functionBreakdown.forEach((fn, idx) => {
      ensureSpace(44);
      writeWrappedParagraph(`${idx + 1}. ${fn.name}(${fn.parameters === 'None' ? '' : fn.parameters})`, {
        style: 'bold',
        size: 10.5,
        color: [15, 23, 42],
        indent: 6,
      });
      writeWrappedParagraph(`Parameters: ${fn.parameters}   |   Returns: ${fn.returns}`, {
        size: 9,
        color: [71, 85, 105],
        indent: 14,
      });
      writeWrappedParagraph(fn.explanation, { size: 9.5, indent: 14 });
      y += 5;
    });
  }

  // ── Optional: Improved Code ──────────────────────────────────────────────────
  if (review?.improvedCode && review.improvedCode.trim() && review.improvedCode.trim() !== (review.code || '').trim()) {
    writeSectionHeading('REF', 'Improved / Fixed Code');
    writeCodeBlock(review.improvedCode, { lineNumbers: true });
  }

  // ── Add Page Numbers Across All Pages ────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Code Review Buddy Study Notes   -   Page ${p} of ${totalPages}`,
      marginX,
      pageHeight - 24
    );
  }

  const filename = buildSafeFileName(review?.title, review?.language);
  doc.save(filename);
  return filename;
};
