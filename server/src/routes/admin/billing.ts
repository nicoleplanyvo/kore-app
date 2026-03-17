import { Router, type Router as RouterType } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';
import { generateInvoiceNumber } from '../../lib/invoice-number.js';
import { generateInvoicePdf } from '../../lib/invoice-pdf.js';

export const adminBillingRouter: RouterType = Router();
adminBillingRouter.use(authenticate, requireMinRole('kore_admin'));

// ── GET /api/admin/billing — Liste mit Pagination & Filter ───────
adminBillingRouter.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query['pageSize'] as string) || 20));
    const type = req.query['type'] as string | undefined;
    const status = req.query['status'] as string | undefined;
    const tenantId = req.query['tenantId'] as string | undefined;

    const where: Record<string, unknown> = {};
    if (type) where['type'] = type;
    if (status) where['status'] = status;
    if (tenantId) where['tenantId'] = tenantId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          tenant: { select: { name: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ invoices, total, page, pageSize });
  } catch (err) {
    console.error('Billing list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /api/admin/billing — Rechnung/Angebot erstellen ─────────
adminBillingRouter.post('/', async (req, res) => {
  try {
    const { tenantId, type, issueDate, dueDate, items, notes } = req.body;

    if (!tenantId || !type || !issueDate || !items?.length) {
      res.status(400).json({ error: 'tenantId, type, issueDate und items sind Pflichtfelder.' });
      return;
    }

    if (!['INVOICE', 'QUOTE'].includes(type)) {
      res.status(400).json({ error: 'type muss INVOICE oder QUOTE sein.' });
      return;
    }

    const number = await generateInvoiceNumber(type);

    const itemsWithTotals = items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = itemsWithTotals.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
    const taxRate = 0.19;
    const taxAmount = Math.round(subtotal * taxRate);
    const total = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        createdById: req.user!.sub,
        number,
        type,
        status: 'DRAFT',
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes: notes || null,
        items: {
          create: itemsWithTotals,
        },
      },
      include: {
        tenant: { select: { name: true } },
        items: true,
      },
    });

    res.status(201).json(invoice);
  } catch (err) {
    console.error('Billing create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /api/admin/billing/stats — Billing-Zusammenfassung ───────
adminBillingRouter.get('/stats', async (_req, res) => {
  try {
    const [openQuotes, openInvoices, overdueInvoices, activeAssignments] = await Promise.all([
      prisma.invoice.count({
        where: { type: 'QUOTE', status: { in: ['DRAFT', 'SENT'] } },
      }),
      prisma.invoice.count({
        where: { type: 'INVOICE', status: { in: ['DRAFT', 'SENT'] } },
      }),
      prisma.invoice.findMany({
        where: { status: 'OVERDUE' },
        select: { total: true },
      }),
      prisma.storeToolAssignment.findMany({
        where: { isActive: true },
        include: { tool: { select: { priceMonthly: true } } },
      }),
    ]);

    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

    let mrr = 0;
    for (const a of activeAssignments) {
      mrr += a.tool.priceMonthly;
    }

    res.json({ openQuotes, openInvoices, overdueAmount, mrr });
  } catch (err) {
    console.error('Billing stats error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /api/admin/billing/:id — Einzelne Rechnung ───────────────
adminBillingRouter.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params['id'] },
      include: {
        tenant: { select: { id: true, name: true, contactName: true, contactEmail: true } },
        items: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Rechnung nicht gefunden.' });
      return;
    }

    res.json(invoice);
  } catch (err) {
    console.error('Billing detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── PATCH /api/admin/billing/:id — Bearbeiten (nur DRAFT) ────────
adminBillingRouter.patch('/:id', async (req, res) => {
  try {
    const existing = await prisma.invoice.findUnique({
      where: { id: req.params['id'] },
      select: { status: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Rechnung nicht gefunden.' });
      return;
    }

    if (existing.status !== 'DRAFT') {
      res.status(400).json({ error: 'Nur Entwürfe können bearbeitet werden.' });
      return;
    }

    const { items, notes, dueDate, issueDate } = req.body;

    const updateData: Record<string, unknown> = {};
    if (notes !== undefined) updateData['notes'] = notes || null;
    if (dueDate !== undefined) updateData['dueDate'] = dueDate ? new Date(dueDate) : null;
    if (issueDate !== undefined) updateData['issueDate'] = new Date(issueDate);

    if (items?.length) {
      const itemsWithTotals = items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

      const subtotal = itemsWithTotals.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
      const taxAmount = Math.round(subtotal * 0.19);
      const total = subtotal + taxAmount;

      updateData['subtotal'] = subtotal;
      updateData['taxAmount'] = taxAmount;
      updateData['total'] = total;

      // Delete old items and recreate
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: req.params['id'] } });
      updateData['items'] = { create: itemsWithTotals };
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params['id'] },
      data: updateData,
      include: {
        tenant: { select: { name: true } },
        items: true,
      },
    });

    res.json(invoice);
  } catch (err) {
    console.error('Billing update error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /api/admin/billing/:id/status — Statuswechsel ──────────
adminBillingRouter.post('/:id/status', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params['id'] },
      select: { status: true, type: true },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Rechnung nicht gefunden.' });
      return;
    }

    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'status ist ein Pflichtfeld.' });
      return;
    }

    // Validate transitions
    const validTransitions: Record<string, Record<string, string[]>> = {
      INVOICE: {
        DRAFT: ['SENT'],
        SENT: ['PAID', 'OVERDUE'],
      },
      QUOTE: {
        DRAFT: ['SENT'],
        SENT: ['ACCEPTED', 'CANCELED'],
      },
    };

    const allowed = validTransitions[invoice.type]?.[invoice.status] || [];
    if (!allowed.includes(status)) {
      res.status(400).json({
        error: `Ungültiger Statuswechsel: ${invoice.status} → ${status}`,
      });
      return;
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'PAID') updateData['paidAt'] = new Date();
    if (status === 'SENT') updateData['sentAt'] = new Date();

    const updated = await prisma.invoice.update({
      where: { id: req.params['id'] },
      data: updateData,
      include: {
        tenant: { select: { name: true } },
        items: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Billing status error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DELETE /api/admin/billing/:id — Löschen (nur DRAFT) ──────────
adminBillingRouter.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.invoice.findUnique({
      where: { id: req.params['id'] },
      select: { status: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Rechnung nicht gefunden.' });
      return;
    }

    if (existing.status !== 'DRAFT') {
      res.status(400).json({ error: 'Nur Entwürfe können gelöscht werden.' });
      return;
    }

    await prisma.invoice.delete({ where: { id: req.params['id'] } });

    res.json({ success: true });
  } catch (err) {
    console.error('Billing delete error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /api/admin/billing/:id/pdf — PDF generieren ──────────────
adminBillingRouter.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params['id'] },
      include: {
        tenant: { select: { name: true, contactName: true, contactEmail: true } },
        items: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Rechnung nicht gefunden.' });
      return;
    }

    const pdfBuffer = await generateInvoicePdf(invoice);

    const typeLabel = invoice.type === 'INVOICE' ? 'Rechnung' : 'Angebot';
    const filename = `${typeLabel}_${invoice.number}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Billing PDF error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /api/admin/billing/:id/send — Versenden (Platzhalter) ───
adminBillingRouter.post('/:id/send', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params['id'] },
      select: { status: true },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Rechnung nicht gefunden.' });
      return;
    }

    if (invoice.status !== 'DRAFT') {
      res.status(400).json({ error: 'Nur Entwürfe können versendet werden.' });
      return;
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params['id'] },
      data: { status: 'SENT', sentAt: new Date() },
      include: {
        tenant: { select: { name: true } },
        items: true,
      },
    });

    // TODO: E-Mail-Versand implementieren
    res.json(updated);
  } catch (err) {
    console.error('Billing send error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /api/admin/billing/generate — Auto-Rechnungen erstellen ─
adminBillingRouter.post('/generate', async (req, res) => {
  try {
    const activeTenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      include: {
        stores: {
          where: { isActive: true },
          include: {
            tools: {
              where: { isActive: true },
              include: { tool: { select: { name: true, priceMonthly: true } } },
            },
          },
        },
      },
    });

    let generatedCount = 0;

    for (const tenant of activeTenants) {
      const items: { description: string; quantity: number; unitPrice: number; total: number }[] = [];

      for (const store of tenant.stores) {
        for (const assignment of store.tools) {
          items.push({
            description: `${assignment.tool.name} — ${store.name}`,
            quantity: 1,
            unitPrice: assignment.tool.priceMonthly,
            total: assignment.tool.priceMonthly,
          });
        }
      }

      if (items.length === 0) continue;

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = 0.19;
      const taxAmount = Math.round(subtotal * taxRate);
      const total = subtotal + taxAmount;

      const number = await generateInvoiceNumber('INVOICE');

      await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          createdById: req.user!.sub,
          number,
          type: 'INVOICE',
          status: 'DRAFT',
          issueDate: new Date(),
          subtotal,
          taxRate,
          taxAmount,
          total,
          items: { create: items },
        },
      });

      generatedCount++;
    }

    res.json({ generated: generatedCount });
  } catch (err) {
    console.error('Billing generate error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
