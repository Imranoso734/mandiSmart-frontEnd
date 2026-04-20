import type {
  ConsignmentSummaryReport,
  CustomerLedgerReport,
  DailySalesReport,
  SupplierSettlementReport,
} from "@/lib/mandi/types";
import { commissionTypeLabels, consignmentStatusLabels } from "@/lib/mandi/constants";
import { formatCurrency, formatDate, formatNumber, formatOptionalCurrency, formatOptionalNumber, getBalanceLabel } from "@/lib/mandi/utils";

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const MARGIN = 72;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BRAND_PRIMARY = "#0e4e3c";
const BRAND_PRIMARY_SOFT = "#dcb47a";
const BRAND_PRIMARY_LINE = "#d7c6aa";
const BRAND_TEXT = "#1f2937";
const BRAND_MUTED = "#6b7280";
const PANEL_BG = "#f7f1e7";
const ROW_BG = "#fffaf3";

type SummaryItem = { title: string; value: string };

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("PDF canvas تیار نہیں ہو سکا");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  ctx.strokeStyle = BRAND_PRIMARY;
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, PAGE_WIDTH - 48, PAGE_HEIGHT - 48);
  ctx.direction = "rtl";
  ctx.textBaseline = "top";
  return { canvas, ctx };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = `${text}`.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

class ReportPainter {
  pages = [makeCanvas()];
  pageIndex = 0;
  y = MARGIN;

  get page() {
    return this.pages[this.pageIndex];
  }

  get ctx() {
    return this.page.ctx;
  }

  addPage() {
    this.pages.push(makeCanvas());
    this.pageIndex += 1;
    this.y = MARGIN;
  }

  ensureSpace(height: number) {
    if (this.y + height > PAGE_HEIGHT - MARGIN) {
      this.addPage();
    }
  }

  drawHeader(title: string, subtitle: string, context: string) {
    const ctx = this.ctx;
    ctx.fillStyle = BRAND_PRIMARY;
    ctx.fillRect(MARGIN, this.y, CONTENT_WIDTH, 58);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(MARGIN + 16, this.y + 9, 190, 40);
    ctx.strokeStyle = BRAND_PRIMARY_SOFT;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(MARGIN + 16, this.y + 9, 190, 40);
    ctx.fillStyle = BRAND_PRIMARY;
    ctx.textAlign = "center";
    ctx.font = "700 22px 'Noto Sans Arabic', Tahoma, sans-serif";
    ctx.fillText("منڈی اسمارٹ", MARGIN + 111, this.y + 17);

    ctx.fillStyle = "#ffffff";
    ctx.font = "500 20px 'Noto Sans Arabic', Tahoma, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(new Date().toLocaleString("ur-PK"), MARGIN + CONTENT_WIDTH - 20, this.y + 18);
    this.y += 90;

    ctx.fillStyle = BRAND_PRIMARY;
    ctx.textAlign = "center";
    ctx.font = "700 40px 'Noto Sans Arabic', Tahoma, sans-serif";
    ctx.fillText(title, PAGE_WIDTH / 2, this.y);
    this.y += 58;

    this.drawParagraph(subtitle, { center: true, box: true });
    this.y += 12;

    ctx.fillStyle = "#475569";
    ctx.font = "500 22px 'Noto Sans Arabic', Tahoma, sans-serif";
    ctx.fillText(context, PAGE_WIDTH / 2, this.y);
    this.y += 42;
  }

  drawParagraph(text: string, options?: { center?: boolean; box?: boolean }) {
    const ctx = this.ctx;
    ctx.font = "400 22px 'Noto Sans Arabic', Tahoma, sans-serif";
    const maxWidth = CONTENT_WIDTH - (options?.box ? 36 : 0);
    const lines = wrapText(ctx, text, maxWidth);
    const height = lines.length * 30 + (options?.box ? 26 : 0);
    this.ensureSpace(height + 6);

    if (options?.box) {
      ctx.strokeStyle = BRAND_PRIMARY_SOFT;
      ctx.lineWidth = 2;
      ctx.strokeRect(MARGIN, this.y, CONTENT_WIDTH, height);
    }

    ctx.fillStyle = BRAND_MUTED;
    ctx.textAlign = options?.center ? "center" : "right";
    const x = options?.center ? PAGE_WIDTH / 2 : MARGIN + CONTENT_WIDTH - 18;
    let y = this.y + (options?.box ? 13 : 0);
    for (const line of lines) {
      ctx.fillText(line, x, y);
      y += 30;
    }
    this.y += height;
  }

