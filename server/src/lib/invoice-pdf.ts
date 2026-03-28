// @ts-expect-error — pdfmake/src/Printer has no type declarations
import PdfPrinter from 'pdfmake/src/Printer.js';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRASS = '#9E8460';

const fontDir = path.join(__dirname, '../../node_modules/pdfmake/build/fonts/Roboto');
const fonts = {
  Roboto: {
    normal: path.join(fontDir, 'Roboto-Regular.ttf'),
    bold: path.join(fontDir, 'Roboto-Medium.ttf'),
    italics: path.join(fontDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(fontDir, 'Roboto-MediumItalic.ttf'),
  },
};

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceForPdf {
  number: string;
  type: string;
  issueDate: Date | string;
  dueDate?: Date | string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  items: InvoiceItem[];
  tenant: {
    name: string;
    contactName?: string | null;
    contactEmail?: string | null;
  } | null;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export async function generateInvoicePdf(invoice: InvoiceForPdf): Promise<Buffer> {
  const printer = new PdfPrinter(fonts);

  const typeLabel = invoice.type === 'INVOICE' ? 'Rechnung' : 'Angebot';

  const itemRows: TableCell[][] = invoice.items.map((item, idx) => [
    { text: String(idx + 1), alignment: 'center' as const },
    { text: item.description },
    { text: String(item.quantity), alignment: 'center' as const },
    { text: formatCurrency(item.unitPrice), alignment: 'right' as const },
    { text: formatCurrency(item.total), alignment: 'right' as const },
  ]);

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [50, 60, 50, 80],
    content: [
      // Header
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'KORE', fontSize: 24, bold: true, color: BRASS },
              { text: 'Retail Operations Platform', fontSize: 9, color: '#666', margin: [0, 2, 0, 0] },
              { text: 'KORE GmbH', fontSize: 8, color: '#999', margin: [0, 10, 0, 0] },
              { text: 'Musterstraße 1, 10115 Berlin', fontSize: 8, color: '#999' },
              { text: 'hello@kore-platform.de', fontSize: 8, color: '#999' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: typeLabel, fontSize: 18, bold: true, alignment: 'right' as const, color: BRASS },
              { text: `Nr. ${invoice.number}`, fontSize: 10, alignment: 'right' as const, margin: [0, 4, 0, 0] },
              { text: `Datum: ${formatDate(invoice.issueDate)}`, fontSize: 9, alignment: 'right' as const, margin: [0, 4, 0, 0] },
              ...(invoice.dueDate
                ? [{ text: `Fällig: ${formatDate(invoice.dueDate)}`, fontSize: 9, alignment: 'right' as const, margin: [0, 2, 0, 0] }]
                : []),
            ],
          },
        ],
      } as Content,

      // Divider
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, lineColor: BRASS }],
        margin: [0, 15, 0, 15],
      } as Content,

      // Recipient
      {
        stack: [
          { text: 'Empfänger:', fontSize: 8, color: '#999', margin: [0, 0, 0, 4] },
          { text: invoice.tenant?.name || 'Unbekannt', fontSize: 11, bold: true },
          ...(invoice.tenant?.contactName ? [{ text: invoice.tenant.contactName, fontSize: 10 }] : []),
          ...(invoice.tenant?.contactEmail ? [{ text: invoice.tenant.contactEmail, fontSize: 9, color: '#666' }] : []),
        ],
        margin: [0, 0, 0, 25],
      } as Content,

      // Items table
      {
        table: {
          headerRows: 1,
          widths: [30, '*', 50, 80, 80],
          body: [
            [
              { text: 'Pos', bold: true, fillColor: BRASS, color: '#fff', alignment: 'center' as const },
              { text: 'Beschreibung', bold: true, fillColor: BRASS, color: '#fff' },
              { text: 'Menge', bold: true, fillColor: BRASS, color: '#fff', alignment: 'center' as const },
              { text: 'Einzelpreis', bold: true, fillColor: BRASS, color: '#fff', alignment: 'right' as const },
              { text: 'Gesamt', bold: true, fillColor: BRASS, color: '#fff', alignment: 'right' as const },
            ],
            ...itemRows,
          ],
        },
        layout: {
          hLineWidth: (i: number, node: { table: { body: TableCell[][] } }) =>
            i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: (i: number) => (i <= 1 ? BRASS : '#ddd'),
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      } as Content,

      // Totals
      {
        margin: [0, 15, 0, 0],
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            table: {
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Netto', alignment: 'right' as const, border: [false, false, false, false] },
                  { text: formatCurrency(invoice.subtotal), alignment: 'right' as const, border: [false, false, false, false] },
                ],
                [
                  { text: `USt ${Math.round(invoice.taxRate * 100)}%`, alignment: 'right' as const, border: [false, false, false, false] },
                  { text: formatCurrency(invoice.taxAmount), alignment: 'right' as const, border: [false, false, false, false] },
                ],
                [
                  { text: 'Brutto', bold: true, alignment: 'right' as const, fontSize: 12, border: [false, true, false, false] },
                  { text: formatCurrency(invoice.total), bold: true, alignment: 'right' as const, fontSize: 12, border: [false, true, false, false] },
                ],
              ],
            },
            layout: {
              hLineWidth: (i: number) => (i === 2 ? 1 : 0),
              vLineWidth: () => 0,
              hLineColor: () => BRASS,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          },
        ],
      } as Content,

      // Notes
      ...(invoice.notes
        ? [
            {
              margin: [0, 30, 0, 0] as [number, number, number, number],
              stack: [
                { text: 'Hinweise', fontSize: 10, bold: true, color: BRASS, margin: [0, 0, 0, 4] as [number, number, number, number] },
                { text: invoice.notes, fontSize: 9, color: '#444' },
              ],
            } as Content,
          ]
        : []),
    ],
    defaultStyle: {
      fontSize: 10,
    },
  };

  return new Promise<Buffer>((resolve, reject) => {
    const doc = printer.createPdfKitDocument(docDefinition);
    const chunks: Uint8Array[] = [];

    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.end();
  });
}
