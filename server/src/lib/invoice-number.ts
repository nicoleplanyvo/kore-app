import prisma from './prisma.js';

export async function generateInvoiceNumber(type: 'INVOICE' | 'QUOTE'): Promise<string> {
  const prefix = type === 'INVOICE' ? 'R' : 'A';
  const year = new Date().getFullYear();

  const lastInvoice = await prisma.invoice.findFirst({
    where: { number: { startsWith: `${prefix}-${year}-` } },
    orderBy: { number: 'desc' },
    select: { number: true },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.number.split('-');
    nextNum = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`;
}