  drawSectionTitle(title: string) {
    this.ensureSpace(54);
    const ctx = this.ctx;
    ctx.fillStyle = BRAND_PRIMARY;
    ctx.fillRect(MARGIN, this.y, CONTENT_WIDTH, 42);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "700 24px 'Noto Sans Arabic', Tahoma, sans-serif";
    ctx.fillText(title, PAGE_WIDTH / 2, this.y + 8);
    this.y += 58;
  }

  drawSummary(items: SummaryItem[]) {
    const ctx = this.ctx;
    const gap = 18;
    const boxWidth = (CONTENT_WIDTH - gap * (items.length - 1)) / items.length;
    this.ensureSpace(150);

    items.forEach((item, index) => {
      const x = MARGIN + index * (boxWidth + gap);
      ctx.strokeStyle = BRAND_PRIMARY_SOFT;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, this.y, boxWidth, 118);
      ctx.fillStyle = BRAND_MUTED;
      ctx.font = "500 18px 'Noto Sans Arabic', Tahoma, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.title, x + boxWidth / 2, this.y + 18);
      ctx.fillStyle = BRAND_TEXT;
      ctx.font = "700 34px 'Noto Sans Arabic', Tahoma, sans-serif";
      ctx.fillText(item.value, x + boxWidth / 2, this.y + 52);
    });

