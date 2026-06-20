// @ts-expect-error — pdfmake/src/Printer has no type declarations
import PdfPrinterImport from 'pdfmake/src/Printer.js';
// @ts-expect-error — kein Typ
import virtualfsImport from 'pdfmake/src/virtual-fs.js';
// @ts-expect-error — kein Typ
import URLResolverImport from 'pdfmake/src/URLResolver.js';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';

// pdfmake 0.3.x: Printer(fonts, virtualfs, urlResolver) — vgl. pdfmake/src/base.js
const PdfPrinter: any = (PdfPrinterImport as any)?.default ?? PdfPrinterImport;
const virtualfs: any = (virtualfsImport as any)?.default ?? virtualfsImport;
const URLResolver: any = (URLResolverImport as any)?.default ?? URLResolverImport;
function makePrinter(fonts: any) {
  return new PdfPrinter(fonts, virtualfs, new URLResolver(virtualfs));
}
import path from 'path';
import { fileURLToPath } from 'url';
import type { PilotReport, StoreRow } from './pilot-report.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRASS = '#9E8460';
const INK = '#2B2622';

const fontDir = path.join(__dirname, '../../node_modules/pdfmake/build/fonts/Roboto');
const fonts = {
  Roboto: {
    normal: path.join(fontDir, 'Roboto-Regular.ttf'),
    bold: path.join(fontDir, 'Roboto-Medium.ttf'),
    italics: path.join(fontDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(fontDir, 'Roboto-MediumItalic.ttf'),
  },
};

const pct = (v: number | null) => (v == null ? '—' : `${v} %`);
const num = (v: number | string | null) => (v == null ? '—' : String(v));

/** Kennzahl-Kachel (groß) für die Highlight-Zeile */
function kpi(label: string, value: string): Content {
  return {
    width: '*',
    stack: [
      { text: value, fontSize: 20, bold: true, color: BRASS },
      { text: label, fontSize: 8, color: '#777', margin: [0, 2, 0, 0] },
    ],
    margin: [0, 0, 0, 0],
  } as Content;
}

/** Store-Tabelle mit Brass-Kopf */
function storeTable(headers: string[], keys: string[], rows: StoreRow[], fmt: (k: string, v: any) => string): Content {
  const head: TableCell[] = headers.map((h, i) => ({
    text: h, bold: true, fillColor: BRASS, color: '#fff',
    alignment: i === 0 ? ('left' as const) : ('right' as const), fontSize: 9,
  }));
  const body: TableCell[][] = rows.map((r) =>
    keys.map((k, i) => ({
      text: i === 0 ? String(r.storeName) : fmt(k, (r as any)[k]),
      alignment: i === 0 ? ('left' as const) : ('right' as const), fontSize: 9,
    })),
  );
  if (body.length === 0) {
    body.push([{ text: 'Keine Daten im Zeitraum', italics: true, color: '#999', colSpan: headers.length } as TableCell,
      ...Array(headers.length - 1).fill({}) as TableCell[]]);
  }
  return {
    table: { headerRows: 1, widths: ['*', ...Array(headers.length - 1).fill('auto')], body: [head, ...body] },
    layout: {
      hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
      vLineWidth: () => 0,
      hLineColor: (i: number) => (i <= 1 ? BRASS : '#ddd'),
      paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4,
    },
    margin: [0, 6, 0, 0],
  } as Content;
}

function sectionTitle(text: string): Content {
  return { text, fontSize: 13, bold: true, color: INK, margin: [0, 18, 0, 2] } as Content;
}

export async function generatePilotReportPdf(r: PilotReport): Promise<Buffer> {
  const printer = makePrinter(fonts);

  const doc: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [50, 55, 50, 60],
    footer: (current: number, total: number) => ({
      columns: [
        { text: 'Kennzahlen ausschließlich auf Store-Ebene — keine personenbezogene Auswertung.', fontSize: 7, color: '#999', margin: [50, 0, 0, 0] },
        { text: `${current} / ${total}`, fontSize: 7, color: '#999', alignment: 'right', margin: [0, 0, 50, 0] },
      ],
    }),
    content: [
      // Header
      {
        columns: [
          { width: '*', stack: [
            { text: 'KORE', fontSize: 22, bold: true, color: BRASS },
            { text: 'Retail Intelligence', fontSize: 9, color: '#666', margin: [0, 2, 0, 0] },
          ] },
          { width: 'auto', stack: [
            { text: 'Pilot-Ergebnisbericht', fontSize: 16, bold: true, alignment: 'right', color: INK },
            { text: r.tenantName, fontSize: 11, alignment: 'right', margin: [0, 4, 0, 0] },
            { text: `Zeitraum ${r.from} – ${r.to}`, fontSize: 9, alignment: 'right', color: '#666', margin: [0, 2, 0, 0] },
          ] },
        ],
      } as Content,
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, lineColor: BRASS }], margin: [0, 12, 0, 16] } as Content,

      // Highlights
      { text: 'Auf einen Blick', fontSize: 11, bold: true, color: INK, margin: [0, 0, 0, 8] } as Content,
      { columns: [
        kpi('Spot-Checks pünktlich', pct(r.spotChecks.onTimeRate)),
        kpi('VM-Freigabequote', pct(r.spotChecks.approvalRate)),
        kpi('Maßnahmen erledigt', pct(r.followUps.completionRate)),
        kpi('Checklisten erfüllt', pct(r.checklists.completionRate)),
        kpi('Ø Audit-Score', r.audits.avgScore == null ? '—' : `${r.audits.avgScore}`),
      ], columnGap: 8 } as Content,

      // Spot-Checks
      sectionTitle('VM Compliance — Spot-Checks'),
      { text: `${r.spotChecks.requests} Anfragen · ${r.spotChecks.submitted}/${r.spotChecks.targets} eingereicht · Ø Reaktionszeit ${num(r.spotChecks.avgResponseMin)} Min.`, fontSize: 9, color: '#555' } as Content,
      storeTable(
        ['Store', 'Anfragen', 'Eingereicht', 'Pünktlich', 'Freigabe', 'Ø Reaktion'],
        ['storeName', 'targets', 'submitted', 'onTimeRate', 'approvalRate', 'avgResponseMin'],
        r.spotChecks.byStore,
        (k, v) => (k === 'onTimeRate' || k === 'approvalRate' ? pct(v) : k === 'avgResponseMin' ? (v == null ? '—' : `${v} Min.`) : num(v)),
      ),

      // Follow-ups
      sectionTitle('Store-Visits — Follow-up-Maßnahmen'),
      { text: `${r.followUps.total} Maßnahmen · ${r.followUps.done} erledigt · ${r.followUps.overdue} überfällig · Ø Durchlaufzeit ${num(r.followUps.avgResolutionDays)} Tg.`, fontSize: 9, color: '#555' } as Content,
      storeTable(
        ['Store', 'Gesamt', 'Erledigt', 'Überfällig', 'Quote', 'Ø Durchlauf'],
        ['storeName', 'total', 'done', 'overdue', 'completionRate', 'avgResolutionDays'],
        r.followUps.byStore,
        (k, v) => (k === 'completionRate' ? pct(v) : k === 'avgResolutionDays' ? (v == null ? '—' : `${v} Tg.`) : num(v)),
      ),

      // Checklisten
      sectionTitle('Checklisten'),
      storeTable(
        ['Store', 'Durchläufe', 'Abgeschlossen', 'Quote'],
        ['storeName', 'sessions', 'completed', 'completionRate'],
        r.checklists.byStore,
        (k, v) => (k === 'completionRate' ? pct(v) : num(v)),
      ),

      // Audits
      sectionTitle('Store Excellence Audits'),
      storeTable(
        ['Store', 'Audits', 'Ø Score'],
        ['storeName', 'sessions', 'avgScore'],
        r.audits.byStore,
        (_k, v) => num(v),
      ),
    ],
    defaultStyle: { fontSize: 10, color: INK },
  };

  const pdfDoc = await printer.createPdfKitDocument(doc); // 0.3.x: async
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    pdfDoc.on('data', (c: Uint8Array) => chunks.push(c));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}
