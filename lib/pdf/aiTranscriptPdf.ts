/**
 * Professional A4 PDF export for AI chat transcripts.
 * Normalizes common Markdown so the PDF reads like a business document (no raw #, *, etc.).
 */

export type TranscriptTurn = { role: "user" | "assistant"; content: string };

type PdfBlock =
  | { type: "spacer"; mm: number }
  | { type: "rule" }
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string; depth: number }
  | { type: "numbered"; label: string; text: string };

/** Strip inline Markdown / markup remnants for clean prose. */
export function sanitizeInlineMarkdown(input: string): string {
  let t = input.trim();
  if (!t) return "";

  // Fenced code blocks → compact plain text
  t = t.replace(/```[\w-]*\s*\n([\s\S]*?)```/g, (_, body: string) =>
    body.trim().replace(/\s+/g, " "),
  );
  t = t.replace(/`([^`]+)`/g, "$1");

  // Links [label](url) → label (URL available separately only if needed)
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

  // Bold / strong
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");

  // Italic (single * or _) — bold already stripped; bullets handled earlier in structure pass
  t = t.replace(/\*([^*\n]+)\*/g, "$1");
  t = t.replace(/_([^_\n]+)_/g, "$1");

  // Stray emphasis markers
  t = t.replace(/\*{2,}/g, "");
  t = t.replace(/_{2,}/g, "");

  // HTML entities unlikely but strip accidental tags
  t = t.replace(/<[^>]+>/g, "");

  return t.replace(/\s+/g, " ").trim();
}

function stripCodeFences(content: string): string {
  return content.replace(/```[\w-]*\s*\n([\s\S]*?)```/g, (_, body: string) =>
    `\n${body.trim()}\n`,
  );
}

/** Convert markdown-ish assistant text into structured blocks. */
export function markdownToPdfBlocks(content: string): PdfBlock[] {
  const text = stripCodeFences(content);
  const blocks: PdfBlock[] = [];
  const lines = text.split(/\r?\n/);

  let paraLines: string[] = [];

  function flushParagraph() {
    if (!paraLines.length) return;
    const merged = sanitizeInlineMarkdown(paraLines.join(" "));
    if (merged) blocks.push({ type: "paragraph", text: merged });
    paraLines = [];
  }

  for (const raw of lines) {
    const trimmedRight = raw.trimEnd();
    const trimmed = trimmedRight.trim();

    if (!trimmed) {
      flushParagraph();
      blocks.push({ type: "spacer", mm: 2.5 });
      continue;
    }

    // Markdown table column separator row
    if (/^\|?\s*:?[-:]+(\s*\|\s*:?[-+:])+/.test(trimmed)) {
      flushParagraph();
      continue;
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "rule" });
      blocks.push({ type: "spacer", mm: 2 });
      continue;
    }

    // ATX headings # … ######
    const hm = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      flushParagraph();
      const depth = hm[1].length;
      const level = (depth >= 3 ? 3 : depth) as 1 | 2 | 3;
      blocks.push({
        type: "heading",
        level,
        text: sanitizeInlineMarkdown(hm[2]),
      });
      blocks.push({ type: "spacer", mm: 1.5 });
      continue;
    }

    // Bullets (indentation → nesting)
    const bm = raw.match(/^(\s*)([-*])\s+(.+)$/);
    if (bm) {
      flushParagraph();
      const depth = Math.min(Math.floor(bm[1].length / 2), 4);
      blocks.push({
        type: "bullet",
        depth,
        text: sanitizeInlineMarkdown(bm[3]),
      });
      continue;
    }

    // Numbered lists 1. item
    const nm = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (nm) {
      flushParagraph();
      blocks.push({
        type: "numbered",
        label: nm[1],
        text: sanitizeInlineMarkdown(nm[2]),
      });
      continue;
    }

    // Simple table row → plain sentence (avoid pipe grid in PDF)
    if (/^\s*\|.*\|\s*$/.test(raw)) {
      flushParagraph();
      const cells = raw
        .split("|")
        .map((c) => sanitizeInlineMarkdown(c))
        .filter(Boolean);
      if (cells.length) {
        blocks.push({ type: "paragraph", text: cells.join(" · ") });
      }
      continue;
    }

    paraLines.push(trimmed);
  }

  flushParagraph();
  return blocks;
}

function userContentToBlocks(content: string): PdfBlock[] {
  const parts = content.split(/\n{2,}/).map((p) => sanitizeInlineMarkdown(p));
  const blocks: PdfBlock[] = [];
  for (const p of parts) {
    if (!p) continue;
    blocks.push({ type: "paragraph", text: p });
    blocks.push({ type: "spacer", mm: 2 });
  }
  const last = blocks[blocks.length - 1];
  if (last?.type === "spacer") blocks.pop();
  return blocks;
}

/**
 * PDF core font `times` — ISO 32000 standard serif; Acrobat and browsers map it to
 * Times New Roman (or equivalent) when viewing/printing.
 */
const FONT = "times" as const;

const MM_MARGIN = 18;
const BODY_PT = 10;
const BODY_LH_MM = 5.2;
const FOOTER_MM_FROM_BOTTOM = 9;

function headingPt(level: 1 | 2 | 3): number {
  if (level === 1) return 13;
  if (level === 2) return 11.5;
  return 10.5;
}

function headingLeadMm(level: 1 | 2 | 3): number {
  if (level === 1) return 6.2;
  if (level === 2) return 5.6;
  return 5.2;
}

/**
 * Generates and downloads a polished PDF transcript.
 */
export async function downloadProfessionalAiTranscript(
  messages: TranscriptTurn[],
): Promise<void> {
  if (!messages.length) return;

  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });

  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const innerW = pageW - MM_MARGIN * 2;

  let y = MM_MARGIN;

  function ensureSpace(mm: number): void {
    const footerReserve = FOOTER_MM_FROM_BOTTOM + 4;
    if (y + mm > pageH - footerReserve) {
      doc.addPage();
      y = MM_MARGIN;
    }
  }

  // —— Title block (report standard)
  doc.setFont(FONT, "bold");
  doc.setFontSize(17);
  doc.setTextColor(28);
  doc.text("Programme analytics report", MM_MARGIN, y);
  y += 9;

  doc.setFont(FONT, "normal");
  doc.setFontSize(10);
  doc.setTextColor(85);
  doc.text("AI-assisted summary · Monitoring & Evaluation workspace", MM_MARGIN, y);
  y += 7;

  doc.setFontSize(9);
  doc.text(`Prepared ${new Date().toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}`, MM_MARGIN, y);
  y += 6;

  doc.setDrawColor(210);
  doc.setLineWidth(0.35);
  doc.line(MM_MARGIN, y, pageW - MM_MARGIN, y);
  y += 8;
  doc.setTextColor(25);

  for (let mi = 0; mi < messages.length; mi++) {
    const m = messages[mi];
    if (mi > 0) {
      ensureSpace(10);
      doc.setDrawColor(235);
      doc.setLineWidth(0.2);
      doc.line(MM_MARGIN, y, pageW - MM_MARGIN, y);
      y += 6;
    }

    const sectionTitle = m.role === "user" ? "Question / instruction" : "Analysis";
    ensureSpace(12);
    doc.setFont(FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(115);
    doc.text(sectionTitle.toUpperCase(), MM_MARGIN, y);
    y += 5;

    doc.setFont(FONT, "normal");
    doc.setFontSize(BODY_PT);
    doc.setTextColor(22);

    const blocks =
      m.role === "assistant"
        ? markdownToPdfBlocks(m.content)
        : userContentToBlocks(m.content);

    for (const b of blocks) {
      switch (b.type) {
        case "spacer": {
          ensureSpace(b.mm);
          y += b.mm;
          break;
        }
        case "rule": {
          ensureSpace(3);
          doc.setDrawColor(230);
          doc.setLineWidth(0.15);
          doc.line(MM_MARGIN + 4, y + 1, pageW - MM_MARGIN - 4, y + 1);
          y += 3;
          break;
        }
        case "heading": {
          const pt = headingPt(b.level);
          const lh = headingLeadMm(b.level);
          doc.setFont(FONT, "bold");
          doc.setFontSize(pt);
          doc.setTextColor(18);
          const lines = doc.splitTextToSize(b.text, innerW);
          for (const line of lines) {
            ensureSpace(lh);
            doc.text(line, MM_MARGIN, y);
            y += lh;
          }
          doc.setFont(FONT, "normal");
          doc.setFontSize(BODY_PT);
          doc.setTextColor(22);
          y += 1.5;
          break;
        }
        case "paragraph": {
          doc.setFont(FONT, "normal");
          doc.setFontSize(BODY_PT);
          const lines = doc.splitTextToSize(b.text, innerW);
          for (const line of lines) {
            ensureSpace(BODY_LH_MM + 0.5);
            doc.text(line, MM_MARGIN, y);
            y += BODY_LH_MM;
          }
          y += 1;
          break;
        }
        case "bullet": {
          const indent = MM_MARGIN + 6 + b.depth * 4;
          const bulletW = innerW - (indent - MM_MARGIN) - 2;
          doc.setFont(FONT, "normal");
          doc.setFontSize(BODY_PT);
          ensureSpace(BODY_LH_MM);
          doc.text("•", indent - 4, y);
          const lines = doc.splitTextToSize(b.text, bulletW);
          for (let i = 0; i < lines.length; i++) {
            ensureSpace(BODY_LH_MM + 0.5);
            doc.text(lines[i], indent, y);
            y += BODY_LH_MM;
          }
          y += 0.8;
          break;
        }
        case "numbered": {
          const indent = MM_MARGIN + 6;
          const label = `${b.label}.`;
          doc.setFont(FONT, "normal");
          doc.setFontSize(BODY_PT);
          const labelW = doc.getTextWidth(label) + 2.5;
          const lines = doc.splitTextToSize(b.text, innerW - labelW - 6);
          for (let i = 0; i < lines.length; i++) {
            ensureSpace(BODY_LH_MM + 0.5);
            if (i === 0) doc.text(label, indent, y);
            doc.text(lines[i]!, indent + labelW, y);
            y += BODY_LH_MM;
          }
          y += 0.8;
          break;
        }
        default:
          break;
      }
    }

    y += 4;
  }

  // Footers: document title (left) + page x of y (right), every page
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont(FONT, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(155);
    doc.text(
      "M&E Platform · AI analytics transcript",
      MM_MARGIN,
      pageH - FOOTER_MM_FROM_BOTTOM,
    );
    doc.setFontSize(8);
    doc.setTextColor(130);
    const label = `Page ${p} of ${total}`;
    const w = doc.getTextWidth(label);
    doc.text(label, pageW - MM_MARGIN - w, pageH - FOOTER_MM_FROM_BOTTOM);
    doc.setTextColor(0);
  }

  const safeTs = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  doc.save(`me-ai-report-${safeTs}.pdf`);
}