    this.y += 138;
  }

  drawInfoBlock(title: string, lines: string[], badge?: string) {
    const ctx = this.ctx;
    const contentHeight = Math.max(118, 38 + lines.length * 30);
    this.ensureSpace(contentHeight + 18);
    ctx.fillStyle = PANEL_BG;
    ctx.fillRect(MARGIN, this.y, CONTENT_WIDTH, contentHeight);
    ctx.strokeStyle = BRAND_PRIMARY_LINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(MARGIN, this.y, CONTENT_WIDTH, contentHeight);
    ctx.fillStyle = BRAND_PRIMARY;
    ctx.textAlign = "right";
    ctx.font = "700 30px 'Noto Sans Arabic', Tahoma, sans-serif";
    ctx.fillText(title, MARGIN + CONTENT_WIDTH - 20, this.y + 18);

    const textRight = MARGIN + CONTENT_WIDTH - 20;
    const textLeftLimit = badge ? MARGIN + 260 : MARGIN + 20;
    const textMaxWidth = textRight - textLeftLimit;
    let wrappedLines: string[] = [];
    lines.forEach((line) => {
      wrappedLines = [...wrappedLines, ...wrapText(ctx, line, textMaxWidth)];
    });
    const dynamicHeight = Math.max(118, 38 + wrappedLines.length * 30);
    if (dynamicHeight !== contentHeight) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(MARGIN - 2, this.y - 2, CONTENT_WIDTH + 4, contentHeight + 4);
      ctx.fillStyle = PANEL_BG;
      ctx.fillRect(MARGIN, this.y, CONTENT_WIDTH, dynamicHeight);
      ctx.strokeStyle = BRAND_PRIMARY_LINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(MARGIN, this.y, CONTENT_WIDTH, dynamicHeight);
      ctx.fillStyle = BRAND_PRIMARY;
      ctx.font = "700 30px 'Noto Sans Arabic', Tahoma, sans-serif";
      ctx.fillText(title, MARGIN + CONTENT_WIDTH - 20, this.y + 18);
    }

    if (badge) {
      ctx.fillStyle = BRAND_PRIMARY;
      this.roundRect(MARGIN + 20, this.y + 16, 210, 46, 22, true);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "700 20px 'Noto Sans Arabic', Tahoma, sans-serif";
      ctx.fillText(badge, MARGIN + 125, this.y + 28);
    }

    ctx.fillStyle = BRAND_TEXT;
    ctx.textAlign = "right";
    ctx.font = "500 22px 'Noto Sans Arabic', Tahoma, sans-serif";
    let lineY = this.y + 62;
    for (const line of wrappedLines) {
      ctx.fillText(line, textRight, lineY);
      lineY += 30;
    }
    this.y += Math.max(118, 38 + wrappedLines.length * 30) + 18;
  }

  drawTable(headers: string[], rows: string[][]) {
    const ctx = this.ctx;
    const colWidth = CONTENT_WIDTH / headers.length;
    const headerHeight = 42;
    this.ensureSpace(56 + Math.max(rows.length, 1) * 56 + 14);

    ctx.fillStyle = BRAND_PRIMARY;
    ctx.fillRect(MARGIN, this.y, CONTENT_WIDTH, headerHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 20px 'Noto Sans Arabic', Tahoma, sans-serif";
    headers.forEach((header, index) => {
      ctx.textAlign = "center";
      ctx.fillText(header, MARGIN + CONTENT_WIDTH - colWidth * index - colWidth / 2, this.y + 11);
    });
    this.y += headerHeight;

    rows.forEach((row, rowIndex) => {
      const wrappedRow = row.map((cell) => wrapText(ctx, cell, colWidth - 14));
      const rowHeight = Math.max(42, Math.max(...wrappedRow.map((lines) => lines.length)) * 24 + 16);
      ctx.fillStyle = rowIndex % 2 === 0 ? ROW_BG : "#ffffff";
      ctx.fillRect(MARGIN, this.y, CONTENT_WIDTH, rowHeight);
      ctx.strokeStyle = BRAND_PRIMARY_SOFT;
      ctx.strokeRect(MARGIN, this.y, CONTENT_WIDTH, rowHeight);
      ctx.fillStyle = BRAND_TEXT;
      ctx.font = "500 18px 'Noto Sans Arabic', Tahoma, sans-serif";
      row.forEach((_, index) => {
        ctx.textAlign = "center";
        const x = MARGIN + CONTENT_WIDTH - colWidth * index - colWidth / 2;
        let lineY = this.y + 10;
        wrappedRow[index].forEach((line) => {
          ctx.fillText(line, x, lineY);
          lineY += 24;
        });
      });
      this.y += rowHeight;
    });

    if (!rows.length) {
      const emptyHeight = 42;
      ctx.strokeStyle = BRAND_PRIMARY_SOFT;
      ctx.strokeRect(MARGIN, this.y, CONTENT_WIDTH, emptyHeight);
      ctx.fillStyle = BRAND_MUTED;
      ctx.textAlign = "center";
      ctx.fillText("کوئی اندراج موجود نہیں", PAGE_WIDTH / 2, this.y + 12);
      this.y += emptyHeight;
    }

    this.y += 14;
  }

  drawConclusion(text: string) {
    this.drawSectionTitle("خلاصہ");
    this.drawParagraph(text, { box: true });
    const ctx = this.ctx;
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "left";
    ctx.font = "500 18px 'Noto Sans Arabic', Tahoma, sans-serif";
    ctx.fillText("System generated PDF report", MARGIN + CONTENT_WIDTH - 32, PAGE_HEIGHT - 82);
  }

  roundRect(x: number, y: number, width: number, height: number, radius: number, fill?: boolean) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    if (fill) ctx.fill();
  }
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function buildPdfFromJpegs(images: { bytes: Uint8Array; width: number; height: number }[]) {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;

  const pushString = (value: string) => {
    const chunk = encoder.encode(value);
    parts.push(chunk);
    length += chunk.length;
  };

  const pushBytes = (value: Uint8Array) => {
    parts.push(value);
    length += value.length;
  };

  const objectOffsets: number[] = [];
  let objectIndex = 1;

  const reserveObject = () => objectIndex++;
  const catalogId = reserveObject();
  const pagesId = reserveObject();
  const pageIds = images.map(() => reserveObject());
  const contentIds = images.map(() => reserveObject());
  const imageIds = images.map(() => reserveObject());

  pushString("%PDF-1.4\n");

  const startObject = (id: number) => {
    objectOffsets[id] = length;
    pushString(`${id} 0 obj\n`);
  };

  images.forEach((image, index) => {
    startObject(imageIds[index]);
    pushString(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`);
    pushBytes(image.bytes);
    pushString("\nendstream\nendobj\n");
  });

  images.forEach((_, index) => {
    startObject(contentIds[index]);
    const stream = `q\n595.92 0 0 841.92 0 0 cm\n/Im${index + 1} Do\nQ`;
    pushString(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
  });

  images.forEach((_, index) => {
    startObject(pageIds[index]);
    pushString(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595.92 841.92] /Resources << /XObject << /Im${index + 1} ${imageIds[index]} 0 R >> >> /Contents ${contentIds[index]} 0 R >>\nendobj\n`);
  });

  startObject(pagesId);
  pushString(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>\nendobj\n`);

  startObject(catalogId);
  pushString(`<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n`);

  const xrefOffset = length;
  pushString(`xref\n0 ${objectIndex}\n0000000000 65535 f \n`);
  for (let id = 1; id < objectIndex; id += 1) {
    pushString(`${String(objectOffsets[id] ?? 0).padStart(10, "0")} 00000 n \n`);
  }
  pushString(`trailer\n<< /Size ${objectIndex} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

async function finalizePdf(painter: ReportPainter) {
  const images = painter.pages.map(({ canvas }) => ({
    bytes: dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.95)),
    width: canvas.width,
    height: canvas.height,
  }));
  return buildPdfFromJpegs(images);
}

