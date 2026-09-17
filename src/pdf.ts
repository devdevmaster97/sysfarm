const MM_TO_PT = 72 / 25.4;

type PdfOrientation = 'portrait' | 'landscape';
type TextAlign = 'left' | 'center' | 'right';

const winAnsiMap: Record<number, number> = {
  0x2013: 0x96,
  0x2014: 0x97,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2026: 0x85,
  0x20ac: 0x80
};

function textToHex(value: string) {
  let hex = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 63;
    const byte = code <= 255 ? code : (winAnsiMap[code] ?? 63);
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex.toUpperCase();
}

function normalizeColor(values: number[]) {
  if (values.length === 1) {
    const gray = Math.max(0, Math.min(255, values[0])) / 255;
    return `${gray.toFixed(3)} ${gray.toFixed(3)} ${gray.toFixed(3)}`;
  }
  return values
    .slice(0, 3)
    .map(value => (Math.max(0, Math.min(255, value)) / 255).toFixed(3))
    .join(' ');
}

export default class jsPDF {
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private pages: string[][] = [[]];
  private currentPage = 0;
  private font = 'F1';
  private fontSize = 10;
  private textColor = '0.000 0.000 0.000';

  lastAutoTable?: { finalY: number };

  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };

  constructor(options?: { orientation?: PdfOrientation; unit?: string; format?: string }) {
    const landscape = options?.orientation === 'landscape';
    this.pageWidth = landscape ? 297 : 210;
    this.pageHeight = landscape ? 210 : 297;
    this.internal = {
      pageSize: {
        getWidth: () => this.pageWidth,
        getHeight: () => this.pageHeight
      }
    };
  }

  setFont(_family: string, style: string) {
    this.font = style === 'bold' ? 'F2' : 'F1';
  }

  setFontSize(size: number) {
    this.fontSize = size;
  }

  setTextColor(...values: number[]) {
    this.textColor = normalizeColor(values);
  }

  text(value: string, x: number, y: number, options?: { align?: TextAlign }) {
    const align = options?.align ?? 'left';
    const estimatedWidthMm = (value.length * this.fontSize * 0.48) / MM_TO_PT;
    let drawX = x;
    if (align === 'center') drawX -= estimatedWidthMm / 2;
    if (align === 'right') drawX -= estimatedWidthMm;

    const xPt = drawX * MM_TO_PT;
    const yPt = (this.pageHeight - y) * MM_TO_PT;
    this.command(
      `BT /${this.font} ${this.fontSize.toFixed(2)} Tf ${this.textColor} rg 1 0 0 1 ${xPt.toFixed(2)} ${yPt.toFixed(2)} Tm <${textToHex(value)}> Tj ET`
    );
  }

  fillRect(x: number, y: number, width: number, height: number, color: number[]) {
    const xPt = x * MM_TO_PT;
    const yPt = (this.pageHeight - y - height) * MM_TO_PT;
    const widthPt = width * MM_TO_PT;
    const heightPt = height * MM_TO_PT;
    this.command(
      `${normalizeColor(color)} rg ${xPt.toFixed(2)} ${yPt.toFixed(2)} ${widthPt.toFixed(2)} ${heightPt.toFixed(2)} re f`
    );
  }

  strokeRect(x: number, y: number, width: number, height: number, color = [220, 220, 215]) {
    const xPt = x * MM_TO_PT;
    const yPt = (this.pageHeight - y - height) * MM_TO_PT;
    const widthPt = width * MM_TO_PT;
    const heightPt = height * MM_TO_PT;
    this.command(
      `${normalizeColor(color)} RG 0.35 w ${xPt.toFixed(2)} ${yPt.toFixed(2)} ${widthPt.toFixed(2)} ${heightPt.toFixed(2)} re S`
    );
  }

  addPage() {
    this.pages.push([]);
    this.currentPage = this.pages.length - 1;
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.pages.length) this.currentPage = page - 1;
  }

  getNumberOfPages() {
    return this.pages.length;
  }

  bytes() {
    const pdf = this.buildPdf();
    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i += 1) {
      bytes[i] = pdf.charCodeAt(i) & 0xff;
    }
    return bytes;
  }

  output(type: 'blob') {
    if (type !== 'blob') throw new Error('Formato de saída não suportado');
    return new Blob([this.bytes()], { type: 'application/pdf' });
  }

  save(filename: string) {
    const url = URL.createObjectURL(this.output('blob'));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private command(value: string) {
    this.pages[this.currentPage].push(value);
  }

  private buildPdf() {
    const objects: string[] = [];
    const pageIds = this.pages.map((_, index) => 5 + index * 2);
    const contentIds = this.pages.map((_, index) => 6 + index * 2);

    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${this.pages.length} >>`;
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

    this.pages.forEach((commands, index) => {
      const pageWidthPt = this.pageWidth * MM_TO_PT;
      const pageHeightPt = this.pageHeight * MM_TO_PT;
      const stream = commands.join('\n');
      objects[pageIds[index]] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt.toFixed(2)} ${pageHeightPt.toFixed(2)}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
      objects[contentIds[index]] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });

    let pdf = '%PDF-1.4\n%' + String.fromCharCode(0xe2, 0xe3, 0xcf, 0xd3) + '\n';
    const offsets: number[] = [0];
    for (let id = 1; id < objects.length; id += 1) {
      offsets[id] = pdf.length;
      pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length}\n`;
    pdf += '0000000000 65535 f \n';
    for (let id = 1; id < objects.length; id += 1) {
      pdf += `${offsets[id].toString().padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
  }
}

interface TableStyle {
  fillColor?: number[];
  textColor?: number[] | number;
  fontStyle?: string;
}

interface ColumnStyle {
  halign?: TextAlign;
  cellWidth?: number;
}

interface AutoTableOptions {
  startY?: number;
  head?: unknown[][];
  body?: unknown[][];
  foot?: unknown[][];
  headStyles?: TableStyle;
  footStyles?: TableStyle;
  styles?: {
    fontSize?: number;
    cellPadding?: number;
    overflow?: string;
  };
  columnStyles?: Record<number, ColumnStyle>;
  margin?: {
    left?: number;
    right?: number;
    bottom?: number;
  };
  showHead?: string;
  theme?: string;
}

function wrapText(text: string, widthMm: number, fontSize: number) {
  const maxChars = Math.max(4, Math.floor((widthMm * MM_TO_PT) / (fontSize * 0.5)));
  if (text.length <= maxChars) return [text];

  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (!line) {
      line = word;
    } else if (`${line} ${word}`.length <= maxChars) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export function autoTable(doc: jsPDF, options: AutoTableOptions) {
  const head = options.head ?? [];
  const body = options.body ?? [];
  const foot = options.foot ?? [];
  const columnCount = Math.max(head[0]?.length ?? 0, body[0]?.length ?? 0, foot[0]?.length ?? 0);
  if (!columnCount) return;

  const left = options.margin?.left ?? 14;
  const right = options.margin?.right ?? 14;
  const bottom = options.margin?.bottom ?? 14;
  const fontSize = options.styles?.fontSize ?? 8;
  const padding = options.styles?.cellPadding ?? 2;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const availableWidth = pageWidth - left - right;

  const widths = Array.from({ length: columnCount }, (_, index) =>
    options.columnStyles?.[index]?.cellWidth ?? 0
  );
  const fixedWidth = widths.reduce((sum, value) => sum + value, 0);
  const flexibleColumns = widths.filter(value => value === 0).length || 1;
  const flexibleWidth = Math.max(10, (availableWidth - fixedWidth) / flexibleColumns);
  widths.forEach((width, index) => {
    if (!width) widths[index] = flexibleWidth;
  });

  let y = options.startY ?? 20;

  const drawRow = (
    row: unknown[],
    style: TableStyle | undefined,
    bold: boolean,
    allowPageBreak = true
  ) => {
    const linesByCell = row.map((cell, index) =>
      wrapText(String(cell ?? ''), widths[index] - padding * 2, fontSize)
    );
    const maxLines = Math.max(...linesByCell.map(lines => lines.length), 1);
    const lineHeight = (fontSize * 1.25) / MM_TO_PT;
    const rowHeight = Math.max(6, maxLines * lineHeight + padding * 2);

    if (allowPageBreak && y + rowHeight > pageHeight - bottom) {
      doc.addPage();
      y = 15;
      if (head.length) drawRows(head, options.headStyles, true, false);
    }

    let x = left;
    row.forEach((_, index) => {
      if (style?.fillColor) doc.fillRect(x, y, widths[index], rowHeight, style.fillColor);
      doc.strokeRect(x, y, widths[index], rowHeight);

      doc.setFont('helvetica', bold || style?.fontStyle === 'bold' ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      const color = style?.textColor;
      if (Array.isArray(color)) doc.setTextColor(...color);
      else if (typeof color === 'number') doc.setTextColor(color);
      else doc.setTextColor(42, 42, 28);

      const align = options.columnStyles?.[index]?.halign ?? 'left';
      linesByCell[index].forEach((line, lineIndex) => {
        const textX = align === 'right'
          ? x + widths[index] - padding
          : align === 'center'
            ? x + widths[index] / 2
            : x + padding;
        doc.text(line, textX, y + padding + lineHeight * (lineIndex + 0.8), { align });
      });
      x += widths[index];
    });
    y += rowHeight;
  };

  const drawRows = (
    rows: unknown[][],
    style: TableStyle | undefined,
    bold: boolean,
    allowPageBreak = true
  ) => rows.forEach(row => drawRow(row, style, bold, allowPageBreak));

  if (head.length) drawRows(head, options.headStyles, true);
  drawRows(body, undefined, false);
  if (foot.length) drawRows(foot, options.footStyles, true);

  doc.lastAutoTable = { finalY: y };
}