export async function createDailySalesPdf(report: DailySalesReport) {
  const painter = new ReportPainter();
  painter.drawHeader("روزانہ فروخت رپورٹ", "یہ رپورٹ منڈی اسمارٹ سے تیار کی گئی ہے اور کاروباری جائزے کے لئے موزوں ہے۔", `تاریخ: ${formatDate(report.date)}`);
  painter.drawSectionTitle("رپورٹ خلاصہ");
  painter.drawSummary([
    { title: "کل فروخت", value: formatCurrency(report.totalSales) },
    { title: "انوائس", value: formatNumber(report.totalInvoices) },
    { title: "آئٹمز", value: formatNumber(report.totalItems ?? report.sales.reduce((sum, sale) => sum + (sale.items?.length ?? 0), 0)) },
    { title: "گاہک", value: formatNumber(report.customers ?? new Set(report.sales.map((sale) => sale.customerId)).size) },
  ]);
  painter.drawSectionTitle("فروخت کی تفصیل");
  painter.drawTable(["کل رقم", "آئٹمز", "تاریخ", "گاہک"], report.sales.map((sale) => [
    formatCurrency(sale.totalAmount),
    formatNumber(sale.items?.length ?? 0),
    formatDate(sale.saleDate),
    sale.customer?.name || "گاہک",
  ]));
  painter.drawConclusion(`${formatDate(report.date)} کے لئے ${formatNumber(report.totalInvoices)} فروخت اندراجات اور ${formatCurrency(report.totalSales)} کی مجموعی فروخت ریکارڈ ہوئی۔`);
  return finalizePdf(painter);
}

export async function createCustomerLedgerPdf(report: CustomerLedgerReport) {
  const painter = new ReportPainter();
  painter.drawHeader("گاہک کھاتہ رپورٹ", "یہ رپورٹ گاہک کے کھاتے کی مکمل مالی حرکت دکھاتی ہے۔", report.customer.name);
  painter.drawSectionTitle("رپورٹ خلاصہ");
  painter.drawSummary([
    { title: "کل فروخت", value: formatCurrency(report.totalSales) },
    { title: "کل وصولی", value: formatCurrency(report.totalPayments) },
    { title: getBalanceLabel(report.balance), value: formatCurrency(Math.abs(report.balance)) },
    { title: "اندراجات", value: formatNumber(report.entries.length) },
  ]);
  painter.drawSectionTitle("کھاتہ اندراجات");
  painter.drawTable(["بیلنس", "کریڈٹ", "ڈیبٹ", "تفصیل", "قسم", "تاریخ"], report.entries.map((entry) => [
    formatCurrency(entry.balance),
    formatCurrency(entry.credit),
    formatCurrency(entry.debit),
    entry.description,
    entry.type === "SALE" ? "فروخت" : "وصولی",
    formatDate(entry.date),
  ]));
  painter.drawConclusion(`${report.customer.name} کے کھاتے میں ${formatNumber(report.entries.length)} اندراجات موجود ہیں۔ موجودہ حیثیت: ${getBalanceLabel(report.balance)} ${formatCurrency(Math.abs(report.balance))}.`);
  return finalizePdf(painter);
}

export async function createConsignmentSummaryPdf(report: ConsignmentSummaryReport) {
  const painter = new ReportPainter();
  painter.drawHeader("مال کا خلاصہ", "یہ رپورٹ منتخب گاڑی کے مال، فروخت اور خرچوں کا ایک نظر میں خلاصہ دیتی ہے۔", `${report.consignment.supplier?.name ?? "سپلائر"} | ${report.consignment.vehicleNumber || "بغیر نمبر"}`);
  painter.drawSectionTitle("رپورٹ خلاصہ");
  painter.drawSummary([
    { title: "مجموعی فروخت", value: formatCurrency(report.totalSales) },
    { title: "کل خرچے", value: formatCurrency(report.totalExpenses) },
    { title: "بکی مقدار", value: formatNumber(report.totalItemsSold ?? 0) },
    { title: "بچی مقدار", value: formatOptionalNumber(report.totalItemsRemaining) },
  ]);
  painter.drawSectionTitle("بنیادی معلومات");
  painter.drawInfoBlock(report.consignment.supplier?.name ?? "سپلائر", [
    `گاڑی نمبر: ${report.consignment.vehicleNumber || "بغیر نمبر"}`,
    `آمد تاریخ: ${formatDate(report.consignment.arrivalDate)}`,
    `حالت: ${consignmentStatusLabels[report.consignment.status]}`,
    `کمیشن: ${commissionTypeLabels[report.consignment.commissionType]} - ${formatNumber(report.consignment.commissionValue)}`,
  ]);
  painter.drawSectionTitle("مال کے آئٹمز");
  painter.drawTable(["بنیادی ریٹ", "مقدار", "آئٹم"], (report.consignment.items ?? []).map((item) => [
    formatOptionalCurrency(item.baseRate),
    formatOptionalNumber(item.quantityReceived),
    item.productNameUrdu,
  ]));
  painter.drawConclusion(`اس گاڑی سے ${formatCurrency(report.totalSales)} کی فروخت اور ${formatCurrency(report.totalExpenses)} کے خرچے ریکارڈ ہوئے۔`);
  return finalizePdf(painter);
}

export async function createSupplierSettlementPdf(report: SupplierSettlementReport) {
  const painter = new ReportPainter();
  painter.drawHeader("سپلائر حساب رپورٹ", "یہ رپورٹ سپلائر کے آخری حساب کو واضح انداز میں پیش کرتی ہے۔", `${report.supplier.name} | ${report.consignment.vehicleNumber || "بغیر نمبر"}`);
  painter.drawSectionTitle("رپورٹ خلاصہ");
  painter.drawSummary([
    { title: "مجموعی فروخت", value: formatCurrency(report.grossSale) },
    { title: "کمیشن", value: formatCurrency(report.commissionAmount) },
    { title: "خرچے", value: formatCurrency(report.expenseTotal) },
    { title: "قابل ادائیگی", value: formatCurrency(report.payable) },
  ]);
  painter.drawSectionTitle("سپلائر کی تفصیل");
  painter.drawInfoBlock(report.supplier.name, [
    `گاڑی نمبر: ${report.consignment.vehicleNumber || "بغیر نمبر"}`,
    `آمد تاریخ: ${formatDate(report.consignment.arrivalDate)}`,
    `حالت: ${report.status || "زیر تکمیل"}`,
    `کمیشن طریقہ: ${commissionTypeLabels[report.consignment.commissionType]}`,
  ], `حساب: ${formatCurrency(report.payable)}`);
  painter.drawSectionTitle("حساب فارمولا");
  painter.drawTable(["رقم", "مد"], [
    [formatCurrency(report.grossSale), "مجموعی فروخت"],
    [formatCurrency(report.commissionAmount), "منفی کمیشن"],
    [formatCurrency(report.expenseTotal), "منفی خرچے"],
    [formatCurrency(report.payable), "سپلائر قابل ادائیگی"],
  ]);
  painter.drawConclusion(`${report.supplier.name} کے لئے آخری قابل ادائیگی رقم ${formatCurrency(report.payable)} بنتی ہے۔`);
  return finalizePdf(painter);
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
